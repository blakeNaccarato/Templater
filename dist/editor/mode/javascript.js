// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
/* eslint-disable */
(function (mod) {
    mod(window.CodeMirror);
})(function (CodeMirror) {
    "use strict";
    CodeMirror.defineMode("javascript", function (config, parserConfig) {
        var indentUnit = config.indentUnit;
        var statementIndent = parserConfig.statementIndent;
        var jsonldMode = parserConfig.jsonld;
        var jsonMode = parserConfig.json || jsonldMode;
        var trackScope = parserConfig.trackScope !== false;
        var isTS = parserConfig.typescript;
        var wordRE = parserConfig.wordCharacters || /[\w$\xa1-\uffff]/;
        // Tokenizer
        var keywords = (function () {
            function kw(type) {
                return { type: type, style: "keyword" };
            }
            var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c"), D = kw("keyword d");
            var operator = kw("operator"), atom = { type: "atom", style: "atom" };
            return {
                if: kw("if"),
                while: A,
                with: A,
                else: B,
                do: B,
                try: B,
                finally: B,
                return: D,
                break: D,
                continue: D,
                new: kw("new"),
                delete: C,
                void: C,
                throw: C,
                debugger: kw("debugger"),
                var: kw("var"),
                const: kw("var"),
                let: kw("var"),
                function: kw("function"),
                catch: kw("catch"),
                for: kw("for"),
                switch: kw("switch"),
                case: kw("case"),
                default: kw("default"),
                in: operator,
                typeof: operator,
                instanceof: operator,
                true: atom,
                false: atom,
                null: atom,
                undefined: atom,
                NaN: atom,
                Infinity: atom,
                this: kw("this"),
                class: kw("class"),
                super: kw("atom"),
                yield: C,
                export: kw("export"),
                import: kw("import"),
                extends: C,
                await: C,
            };
        })();
        var isOperatorChar = /[+\-*&%=<>!?|~^@]/;
        var isJsonldKeyword = /^@(context|id|value|language|type|container|list|set|reverse|index|base|vocab|graph)"/;
        function readRegexp(stream) {
            var escaped = false, next, inSet = false;
            while ((next = stream.next()) != null) {
                if (!escaped) {
                    if (next == "/" && !inSet)
                        return;
                    if (next == "[")
                        inSet = true;
                    else if (inSet && next == "]")
                        inSet = false;
                }
                escaped = !escaped && next == "\\";
            }
        }
        // Used as scratch variables to communicate multiple values without
        // consing up tons of objects.
        var type, content;
        function ret(tp, style, cont) {
            type = tp;
            content = cont;
            return style;
        }
        function tokenBase(stream, state) {
            var ch = stream.next();
            if (ch == '"' || ch == "'") {
                state.tokenize = tokenString(ch);
                return state.tokenize(stream, state);
            }
            else if (ch == "." &&
                stream.match(/^\d[\d_]*(?:[eE][+\-]?[\d_]+)?/)) {
                return ret("number", "number");
            }
            else if (ch == "." && stream.match("..")) {
                return ret("spread", "meta");
            }
            else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
                return ret(ch);
            }
            else if (ch == "=" && stream.eat(">")) {
                return ret("=>", "operator");
            }
            else if (ch == "0" &&
                stream.match(/^(?:x[\dA-Fa-f_]+|o[0-7_]+|b[01_]+)n?/)) {
                return ret("number", "number");
            }
            else if (/\d/.test(ch)) {
                stream.match(/^[\d_]*(?:n|(?:\.[\d_]*)?(?:[eE][+\-]?[\d_]+)?)?/);
                return ret("number", "number");
            }
            else if (ch == "/") {
                if (stream.eat("*")) {
                    state.tokenize = tokenComment;
                    return tokenComment(stream, state);
                }
                else if (stream.eat("/")) {
                    stream.skipToEnd();
                    return ret("comment", "comment");
                }
                else if (expressionAllowed(stream, state, 1)) {
                    readRegexp(stream);
                    stream.match(/^\b(([gimyus])(?![gimyus]*\2))+\b/);
                    return ret("regexp", "string-2");
                }
                else {
                    stream.eat("=");
                    return ret("operator", "operator", stream.current());
                }
            }
            else if (ch == "`") {
                state.tokenize = tokenQuasi;
                return tokenQuasi(stream, state);
            }
            else if (ch == "#" && stream.peek() == "!") {
                stream.skipToEnd();
                return ret("meta", "meta");
            }
            else if (ch == "#" && stream.eatWhile(wordRE)) {
                return ret("variable", "property");
            }
            else if ((ch == "<" && stream.match("!--")) ||
                (ch == "-" &&
                    stream.match("->") &&
                    !/\S/.test(stream.string.slice(0, stream.start)))) {
                stream.skipToEnd();
                return ret("comment", "comment");
            }
            else if (isOperatorChar.test(ch)) {
                if (ch != ">" || !state.lexical || state.lexical.type != ">") {
                    if (stream.eat("=")) {
                        if (ch == "!" || ch == "=")
                            stream.eat("=");
                    }
                    else if (/[<>*+\-|&?]/.test(ch)) {
                        stream.eat(ch);
                        if (ch == ">")
                            stream.eat(ch);
                    }
                }
                if (ch == "?" && stream.eat("."))
                    return ret(".");
                return ret("operator", "operator", stream.current());
            }
            else if (wordRE.test(ch)) {
                stream.eatWhile(wordRE);
                var word = stream.current();
                if (state.lastType != ".") {
                    if (keywords.propertyIsEnumerable(word)) {
                        var kw = keywords[word];
                        return ret(kw.type, kw.style, word);
                    }
                    if (word == "async" &&
                        stream.match(/^(\s|\/\*([^*]|\*(?!\/))*?\*\/)*[\[\(\w]/, false))
                        return ret("async", "keyword", word);
                }
                return ret("variable", "variable", word);
            }
        }
        function tokenString(quote) {
            return function (stream, state) {
                var escaped = false, next;
                if (jsonldMode &&
                    stream.peek() == "@" &&
                    stream.match(isJsonldKeyword)) {
                    state.tokenize = tokenBase;
                    return ret("jsonld-keyword", "meta");
                }
                while ((next = stream.next()) != null) {
                    if (next == quote && !escaped)
                        break;
                    escaped = !escaped && next == "\\";
                }
                if (!escaped)
                    state.tokenize = tokenBase;
                return ret("string", "string");
            };
        }
        function tokenComment(stream, state) {
            var maybeEnd = false, ch;
            while ((ch = stream.next())) {
                if (ch == "/" && maybeEnd) {
                    state.tokenize = tokenBase;
                    break;
                }
                maybeEnd = ch == "*";
            }
            return ret("comment", "comment");
        }
        function tokenQuasi(stream, state) {
            var escaped = false, next;
            while ((next = stream.next()) != null) {
                if (!escaped &&
                    (next == "`" || (next == "$" && stream.eat("{")))) {
                    state.tokenize = tokenBase;
                    break;
                }
                escaped = !escaped && next == "\\";
            }
            return ret("quasi", "string-2", stream.current());
        }
        var brackets = "([{}])";
        // This is a crude lookahead trick to try and notice that we're
        // parsing the argument patterns for a fat-arrow function before we
        // actually hit the arrow token. It only works if the arrow is on
        // the same line as the arguments and there's no strange noise
        // (comments) in between. Fallback is to only notice when we hit the
        // arrow, and not declare the arguments as locals for the arrow
        // body.
        function findFatArrow(stream, state) {
            if (state.fatArrowAt)
                state.fatArrowAt = null;
            var arrow = stream.string.indexOf("=>", stream.start);
            if (arrow < 0)
                return;
            if (isTS) {
                // Try to skip TypeScript return type declarations after the arguments
                var m = /:\s*(?:\w+(?:<[^>]*>|\[\])?|\{[^}]*\})\s*$/.exec(stream.string.slice(stream.start, arrow));
                if (m)
                    arrow = m.index;
            }
            var depth = 0, sawSomething = false;
            for (var pos = arrow - 1; pos >= 0; --pos) {
                var ch = stream.string.charAt(pos);
                var bracket = brackets.indexOf(ch);
                if (bracket >= 0 && bracket < 3) {
                    if (!depth) {
                        ++pos;
                        break;
                    }
                    if (--depth == 0) {
                        if (ch == "(")
                            sawSomething = true;
                        break;
                    }
                }
                else if (bracket >= 3 && bracket < 6) {
                    ++depth;
                }
                else if (wordRE.test(ch)) {
                    sawSomething = true;
                }
                else if (/["'\/`]/.test(ch)) {
                    for (;; --pos) {
                        if (pos == 0)
                            return;
                        var next = stream.string.charAt(pos - 1);
                        if (next == ch &&
                            stream.string.charAt(pos - 2) != "\\") {
                            pos--;
                            break;
                        }
                    }
                }
                else if (sawSomething && !depth) {
                    ++pos;
                    break;
                }
            }
            if (sawSomething && !depth)
                state.fatArrowAt = pos;
        }
        // Parser
        var atomicTypes = {
            atom: true,
            number: true,
            variable: true,
            string: true,
            regexp: true,
            this: true,
            import: true,
            "jsonld-keyword": true,
        };
        function JSLexical(indented, column, type, align, prev, info) {
            this.indented = indented;
            this.column = column;
            this.type = type;
            this.prev = prev;
            this.info = info;
            if (align != null)
                this.align = align;
        }
        function inScope(state, varname) {
            if (!trackScope)
                return false;
            for (var v = state.localVars; v; v = v.next)
                if (v.name == varname)
                    return true;
            for (var cx = state.context; cx; cx = cx.prev) {
                for (var v = cx.vars; v; v = v.next)
                    if (v.name == varname)
                        return true;
            }
        }
        function parseJS(state, style, type, content, stream) {
            var cc = state.cc;
            // Communicate our context to the combinators.
            // (Less wasteful than consing up a hundred closures on every call.)
            cx.state = state;
            cx.stream = stream;
            (cx.marked = null), (cx.cc = cc);
            cx.style = style;
            if (!state.lexical.hasOwnProperty("align"))
                state.lexical.align = true;
            while (true) {
                var combinator = cc.length
                    ? cc.pop()
                    : jsonMode
                        ? expression
                        : statement;
                if (combinator(type, content)) {
                    while (cc.length && cc[cc.length - 1].lex)
                        cc.pop()();
                    if (cx.marked)
                        return cx.marked;
                    if (type == "variable" && inScope(state, content))
                        return "variable-2";
                    return style;
                }
            }
        }
        // Combinator utils
        var cx = { state: null, column: null, marked: null, cc: null };
        function pass() {
            for (var i = arguments.length - 1; i >= 0; i--)
                cx.cc.push(arguments[i]);
        }
        function cont() {
            pass.apply(null, arguments);
            return true;
        }
        function inList(name, list) {
            for (var v = list; v; v = v.next)
                if (v.name == name)
                    return true;
            return false;
        }
        function register(varname) {
            var state = cx.state;
            cx.marked = "def";
            if (!trackScope)
                return;
            if (state.context) {
                if (state.lexical.info == "var" &&
                    state.context &&
                    state.context.block) {
                    // FIXME function decls are also not block scoped
                    var newContext = registerVarScoped(varname, state.context);
                    if (newContext != null) {
                        state.context = newContext;
                        return;
                    }
                }
                else if (!inList(varname, state.localVars)) {
                    state.localVars = new Var(varname, state.localVars);
                    return;
                }
            }
            // Fall through means this is global
            if (parserConfig.globalVars && !inList(varname, state.globalVars))
                state.globalVars = new Var(varname, state.globalVars);
        }
        function registerVarScoped(varname, context) {
            if (!context) {
                return null;
            }
            else if (context.block) {
                var inner = registerVarScoped(varname, context.prev);
                if (!inner)
                    return null;
                if (inner == context.prev)
                    return context;
                return new Context(inner, context.vars, true);
            }
            else if (inList(varname, context.vars)) {
                return context;
            }
            else {
                return new Context(context.prev, new Var(varname, context.vars), false);
            }
        }
        function isModifier(name) {
            return (name == "public" ||
                name == "private" ||
                name == "protected" ||
                name == "abstract" ||
                name == "readonly");
        }
        // Combinators
        function Context(prev, vars, block) {
            this.prev = prev;
            this.vars = vars;
            this.block = block;
        }
        function Var(name, next) {
            this.name = name;
            this.next = next;
        }
        var defaultVars = new Var("this", new Var("arguments", null));
        function pushcontext() {
            cx.state.context = new Context(cx.state.context, cx.state.localVars, false);
            cx.state.localVars = defaultVars;
        }
        function pushblockcontext() {
            cx.state.context = new Context(cx.state.context, cx.state.localVars, true);
            cx.state.localVars = null;
        }
        function popcontext() {
            cx.state.localVars = cx.state.context.vars;
            cx.state.context = cx.state.context.prev;
        }
        popcontext.lex = true;
        function pushlex(type, info) {
            var result = function () {
                var state = cx.state, indent = state.indented;
                if (state.lexical.type == "stat")
                    indent = state.lexical.indented;
                else
                    for (var outer = state.lexical; outer && outer.type == ")" && outer.align; outer = outer.prev)
                        indent = outer.indented;
                state.lexical = new JSLexical(indent, cx.stream.column(), type, null, state.lexical, info);
            };
            result.lex = true;
            return result;
        }
        function poplex() {
            var state = cx.state;
            if (state.lexical.prev) {
                if (state.lexical.type == ")")
                    state.indented = state.lexical.indented;
                state.lexical = state.lexical.prev;
            }
        }
        poplex.lex = true;
        function expect(wanted) {
            function exp(type) {
                if (type == wanted)
                    return cont();
                else if (wanted == ";" ||
                    type == "}" ||
                    type == ")" ||
                    type == "]")
                    return pass();
                else
                    return cont(exp);
            }
            return exp;
        }
        function statement(type, value) {
            if (type == "var")
                return cont(pushlex("vardef", value), vardef, expect(";"), poplex);
            if (type == "keyword a")
                return cont(pushlex("form"), parenExpr, statement, poplex);
            if (type == "keyword b")
                return cont(pushlex("form"), statement, poplex);
            if (type == "keyword d")
                return cx.stream.match(/^\s*$/, false)
                    ? cont()
                    : cont(pushlex("stat"), maybeexpression, expect(";"), poplex);
            if (type == "debugger")
                return cont(expect(";"));
            if (type == "{")
                return cont(pushlex("}"), pushblockcontext, block, poplex, popcontext);
            if (type == ";")
                return cont();
            if (type == "if") {
                if (cx.state.lexical.info == "else" &&
                    cx.state.cc[cx.state.cc.length - 1] == poplex)
                    cx.state.cc.pop()();
                return cont(pushlex("form"), parenExpr, statement, poplex, maybeelse);
            }
            if (type == "function")
                return cont(functiondef);
            if (type == "for")
                return cont(pushlex("form"), pushblockcontext, forspec, statement, popcontext, poplex);
            if (type == "class" || (isTS && value == "interface")) {
                cx.marked = "keyword";
                return cont(pushlex("form", type == "class" ? type : value), className, poplex);
            }
            if (type == "variable") {
                if (isTS && value == "declare") {
                    cx.marked = "keyword";
                    return cont(statement);
                }
                else if (isTS &&
                    (value == "module" || value == "enum" || value == "type") &&
                    cx.stream.match(/^\s*\w/, false)) {
                    cx.marked = "keyword";
                    if (value == "enum")
                        return cont(enumdef);
                    else if (value == "type")
                        return cont(typename, expect("operator"), typeexpr, expect(";"));
                    else
                        return cont(pushlex("form"), pattern, expect("{"), pushlex("}"), block, poplex, poplex);
                }
                else if (isTS && value == "namespace") {
                    cx.marked = "keyword";
                    return cont(pushlex("form"), expression, statement, poplex);
                }
                else if (isTS && value == "abstract") {
                    cx.marked = "keyword";
                    return cont(statement);
                }
                else {
                    return cont(pushlex("stat"), maybelabel);
                }
            }
            if (type == "switch")
                return cont(pushlex("form"), parenExpr, expect("{"), pushlex("}", "switch"), pushblockcontext, block, poplex, poplex, popcontext);
            if (type == "case")
                return cont(expression, expect(":"));
            if (type == "default")
                return cont(expect(":"));
            if (type == "catch")
                return cont(pushlex("form"), pushcontext, maybeCatchBinding, statement, poplex, popcontext);
            if (type == "export")
                return cont(pushlex("stat"), afterExport, poplex);
            if (type == "import")
                return cont(pushlex("stat"), afterImport, poplex);
            if (type == "async")
                return cont(statement);
            if (value == "@")
                return cont(expression, statement);
            return pass(pushlex("stat"), expression, expect(";"), poplex);
        }
        function maybeCatchBinding(type) {
            if (type == "(")
                return cont(funarg, expect(")"));
        }
        function expression(type, value) {
            return expressionInner(type, value, false);
        }
        function expressionNoComma(type, value) {
            return expressionInner(type, value, true);
        }
        function parenExpr(type) {
            if (type != "(")
                return pass();
            return cont(pushlex(")"), maybeexpression, expect(")"), poplex);
        }
        function expressionInner(type, value, noComma) {
            if (cx.state.fatArrowAt == cx.stream.start) {
                var body = noComma ? arrowBodyNoComma : arrowBody;
                if (type == "(")
                    return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, expect("=>"), body, popcontext);
                else if (type == "variable")
                    return pass(pushcontext, pattern, expect("=>"), body, popcontext);
            }
            var maybeop = noComma ? maybeoperatorNoComma : maybeoperatorComma;
            if (atomicTypes.hasOwnProperty(type))
                return cont(maybeop);
            if (type == "function")
                return cont(functiondef, maybeop);
            if (type == "class" || (isTS && value == "interface")) {
                cx.marked = "keyword";
                return cont(pushlex("form"), classExpression, poplex);
            }
            if (type == "keyword c" || type == "async")
                return cont(noComma ? expressionNoComma : expression);
            if (type == "(")
                return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeop);
            if (type == "operator" || type == "spread")
                return cont(noComma ? expressionNoComma : expression);
            if (type == "[")
                return cont(pushlex("]"), arrayLiteral, poplex, maybeop);
            if (type == "{")
                return contCommasep(objprop, "}", null, maybeop);
            if (type == "quasi")
                return pass(quasi, maybeop);
            if (type == "new")
                return cont(maybeTarget(noComma));
            return cont();
        }
        function maybeexpression(type) {
            if (type.match(/[;\}\)\],]/))
                return pass();
            return pass(expression);
        }
        function maybeoperatorComma(type, value) {
            if (type == ",")
                return cont(maybeexpression);
            return maybeoperatorNoComma(type, value, false);
        }
        function maybeoperatorNoComma(type, value, noComma) {
            var me = noComma == false ? maybeoperatorComma : maybeoperatorNoComma;
            var expr = noComma == false ? expression : expressionNoComma;
            if (type == "=>")
                return cont(pushcontext, noComma ? arrowBodyNoComma : arrowBody, popcontext);
            if (type == "operator") {
                if (/\+\+|--/.test(value) || (isTS && value == "!"))
                    return cont(me);
                if (isTS &&
                    value == "<" &&
                    cx.stream.match(/^([^<>]|<[^<>]*>)*>\s*\(/, false))
                    return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, me);
                if (value == "?")
                    return cont(expression, expect(":"), expr);
                return cont(expr);
            }
            if (type == "quasi") {
                return pass(quasi, me);
            }
            if (type == ";")
                return;
            if (type == "(")
                return contCommasep(expressionNoComma, ")", "call", me);
            if (type == ".")
                return cont(property, me);
            if (type == "[")
                return cont(pushlex("]"), maybeexpression, expect("]"), poplex, me);
            if (isTS && value == "as") {
                cx.marked = "keyword";
                return cont(typeexpr, me);
            }
            if (type == "regexp") {
                cx.state.lastType = cx.marked = "operator";
                cx.stream.backUp(cx.stream.pos - cx.stream.start - 1);
                return cont(expr);
            }
        }
        function quasi(type, value) {
            if (type != "quasi")
                return pass();
            if (value.slice(value.length - 2) != "${")
                return cont(quasi);
            return cont(maybeexpression, continueQuasi);
        }
        function continueQuasi(type) {
            if (type == "}") {
                cx.marked = "string-2";
                cx.state.tokenize = tokenQuasi;
                return cont(quasi);
            }
        }
        function arrowBody(type) {
            findFatArrow(cx.stream, cx.state);
            return pass(type == "{" ? statement : expression);
        }
        function arrowBodyNoComma(type) {
            findFatArrow(cx.stream, cx.state);
            return pass(type == "{" ? statement : expressionNoComma);
        }
        function maybeTarget(noComma) {
            return function (type) {
                if (type == ".")
                    return cont(noComma ? targetNoComma : target);
                else if (type == "variable" && isTS)
                    return cont(maybeTypeArgs, noComma ? maybeoperatorNoComma : maybeoperatorComma);
                else
                    return pass(noComma ? expressionNoComma : expression);
            };
        }
        function target(_, value) {
            if (value == "target") {
                cx.marked = "keyword";
                return cont(maybeoperatorComma);
            }
        }
        function targetNoComma(_, value) {
            if (value == "target") {
                cx.marked = "keyword";
                return cont(maybeoperatorNoComma);
            }
        }
        function maybelabel(type) {
            if (type == ":")
                return cont(poplex, statement);
            return pass(maybeoperatorComma, expect(";"), poplex);
        }
        function property(type) {
            if (type == "variable") {
                cx.marked = "property";
                return cont();
            }
        }
        function objprop(type, value) {
            if (type == "async") {
                cx.marked = "property";
                return cont(objprop);
            }
            else if (type == "variable" || cx.style == "keyword") {
                cx.marked = "property";
                if (value == "get" || value == "set")
                    return cont(getterSetter);
                var m; // Work around fat-arrow-detection complication for detecting typescript typed arrow params
                if (isTS &&
                    cx.state.fatArrowAt == cx.stream.start &&
                    (m = cx.stream.match(/^\s*:\s*/, false)))
                    cx.state.fatArrowAt = cx.stream.pos + m[0].length;
                return cont(afterprop);
            }
            else if (type == "number" || type == "string") {
                cx.marked = jsonldMode ? "property" : cx.style + " property";
                return cont(afterprop);
            }
            else if (type == "jsonld-keyword") {
                return cont(afterprop);
            }
            else if (isTS && isModifier(value)) {
                cx.marked = "keyword";
                return cont(objprop);
            }
            else if (type == "[") {
                return cont(expression, maybetype, expect("]"), afterprop);
            }
            else if (type == "spread") {
                return cont(expressionNoComma, afterprop);
            }
            else if (value == "*") {
                cx.marked = "keyword";
                return cont(objprop);
            }
            else if (type == ":") {
                return pass(afterprop);
            }
        }
        function getterSetter(type) {
            if (type != "variable")
                return pass(afterprop);
            cx.marked = "property";
            return cont(functiondef);
        }
        function afterprop(type) {
            if (type == ":")
                return cont(expressionNoComma);
            if (type == "(")
                return pass(functiondef);
        }
        function commasep(what, end, sep) {
            function proceed(type, value) {
                if (sep ? sep.indexOf(type) > -1 : type == ",") {
                    var lex = cx.state.lexical;
                    if (lex.info == "call")
                        lex.pos = (lex.pos || 0) + 1;
                    return cont(function (type, value) {
                        if (type == end || value == end)
                            return pass();
                        return pass(what);
                    }, proceed);
                }
                if (type == end || value == end)
                    return cont();
                if (sep && sep.indexOf(";") > -1)
                    return pass(what);
                return cont(expect(end));
            }
            return function (type, value) {
                if (type == end || value == end)
                    return cont();
                return pass(what, proceed);
            };
        }
        function contCommasep(what, end, info) {
            for (var i = 3; i < arguments.length; i++)
                cx.cc.push(arguments[i]);
            return cont(pushlex(end, info), commasep(what, end), poplex);
        }
        function block(type) {
            if (type == "}")
                return cont();
            return pass(statement, block);
        }
        function maybetype(type, value) {
            if (isTS) {
                if (type == ":")
                    return cont(typeexpr);
                if (value == "?")
                    return cont(maybetype);
            }
        }
        function maybetypeOrIn(type, value) {
            if (isTS && (type == ":" || value == "in"))
                return cont(typeexpr);
        }
        function mayberettype(type) {
            if (isTS && type == ":") {
                if (cx.stream.match(/^\s*\w+\s+is\b/, false))
                    return cont(expression, isKW, typeexpr);
                else
                    return cont(typeexpr);
            }
        }
        function isKW(_, value) {
            if (value == "is") {
                cx.marked = "keyword";
                return cont();
            }
        }
        function typeexpr(type, value) {
            if (value == "keyof" ||
                value == "typeof" ||
                value == "infer" ||
                value == "readonly") {
                cx.marked = "keyword";
                return cont(value == "typeof" ? expressionNoComma : typeexpr);
            }
            if (type == "variable" || value == "void") {
                cx.marked = "type";
                return cont(afterType);
            }
            if (value == "|" || value == "&")
                return cont(typeexpr);
            if (type == "string" || type == "number" || type == "atom")
                return cont(afterType);
            if (type == "[")
                return cont(pushlex("]"), commasep(typeexpr, "]", ","), poplex, afterType);
            if (type == "{")
                return cont(pushlex("}"), typeprops, poplex, afterType);
            if (type == "(")
                return cont(commasep(typearg, ")"), maybeReturnType, afterType);
            if (type == "<")
                return cont(commasep(typeexpr, ">"), typeexpr);
            if (type == "quasi") {
                return pass(quasiType, afterType);
            }
        }
        function maybeReturnType(type) {
            if (type == "=>")
                return cont(typeexpr);
        }
        function typeprops(type) {
            if (type.match(/[\}\)\]]/))
                return cont();
            if (type == "," || type == ";")
                return cont(typeprops);
            return pass(typeprop, typeprops);
        }
        function typeprop(type, value) {
            if (type == "variable" || cx.style == "keyword") {
                cx.marked = "property";
                return cont(typeprop);
            }
            else if (value == "?" || type == "number" || type == "string") {
                return cont(typeprop);
            }
            else if (type == ":") {
                return cont(typeexpr);
            }
            else if (type == "[") {
                return cont(expect("variable"), maybetypeOrIn, expect("]"), typeprop);
            }
            else if (type == "(") {
                return pass(functiondecl, typeprop);
            }
            else if (!type.match(/[;\}\)\],]/)) {
                return cont();
            }
        }
        function quasiType(type, value) {
            if (type != "quasi")
                return pass();
            if (value.slice(value.length - 2) != "${")
                return cont(quasiType);
            return cont(typeexpr, continueQuasiType);
        }
        function continueQuasiType(type) {
            if (type == "}") {
                cx.marked = "string-2";
                cx.state.tokenize = tokenQuasi;
                return cont(quasiType);
            }
        }
        function typearg(type, value) {
            if ((type == "variable" && cx.stream.match(/^\s*[?:]/, false)) ||
                value == "?")
                return cont(typearg);
            if (type == ":")
                return cont(typeexpr);
            if (type == "spread")
                return cont(typearg);
            return pass(typeexpr);
        }
        function afterType(type, value) {
            if (value == "<")
                return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType);
            if (value == "|" || type == "." || value == "&")
                return cont(typeexpr);
            if (type == "[")
                return cont(typeexpr, expect("]"), afterType);
            if (value == "extends" || value == "implements") {
                cx.marked = "keyword";
                return cont(typeexpr);
            }
            if (value == "?")
                return cont(typeexpr, expect(":"), typeexpr);
        }
        function maybeTypeArgs(_, value) {
            if (value == "<")
                return cont(pushlex(">"), commasep(typeexpr, ">"), poplex, afterType);
        }
        function typeparam() {
            return pass(typeexpr, maybeTypeDefault);
        }
        function maybeTypeDefault(_, value) {
            if (value == "=")
                return cont(typeexpr);
        }
        function vardef(_, value) {
            if (value == "enum") {
                cx.marked = "keyword";
                return cont(enumdef);
            }
            return pass(pattern, maybetype, maybeAssign, vardefCont);
        }
        function pattern(type, value) {
            if (isTS && isModifier(value)) {
                cx.marked = "keyword";
                return cont(pattern);
            }
            if (type == "variable") {
                register(value);
                return cont();
            }
            if (type == "spread")
                return cont(pattern);
            if (type == "[")
                return contCommasep(eltpattern, "]");
            if (type == "{")
                return contCommasep(proppattern, "}");
        }
        function proppattern(type, value) {
            if (type == "variable" && !cx.stream.match(/^\s*:/, false)) {
                register(value);
                return cont(maybeAssign);
            }
            if (type == "variable")
                cx.marked = "property";
            if (type == "spread")
                return cont(pattern);
            if (type == "}")
                return pass();
            if (type == "[")
                return cont(expression, expect("]"), expect(":"), proppattern);
            return cont(expect(":"), pattern, maybeAssign);
        }
        function eltpattern() {
            return pass(pattern, maybeAssign);
        }
        function maybeAssign(_type, value) {
            if (value == "=")
                return cont(expressionNoComma);
        }
        function vardefCont(type) {
            if (type == ",")
                return cont(vardef);
        }
        function maybeelse(type, value) {
            if (type == "keyword b" && value == "else")
                return cont(pushlex("form", "else"), statement, poplex);
        }
        function forspec(type, value) {
            if (value == "await")
                return cont(forspec);
            if (type == "(")
                return cont(pushlex(")"), forspec1, poplex);
        }
        function forspec1(type) {
            if (type == "var")
                return cont(vardef, forspec2);
            if (type == "variable")
                return cont(forspec2);
            return pass(forspec2);
        }
        function forspec2(type, value) {
            if (type == ")")
                return cont();
            if (type == ";")
                return cont(forspec2);
            if (value == "in" || value == "of") {
                cx.marked = "keyword";
                return cont(expression, forspec2);
            }
            return pass(expression, forspec2);
        }
        function functiondef(type, value) {
            if (value == "*") {
                cx.marked = "keyword";
                return cont(functiondef);
            }
            if (type == "variable") {
                register(value);
                return cont(functiondef);
            }
            if (type == "(")
                return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, mayberettype, statement, popcontext);
            if (isTS && value == "<")
                return cont(pushlex(">"), commasep(typeparam, ">"), poplex, functiondef);
        }
        function functiondecl(type, value) {
            if (value == "*") {
                cx.marked = "keyword";
                return cont(functiondecl);
            }
            if (type == "variable") {
                register(value);
                return cont(functiondecl);
            }
            if (type == "(")
                return cont(pushcontext, pushlex(")"), commasep(funarg, ")"), poplex, mayberettype, popcontext);
            if (isTS && value == "<")
                return cont(pushlex(">"), commasep(typeparam, ">"), poplex, functiondecl);
        }
        function typename(type, value) {
            if (type == "keyword" || type == "variable") {
                cx.marked = "type";
                return cont(typename);
            }
            else if (value == "<") {
                return cont(pushlex(">"), commasep(typeparam, ">"), poplex);
            }
        }
        function funarg(type, value) {
            if (value == "@")
                cont(expression, funarg);
            if (type == "spread")
                return cont(funarg);
            if (isTS && isModifier(value)) {
                cx.marked = "keyword";
                return cont(funarg);
            }
            if (isTS && type == "this")
                return cont(maybetype, maybeAssign);
            return pass(pattern, maybetype, maybeAssign);
        }
        function classExpression(type, value) {
            // Class expressions may have an optional name.
            if (type == "variable")
                return className(type, value);
            return classNameAfter(type, value);
        }
        function className(type, value) {
            if (type == "variable") {
                register(value);
                return cont(classNameAfter);
            }
        }
        function classNameAfter(type, value) {
            if (value == "<")
                return cont(pushlex(">"), commasep(typeparam, ">"), poplex, classNameAfter);
            if (value == "extends" ||
                value == "implements" ||
                (isTS && type == ",")) {
                if (value == "implements")
                    cx.marked = "keyword";
                return cont(isTS ? typeexpr : expression, classNameAfter);
            }
            if (type == "{")
                return cont(pushlex("}"), classBody, poplex);
        }
        function classBody(type, value) {
            if (type == "async" ||
                (type == "variable" &&
                    (value == "static" ||
                        value == "get" ||
                        value == "set" ||
                        (isTS && isModifier(value))) &&
                    cx.stream.match(/^\s+[\w$\xa1-\uffff]/, false))) {
                cx.marked = "keyword";
                return cont(classBody);
            }
            if (type == "variable" || cx.style == "keyword") {
                cx.marked = "property";
                return cont(classfield, classBody);
            }
            if (type == "number" || type == "string")
                return cont(classfield, classBody);
            if (type == "[")
                return cont(expression, maybetype, expect("]"), classfield, classBody);
            if (value == "*") {
                cx.marked = "keyword";
                return cont(classBody);
            }
            if (isTS && type == "(")
                return pass(functiondecl, classBody);
            if (type == ";" || type == ",")
                return cont(classBody);
            if (type == "}")
                return cont();
            if (value == "@")
                return cont(expression, classBody);
        }
        function classfield(type, value) {
            if (value == "!")
                return cont(classfield);
            if (value == "?")
                return cont(classfield);
            if (type == ":")
                return cont(typeexpr, maybeAssign);
            if (value == "=")
                return cont(expressionNoComma);
            var context = cx.state.lexical.prev, isInterface = context && context.info == "interface";
            return pass(isInterface ? functiondecl : functiondef);
        }
        function afterExport(type, value) {
            if (value == "*") {
                cx.marked = "keyword";
                return cont(maybeFrom, expect(";"));
            }
            if (value == "default") {
                cx.marked = "keyword";
                return cont(expression, expect(";"));
            }
            if (type == "{")
                return cont(commasep(exportField, "}"), maybeFrom, expect(";"));
            return pass(statement);
        }
        function exportField(type, value) {
            if (value == "as") {
                cx.marked = "keyword";
                return cont(expect("variable"));
            }
            if (type == "variable")
                return pass(expressionNoComma, exportField);
        }
        function afterImport(type) {
            if (type == "string")
                return cont();
            if (type == "(")
                return pass(expression);
            if (type == ".")
                return pass(maybeoperatorComma);
            return pass(importSpec, maybeMoreImports, maybeFrom);
        }
        function importSpec(type, value) {
            if (type == "{")
                return contCommasep(importSpec, "}");
            if (type == "variable")
                register(value);
            if (value == "*")
                cx.marked = "keyword";
            return cont(maybeAs);
        }
        function maybeMoreImports(type) {
            if (type == ",")
                return cont(importSpec, maybeMoreImports);
        }
        function maybeAs(_type, value) {
            if (value == "as") {
                cx.marked = "keyword";
                return cont(importSpec);
            }
        }
        function maybeFrom(_type, value) {
            if (value == "from") {
                cx.marked = "keyword";
                return cont(expression);
            }
        }
        function arrayLiteral(type) {
            if (type == "]")
                return cont();
            return pass(commasep(expressionNoComma, "]"));
        }
        function enumdef() {
            return pass(pushlex("form"), pattern, expect("{"), pushlex("}"), commasep(enummember, "}"), poplex, poplex);
        }
        function enummember() {
            return pass(pattern, maybeAssign);
        }
        function isContinuedStatement(state, textAfter) {
            return (state.lastType == "operator" ||
                state.lastType == "," ||
                isOperatorChar.test(textAfter.charAt(0)) ||
                /[,.]/.test(textAfter.charAt(0)));
        }
        function expressionAllowed(stream, state, backUp) {
            return ((state.tokenize == tokenBase &&
                /^(?:operator|sof|keyword [bcd]|case|new|export|default|spread|[\[{}\(,;:]|=>)$/.test(state.lastType)) ||
                (state.lastType == "quasi" &&
                    /\{\s*$/.test(stream.string.slice(0, stream.pos - (backUp || 0)))));
        }
        // Interface
        return {
            startState: function (basecolumn) {
                var state = {
                    tokenize: tokenBase,
                    lastType: "sof",
                    cc: [],
                    lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
                    localVars: parserConfig.localVars,
                    context: parserConfig.localVars &&
                        new Context(null, null, false),
                    indented: basecolumn || 0,
                };
                if (parserConfig.globalVars &&
                    typeof parserConfig.globalVars == "object")
                    state.globalVars = parserConfig.globalVars;
                return state;
            },
            token: function (stream, state) {
                if (stream.sol()) {
                    if (!state.lexical.hasOwnProperty("align"))
                        state.lexical.align = false;
                    state.indented = stream.indentation();
                    findFatArrow(stream, state);
                }
                if (state.tokenize != tokenComment && stream.eatSpace())
                    return null;
                var style = state.tokenize(stream, state);
                if (type == "comment")
                    return style;
                state.lastType =
                    type == "operator" && (content == "++" || content == "--")
                        ? "incdec"
                        : type;
                return parseJS(state, style, type, content, stream);
            },
            indent: function (state, textAfter) {
                if (state.tokenize == tokenComment ||
                    state.tokenize == tokenQuasi)
                    return CodeMirror.Pass;
                if (state.tokenize != tokenBase)
                    return 0;
                var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical, top;
                // Kludge to prevent 'maybelse' from blocking lexical scope pops
                if (!/^\s*else\b/.test(textAfter))
                    for (var i = state.cc.length - 1; i >= 0; --i) {
                        var c = state.cc[i];
                        if (c == poplex)
                            lexical = lexical.prev;
                        else if (c != maybeelse && c != popcontext)
                            break;
                    }
                while ((lexical.type == "stat" || lexical.type == "form") &&
                    (firstChar == "}" ||
                        ((top = state.cc[state.cc.length - 1]) &&
                            (top == maybeoperatorComma ||
                                top == maybeoperatorNoComma) &&
                            !/^[,\.=+\-*:?[\(]/.test(textAfter))))
                    lexical = lexical.prev;
                if (statementIndent &&
                    lexical.type == ")" &&
                    lexical.prev.type == "stat")
                    lexical = lexical.prev;
                var type = lexical.type, closing = firstChar == type;
                if (type == "vardef")
                    return (lexical.indented +
                        (state.lastType == "operator" || state.lastType == ","
                            ? lexical.info.length + 1
                            : 0));
                else if (type == "form" && firstChar == "{")
                    return lexical.indented;
                else if (type == "form")
                    return lexical.indented + indentUnit;
                else if (type == "stat")
                    return (lexical.indented +
                        (isContinuedStatement(state, textAfter)
                            ? statementIndent || indentUnit
                            : 0));
                else if (lexical.info == "switch" &&
                    !closing &&
                    parserConfig.doubleIndentSwitch != false)
                    return (lexical.indented +
                        (/^(?:case|default)\b/.test(textAfter)
                            ? indentUnit
                            : 2 * indentUnit));
                else if (lexical.align)
                    return lexical.column + (closing ? 0 : 1);
                else
                    return lexical.indented + (closing ? 0 : indentUnit);
            },
            electricInput: /^\s*(?:case .*?:|default:|\{|\})$/,
            blockCommentStart: jsonMode ? null : "/*",
            blockCommentEnd: jsonMode ? null : "*/",
            blockCommentContinue: jsonMode ? null : " * ",
            lineComment: jsonMode ? null : "//",
            fold: "brace",
            closeBrackets: "()[]{}''\"\"``",
            helperType: jsonMode ? "json" : "javascript",
            jsonldMode: jsonldMode,
            jsonMode: jsonMode,
            expressionAllowed: expressionAllowed,
            skipExpression: function (state) {
                parseJS(state, "atom", "atom", "true", new CodeMirror.StringStream("", 2, null));
            },
        };
    });
    CodeMirror.registerHelper("wordChars", "javascript", /[\w$]/);
    CodeMirror.defineMIME("text/javascript", "javascript");
    CodeMirror.defineMIME("text/ecmascript", "javascript");
    CodeMirror.defineMIME("application/javascript", "javascript");
    CodeMirror.defineMIME("application/x-javascript", "javascript");
    CodeMirror.defineMIME("application/ecmascript", "javascript");
    CodeMirror.defineMIME("application/json", {
        name: "javascript",
        json: true,
    });
    CodeMirror.defineMIME("application/x-json", {
        name: "javascript",
        json: true,
    });
    CodeMirror.defineMIME("application/manifest+json", {
        name: "javascript",
        json: true,
    });
    CodeMirror.defineMIME("application/ld+json", {
        name: "javascript",
        jsonld: true,
    });
    CodeMirror.defineMIME("text/typescript", {
        name: "javascript",
        typescript: true,
    });
    CodeMirror.defineMIME("application/typescript", {
        name: "javascript",
        typescript: true,
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiamF2YXNjcmlwdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9lZGl0b3IvbW9kZS9qYXZhc2NyaXB0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDJEQUEyRDtBQUMzRCxtRUFBbUU7QUFFbkUsb0JBQW9CO0FBRXBCLENBQUMsVUFBVSxHQUFHO0lBQ1YsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxVQUFVLFVBQVU7SUFDbkIsWUFBWSxDQUFDO0lBRWIsVUFBVSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxNQUFNLEVBQUUsWUFBWTtRQUM5RCxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ25DLElBQUksZUFBZSxHQUFHLFlBQVksQ0FBQyxlQUFlLENBQUM7UUFDbkQsSUFBSSxVQUFVLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQztRQUNyQyxJQUFJLFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxJQUFJLFVBQVUsQ0FBQztRQUMvQyxJQUFJLFVBQVUsR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLEtBQUssQ0FBQztRQUNuRCxJQUFJLElBQUksR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFDO1FBQ25DLElBQUksTUFBTSxHQUFHLFlBQVksQ0FBQyxjQUFjLElBQUksa0JBQWtCLENBQUM7UUFFL0QsWUFBWTtRQUVaLElBQUksUUFBUSxHQUFHLENBQUM7WUFDWixTQUFTLEVBQUUsQ0FBQyxJQUFJO2dCQUNaLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQztZQUM1QyxDQUFDO1lBQ0QsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUNuQixDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUNuQixDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUNuQixD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SUFDdkQsVUFBVSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsRUFBRSxZQUFZLENBQUMsQ0FBQztJQUM5RCxVQUFVLENBQUMsVUFBVSxDQUFDLDBCQUEwQixFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ2hFLFVBQVUsQ0FBQyxVQUFVLENBQUMsd0JBQXdCLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDOUQsVUFBVSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRTtRQUN0QyxJQUFJLEVBQUUsWUFBWTtRQUNsQixJQUFJLEVBQUUsSUFBSTtLQUNiLENBQUMsQ0FBQztJQUNILFVBQVUsQ0FBQyxVQUFVLENBQUMsb0JBQW9CLEVBQUU7UUFDeEMsSUFBSSxFQUFFLFlBQVk7UUFDbEIsSUFBSSxFQUFFLElBQUk7S0FDYixDQUFDLENBQUM7SUFDSCxVQUFVLENBQUMsVUFBVSxDQUFDLDJCQUEyQixFQUFFO1FBQy9DLElBQUksRUFBRSxZQUFZO1FBQ2xCLElBQUksRUFBRSxJQUFJO0tBQ2IsQ0FBQyxDQUFDO0lBQ0gsVUFBVSxDQUFDLFVBQVUsQ0FBQyxxQkFBcUIsRUFBRTtRQUN6QyxJQUFJLEVBQUUsWUFBWTtRQUNsQixNQUFNLEVBQUUsSUFBSTtLQUNmLENBQUMsQ0FBQztJQUNILFVBQVUsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUU7UUFDckMsSUFBSSxFQUFFLFlBQVk7UUFDbEIsVUFBVSxFQUFFLElBQUk7S0FDbkIsQ0FBQyxDQUFDO0lBQ0gsVUFBVSxDQUFDLFVBQVUsQ0FBQyx3QkFBd0IsRUFBRTtRQUM1QyxJQUFJLEVBQUUsWUFBWTtRQUNsQixVQUFVLEVBQUUsSUFBSTtLQUNuQixDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvZGVNaXJyb3IsIGNvcHlyaWdodCAoYykgYnkgTWFyaWpuIEhhdmVyYmVrZSBhbmQgb3RoZXJzXHJcbi8vIERpc3RyaWJ1dGVkIHVuZGVyIGFuIE1JVCBsaWNlbnNlOiBodHRwczovL2NvZGVtaXJyb3IubmV0L0xJQ0VOU0VcclxuXHJcbi8qIGVzbGludC1kaXNhYmxlICovXHJcblxyXG4oZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgbW9kKHdpbmRvdy5Db2RlTWlycm9yKTtcclxufSkoZnVuY3Rpb24gKENvZGVNaXJyb3IpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTW9kZShcImphdmFzY3JpcHRcIiwgZnVuY3Rpb24gKGNvbmZpZywgcGFyc2VyQ29uZmlnKSB7XHJcbiAgICAgICAgdmFyIGluZGVudFVuaXQgPSBjb25maWcuaW5kZW50VW5pdDtcclxuICAgICAgICB2YXIgc3RhdGVtZW50SW5kZW50ID0gcGFyc2VyQ29uZmlnLnN0YXRlbWVudEluZGVudDtcclxuICAgICAgICB2YXIganNvbmxkTW9kZSA9IHBhcnNlckNvbmZpZy5qc29ubGQ7XHJcbiAgICAgICAgdmFyIGpzb25Nb2RlID0gcGFyc2VyQ29uZmlnLmpzb24gfHwganNvbmxkTW9kZTtcclxuICAgICAgICB2YXIgdHJhY2tTY29wZSA9IHBhcnNlckNvbmZpZy50cmFja1Njb3BlICE9PSBmYWxzZTtcclxuICAgICAgICB2YXIgaXNUUyA9IHBhcnNlckNvbmZpZy50eXBlc2NyaXB0O1xyXG4gICAgICAgIHZhciB3b3JkUkUgPSBwYXJzZXJDb25maWcud29yZENoYXJhY3RlcnMgfHwgL1tcXHckXFx4YTEtXFx1ZmZmZl0vO1xyXG5cclxuICAgICAgICAvLyBUb2tlbml6ZXJcclxuXHJcbiAgICAgICAgdmFyIGtleXdvcmRzID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24ga3codHlwZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogdHlwZSwgc3R5bGU6IFwia2V5d29yZFwiIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIEEgPSBrdyhcImtleXdvcmQgYVwiKSxcclxuICAgICAgICAgICAgICAgIEIgPSBrdyhcImtleXdvcmQgYlwiKSxcclxuICAgICAgICAgICAgICAgIEMgPSBrdyhcImtleXdvcmQgY1wiKSxcclxuICAgICAgICAgICAgICAgIEQgPSBrdyhcImtleXdvcmQgZFwiKTtcclxuICAgICAgICAgICAgdmFyIG9wZXJhdG9yID0ga3coXCJvcGVyYXRvclwiKSxcclxuICAgICAgICAgICAgICAgIGF0b20gPSB7IHR5cGU6IFwiYXRvbVwiLCBzdHlsZTogXCJhdG9tXCIgfTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBpZjoga3coXCJpZlwiKSxcclxuICAgICAgICAgICAgICAgIHdoaWxlOiBBLFxyXG4gICAgICAgICAgICAgICAgd2l0aDogQSxcclxuICAgICAgICAgICAgICAgIGVsc2U6IEIsXHJcbiAgICAgICAgICAgICAgICBkbzogQixcclxuICAgICAgICAgICAgICAgIHRyeTogQixcclxuICAgICAgICAgICAgICAgIGZpbmFsbHk6IEIsXHJcbiAgICAgICAgICAgICAgICByZXR1cm46IEQsXHJcbiAgICAgICAgICAgICAgICBicmVhazogRCxcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlOiBELFxyXG4gICAgICAgICAgICAgICAgbmV3OiBrdyhcIm5ld1wiKSxcclxuICAgICAgICAgICAgICAgIGRlbGV0ZTogQyxcclxuICAgICAgICAgICAgICAgIHZvaWQ6IEMsXHJcbiAgICAgICAgICAgICAgICB0aHJvdzogQyxcclxuICAgICAgICAgICAgICAgIGRlYnVnZ2VyOiBrdyhcImRlYnVnZ2VyXCIpLFxyXG4gICAgICAgICAgICAgICAgdmFyOiBrdyhcInZhclwiKSxcclxuICAgICAgICAgICAgICAgIGNvbnN0OiBrdyhcInZhclwiKSxcclxuICAgICAgICAgICAgICAgIGxldDoga3coXCJ2YXJcIiksXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbjoga3coXCJmdW5jdGlvblwiKSxcclxuICAgICAgICAgICAgICAgIGNhdGNoOiBrdyhcImNhdGNoXCIpLFxyXG4gICAgICAgICAgICAgICAgZm9yOiBrdyhcImZvclwiKSxcclxuICAgICAgICAgICAgICAgIHN3aXRjaDoga3coXCJzd2l0Y2hcIiksXHJcbiAgICAgICAgICAgICAgICBjYXNlOiBrdyhcImNhc2VcIiksXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBrdyhcImRlZmF1bHRcIiksXHJcbiAgICAgICAgICAgICAgICBpbjogb3BlcmF0b3IsXHJcbiAgICAgICAgICAgICAgICB0eXBlb2Y6IG9wZXJhdG9yLFxyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VvZjogb3BlcmF0b3IsXHJcbiAgICAgICAgICAgICAgICB0cnVlOiBhdG9tLFxyXG4gICAgICAgICAgICAgICAgZmFsc2U6IGF0b20sXHJcbiAgICAgICAgICAgICAgICBudWxsOiBhdG9tLFxyXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkOiBhdG9tLFxyXG4gICAgICAgICAgICAgICAgTmFOOiBhdG9tLFxyXG4gICAgICAgICAgICAgICAgSW5maW5pdHk6IGF0b20sXHJcbiAgICAgICAgICAgICAgICB0aGlzOiBrdyhcInRoaXNcIiksXHJcbiAgICAgICAgICAgICAgICBjbGFzczoga3coXCJjbGFzc1wiKSxcclxuICAgICAgICAgICAgICAgIHN1cGVyOiBrdyhcImF0b21cIiksXHJcbiAgICAgICAgICAgICAgICB5aWVsZDogQyxcclxuICAgICAgICAgICAgICAgIGV4cG9ydDoga3coXCJleHBvcnRcIiksXHJcbiAgICAgICAgICAgICAgICBpbXBvcnQ6IGt3KFwiaW1wb3J0XCIpLFxyXG4gICAgICAgICAgICAgICAgZXh0ZW5kczogQyxcclxuICAgICAgICAgICAgICAgIGF3YWl0OiBDLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pKCk7XHJcblxyXG4gICAgICAgIHZhciBpc09wZXJhdG9yQ2hhciA9IC9bK1xcLSomJT08PiE/fH5eQF0vO1xyXG4gICAgICAgIHZhciBpc0pzb25sZEtleXdvcmQgPVxyXG4gICAgICAgICAgICAvXkAoY29udGV4dHxpZHx2YWx1ZXxsYW5ndWFnZXx0eXBlfGNvbnRhaW5lcnxsaXN0fHNldHxyZXZlcnNlfGluZGV4fGJhc2V8dm9jYWJ8Z3JhcGgpXCIvO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkUmVnZXhwKHN0cmVhbSkge1xyXG4gICAgICAgICAgICB2YXIgZXNjYXBlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbmV4dCxcclxuICAgICAgICAgICAgICAgIGluU2V0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHdoaWxlICgobmV4dCA9IHN0cmVhbS5uZXh0KCkpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghZXNjYXBlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0ID09IFwiL1wiICYmICFpblNldCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0ID09IFwiW1wiKSBpblNldCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoaW5TZXQgJiYgbmV4dCA9PSBcIl1cIikgaW5TZXQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVzY2FwZWQgPSAhZXNjYXBlZCAmJiBuZXh0ID09IFwiXFxcXFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBVc2VkIGFzIHNjcmF0Y2ggdmFyaWFibGVzIHRvIGNvbW11bmljYXRlIG11bHRpcGxlIHZhbHVlcyB3aXRob3V0XHJcbiAgICAgICAgLy8gY29uc2luZyB1cCB0b25zIG9mIG9iamVjdHMuXHJcbiAgICAgICAgdmFyIHR5cGUsIGNvbnRlbnQ7XHJcbiAgICAgICAgZnVuY3Rpb24gcmV0KHRwLCBzdHlsZSwgY29udCkge1xyXG4gICAgICAgICAgICB0eXBlID0gdHA7XHJcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250O1xyXG4gICAgICAgICAgICByZXR1cm4gc3R5bGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHRva2VuQmFzZShzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBjaCA9IHN0cmVhbS5uZXh0KCk7XHJcbiAgICAgICAgICAgIGlmIChjaCA9PSAnXCInIHx8IGNoID09IFwiJ1wiKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IHRva2VuU3RyaW5nKGNoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZS50b2tlbml6ZShzdHJlYW0sIHN0YXRlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgICAgIGNoID09IFwiLlwiICYmXHJcbiAgICAgICAgICAgICAgICBzdHJlYW0ubWF0Y2goL15cXGRbXFxkX10qKD86W2VFXVsrXFwtXT9bXFxkX10rKT8vKVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQoXCJudW1iZXJcIiwgXCJudW1iZXJcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT0gXCIuXCIgJiYgc3RyZWFtLm1hdGNoKFwiLi5cIikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQoXCJzcHJlYWRcIiwgXCJtZXRhXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKC9bXFxbXFxde31cXChcXCksO1xcOlxcLl0vLnRlc3QoY2gpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0KGNoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PSBcIj1cIiAmJiBzdHJlYW0uZWF0KFwiPlwiKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcIj0+XCIsIFwib3BlcmF0b3JcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICAgICBjaCA9PSBcIjBcIiAmJlxyXG4gICAgICAgICAgICAgICAgc3RyZWFtLm1hdGNoKC9eKD86eFtcXGRBLUZhLWZfXSt8b1swLTdfXSt8YlswMV9dKyluPy8pXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcIm51bWJlclwiLCBcIm51bWJlclwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgvXFxkLy50ZXN0KGNoKSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLm1hdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgIC9eW1xcZF9dKig/Om58KD86XFwuW1xcZF9dKik/KD86W2VFXVsrXFwtXT9bXFxkX10rKT8pPy9cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwibnVtYmVyXCIsIFwibnVtYmVyXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09IFwiL1wiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmVhdChcIipcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IHRva2VuQ29tbWVudDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW5Db21tZW50KHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJlYW0uZWF0KFwiL1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5za2lwVG9FbmQoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwiY29tbWVudFwiLCBcImNvbW1lbnRcIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4cHJlc3Npb25BbGxvd2VkKHN0cmVhbSwgc3RhdGUsIDEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVhZFJlZ2V4cChzdHJlYW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5tYXRjaCgvXlxcYigoW2dpbXl1c10pKD8hW2dpbXl1c10qXFwyKSkrXFxiLyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldChcInJlZ2V4cFwiLCBcInN0cmluZy0yXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uZWF0KFwiPVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwib3BlcmF0b3JcIiwgXCJvcGVyYXRvclwiLCBzdHJlYW0uY3VycmVudCgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PSBcImBcIikge1xyXG4gICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlblF1YXNpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuUXVhc2koc3RyZWFtLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT0gXCIjXCIgJiYgc3RyZWFtLnBlZWsoKSA9PSBcIiFcIikge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNraXBUb0VuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcIm1ldGFcIiwgXCJtZXRhXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09IFwiI1wiICYmIHN0cmVhbS5lYXRXaGlsZSh3b3JkUkUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwidmFyaWFibGVcIiwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgICAgIChjaCA9PSBcIjxcIiAmJiBzdHJlYW0ubWF0Y2goXCIhLS1cIikpIHx8XHJcbiAgICAgICAgICAgICAgICAoY2ggPT0gXCItXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ubWF0Y2goXCItPlwiKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICEvXFxTLy50ZXN0KHN0cmVhbS5zdHJpbmcuc2xpY2UoMCwgc3RyZWFtLnN0YXJ0KSkpXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNraXBUb0VuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcImNvbW1lbnRcIiwgXCJjb21tZW50XCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzT3BlcmF0b3JDaGFyLnRlc3QoY2gpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2ggIT0gXCI+XCIgfHwgIXN0YXRlLmxleGljYWwgfHwgc3RhdGUubGV4aWNhbC50eXBlICE9IFwiPlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5lYXQoXCI9XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PSBcIiFcIiB8fCBjaCA9PSBcIj1cIikgc3RyZWFtLmVhdChcIj1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvWzw+KitcXC18Jj9dLy50ZXN0KGNoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0uZWF0KGNoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09IFwiPlwiKSBzdHJlYW0uZWF0KGNoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT0gXCI/XCIgJiYgc3RyZWFtLmVhdChcIi5cIikpIHJldHVybiByZXQoXCIuXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcIm9wZXJhdG9yXCIsIFwib3BlcmF0b3JcIiwgc3RyZWFtLmN1cnJlbnQoKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAod29yZFJFLnRlc3QoY2gpKSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0uZWF0V2hpbGUod29yZFJFKTtcclxuICAgICAgICAgICAgICAgIHZhciB3b3JkID0gc3RyZWFtLmN1cnJlbnQoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5sYXN0VHlwZSAhPSBcIi5cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXl3b3Jkcy5wcm9wZXJ0eUlzRW51bWVyYWJsZSh3b3JkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIga3cgPSBrZXl3b3Jkc1t3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldChrdy50eXBlLCBrdy5zdHlsZSwgd29yZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29yZCA9PSBcImFzeW5jXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLm1hdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgL14oXFxzfFxcL1xcKihbXipdfFxcKig/IVxcLykpKj9cXCpcXC8pKltcXFtcXChcXHddLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQoXCJhc3luY1wiLCBcImtleXdvcmRcIiwgd29yZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwidmFyaWFibGVcIiwgXCJ2YXJpYWJsZVwiLCB3b3JkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdG9rZW5TdHJpbmcocXVvdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXNjYXBlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAganNvbmxkTW9kZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wZWVrKCkgPT0gXCJAXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ubWF0Y2goaXNKc29ubGRLZXl3b3JkKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldChcImpzb25sZC1rZXl3b3JkXCIsIFwibWV0YVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHdoaWxlICgobmV4dCA9IHN0cmVhbS5uZXh0KCkpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCA9PSBxdW90ZSAmJiAhZXNjYXBlZCkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZXNjYXBlZCA9ICFlc2NhcGVkICYmIG5leHQgPT0gXCJcXFxcXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVzY2FwZWQpIHN0YXRlLnRva2VuaXplID0gdG9rZW5CYXNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcInN0cmluZ1wiLCBcInN0cmluZ1wiKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHRva2VuQ29tbWVudChzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBtYXliZUVuZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgY2g7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY2ggPSBzdHJlYW0ubmV4dCgpKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoID09IFwiL1wiICYmIG1heWJlRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBtYXliZUVuZCA9IGNoID09IFwiKlwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXQoXCJjb21tZW50XCIsIFwiY29tbWVudFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHRva2VuUXVhc2koc3RyZWFtLCBzdGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgZXNjYXBlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbmV4dDtcclxuICAgICAgICAgICAgd2hpbGUgKChuZXh0ID0gc3RyZWFtLm5leHQoKSkgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICFlc2NhcGVkICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKG5leHQgPT0gXCJgXCIgfHwgKG5leHQgPT0gXCIkXCIgJiYgc3RyZWFtLmVhdChcIntcIikpKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlc2NhcGVkID0gIWVzY2FwZWQgJiYgbmV4dCA9PSBcIlxcXFxcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmV0KFwicXVhc2lcIiwgXCJzdHJpbmctMlwiLCBzdHJlYW0uY3VycmVudCgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBicmFja2V0cyA9IFwiKFt7fV0pXCI7XHJcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNydWRlIGxvb2thaGVhZCB0cmljayB0byB0cnkgYW5kIG5vdGljZSB0aGF0IHdlJ3JlXHJcbiAgICAgICAgLy8gcGFyc2luZyB0aGUgYXJndW1lbnQgcGF0dGVybnMgZm9yIGEgZmF0LWFycm93IGZ1bmN0aW9uIGJlZm9yZSB3ZVxyXG4gICAgICAgIC8vIGFjdHVhbGx5IGhpdCB0aGUgYXJyb3cgdG9rZW4uIEl0IG9ubHkgd29ya3MgaWYgdGhlIGFycm93IGlzIG9uXHJcbiAgICAgICAgLy8gdGhlIHNhbWUgbGluZSBhcyB0aGUgYXJndW1lbnRzIGFuZCB0aGVyZSdzIG5vIHN0cmFuZ2Ugbm9pc2VcclxuICAgICAgICAvLyAoY29tbWVudHMpIGluIGJldHdlZW4uIEZhbGxiYWNrIGlzIHRvIG9ubHkgbm90aWNlIHdoZW4gd2UgaGl0IHRoZVxyXG4gICAgICAgIC8vIGFycm93LCBhbmQgbm90IGRlY2xhcmUgdGhlIGFyZ3VtZW50cyBhcyBsb2NhbHMgZm9yIHRoZSBhcnJvd1xyXG4gICAgICAgIC8vIGJvZHkuXHJcbiAgICAgICAgZnVuY3Rpb24gZmluZEZhdEFycm93KHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKHN0YXRlLmZhdEFycm93QXQpIHN0YXRlLmZhdEFycm93QXQgPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIgYXJyb3cgPSBzdHJlYW0uc3RyaW5nLmluZGV4T2YoXCI9PlwiLCBzdHJlYW0uc3RhcnQpO1xyXG4gICAgICAgICAgICBpZiAoYXJyb3cgPCAwKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNUUykge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIHNraXAgVHlwZVNjcmlwdCByZXR1cm4gdHlwZSBkZWNsYXJhdGlvbnMgYWZ0ZXIgdGhlIGFyZ3VtZW50c1xyXG4gICAgICAgICAgICAgICAgdmFyIG0gPSAvOlxccyooPzpcXHcrKD86PFtePl0qPnxcXFtcXF0pP3xcXHtbXn1dKlxcfSlcXHMqJC8uZXhlYyhcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uc3RyaW5nLnNsaWNlKHN0cmVhbS5zdGFydCwgYXJyb3cpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIGFycm93ID0gbS5pbmRleDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGRlcHRoID0gMCxcclxuICAgICAgICAgICAgICAgIHNhd1NvbWV0aGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwb3MgPSBhcnJvdyAtIDE7IHBvcyA+PSAwOyAtLXBvcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoID0gc3RyZWFtLnN0cmluZy5jaGFyQXQocG9zKTtcclxuICAgICAgICAgICAgICAgIHZhciBicmFja2V0ID0gYnJhY2tldHMuaW5kZXhPZihjaCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYnJhY2tldCA+PSAwICYmIGJyYWNrZXQgPCAzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkZXB0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICArK3BvcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICgtLWRlcHRoID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09IFwiKFwiKSBzYXdTb21ldGhpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGJyYWNrZXQgPj0gMyAmJiBicmFja2V0IDwgNikge1xyXG4gICAgICAgICAgICAgICAgICAgICsrZGVwdGg7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHdvcmRSRS50ZXN0KGNoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNhd1NvbWV0aGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9bXCInXFwvYF0vLnRlc3QoY2gpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IDsgLS1wb3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvcyA9PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gc3RyZWFtLnN0cmluZy5jaGFyQXQocG9zIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgPT0gY2ggJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5zdHJpbmcuY2hhckF0KHBvcyAtIDIpICE9IFwiXFxcXFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zLS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2F3U29tZXRoaW5nICYmICFkZXB0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICsrcG9zO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzYXdTb21ldGhpbmcgJiYgIWRlcHRoKSBzdGF0ZS5mYXRBcnJvd0F0ID0gcG9zO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUGFyc2VyXHJcblxyXG4gICAgICAgIHZhciBhdG9taWNUeXBlcyA9IHtcclxuICAgICAgICAgICAgYXRvbTogdHJ1ZSxcclxuICAgICAgICAgICAgbnVtYmVyOiB0cnVlLFxyXG4gICAgICAgICAgICB2YXJpYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgc3RyaW5nOiB0cnVlLFxyXG4gICAgICAgICAgICByZWdleHA6IHRydWUsXHJcbiAgICAgICAgICAgIHRoaXM6IHRydWUsXHJcbiAgICAgICAgICAgIGltcG9ydDogdHJ1ZSxcclxuICAgICAgICAgICAgXCJqc29ubGQta2V5d29yZFwiOiB0cnVlLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIEpTTGV4aWNhbChpbmRlbnRlZCwgY29sdW1uLCB0eXBlLCBhbGlnbiwgcHJldiwgaW5mbykge1xyXG4gICAgICAgICAgICB0aGlzLmluZGVudGVkID0gaW5kZW50ZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xyXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xyXG4gICAgICAgICAgICB0aGlzLnByZXYgPSBwcmV2O1xyXG4gICAgICAgICAgICB0aGlzLmluZm8gPSBpbmZvO1xyXG4gICAgICAgICAgICBpZiAoYWxpZ24gIT0gbnVsbCkgdGhpcy5hbGlnbiA9IGFsaWduO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaW5TY29wZShzdGF0ZSwgdmFybmFtZSkge1xyXG4gICAgICAgICAgICBpZiAoIXRyYWNrU2NvcGUpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgZm9yICh2YXIgdiA9IHN0YXRlLmxvY2FsVmFyczsgdjsgdiA9IHYubmV4dClcclxuICAgICAgICAgICAgICAgIGlmICh2Lm5hbWUgPT0gdmFybmFtZSkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGN4ID0gc3RhdGUuY29udGV4dDsgY3g7IGN4ID0gY3gucHJldikge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdiA9IGN4LnZhcnM7IHY7IHYgPSB2Lm5leHQpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYubmFtZSA9PSB2YXJuYW1lKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcGFyc2VKUyhzdGF0ZSwgc3R5bGUsIHR5cGUsIGNvbnRlbnQsIHN0cmVhbSkge1xyXG4gICAgICAgICAgICB2YXIgY2MgPSBzdGF0ZS5jYztcclxuICAgICAgICAgICAgLy8gQ29tbXVuaWNhdGUgb3VyIGNvbnRleHQgdG8gdGhlIGNvbWJpbmF0b3JzLlxyXG4gICAgICAgICAgICAvLyAoTGVzcyB3YXN0ZWZ1bCB0aGFuIGNvbnNpbmcgdXAgYSBodW5kcmVkIGNsb3N1cmVzIG9uIGV2ZXJ5IGNhbGwuKVxyXG4gICAgICAgICAgICBjeC5zdGF0ZSA9IHN0YXRlO1xyXG4gICAgICAgICAgICBjeC5zdHJlYW0gPSBzdHJlYW07XHJcbiAgICAgICAgICAgIChjeC5tYXJrZWQgPSBudWxsKSwgKGN4LmNjID0gY2MpO1xyXG4gICAgICAgICAgICBjeC5zdHlsZSA9IHN0eWxlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFzdGF0ZS5sZXhpY2FsLmhhc093blByb3BlcnR5KFwiYWxpZ25cIikpXHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5sZXhpY2FsLmFsaWduID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tYmluYXRvciA9IGNjLmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgICAgID8gY2MucG9wKClcclxuICAgICAgICAgICAgICAgICAgICA6IGpzb25Nb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgPyBleHByZXNzaW9uXHJcbiAgICAgICAgICAgICAgICAgICAgOiBzdGF0ZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29tYmluYXRvcih0eXBlLCBjb250ZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChjYy5sZW5ndGggJiYgY2NbY2MubGVuZ3RoIC0gMV0ubGV4KSBjYy5wb3AoKSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjeC5tYXJrZWQpIHJldHVybiBjeC5tYXJrZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiICYmIGluU2NvcGUoc3RhdGUsIGNvbnRlbnQpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ2YXJpYWJsZS0yXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb21iaW5hdG9yIHV0aWxzXHJcblxyXG4gICAgICAgIHZhciBjeCA9IHsgc3RhdGU6IG51bGwsIGNvbHVtbjogbnVsbCwgbWFya2VkOiBudWxsLCBjYzogbnVsbCB9O1xyXG4gICAgICAgIGZ1bmN0aW9uIHBhc3MoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXHJcbiAgICAgICAgICAgICAgICBjeC5jYy5wdXNoKGFyZ3VtZW50c1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGNvbnQoKSB7XHJcbiAgICAgICAgICAgIHBhc3MuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGluTGlzdChuYW1lLCBsaXN0KSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHYgPSBsaXN0OyB2OyB2ID0gdi5uZXh0KSBpZiAodi5uYW1lID09IG5hbWUpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlZ2lzdGVyKHZhcm5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXRlID0gY3guc3RhdGU7XHJcbiAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwiZGVmXCI7XHJcbiAgICAgICAgICAgIGlmICghdHJhY2tTY29wZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoc3RhdGUuY29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmxleGljYWwuaW5mbyA9PSBcInZhclwiICYmXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuY29udGV4dCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmNvbnRleHQuYmxvY2tcclxuICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FIGZ1bmN0aW9uIGRlY2xzIGFyZSBhbHNvIG5vdCBibG9jayBzY29wZWRcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Q29udGV4dCA9IHJlZ2lzdGVyVmFyU2NvcGVkKHZhcm5hbWUsIHN0YXRlLmNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdDb250ZXh0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuY29udGV4dCA9IG5ld0NvbnRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFpbkxpc3QodmFybmFtZSwgc3RhdGUubG9jYWxWYXJzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmxvY2FsVmFycyA9IG5ldyBWYXIodmFybmFtZSwgc3RhdGUubG9jYWxWYXJzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRmFsbCB0aHJvdWdoIG1lYW5zIHRoaXMgaXMgZ2xvYmFsXHJcbiAgICAgICAgICAgIGlmIChwYXJzZXJDb25maWcuZ2xvYmFsVmFycyAmJiAhaW5MaXN0KHZhcm5hbWUsIHN0YXRlLmdsb2JhbFZhcnMpKVxyXG4gICAgICAgICAgICAgICAgc3RhdGUuZ2xvYmFsVmFycyA9IG5ldyBWYXIodmFybmFtZSwgc3RhdGUuZ2xvYmFsVmFycyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlZ2lzdGVyVmFyU2NvcGVkKHZhcm5hbWUsIGNvbnRleHQpIHtcclxuICAgICAgICAgICAgaWYgKCFjb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmJsb2NrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5uZXIgPSByZWdpc3RlclZhclNjb3BlZCh2YXJuYW1lLCBjb250ZXh0LnByZXYpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpbm5lcikgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5uZXIgPT0gY29udGV4dC5wcmV2KSByZXR1cm4gY29udGV4dDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29udGV4dChpbm5lciwgY29udGV4dC52YXJzLCB0cnVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpbkxpc3QodmFybmFtZSwgY29udGV4dC52YXJzKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvbnRleHQoXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5wcmV2LFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBWYXIodmFybmFtZSwgY29udGV4dC52YXJzKSxcclxuICAgICAgICAgICAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaXNNb2RpZmllcihuYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICBuYW1lID09IFwicHVibGljXCIgfHxcclxuICAgICAgICAgICAgICAgIG5hbWUgPT0gXCJwcml2YXRlXCIgfHxcclxuICAgICAgICAgICAgICAgIG5hbWUgPT0gXCJwcm90ZWN0ZWRcIiB8fFxyXG4gICAgICAgICAgICAgICAgbmFtZSA9PSBcImFic3RyYWN0XCIgfHxcclxuICAgICAgICAgICAgICAgIG5hbWUgPT0gXCJyZWFkb25seVwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb21iaW5hdG9yc1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBDb250ZXh0KHByZXYsIHZhcnMsIGJsb2NrKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJldiA9IHByZXY7XHJcbiAgICAgICAgICAgIHRoaXMudmFycyA9IHZhcnM7XHJcbiAgICAgICAgICAgIHRoaXMuYmxvY2sgPSBibG9jaztcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gVmFyKG5hbWUsIG5leHQpIHtcclxuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0ID0gbmV4dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkZWZhdWx0VmFycyA9IG5ldyBWYXIoXCJ0aGlzXCIsIG5ldyBWYXIoXCJhcmd1bWVudHNcIiwgbnVsbCkpO1xyXG4gICAgICAgIGZ1bmN0aW9uIHB1c2hjb250ZXh0KCkge1xyXG4gICAgICAgICAgICBjeC5zdGF0ZS5jb250ZXh0ID0gbmV3IENvbnRleHQoXHJcbiAgICAgICAgICAgICAgICBjeC5zdGF0ZS5jb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgY3guc3RhdGUubG9jYWxWYXJzLFxyXG4gICAgICAgICAgICAgICAgZmFsc2VcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY3guc3RhdGUubG9jYWxWYXJzID0gZGVmYXVsdFZhcnM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHB1c2hibG9ja2NvbnRleHQoKSB7XHJcbiAgICAgICAgICAgIGN4LnN0YXRlLmNvbnRleHQgPSBuZXcgQ29udGV4dChcclxuICAgICAgICAgICAgICAgIGN4LnN0YXRlLmNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICBjeC5zdGF0ZS5sb2NhbFZhcnMsXHJcbiAgICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGN4LnN0YXRlLmxvY2FsVmFycyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHBvcGNvbnRleHQoKSB7XHJcbiAgICAgICAgICAgIGN4LnN0YXRlLmxvY2FsVmFycyA9IGN4LnN0YXRlLmNvbnRleHQudmFycztcclxuICAgICAgICAgICAgY3guc3RhdGUuY29udGV4dCA9IGN4LnN0YXRlLmNvbnRleHQucHJldjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcG9wY29udGV4dC5sZXggPSB0cnVlO1xyXG4gICAgICAgIGZ1bmN0aW9uIHB1c2hsZXgodHlwZSwgaW5mbykge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gY3guc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50ID0gc3RhdGUuaW5kZW50ZWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUubGV4aWNhbC50eXBlID09IFwic3RhdFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIGluZGVudCA9IHN0YXRlLmxleGljYWwuaW5kZW50ZWQ7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG91dGVyID0gc3RhdGUubGV4aWNhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXIgJiYgb3V0ZXIudHlwZSA9PSBcIilcIiAmJiBvdXRlci5hbGlnbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXIgPSBvdXRlci5wcmV2XHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnQgPSBvdXRlci5pbmRlbnRlZDtcclxuICAgICAgICAgICAgICAgIHN0YXRlLmxleGljYWwgPSBuZXcgSlNMZXhpY2FsKFxyXG4gICAgICAgICAgICAgICAgICAgIGluZGVudCxcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdHJlYW0uY29sdW1uKCksXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmxleGljYWwsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5mb1xyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVzdWx0LmxleCA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHBvcGxleCgpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXRlID0gY3guc3RhdGU7XHJcbiAgICAgICAgICAgIGlmIChzdGF0ZS5sZXhpY2FsLnByZXYpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5sZXhpY2FsLnR5cGUgPT0gXCIpXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuaW5kZW50ZWQgPSBzdGF0ZS5sZXhpY2FsLmluZGVudGVkO1xyXG4gICAgICAgICAgICAgICAgc3RhdGUubGV4aWNhbCA9IHN0YXRlLmxleGljYWwucHJldjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwb3BsZXgubGV4ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZXhwZWN0KHdhbnRlZCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBleHAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gd2FudGVkKSByZXR1cm4gY29udCgpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgd2FudGVkID09IFwiO1wiIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9PSBcIn1cIiB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPT0gXCIpXCIgfHxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlID09IFwiXVwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhc3MoKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIGNvbnQoZXhwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZXhwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3RhdGVtZW50KHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwidmFyZGVmXCIsIHZhbHVlKSxcclxuICAgICAgICAgICAgICAgICAgICB2YXJkZWYsXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwiO1wiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXhcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwia2V5d29yZCBhXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgcGFyZW5FeHByLCBzdGF0ZW1lbnQsIHBvcGxleCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwia2V5d29yZCBiXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgc3RhdGVtZW50LCBwb3BsZXgpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImtleXdvcmQgZFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGN4LnN0cmVhbS5tYXRjaCgvXlxccyokLywgZmFsc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgPyBjb250KClcclxuICAgICAgICAgICAgICAgICAgICA6IGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcInN0YXRcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVleHByZXNzaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChcIjtcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wbGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImRlYnVnZ2VyXCIpIHJldHVybiBjb250KGV4cGVjdChcIjtcIikpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIntcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJ9XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hibG9ja2NvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGNvbnRleHRcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiO1wiKSByZXR1cm4gY29udCgpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImlmXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdGF0ZS5sZXhpY2FsLmluZm8gPT0gXCJlbHNlXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdGF0ZS5jY1tjeC5zdGF0ZS5jYy5sZW5ndGggLSAxXSA9PSBwb3BsZXhcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdGF0ZS5jYy5wb3AoKSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcImZvcm1cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW5FeHByLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF5YmVlbHNlXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImZvclwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcImZvcm1cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGJsb2NrY29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICBmb3JzcGVjLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3Bjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGxleFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJjbGFzc1wiIHx8IChpc1RTICYmIHZhbHVlID09IFwiaW50ZXJmYWNlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJmb3JtXCIsIHR5cGUgPT0gXCJjbGFzc1wiID8gdHlwZSA6IHZhbHVlKSxcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCJkZWNsYXJlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udChzdGF0ZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgICAgICAgICBpc1RTICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKHZhbHVlID09IFwibW9kdWxlXCIgfHwgdmFsdWUgPT0gXCJlbnVtXCIgfHwgdmFsdWUgPT0gXCJ0eXBlXCIpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgY3guc3RyZWFtLm1hdGNoKC9eXFxzKlxcdy8sIGZhbHNlKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiZW51bVwiKSByZXR1cm4gY29udChlbnVtZGVmKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcInR5cGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChcIm9wZXJhdG9yXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZWV4cHIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3QoXCI7XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJmb3JtXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChcIntcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwifVwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wbGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCJuYW1lc3BhY2VcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBleHByZXNzaW9uLCBzdGF0ZW1lbnQsIHBvcGxleCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCJhYnN0cmFjdFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoc3RhdGVtZW50KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocHVzaGxleChcInN0YXRcIiksIG1heWJlbGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwic3dpdGNoXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiZm9ybVwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbkV4cHIsXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwie1wiKSxcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwifVwiLCBcInN3aXRjaFwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwdXNoYmxvY2tjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGxleCxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJjYXNlXCIpIHJldHVybiBjb250KGV4cHJlc3Npb24sIGV4cGVjdChcIjpcIikpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImRlZmF1bHRcIikgcmV0dXJuIGNvbnQoZXhwZWN0KFwiOlwiKSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiY2F0Y2hcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJmb3JtXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIG1heWJlQ2F0Y2hCaW5kaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJleHBvcnRcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJzdGF0XCIpLCBhZnRlckV4cG9ydCwgcG9wbGV4KTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJpbXBvcnRcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJzdGF0XCIpLCBhZnRlckltcG9ydCwgcG9wbGV4KTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJhc3luY1wiKSByZXR1cm4gY29udChzdGF0ZW1lbnQpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJAXCIpIHJldHVybiBjb250KGV4cHJlc3Npb24sIHN0YXRlbWVudCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHB1c2hsZXgoXCJzdGF0XCIpLCBleHByZXNzaW9uLCBleHBlY3QoXCI7XCIpLCBwb3BsZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZUNhdGNoQmluZGluZyh0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gY29udChmdW5hcmcsIGV4cGVjdChcIilcIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBleHByZXNzaW9uKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBleHByZXNzaW9uSW5uZXIodHlwZSwgdmFsdWUsIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZXhwcmVzc2lvbk5vQ29tbWEodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGV4cHJlc3Npb25Jbm5lcih0eXBlLCB2YWx1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHBhcmVuRXhwcih0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlICE9IFwiKFwiKSByZXR1cm4gcGFzcygpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KFwiKVwiKSwgbWF5YmVleHByZXNzaW9uLCBleHBlY3QoXCIpXCIpLCBwb3BsZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBleHByZXNzaW9uSW5uZXIodHlwZSwgdmFsdWUsIG5vQ29tbWEpIHtcclxuICAgICAgICAgICAgaWYgKGN4LnN0YXRlLmZhdEFycm93QXQgPT0gY3guc3RyZWFtLnN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYm9keSA9IG5vQ29tbWEgPyBhcnJvd0JvZHlOb0NvbW1hIDogYXJyb3dCb2R5O1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIoXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiKVwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFzZXAoZnVuYXJnLCBcIilcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcGxleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwiPT5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcGNvbnRleHRcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhc3MoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBlY3QoXCI9PlwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBtYXliZW9wID0gbm9Db21tYSA/IG1heWJlb3BlcmF0b3JOb0NvbW1hIDogbWF5YmVvcGVyYXRvckNvbW1hO1xyXG4gICAgICAgICAgICBpZiAoYXRvbWljVHlwZXMuaGFzT3duUHJvcGVydHkodHlwZSkpIHJldHVybiBjb250KG1heWJlb3ApO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBjb250KGZ1bmN0aW9uZGVmLCBtYXliZW9wKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJjbGFzc1wiIHx8IChpc1RTICYmIHZhbHVlID09IFwiaW50ZXJmYWNlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBjbGFzc0V4cHJlc3Npb24sIHBvcGxleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJrZXl3b3JkIGNcIiB8fCB0eXBlID09IFwiYXN5bmNcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KG5vQ29tbWEgPyBleHByZXNzaW9uTm9Db21tYSA6IGV4cHJlc3Npb24pO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIihcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCIpXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1heWJlZXhwcmVzc2lvbixcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoXCIpXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGxleCxcclxuICAgICAgICAgICAgICAgICAgICBtYXliZW9wXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIm9wZXJhdG9yXCIgfHwgdHlwZSA9PSBcInNwcmVhZFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQobm9Db21tYSA/IGV4cHJlc3Npb25Ob0NvbW1hIDogZXhwcmVzc2lvbik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocHVzaGxleChcIl1cIiksIGFycmF5TGl0ZXJhbCwgcG9wbGV4LCBtYXliZW9wKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ7XCIpIHJldHVybiBjb250Q29tbWFzZXAob2JqcHJvcCwgXCJ9XCIsIG51bGwsIG1heWJlb3ApO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInF1YXNpXCIpIHJldHVybiBwYXNzKHF1YXNpLCBtYXliZW9wKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJuZXdcIikgcmV0dXJuIGNvbnQobWF5YmVUYXJnZXQobm9Db21tYSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZWV4cHJlc3Npb24odHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZS5tYXRjaCgvWztcXH1cXClcXF0sXS8pKSByZXR1cm4gcGFzcygpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhleHByZXNzaW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlb3BlcmF0b3JDb21tYSh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIixcIikgcmV0dXJuIGNvbnQobWF5YmVleHByZXNzaW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIG1heWJlb3BlcmF0b3JOb0NvbW1hKHR5cGUsIHZhbHVlLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlb3BlcmF0b3JOb0NvbW1hKHR5cGUsIHZhbHVlLCBub0NvbW1hKSB7XHJcbiAgICAgICAgICAgIHZhciBtZSA9XHJcbiAgICAgICAgICAgICAgICBub0NvbW1hID09IGZhbHNlID8gbWF5YmVvcGVyYXRvckNvbW1hIDogbWF5YmVvcGVyYXRvck5vQ29tbWE7XHJcbiAgICAgICAgICAgIHZhciBleHByID0gbm9Db21tYSA9PSBmYWxzZSA/IGV4cHJlc3Npb24gOiBleHByZXNzaW9uTm9Db21tYTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCI9PlwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgbm9Db21tYSA/IGFycm93Qm9keU5vQ29tbWEgOiBhcnJvd0JvZHksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJvcGVyYXRvclwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoL1xcK1xcK3wtLS8udGVzdCh2YWx1ZSkgfHwgKGlzVFMgJiYgdmFsdWUgPT0gXCIhXCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250KG1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICBpc1RTICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPT0gXCI8XCIgJiZcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdHJlYW0ubWF0Y2goL14oW148Pl18PFtePD5dKj4pKj5cXHMqXFwoLywgZmFsc2UpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCI+XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYXNlcCh0eXBlZXhwciwgXCI+XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIj9cIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiOlwiKSwgZXhwcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChleHByKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInF1YXNpXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXNzKHF1YXNpLCBtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCI7XCIpIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIoXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udENvbW1hc2VwKGV4cHJlc3Npb25Ob0NvbW1hLCBcIilcIiwgXCJjYWxsXCIsIG1lKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIuXCIpIHJldHVybiBjb250KHByb3BlcnR5LCBtZSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcIl1cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgbWF5YmVleHByZXNzaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChcIl1cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAoaXNUUyAmJiB2YWx1ZSA9PSBcImFzXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQodHlwZWV4cHIsIG1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInJlZ2V4cFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5zdGF0ZS5sYXN0VHlwZSA9IGN4Lm1hcmtlZCA9IFwib3BlcmF0b3JcIjtcclxuICAgICAgICAgICAgICAgIGN4LnN0cmVhbS5iYWNrVXAoY3guc3RyZWFtLnBvcyAtIGN4LnN0cmVhbS5zdGFydCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gcXVhc2kodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgIT0gXCJxdWFzaVwiKSByZXR1cm4gcGFzcygpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUuc2xpY2UodmFsdWUubGVuZ3RoIC0gMikgIT0gXCIke1wiKSByZXR1cm4gY29udChxdWFzaSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250KG1heWJlZXhwcmVzc2lvbiwgY29udGludWVRdWFzaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGNvbnRpbnVlUXVhc2kodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIn1cIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJzdHJpbmctMlwiO1xyXG4gICAgICAgICAgICAgICAgY3guc3RhdGUudG9rZW5pemUgPSB0b2tlblF1YXNpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocXVhc2kpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGFycm93Qm9keSh0eXBlKSB7XHJcbiAgICAgICAgICAgIGZpbmRGYXRBcnJvdyhjeC5zdHJlYW0sIGN4LnN0YXRlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHBhc3ModHlwZSA9PSBcIntcIiA/IHN0YXRlbWVudCA6IGV4cHJlc3Npb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBhcnJvd0JvZHlOb0NvbW1hKHR5cGUpIHtcclxuICAgICAgICAgICAgZmluZEZhdEFycm93KGN4LnN0cmVhbSwgY3guc3RhdGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyh0eXBlID09IFwie1wiID8gc3RhdGVtZW50IDogZXhwcmVzc2lvbk5vQ29tbWEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZVRhcmdldChub0NvbW1hKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIuXCIpIHJldHVybiBjb250KG5vQ29tbWEgPyB0YXJnZXROb0NvbW1hIDogdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiICYmIGlzVFMpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlVHlwZUFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vQ29tbWEgPyBtYXliZW9wZXJhdG9yTm9Db21tYSA6IG1heWJlb3BlcmF0b3JDb21tYVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBwYXNzKG5vQ29tbWEgPyBleHByZXNzaW9uTm9Db21tYSA6IGV4cHJlc3Npb24pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0YXJnZXQoXywgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwidGFyZ2V0XCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQobWF5YmVvcGVyYXRvckNvbW1hKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0YXJnZXROb0NvbW1hKF8sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcInRhcmdldFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KG1heWJlb3BlcmF0b3JOb0NvbW1hKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZWxhYmVsKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCI6XCIpIHJldHVybiBjb250KHBvcGxleCwgc3RhdGVtZW50KTtcclxuICAgICAgICAgICAgcmV0dXJuIHBhc3MobWF5YmVvcGVyYXRvckNvbW1hLCBleHBlY3QoXCI7XCIpLCBwb3BsZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBwcm9wZXJ0eSh0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBvYmpwcm9wKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiYXN5bmNcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQob2JqcHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgfHwgY3guc3R5bGUgPT0gXCJrZXl3b3JkXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImdldFwiIHx8IHZhbHVlID09IFwic2V0XCIpIHJldHVybiBjb250KGdldHRlclNldHRlcik7XHJcbiAgICAgICAgICAgICAgICB2YXIgbTsgLy8gV29yayBhcm91bmQgZmF0LWFycm93LWRldGVjdGlvbiBjb21wbGljYXRpb24gZm9yIGRldGVjdGluZyB0eXBlc2NyaXB0IHR5cGVkIGFycm93IHBhcmFtc1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIGlzVFMgJiZcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdGF0ZS5mYXRBcnJvd0F0ID09IGN4LnN0cmVhbS5zdGFydCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIChtID0gY3guc3RyZWFtLm1hdGNoKC9eXFxzKjpcXHMqLywgZmFsc2UpKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgIGN4LnN0YXRlLmZhdEFycm93QXQgPSBjeC5zdHJlYW0ucG9zICsgbVswXS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJudW1iZXJcIiB8fCB0eXBlID09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IGpzb25sZE1vZGUgPyBcInByb3BlcnR5XCIgOiBjeC5zdHlsZSArIFwiIHByb3BlcnR5XCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJqc29ubGQta2V5d29yZFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzVFMgJiYgaXNNb2RpZmllcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQob2JqcHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIltcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgbWF5YmV0eXBlLCBleHBlY3QoXCJdXCIpLCBhZnRlcnByb3ApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJzcHJlYWRcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbk5vQ29tbWEsIGFmdGVycHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCIqXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQob2JqcHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIjpcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhc3MoYWZ0ZXJwcm9wKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBnZXR0ZXJTZXR0ZXIodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSAhPSBcInZhcmlhYmxlXCIpIHJldHVybiBwYXNzKGFmdGVycHJvcCk7XHJcbiAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBhZnRlcnByb3AodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIjpcIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbk5vQ29tbWEpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIHBhc3MoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjb21tYXNlcCh3aGF0LCBlbmQsIHNlcCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBwcm9jZWVkKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VwID8gc2VwLmluZGV4T2YodHlwZSkgPiAtMSA6IHR5cGUgPT0gXCIsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGV4ID0gY3guc3RhdGUubGV4aWNhbDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGV4LmluZm8gPT0gXCJjYWxsXCIpIGxleC5wb3MgPSAobGV4LnBvcyB8fCAwKSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb24gKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlID09IGVuZCB8fCB2YWx1ZSA9PSBlbmQpIHJldHVybiBwYXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXNzKHdoYXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHByb2NlZWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gZW5kIHx8IHZhbHVlID09IGVuZCkgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzZXAgJiYgc2VwLmluZGV4T2YoXCI7XCIpID4gLTEpIHJldHVybiBwYXNzKHdoYXQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwZWN0KGVuZCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlID09IGVuZCB8fCB2YWx1ZSA9PSBlbmQpIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFzcyh3aGF0LCBwcm9jZWVkKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gY29udENvbW1hc2VwKHdoYXQsIGVuZCwgaW5mbykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMzsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgY3guY2MucHVzaChhcmd1bWVudHNbaV0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KGVuZCwgaW5mbyksIGNvbW1hc2VwKHdoYXQsIGVuZCksIHBvcGxleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGJsb2NrKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ9XCIpIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHN0YXRlbWVudCwgYmxvY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZXR5cGUodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGlzVFMpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlID09IFwiOlwiKSByZXR1cm4gY29udCh0eXBlZXhwcik7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI/XCIpIHJldHVybiBjb250KG1heWJldHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmV0eXBlT3JJbih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNUUyAmJiAodHlwZSA9PSBcIjpcIiB8fCB2YWx1ZSA9PSBcImluXCIpKSByZXR1cm4gY29udCh0eXBlZXhwcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlcmV0dHlwZSh0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1RTICYmIHR5cGUgPT0gXCI6XCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjeC5zdHJlYW0ubWF0Y2goL15cXHMqXFx3K1xccytpc1xcYi8sIGZhbHNlKSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udChleHByZXNzaW9uLCBpc0tXLCB0eXBlZXhwcik7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBpc0tXKF8sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImlzXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0eXBlZXhwcih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PSBcImtleW9mXCIgfHxcclxuICAgICAgICAgICAgICAgIHZhbHVlID09IFwidHlwZW9mXCIgfHxcclxuICAgICAgICAgICAgICAgIHZhbHVlID09IFwiaW5mZXJcIiB8fFxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPT0gXCJyZWFkb25seVwiXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCh2YWx1ZSA9PSBcInR5cGVvZlwiID8gZXhwcmVzc2lvbk5vQ29tbWEgOiB0eXBlZXhwcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiIHx8IHZhbHVlID09IFwidm9pZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcInR5cGVcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGFmdGVyVHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifFwiIHx8IHZhbHVlID09IFwiJlwiKSByZXR1cm4gY29udCh0eXBlZXhwcik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwic3RyaW5nXCIgfHwgdHlwZSA9PSBcIm51bWJlclwiIHx8IHR5cGUgPT0gXCJhdG9tXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChhZnRlclR5cGUpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIltcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJdXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hc2VwKHR5cGVleHByLCBcIl1cIiwgXCIsXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGxleCxcclxuICAgICAgICAgICAgICAgICAgICBhZnRlclR5cGVcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwie1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocHVzaGxleChcIn1cIiksIHR5cGVwcm9wcywgcG9wbGV4LCBhZnRlclR5cGUpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIihcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGNvbW1hc2VwKHR5cGVhcmcsIFwiKVwiKSwgbWF5YmVSZXR1cm5UeXBlLCBhZnRlclR5cGUpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIjxcIikgcmV0dXJuIGNvbnQoY29tbWFzZXAodHlwZWV4cHIsIFwiPlwiKSwgdHlwZWV4cHIpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInF1YXNpXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXNzKHF1YXNpVHlwZSwgYWZ0ZXJUeXBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZVJldHVyblR5cGUodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIj0+XCIpIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdHlwZXByb3BzKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUubWF0Y2goL1tcXH1cXClcXF1dLykpIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiLFwiIHx8IHR5cGUgPT0gXCI7XCIpIHJldHVybiBjb250KHR5cGVwcm9wcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHR5cGVwcm9wLCB0eXBlcHJvcHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0eXBlcHJvcCh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgfHwgY3guc3R5bGUgPT0gXCJrZXl3b3JkXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHR5cGVwcm9wKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBcIj9cIiB8fCB0eXBlID09IFwibnVtYmVyXCIgfHwgdHlwZSA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCh0eXBlcHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIjpcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQodHlwZWV4cHIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJbXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChcInZhcmlhYmxlXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1heWJldHlwZU9ySW4sXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwiXVwiKSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlcHJvcFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09IFwiKFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFzcyhmdW5jdGlvbmRlY2wsIHR5cGVwcm9wKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICghdHlwZS5tYXRjaCgvWztcXH1cXClcXF0sXS8pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHF1YXNpVHlwZSh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSAhPSBcInF1YXNpXCIpIHJldHVybiBwYXNzKCk7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zbGljZSh2YWx1ZS5sZW5ndGggLSAyKSAhPSBcIiR7XCIpIHJldHVybiBjb250KHF1YXNpVHlwZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250KHR5cGVleHByLCBjb250aW51ZVF1YXNpVHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGNvbnRpbnVlUXVhc2lUeXBlKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ9XCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwic3RyaW5nLTJcIjtcclxuICAgICAgICAgICAgICAgIGN4LnN0YXRlLnRva2VuaXplID0gdG9rZW5RdWFzaTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHF1YXNpVHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdHlwZWFyZyh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAodHlwZSA9PSBcInZhcmlhYmxlXCIgJiYgY3guc3RyZWFtLm1hdGNoKC9eXFxzKls/Ol0vLCBmYWxzZSkpIHx8XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PSBcIj9cIlxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCh0eXBlYXJnKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCI6XCIpIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJzcHJlYWRcIikgcmV0dXJuIGNvbnQodHlwZWFyZyk7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHR5cGVleHByKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gYWZ0ZXJUeXBlKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIjxcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCI+XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hc2VwKHR5cGVleHByLCBcIj5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIGFmdGVyVHlwZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifFwiIHx8IHR5cGUgPT0gXCIuXCIgfHwgdmFsdWUgPT0gXCImXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCh0eXBlZXhwcik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKSByZXR1cm4gY29udCh0eXBlZXhwciwgZXhwZWN0KFwiXVwiKSwgYWZ0ZXJUeXBlKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiZXh0ZW5kc1wiIHx8IHZhbHVlID09IFwiaW1wbGVtZW50c1wiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI/XCIpIHJldHVybiBjb250KHR5cGVleHByLCBleHBlY3QoXCI6XCIpLCB0eXBlZXhwcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlVHlwZUFyZ3MoXywgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiPFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcIj5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFzZXAodHlwZWV4cHIsIFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgYWZ0ZXJUeXBlXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0eXBlcGFyYW0oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHR5cGVleHByLCBtYXliZVR5cGVEZWZhdWx0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmVUeXBlRGVmYXVsdChfLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI9XCIpIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdmFyZGVmKF8sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImVudW1cIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChlbnVtZGVmKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhwYXR0ZXJuLCBtYXliZXR5cGUsIG1heWJlQXNzaWduLCB2YXJkZWZDb250KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gcGF0dGVybih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNUUyAmJiBpc01vZGlmaWVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChwYXR0ZXJuKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlZ2lzdGVyKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJzcHJlYWRcIikgcmV0dXJuIGNvbnQocGF0dGVybik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKSByZXR1cm4gY29udENvbW1hc2VwKGVsdHBhdHRlcm4sIFwiXVwiKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ7XCIpIHJldHVybiBjb250Q29tbWFzZXAocHJvcHBhdHRlcm4sIFwifVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gcHJvcHBhdHRlcm4odHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiICYmICFjeC5zdHJlYW0ubWF0Y2goL15cXHMqOi8sIGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgcmVnaXN0ZXIodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQobWF5YmVBc3NpZ24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInNwcmVhZFwiKSByZXR1cm4gY29udChwYXR0ZXJuKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ9XCIpIHJldHVybiBwYXNzKCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiXVwiKSwgZXhwZWN0KFwiOlwiKSwgcHJvcHBhdHRlcm4pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udChleHBlY3QoXCI6XCIpLCBwYXR0ZXJuLCBtYXliZUFzc2lnbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGVsdHBhdHRlcm4oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHBhdHRlcm4sIG1heWJlQXNzaWduKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmVBc3NpZ24oX3R5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIj1cIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbk5vQ29tbWEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB2YXJkZWZDb250KHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIsXCIpIHJldHVybiBjb250KHZhcmRlZik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlZWxzZSh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImtleXdvcmQgYlwiICYmIHZhbHVlID09IFwiZWxzZVwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocHVzaGxleChcImZvcm1cIiwgXCJlbHNlXCIpLCBzdGF0ZW1lbnQsIHBvcGxleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGZvcnNwZWModHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiYXdhaXRcIikgcmV0dXJuIGNvbnQoZm9yc3BlYyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gY29udChwdXNobGV4KFwiKVwiKSwgZm9yc3BlYzEsIHBvcGxleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGZvcnNwZWMxKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJcIikgcmV0dXJuIGNvbnQodmFyZGVmLCBmb3JzcGVjMik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmV0dXJuIGNvbnQoZm9yc3BlYzIpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhmb3JzcGVjMik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGZvcnNwZWMyKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiKVwiKSByZXR1cm4gY29udCgpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIjtcIikgcmV0dXJuIGNvbnQoZm9yc3BlYzIpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJpblwiIHx8IHZhbHVlID09IFwib2ZcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChleHByZXNzaW9uLCBmb3JzcGVjMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHBhc3MoZXhwcmVzc2lvbiwgZm9yc3BlYzIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBmdW5jdGlvbmRlZih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIqXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikge1xyXG4gICAgICAgICAgICAgICAgcmVnaXN0ZXIodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiKFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcIilcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFzZXAoZnVuYXJnLCBcIilcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIG1heWJlcmV0dHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCI8XCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBjb21tYXNlcCh0eXBlcGFyYW0sIFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25kZWZcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bmN0aW9uZGVjbCh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIqXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWNsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlZ2lzdGVyKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGZ1bmN0aW9uZGVjbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIoXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNoY29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiKVwiKSxcclxuICAgICAgICAgICAgICAgICAgICBjb21tYXNlcChmdW5hcmcsIFwiKVwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF5YmVyZXR0eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGNvbnRleHRcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmIChpc1RTICYmIHZhbHVlID09IFwiPFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcIj5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFzZXAodHlwZXBhcmFtLCBcIj5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uZGVjbFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdHlwZW5hbWUodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJrZXl3b3JkXCIgfHwgdHlwZSA9PSBcInZhcmlhYmxlXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwidHlwZVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQodHlwZW5hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09IFwiPFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KFwiPlwiKSwgY29tbWFzZXAodHlwZXBhcmFtLCBcIj5cIiksIHBvcGxleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZnVuYXJnKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIkBcIikgY29udChleHByZXNzaW9uLCBmdW5hcmcpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInNwcmVhZFwiKSByZXR1cm4gY29udChmdW5hcmcpO1xyXG4gICAgICAgICAgICBpZiAoaXNUUyAmJiBpc01vZGlmaWVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChmdW5hcmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc1RTICYmIHR5cGUgPT0gXCJ0aGlzXCIpIHJldHVybiBjb250KG1heWJldHlwZSwgbWF5YmVBc3NpZ24pO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhwYXR0ZXJuLCBtYXliZXR5cGUsIG1heWJlQXNzaWduKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gY2xhc3NFeHByZXNzaW9uKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIENsYXNzIGV4cHJlc3Npb25zIG1heSBoYXZlIGFuIG9wdGlvbmFsIG5hbWUuXHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmV0dXJuIGNsYXNzTmFtZSh0eXBlLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjbGFzc05hbWVBZnRlcih0eXBlLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGNsYXNzTmFtZSh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlZ2lzdGVyKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGNsYXNzTmFtZUFmdGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjbGFzc05hbWVBZnRlcih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI8XCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBjb21tYXNlcCh0eXBlcGFyYW0sIFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lQWZ0ZXJcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIHZhbHVlID09IFwiZXh0ZW5kc1wiIHx8XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PSBcImltcGxlbWVudHNcIiB8fFxyXG4gICAgICAgICAgICAgICAgKGlzVFMgJiYgdHlwZSA9PSBcIixcIilcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJpbXBsZW1lbnRzXCIpIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoaXNUUyA/IHR5cGVleHByIDogZXhwcmVzc2lvbiwgY2xhc3NOYW1lQWZ0ZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwie1wiKSByZXR1cm4gY29udChwdXNobGV4KFwifVwiKSwgY2xhc3NCb2R5LCBwb3BsZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjbGFzc0JvZHkodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgdHlwZSA9PSBcImFzeW5jXCIgfHxcclxuICAgICAgICAgICAgICAgICh0eXBlID09IFwidmFyaWFibGVcIiAmJlxyXG4gICAgICAgICAgICAgICAgICAgICh2YWx1ZSA9PSBcInN0YXRpY1wiIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID09IFwiZ2V0XCIgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPT0gXCJzZXRcIiB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoaXNUUyAmJiBpc01vZGlmaWVyKHZhbHVlKSkpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgY3guc3RyZWFtLm1hdGNoKC9eXFxzK1tcXHckXFx4YTEtXFx1ZmZmZl0vLCBmYWxzZSkpXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChjbGFzc0JvZHkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIiB8fCBjeC5zdHlsZSA9PSBcImtleXdvcmRcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoY2xhc3NmaWVsZCwgY2xhc3NCb2R5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIm51bWJlclwiIHx8IHR5cGUgPT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGNsYXNzZmllbGQsIGNsYXNzQm9keSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwcmVzc2lvbixcclxuICAgICAgICAgICAgICAgICAgICBtYXliZXR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwiXVwiKSxcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc2ZpZWxkLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzQm9keVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiKlwiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGNsYXNzQm9keSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlzVFMgJiYgdHlwZSA9PSBcIihcIikgcmV0dXJuIHBhc3MoZnVuY3Rpb25kZWNsLCBjbGFzc0JvZHkpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIjtcIiB8fCB0eXBlID09IFwiLFwiKSByZXR1cm4gY29udChjbGFzc0JvZHkpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIn1cIikgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiQFwiKSByZXR1cm4gY29udChleHByZXNzaW9uLCBjbGFzc0JvZHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjbGFzc2ZpZWxkKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIiFcIikgcmV0dXJuIGNvbnQoY2xhc3NmaWVsZCk7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIj9cIikgcmV0dXJuIGNvbnQoY2xhc3NmaWVsZCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiOlwiKSByZXR1cm4gY29udCh0eXBlZXhwciwgbWF5YmVBc3NpZ24pO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI9XCIpIHJldHVybiBjb250KGV4cHJlc3Npb25Ob0NvbW1hKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBjeC5zdGF0ZS5sZXhpY2FsLnByZXYsXHJcbiAgICAgICAgICAgICAgICBpc0ludGVyZmFjZSA9IGNvbnRleHQgJiYgY29udGV4dC5pbmZvID09IFwiaW50ZXJmYWNlXCI7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKGlzSW50ZXJmYWNlID8gZnVuY3Rpb25kZWNsIDogZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBhZnRlckV4cG9ydCh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIqXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQobWF5YmVGcm9tLCBleHBlY3QoXCI7XCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJkZWZhdWx0XCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiO1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ7XCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChjb21tYXNlcChleHBvcnRGaWVsZCwgXCJ9XCIpLCBtYXliZUZyb20sIGV4cGVjdChcIjtcIikpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhzdGF0ZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBleHBvcnRGaWVsZCh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJhc1wiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGV4cGVjdChcInZhcmlhYmxlXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHJldHVybiBwYXNzKGV4cHJlc3Npb25Ob0NvbW1hLCBleHBvcnRGaWVsZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGFmdGVySW1wb3J0KHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIoXCIpIHJldHVybiBwYXNzKGV4cHJlc3Npb24pO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIi5cIikgcmV0dXJuIHBhc3MobWF5YmVvcGVyYXRvckNvbW1hKTtcclxuICAgICAgICAgICAgcmV0dXJuIHBhc3MoaW1wb3J0U3BlYywgbWF5YmVNb3JlSW1wb3J0cywgbWF5YmVGcm9tKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gaW1wb3J0U3BlYyh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIntcIikgcmV0dXJuIGNvbnRDb21tYXNlcChpbXBvcnRTcGVjLCBcIn1cIik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmVnaXN0ZXIodmFsdWUpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIqXCIpIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udChtYXliZUFzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmVNb3JlSW1wb3J0cyh0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiLFwiKSByZXR1cm4gY29udChpbXBvcnRTcGVjLCBtYXliZU1vcmVJbXBvcnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmVBcyhfdHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiYXNcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChpbXBvcnRTcGVjKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZUZyb20oX3R5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImZyb21cIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChleHByZXNzaW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBhcnJheUxpdGVyYWwodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIl1cIikgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHBhc3MoY29tbWFzZXAoZXhwcmVzc2lvbk5vQ29tbWEsIFwiXVwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGVudW1kZWYoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKFxyXG4gICAgICAgICAgICAgICAgcHVzaGxleChcImZvcm1cIiksXHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuLFxyXG4gICAgICAgICAgICAgICAgZXhwZWN0KFwie1wiKSxcclxuICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJ9XCIpLFxyXG4gICAgICAgICAgICAgICAgY29tbWFzZXAoZW51bW1lbWJlciwgXCJ9XCIpLFxyXG4gICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgcG9wbGV4XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGVudW1tZW1iZXIoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHBhdHRlcm4sIG1heWJlQXNzaWduKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGlzQ29udGludWVkU3RhdGVtZW50KHN0YXRlLCB0ZXh0QWZ0ZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHN0YXRlLmxhc3RUeXBlID09IFwib3BlcmF0b3JcIiB8fFxyXG4gICAgICAgICAgICAgICAgc3RhdGUubGFzdFR5cGUgPT0gXCIsXCIgfHxcclxuICAgICAgICAgICAgICAgIGlzT3BlcmF0b3JDaGFyLnRlc3QodGV4dEFmdGVyLmNoYXJBdCgwKSkgfHxcclxuICAgICAgICAgICAgICAgIC9bLC5dLy50ZXN0KHRleHRBZnRlci5jaGFyQXQoMCkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBleHByZXNzaW9uQWxsb3dlZChzdHJlYW0sIHN0YXRlLCBiYWNrVXApIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIChzdGF0ZS50b2tlbml6ZSA9PSB0b2tlbkJhc2UgJiZcclxuICAgICAgICAgICAgICAgICAgICAvXig/Om9wZXJhdG9yfHNvZnxrZXl3b3JkIFtiY2RdfGNhc2V8bmV3fGV4cG9ydHxkZWZhdWx0fHNwcmVhZHxbXFxbe31cXCgsOzpdfD0+KSQvLnRlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLmxhc3RUeXBlXHJcbiAgICAgICAgICAgICAgICAgICAgKSkgfHxcclxuICAgICAgICAgICAgICAgIChzdGF0ZS5sYXN0VHlwZSA9PSBcInF1YXNpXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICAvXFx7XFxzKiQvLnRlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5zdHJpbmcuc2xpY2UoMCwgc3RyZWFtLnBvcyAtIChiYWNrVXAgfHwgMCkpXHJcbiAgICAgICAgICAgICAgICAgICAgKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEludGVyZmFjZVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdGFydFN0YXRlOiBmdW5jdGlvbiAoYmFzZWNvbHVtbikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRva2VuaXplOiB0b2tlbkJhc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFR5cGU6IFwic29mXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2M6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIGxleGljYWw6IG5ldyBKU0xleGljYWwoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChiYXNlY29sdW1uIHx8IDApIC0gaW5kZW50VW5pdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJibG9ja1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxWYXJzOiBwYXJzZXJDb25maWcubG9jYWxWYXJzLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlckNvbmZpZy5sb2NhbFZhcnMgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IENvbnRleHQobnVsbCwgbnVsbCwgZmFsc2UpLFxyXG4gICAgICAgICAgICAgICAgICAgIGluZGVudGVkOiBiYXNlY29sdW1uIHx8IDAsXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlckNvbmZpZy5nbG9iYWxWYXJzICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHBhcnNlckNvbmZpZy5nbG9iYWxWYXJzID09IFwib2JqZWN0XCJcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5nbG9iYWxWYXJzID0gcGFyc2VyQ29uZmlnLmdsb2JhbFZhcnM7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICB0b2tlbjogZnVuY3Rpb24gKHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uc29sKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YXRlLmxleGljYWwuaGFzT3duUHJvcGVydHkoXCJhbGlnblwiKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUubGV4aWNhbC5hbGlnbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmluZGVudGVkID0gc3RyZWFtLmluZGVudGF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmluZEZhdEFycm93KHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLnRva2VuaXplICE9IHRva2VuQ29tbWVudCAmJiBzdHJlYW0uZWF0U3BhY2UoKSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIHZhciBzdHlsZSA9IHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJjb21tZW50XCIpIHJldHVybiBzdHlsZTtcclxuICAgICAgICAgICAgICAgIHN0YXRlLmxhc3RUeXBlID1cclxuICAgICAgICAgICAgICAgICAgICB0eXBlID09IFwib3BlcmF0b3JcIiAmJiAoY29udGVudCA9PSBcIisrXCIgfHwgY29udGVudCA9PSBcIi0tXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgID8gXCJpbmNkZWNcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHR5cGU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VKUyhzdGF0ZSwgc3R5bGUsIHR5cGUsIGNvbnRlbnQsIHN0cmVhbSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBpbmRlbnQ6IGZ1bmN0aW9uIChzdGF0ZSwgdGV4dEFmdGVyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPT0gdG9rZW5Db21tZW50IHx8XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPT0gdG9rZW5RdWFzaVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBDb2RlTWlycm9yLlBhc3M7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUudG9rZW5pemUgIT0gdG9rZW5CYXNlKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdENoYXIgPSB0ZXh0QWZ0ZXIgJiYgdGV4dEFmdGVyLmNoYXJBdCgwKSxcclxuICAgICAgICAgICAgICAgICAgICBsZXhpY2FsID0gc3RhdGUubGV4aWNhbCxcclxuICAgICAgICAgICAgICAgICAgICB0b3A7XHJcbiAgICAgICAgICAgICAgICAvLyBLbHVkZ2UgdG8gcHJldmVudCAnbWF5YmVsc2UnIGZyb20gYmxvY2tpbmcgbGV4aWNhbCBzY29wZSBwb3BzXHJcbiAgICAgICAgICAgICAgICBpZiAoIS9eXFxzKmVsc2VcXGIvLnRlc3QodGV4dEFmdGVyKSlcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhdGUuY2MubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBzdGF0ZS5jY1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGMgPT0gcG9wbGV4KSBsZXhpY2FsID0gbGV4aWNhbC5wcmV2O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjICE9IG1heWJlZWxzZSAmJiBjICE9IHBvcGNvbnRleHQpIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHdoaWxlIChcclxuICAgICAgICAgICAgICAgICAgICAobGV4aWNhbC50eXBlID09IFwic3RhdFwiIHx8IGxleGljYWwudHlwZSA9PSBcImZvcm1cIikgJiZcclxuICAgICAgICAgICAgICAgICAgICAoZmlyc3RDaGFyID09IFwifVwiIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgodG9wID0gc3RhdGUuY2Nbc3RhdGUuY2MubGVuZ3RoIC0gMV0pICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodG9wID09IG1heWJlb3BlcmF0b3JDb21tYSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA9PSBtYXliZW9wZXJhdG9yTm9Db21tYSkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICEvXlssXFwuPStcXC0qOj9bXFwoXS8udGVzdCh0ZXh0QWZ0ZXIpKSlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICBsZXhpY2FsID0gbGV4aWNhbC5wcmV2O1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudEluZGVudCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGxleGljYWwudHlwZSA9PSBcIilcIiAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGxleGljYWwucHJldi50eXBlID09IFwic3RhdFwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgbGV4aWNhbCA9IGxleGljYWwucHJldjtcclxuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gbGV4aWNhbC50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NpbmcgPSBmaXJzdENoYXIgPT0gdHlwZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmRlZlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxleGljYWwuaW5kZW50ZWQgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoc3RhdGUubGFzdFR5cGUgPT0gXCJvcGVyYXRvclwiIHx8IHN0YXRlLmxhc3RUeXBlID09IFwiLFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxleGljYWwuaW5mby5sZW5ndGggKyAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDApXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJmb3JtXCIgJiYgZmlyc3RDaGFyID09IFwie1wiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZXhpY2FsLmluZGVudGVkO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBcImZvcm1cIikgcmV0dXJuIGxleGljYWwuaW5kZW50ZWQgKyBpbmRlbnRVbml0O1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBcInN0YXRcIilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXhpY2FsLmluZGVudGVkICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKGlzQ29udGludWVkU3RhdGVtZW50KHN0YXRlLCB0ZXh0QWZ0ZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHN0YXRlbWVudEluZGVudCB8fCBpbmRlbnRVbml0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDApXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIGxleGljYWwuaW5mbyA9PSBcInN3aXRjaFwiICYmXHJcbiAgICAgICAgICAgICAgICAgICAgIWNsb3NpbmcgJiZcclxuICAgICAgICAgICAgICAgICAgICBwYXJzZXJDb25maWcuZG91YmxlSW5kZW50U3dpdGNoICE9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV4aWNhbC5pbmRlbnRlZCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgvXig/OmNhc2V8ZGVmYXVsdClcXGIvLnRlc3QodGV4dEFmdGVyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBpbmRlbnRVbml0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDIgKiBpbmRlbnRVbml0KVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChsZXhpY2FsLmFsaWduKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZXhpY2FsLmNvbHVtbiArIChjbG9zaW5nID8gMCA6IDEpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArIChjbG9zaW5nID8gMCA6IGluZGVudFVuaXQpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgZWxlY3RyaWNJbnB1dDogL15cXHMqKD86Y2FzZSAuKj86fGRlZmF1bHQ6fFxce3xcXH0pJC8sXHJcbiAgICAgICAgICAgIGJsb2NrQ29tbWVudFN0YXJ0OiBqc29uTW9kZSA/IG51bGwgOiBcIi8qXCIsXHJcbiAgICAgICAgICAgIGJsb2NrQ29tbWVudEVuZDoganNvbk1vZGUgPyBudWxsIDogXCIqL1wiLFxyXG4gICAgICAgICAgICBibG9ja0NvbW1lbnRDb250aW51ZToganNvbk1vZGUgPyBudWxsIDogXCIgKiBcIixcclxuICAgICAgICAgICAgbGluZUNvbW1lbnQ6IGpzb25Nb2RlID8gbnVsbCA6IFwiLy9cIixcclxuICAgICAgICAgICAgZm9sZDogXCJicmFjZVwiLFxyXG4gICAgICAgICAgICBjbG9zZUJyYWNrZXRzOiBcIigpW117fScnXFxcIlxcXCJgYFwiLFxyXG5cclxuICAgICAgICAgICAgaGVscGVyVHlwZToganNvbk1vZGUgPyBcImpzb25cIiA6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICAgICAgICBqc29ubGRNb2RlOiBqc29ubGRNb2RlLFxyXG4gICAgICAgICAgICBqc29uTW9kZToganNvbk1vZGUsXHJcblxyXG4gICAgICAgICAgICBleHByZXNzaW9uQWxsb3dlZDogZXhwcmVzc2lvbkFsbG93ZWQsXHJcblxyXG4gICAgICAgICAgICBza2lwRXhwcmVzc2lvbjogZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZUpTKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYXRvbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYXRvbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBDb2RlTWlycm9yLlN0cmluZ1N0cmVhbShcIlwiLCAyLCBudWxsKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgQ29kZU1pcnJvci5yZWdpc3RlckhlbHBlcihcIndvcmRDaGFyc1wiLCBcImphdmFzY3JpcHRcIiwgL1tcXHckXS8pO1xyXG5cclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTUlNRShcInRleHQvamF2YXNjcmlwdFwiLCBcImphdmFzY3JpcHRcIik7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJ0ZXh0L2VjbWFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0XCIpO1xyXG4gICAgQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vamF2YXNjcmlwdFwiLCBcImphdmFzY3JpcHRcIik7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi94LWphdmFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0XCIpO1xyXG4gICAgQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vZWNtYXNjcmlwdFwiLCBcImphdmFzY3JpcHRcIik7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi9qc29uXCIsIHtcclxuICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIixcclxuICAgICAgICBqc29uOiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi94LWpzb25cIiwge1xyXG4gICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICAgIGpzb246IHRydWUsXHJcbiAgICB9KTtcclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL21hbmlmZXN0K2pzb25cIiwge1xyXG4gICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICAgIGpzb246IHRydWUsXHJcbiAgICB9KTtcclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL2xkK2pzb25cIiwge1xyXG4gICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICAgIGpzb25sZDogdHJ1ZSxcclxuICAgIH0pO1xyXG4gICAgQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwidGV4dC90eXBlc2NyaXB0XCIsIHtcclxuICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIixcclxuICAgICAgICB0eXBlc2NyaXB0OiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi90eXBlc2NyaXB0XCIsIHtcclxuICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIixcclxuICAgICAgICB0eXBlc2NyaXB0OiB0cnVlLFxyXG4gICAgfSk7XHJcbn0pO1xyXG4iXX0=