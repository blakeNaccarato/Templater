System.register("src/utils/TJDocFile", ["obsidian"], function (exports_1, context_1) {
    "use strict";
    var obsidian_1, TJDocFile, TJDocFileArgument;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (obsidian_1_1) {
                obsidian_1 = obsidian_1_1;
            }
        ],
        execute: function () {
            TJDocFile = class TJDocFile extends obsidian_1.TFile {
                constructor(file) {
                    super(file.vault, file.path);
                    Object.assign(this, file);
                }
            };
            exports_1("TJDocFile", TJDocFile);
            TJDocFileArgument = class TJDocFileArgument {
                constructor(name, desc) {
                    this.name = name;
                    this.description = desc;
                }
            };
            exports_1("TJDocFileArgument", TJDocFileArgument);
        }
    };
});
System.register("src/utils/Log", ["obsidian", "src/utils/Error"], function (exports_2, context_2) {
    "use strict";
    var obsidian_2, Error_1;
    var __moduleName = context_2 && context_2.id;
    function log_update(msg) {
        const notice = new obsidian_2.Notice("", 15000);
        // TODO: Find better way for this
        // @ts-ignore
        notice.noticeEl.innerHTML = `<b>Templater update</b>:<br/>${msg}`;
    }
    exports_2("log_update", log_update);
    function log_error(e) {
        const notice = new obsidian_2.Notice("", 8000);
        if (e instanceof Error_1.TemplaterError && e.console_msg) {
            // TODO: Find a better way for this
            // @ts-ignore
            notice.noticeEl.innerHTML = `<b>Templater Error</b>:<br/>${e.message}<br/>Check console for more information`;
            console.error(`Templater Error:`, e.message, "\n", e.console_msg);
        }
        else {
            // @ts-ignore
            notice.noticeEl.innerHTML = `<b>Templater Error</b>:<br/>${e.message}`;
        }
    }
    exports_2("log_error", log_error);
    return {
        setters: [
            function (obsidian_2_1) {
                obsidian_2 = obsidian_2_1;
            },
            function (Error_1_1) {
                Error_1 = Error_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("src/utils/Error", ["tslib", "src/utils/Log"], function (exports_3, context_3) {
    "use strict";
    var tslib_1, Log_1, TemplaterError;
    var __moduleName = context_3 && context_3.id;
    function errorWrapper(fn, msg) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield fn();
            }
            catch (e) {
                if (!(e instanceof TemplaterError)) {
                    Log_1.log_error(new TemplaterError(msg, e.message));
                }
                else {
                    Log_1.log_error(e);
                }
                return null;
            }
        });
    }
    exports_3("errorWrapper", errorWrapper);
    function errorWrapperSync(fn, msg) {
        try {
            return fn();
        }
        catch (e) {
            Log_1.log_error(new TemplaterError(msg, e.message));
            return null;
        }
    }
    exports_3("errorWrapperSync", errorWrapperSync);
    return {
        setters: [
            function (tslib_1_1) {
                tslib_1 = tslib_1_1;
            },
            function (Log_1_1) {
                Log_1 = Log_1_1;
            }
        ],
        execute: function () {
            TemplaterError = class TemplaterError extends Error {
                constructor(msg, console_msg) {
                    super(msg);
                    this.console_msg = console_msg;
                    this.name = this.constructor.name;
                    if (Error.captureStackTrace) {
                        Error.captureStackTrace(this, this.constructor);
                    }
                }
            };
            exports_3("TemplaterError", TemplaterError);
        }
    };
});
System.register("src/utils/Utils", ["tslib", "@microsoft/tsdoc", "src/utils/TJDocFile", "src/utils/Error", "obsidian"], function (exports_4, context_4) {
    "use strict";
    var tslib_2, tsdoc_1, TJDocFile_1, Error_2, obsidian_3;
    var __moduleName = context_4 && context_4.id;
    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    exports_4("delay", delay);
    function escape_RegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }
    exports_4("escape_RegExp", escape_RegExp);
    function generate_command_regex() {
        return /<%(?:-|_)?\s*[*~]{0,1}((?:.|\s)*?)(?:-|_)?%>/g;
    }
    exports_4("generate_command_regex", generate_command_regex);
    function generate_dynamic_command_regex() {
        return /(<%(?:-|_)?\s*[*~]{0,1})\+((?:.|\s)*?%>)/g;
    }
    exports_4("generate_dynamic_command_regex", generate_dynamic_command_regex);
    function resolve_tfolder(app, folder_str) {
        folder_str = obsidian_3.normalizePath(folder_str);
        const folder = app.vault.getAbstractFileByPath(folder_str);
        if (!folder) {
            throw new Error_2.TemplaterError(`Folder "${folder_str}" doesn't exist`);
        }
        if (!(folder instanceof obsidian_3.TFolder)) {
            throw new Error_2.TemplaterError(`${folder_str} is a file, not a folder`);
        }
        return folder;
    }
    exports_4("resolve_tfolder", resolve_tfolder);
    function resolve_tfile(app, file_str) {
        file_str = obsidian_3.normalizePath(file_str);
        const file = app.vault.getAbstractFileByPath(file_str);
        if (!file) {
            throw new Error_2.TemplaterError(`File "${file_str}" doesn't exist`);
        }
        if (!(file instanceof obsidian_3.TFile)) {
            throw new Error_2.TemplaterError(`${file_str} is a folder, not a file`);
        }
        return file;
    }
    exports_4("resolve_tfile", resolve_tfile);
    function get_tfiles_from_folder(app, folder_str) {
        const folder = resolve_tfolder(app, folder_str);
        const files = [];
        obsidian_3.Vault.recurseChildren(folder, (file) => {
            if (file instanceof obsidian_3.TFile) {
                files.push(file);
            }
        });
        files.sort((a, b) => {
            return a.path.localeCompare(b.path);
        });
        return files;
    }
    exports_4("get_tfiles_from_folder", get_tfiles_from_folder);
    function populate_docs_from_user_scripts(app, files) {
        return tslib_2.__awaiter(this, void 0, void 0, function* () {
            const docFiles = yield Promise.all(files.map((file) => tslib_2.__awaiter(this, void 0, void 0, function* () {
                // Get file contents
                const content = yield app.vault.cachedRead(file);
                const newDocFile = generate_jsdoc(file, content);
                return newDocFile;
            })));
            return docFiles;
        });
    }
    exports_4("populate_docs_from_user_scripts", populate_docs_from_user_scripts);
    function generate_jsdoc(file, content) {
        // Parse the content
        const tsdocParser = new tsdoc_1.TSDocParser();
        const parsedDoc = tsdocParser.parseString(content);
        // Copy and extract information into the TJDocFile
        const newDocFile = new TJDocFile_1.TJDocFile(file);
        newDocFile.description = generate_jsdoc_description(parsedDoc.docComment.summarySection);
        newDocFile.returns = generate_jsdoc_return(parsedDoc.docComment.returnsBlock);
        newDocFile.arguments = generate_jsdoc_arguments(parsedDoc.docComment.params);
        return newDocFile;
    }
    function generate_jsdoc_description(summarySection) {
        try {
            const description = summarySection.nodes.map((node) => node.getChildNodes()
                .filter((node) => node instanceof tsdoc_1.DocPlainText)
                .map((x) => x.text)
                .join("\n"));
            return description.join("\n");
        }
        catch (error) {
            console.error('Failed to parse sumamry section');
            throw error;
        }
    }
    function generate_jsdoc_return(returnSection) {
        if (!returnSection)
            return "";
        try {
            const returnValue = returnSection.content.nodes[0].getChildNodes()[0].text.trim();
            return returnValue;
        }
        catch (error) {
            return "";
        }
    }
    function generate_jsdoc_arguments(paramSection) {
        try {
            const blocks = paramSection.blocks;
            const args = blocks.map((block) => {
                const name = block.parameterName;
                const description = block.content.getChildNodes()[0].getChildNodes()
                    .filter(x => x instanceof tsdoc_1.DocPlainText)
                    .map(x => x.text).join(" ");
                return new TJDocFile_1.TJDocFileArgument(name, description);
            });
            return args;
        }
        catch (error) {
            return [];
        }
    }
    function arraymove(arr, fromIndex, toIndex) {
        if (toIndex < 0 || toIndex === arr.length) {
            return;
        }
        const element = arr[fromIndex];
        arr[fromIndex] = arr[toIndex];
        arr[toIndex] = element;
    }
    exports_4("arraymove", arraymove);
    function get_active_file(app) {
        var _a, _b;
        return (_b = (_a = app.workspace.activeEditor) === null || _a === void 0 ? void 0 : _a.file) !== null && _b !== void 0 ? _b : app.workspace.getActiveFile();
    }
    exports_4("get_active_file", get_active_file);
    /**
     * @param path Normalized file path
     * @returns Folder path
     * @example
     * get_folder_path_from_path(normalizePath("path/to/folder/file", "md")) // path/to/folder
     */
    function get_folder_path_from_file_path(path) {
        const path_separator = path.lastIndexOf("/");
        if (path_separator !== -1)
            return path.slice(0, path_separator);
        return "";
    }
    exports_4("get_folder_path_from_file_path", get_folder_path_from_file_path);
    function is_object(obj) {
        return obj !== null && typeof obj === "object";
    }
    exports_4("is_object", is_object);
    function get_fn_params(func) {
        const str = func.toString();
        const len = str.indexOf("(");
        return str
            .substring(len + 1, str.indexOf(")"))
            .replace(/ /g, "")
            .split(",");
    }
    exports_4("get_fn_params", get_fn_params);
    /**
     * Use a parent HtmlElement to create a label with a value
     * @param parent The parent HtmlElement; Use HtmlOListElement to return a `li` element
     * @param title The title for the label which will be bolded
     * @param value The value of the label
     * @returns A label HtmlElement (p | li)
     */
    function append_bolded_label_with_value_to_parent(parent, title, value) {
        const tag = parent instanceof HTMLOListElement ? "li" : "p";
        const para = parent.createEl(tag);
        const bold = parent.createEl('b', { text: title });
        para.appendChild(bold);
        para.appendChild(document.createTextNode(`: ${value}`));
        // Returns a p or li element
        // Resulting in <b>Title</b>: value
        return para;
    }
    exports_4("append_bolded_label_with_value_to_parent", append_bolded_label_with_value_to_parent);
    return {
        setters: [
            function (tslib_2_1) {
                tslib_2 = tslib_2_1;
            },
            function (tsdoc_1_1) {
                tsdoc_1 = tsdoc_1_1;
            },
            function (TJDocFile_1_1) {
                TJDocFile_1 = TJDocFile_1_1;
            },
            function (Error_2_1) {
                Error_2 = Error_2_1;
            },
            function (obsidian_3_1) {
                obsidian_3 = obsidian_3_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("src/core/functions/IGenerateObject", [], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("src/editor/TpDocumentation", ["tslib", "src/utils/Error", "src/utils/Utils", "../../docs/documentation.toml"], function (exports_6, context_6) {
    "use strict";
    var tslib_3, Error_3, Utils_1, documentation_toml_1, module_names, module_names_checker, Documentation;
    var __moduleName = context_6 && context_6.id;
    function is_module_name(x) {
        return typeof x === "string" && module_names_checker.has(x);
    }
    exports_6("is_module_name", is_module_name);
    function is_function_documentation(x) {
        if (x.definition ||
            x.returns ||
            x.args) {
            return true;
        }
        return false;
    }
    exports_6("is_function_documentation", is_function_documentation);
    return {
        setters: [
            function (tslib_3_1) {
                tslib_3 = tslib_3_1;
            },
            function (Error_3_1) {
                Error_3 = Error_3_1;
            },
            function (Utils_1_1) {
                Utils_1 = Utils_1_1;
            },
            function (documentation_toml_1_1) {
                documentation_toml_1 = documentation_toml_1_1;
            }
        ],
        execute: function () {
            module_names = [
                "app",
                "config",
                "date",
                "file",
                "frontmatter",
                "hooks",
                "obsidian",
                "system",
                "user",
                "web",
            ];
            module_names_checker = new Set(module_names);
            Documentation = class Documentation {
                constructor(plugin) {
                    this.plugin = plugin;
                    this.documentation = documentation_toml_1.default;
                }
                get_all_modules_documentation() {
                    let tp = this.documentation.tp;
                    // Remove 'user' if no user scripts found
                    if (!this.plugin.settings ||
                        !this.plugin.settings.user_scripts_folder) {
                        tp = Object.values(tp).filter((x) => x.name !== 'user');
                    }
                    return Object.values(tp).map((mod) => {
                        mod.queryKey = mod.name;
                        return mod;
                    });
                }
                get_all_functions_documentation(module_name, function_name) {
                    return tslib_3.__awaiter(this, void 0, void 0, function* () {
                        if (module_name === "app") {
                            return this.get_app_functions_documentation(this.plugin.app, function_name);
                        }
                        if (module_name === "user") {
                            if (!this.plugin.settings ||
                                !this.plugin.settings.user_scripts_folder)
                                return;
                            const files = yield Error_3.errorWrapper(() => tslib_3.__awaiter(this, void 0, void 0, function* () {
                                const files = Utils_1.get_tfiles_from_folder(this.plugin.app, this.plugin.settings.user_scripts_folder).filter(x => x.extension == "js");
                                const docFiles = yield Utils_1.populate_docs_from_user_scripts(this.plugin.app, files);
                                return docFiles;
                            }), `User Scripts folder doesn't exist`);
                            if (!files || files.length === 0)
                                return;
                            return files.reduce((processedFiles, file) => {
                                if (file.extension !== "js")
                                    return processedFiles;
                                const values = [
                                    ...processedFiles,
                                    {
                                        name: file.basename,
                                        queryKey: file.basename,
                                        definition: "",
                                        description: file.description,
                                        returns: file.returns,
                                        args: file.arguments.reduce((acc, arg) => {
                                            acc[arg.name] = {
                                                name: arg.name,
                                                description: arg.description
                                            };
                                            return acc;
                                        }, {}),
                                        example: "",
                                    },
                                ];
                                return values;
                            }, []);
                        }
                        if (!this.documentation.tp[module_name].functions) {
                            return;
                        }
                        return Object.values(this.documentation.tp[module_name].functions).map((mod) => {
                            mod.queryKey = mod.name;
                            return mod;
                        });
                    });
                }
                get_app_functions_documentation(obj, path) {
                    if (!Utils_1.is_object(obj)) {
                        return [];
                    }
                    const parts = path.split(".");
                    if (parts.length === 0) {
                        return [];
                    }
                    let currentObj = obj;
                    for (let index = 0; index < parts.length - 1; index++) {
                        const part = parts[index];
                        if (part in currentObj) {
                            if (!Utils_1.is_object(currentObj[part])) {
                                return [];
                            }
                            currentObj = currentObj[part];
                        }
                    }
                    const definitionPrefix = [
                        "tp",
                        "app",
                        ...parts.slice(0, parts.length - 1),
                    ].join(".");
                    const queryKeyPrefix = parts.slice(0, parts.length - 1).join(".");
                    const docs = [];
                    for (const key in currentObj) {
                        const definition = `${definitionPrefix}.${key}`;
                        const queryKey = queryKeyPrefix ? `${queryKeyPrefix}.${key}` : key;
                        docs.push({
                            name: key,
                            queryKey,
                            definition: typeof currentObj[key] === "function"
                                ? `${definition}(${Utils_1.get_fn_params(currentObj[key])})`
                                : definition,
                            description: "",
                            returns: "",
                            example: "",
                        });
                    }
                    return docs;
                }
                get_module_documentation(module_name) {
                    return this.documentation.tp[module_name];
                }
                get_function_documentation(module_name, function_name) {
                    return this.documentation.tp[module_name].functions[function_name];
                }
                get_argument_documentation(module_name, function_name, argument_name) {
                    const function_doc = this.get_function_documentation(module_name, function_name);
                    if (!function_doc || !function_doc.args) {
                        return null;
                    }
                    return function_doc.args[argument_name];
                }
            };
            exports_6("Documentation", Documentation);
        }
    };
});
System.register("src/core/functions/internal_functions/InternalModule", ["tslib"], function (exports_7, context_7) {
    "use strict";
    var tslib_4, InternalModule;
    var __moduleName = context_7 && context_7.id;
    return {
        setters: [
            function (tslib_4_1) {
                tslib_4 = tslib_4_1;
            }
        ],
        execute: function () {
            InternalModule = class InternalModule {
                constructor(plugin) {
                    this.plugin = plugin;
                    this.static_functions = new Map();
                    this.dynamic_functions = new Map();
                }
                getName() {
                    return this.name;
                }
                init() {
                    return tslib_4.__awaiter(this, void 0, void 0, function* () {
                        yield this.create_static_templates();
                        this.static_object = Object.fromEntries(this.static_functions);
                    });
                }
                generate_object(new_config) {
                    return tslib_4.__awaiter(this, void 0, void 0, function* () {
                        this.config = new_config;
                        yield this.create_dynamic_templates();
                        return Object.assign(Object.assign({}, this.static_object), Object.fromEntries(this.dynamic_functions));
                    });
                }
            };
            exports_7("InternalModule", InternalModule);
        }
    };
});
System.register("src/core/functions/internal_functions/date/InternalModuleDate", ["tslib", "obsidian", "src/utils/Error", "src/core/functions/internal_functions/InternalModule"], function (exports_8, context_8) {
    "use strict";
    var tslib_5, obsidian_4, Error_4, InternalModule_1, InternalModuleDate;
    var __moduleName = context_8 && context_8.id;
    return {
        setters: [
            function (tslib_5_1) {
                tslib_5 = tslib_5_1;
            },
            function (obsidian_4_1) {
                obsidian_4 = obsidian_4_1;
            },
            function (Error_4_1) {
                Error_4 = Error_4_1;
            },
            function (InternalModule_1_1) {
                InternalModule_1 = InternalModule_1_1;
            }
        ],
        execute: function () {
            InternalModuleDate = class InternalModuleDate extends InternalModule_1.InternalModule {
                constructor() {
                    super(...arguments);
                    this.name = "date";
                }
                create_static_templates() {
                    return tslib_5.__awaiter(this, void 0, void 0, function* () {
                        this.static_functions.set("now", this.generate_now());
                        this.static_functions.set("tomorrow", this.generate_tomorrow());
                        this.static_functions.set("weekday", this.generate_weekday());
                        this.static_functions.set("yesterday", this.generate_yesterday());
                    });
                }
                create_dynamic_templates() {
                    return tslib_5.__awaiter(this, void 0, void 0, function* () { });
                }
                teardown() {
                    return tslib_5.__awaiter(this, void 0, void 0, function* () { });
                }
                generate_now() {
                    return (format = "YYYY-MM-DD", offset, reference, reference_format) => {
                        if (reference && !obsidian_4.moment(reference, reference_format).isValid()) {
                            throw new Error_4.TemplaterError("Invalid reference date format, try specifying one with the argument 'reference_format'");
                        }
                        let duration;
                        if (typeof offset === "string") {
                            duration = obsidian_4.moment.duration(offset);
                        }
                        else if (typeof offset === "number") {
                            duration = obsidian_4.moment.duration(offset, "days");
                        }
                        return obsidian_4.moment(reference, reference_format)
                            .add(duration)
                            .format(format);
                    };
                }
                generate_tomorrow() {
                    return (format = "YYYY-MM-DD") => {
                        return obsidian_4.moment().add(1, "days").format(format);
                    };
                }
                generate_weekday() {
                    return (format = "YYYY-MM-DD", weekday, reference, reference_format) => {
                        if (reference && !obsidian_4.moment(reference, reference_format).isValid()) {
                            throw new Error_4.TemplaterError("Invalid reference date format, try specifying one with the argument 'reference_format'");
                        }
                        return obsidian_4.moment(reference, reference_format)
                            .weekday(weekday)
                            .format(format);
                    };
                }
                generate_yesterday() {
                    return (format = "YYYY-MM-DD") => {
                        return obsidian_4.moment().add(-1, "days").format(format);
                    };
                }
            };
            exports_8("InternalModuleDate", InternalModuleDate);
        }
    };
});
System.register("src/core/functions/internal_functions/file/InternalModuleFile", ["tslib", "src/core/functions/internal_functions/InternalModule", "src/utils/Log", "obsidian", "src/utils/Error"], function (exports_9, context_9) {
    "use strict";
    var tslib_6, InternalModule_2, Log_2, obsidian_5, Error_5, DEPTH_LIMIT, InternalModuleFile;
    var __moduleName = context_9 && context_9.id;
    return {
        setters: [
            function (tslib_6_1) {
                tslib_6 = tslib_6_1;
            },
            function (InternalModule_2_1) {
                InternalModule_2 = InternalModule_2_1;
            },
            function (Log_2_1) {
                Log_2 = Log_2_1;
            },
            function (obsidian_5_1) {
                obsidian_5 = obsidian_5_1;
            },
            function (Error_5_1) {
                Error_5 = Error_5_1;
            }
        ],
        execute: function () {
            exports_9("DEPTH_LIMIT", DEPTH_LIMIT = 10);
            InternalModuleFile = class InternalModuleFile extends InternalModule_2.InternalModule {
                constructor() {
                    super(...arguments);
                    this.name = "file";
                    this.include_depth = 0;
                    this.create_new_depth = 0;
                    this.linkpath_regex = new RegExp("^\\[\\[(.*)\\]\\]$");
                }
                create_static_templates() {
                    return tslib_6.__awaiter(this, void 0, void 0, function* () {
                        this.static_functions.set("creation_date", this.generate_creation_date());
                        this.static_functions.set("create_new", this.generate_create_new());
                        this.static_functions.set("cursor", this.generate_cursor());
                        this.static_functions.set("cursor_append", this.generate_cursor_append());
                        this.static_functions.set("exists", this.generate_exists());
                        this.static_functions.set("find_tfile", this.generate_find_tfile());
                        this.static_functions.set("folder", this.generate_folder());
                        this.static_functions.set("include", this.generate_include());
                        this.static_functions.set("last_modified_date", this.generate_last_modified_date());
                        this.static_functions.set("move", this.generate_move());
                        this.static_functions.set("path", this.generate_path());
                        this.static_functions.set("rename", this.generate_rename());
                        this.static_functions.set("selection", this.generate_selection());
                    });
                }
                create_dynamic_templates() {
                    return tslib_6.__awaiter(this, void 0, void 0, function* () {
                        this.dynamic_functions.set("content", yield this.generate_content());
                        this.dynamic_functions.set("tags", this.generate_tags());
                        this.dynamic_functions.set("title", this.generate_title());
                    });
                }
                teardown() {
                    return tslib_6.__awaiter(this, void 0, void 0, function* () { });
                }
                generate_content() {
                    return tslib_6.__awaiter(this, void 0, void 0, function* () {
                        return yield this.plugin.app.vault.read(this.config.target_file);
                    });
                }
                generate_create_new() {
                    return (template, filename, open_new = false, folder) => tslib_6.__awaiter(this, void 0, void 0, function* () {
                        this.create_new_depth += 1;
                        if (this.create_new_depth > DEPTH_LIMIT) {
                            this.create_new_depth = 0;
                            throw new Error_5.TemplaterError("Reached create_new depth limit (max = 10)");
                        }
                        const new_file = yield this.plugin.templater.create_new_note_from_template(template, folder, filename, open_new);
                        this.create_new_depth -= 1;
                        return new_file;
                    });
                }
                generate_creation_date() {
                    return (format = "YYYY-MM-DD HH:mm") => {
                        return obsidian_5.moment(this.config.target_file.stat.ctime).format(format);
                    };
                }
                generate_cursor() {
                    return (order) => {
                        // Hack to prevent empty output
                        return `<% tp.file.cursor(${order !== null && order !== void 0 ? order : ""}) %>`;
                    };
                }
                generate_cursor_append() {
                    return (content) => {
                        const active_editor = this.plugin.app.workspace.activeEditor;
                        if (!active_editor || !active_editor.editor) {
                            Log_2.log_error(new Error_5.TemplaterError("No active editor, can't append to cursor."));
                            return;
                        }
                        const editor = active_editor.editor;
                        const doc = editor.getDoc();
                        doc.replaceSelection(content);
                        return "";
                    };
                }
                generate_exists() {
                    return (filepath) => tslib_6.__awaiter(this, void 0, void 0, function* () {
                        const path = obsidian_5.normalizePath(filepath);
                        return yield this.plugin.app.vault.exists(path);
                    });
                }
                generate_find_tfile() {
                    return (filename) => {
                        const path = obsidian_5.normalizePath(filename);
                        return this.plugin.app.metadataCache.getFirstLinkpathDest(path, "");
                    };
                }
                generate_folder() {
                    return (absolute = false) => {
                        const parent = this.config.target_file.parent;
                        let folder;
                        if (absolute) {
                            folder = parent.path;
                        }
                        else {
                            folder = parent.name;
                        }
                        return folder;
                    };
                }
                generate_include() {
                    return (include_link) => tslib_6.__awaiter(this, void 0, void 0, function* () {
                        var _a;
                        // TODO: Add mutex for this, this may currently lead to a race condition.
                        // While not very impactful, that could still be annoying.
                        this.include_depth += 1;
                        if (this.include_depth > DEPTH_LIMIT) {
                            this.include_depth -= 1;
                            throw new Error_5.TemplaterError("Reached inclusion depth limit (max = 10)");
                        }
                        let inc_file_content;
                        if (include_link instanceof obsidian_5.TFile) {
                            inc_file_content = yield this.plugin.app.vault.read(include_link);
                        }
                        else {
                            let match;
                            if ((match = this.linkpath_regex.exec(include_link)) === null) {
                                this.include_depth -= 1;
                                throw new Error_5.TemplaterError("Invalid file format, provide an obsidian link between quotes.");
                            }
                            const { path, subpath } = obsidian_5.parseLinktext(match[1]);
                            const inc_file = this.plugin.app.metadataCache.getFirstLinkpathDest(path, "");
                            if (!inc_file) {
                                this.include_depth -= 1;
                                throw new Error_5.TemplaterError(`File ${include_link} doesn't exist`);
                            }
                            inc_file_content = yield this.plugin.app.vault.read(inc_file);
                            if (subpath) {
                                const cache = this.plugin.app.metadataCache.getFileCache(inc_file);
                                if (cache) {
                                    const result = obsidian_5.resolveSubpath(cache, subpath);
                                    if (result) {
                                        inc_file_content = inc_file_content.slice(result.start.offset, (_a = result.end) === null || _a === void 0 ? void 0 : _a.offset);
                                    }
                                }
                            }
                        }
                        try {
                            const parsed_content = yield this.plugin.templater.parser.parse_commands(inc_file_content, this.plugin.templater.current_functions_object);
                            this.include_depth -= 1;
                            return parsed_content;
                        }
                        catch (e) {
                            this.include_depth -= 1;
                            throw e;
                        }
                    });
                }
                generate_last_modified_date() {
                    return (format = "YYYY-MM-DD HH:mm") => {
                        return obsidian_5.moment(this.config.target_file.stat.mtime).format(format);
                    };
                }
                generate_move() {
                    return (path, file_to_move) => tslib_6.__awaiter(this, void 0, void 0, function* () {
                        const file = file_to_move || this.config.target_file;
                        const new_path = obsidian_5.normalizePath(`${path}.${file.extension}`);
                        const dirs = new_path.replace(/\\/g, "/").split("/");
                        dirs.pop(); // remove basename
                        if (dirs.length) {
                            const dir = dirs.join("/");
                            if (!this.plugin.app.vault.getAbstractFileByPath(dir)) {
                                yield this.plugin.app.vault.createFolder(dir);
                            }
                        }
                        yield this.plugin.app.fileManager.renameFile(file, new_path);
                        return "";
                    });
                }
                generate_path() {
                    return (relative = false) => {
                        let vault_path = "";
                        if (obsidian_5.Platform.isMobile) {
                            const vault_adapter = this.plugin.app.vault.adapter.fs.uri;
                            const vault_base = this.plugin.app.vault.adapter.basePath;
                            vault_path = `${vault_adapter}/${vault_base}`;
                        }
                        else {
                            if (this.plugin.app.vault.adapter instanceof obsidian_5.FileSystemAdapter) {
                                vault_path = this.plugin.app.vault.adapter.getBasePath();
                            }
                            else {
                                throw new Error_5.TemplaterError("app.vault is not a FileSystemAdapter instance");
                            }
                        }
                        if (relative) {
                            return this.config.target_file.path;
                        }
                        else {
                            return `${vault_path}/${this.config.target_file.path}`;
                        }
                    };
                }
                generate_rename() {
                    return (new_title) => tslib_6.__awaiter(this, void 0, void 0, function* () {
                        if (new_title.match(/[\\/:]+/g)) {
                            throw new Error_5.TemplaterError("File name cannot contain any of these characters: \\ / :");
                        }
                        const new_path = obsidian_5.normalizePath(`${this.config.target_file.parent.path}/${new_title}.${this.config.target_file.extension}`);
                        yield this.plugin.app.fileManager.renameFile(this.config.target_file, new_path);
                        return "";
                    });
                }
                generate_selection() {
                    return () => {
                        const active_editor = this.plugin.app.workspace.activeEditor;
                        if (!active_editor || !active_editor.editor) {
                            throw new Error_5.TemplaterError("Active editor is null, can't read selection.");
                        }
                        const editor = active_editor.editor;
                        return editor.getSelection();
                    };
                }
                // TODO: Turn this into a function
                generate_tags() {
                    const cache = this.plugin.app.metadataCache.getFileCache(this.config.target_file);
                    if (cache) {
                        return obsidian_5.getAllTags(cache);
                    }
                    return null;
                }
                // TODO: Turn this into a function
                generate_title() {
                    return this.config.target_file.basename;
                }
            };
            exports_9("InternalModuleFile", InternalModuleFile);
        }
    };
});
System.register("src/core/functions/internal_functions/web/InternalModuleWeb", ["tslib", "obsidian", "src/utils/Error", "src/core/functions/internal_functions/InternalModule"], function (exports_10, context_10) {
    "use strict";
    var tslib_7, obsidian_6, Error_6, InternalModule_3, InternalModuleWeb;
    var __moduleName = context_10 && context_10.id;
    return {
        setters: [
            function (tslib_7_1) {
                tslib_7 = tslib_7_1;
            },
            function (obsidian_6_1) {
                obsidian_6 = obsidian_6_1;
            },
            function (Error_6_1) {
                Error_6 = Error_6_1;
            },
            function (InternalModule_3_1) {
                InternalModule_3 = InternalModule_3_1;
            }
        ],
        execute: function () {
            InternalModuleWeb = class InternalModuleWeb extends InternalModule_3.InternalModule {
                constructor() {
                    super(...arguments);
                    this.name = "web";
                }
                create_static_templates() {
                    return tslib_7.__awaiter(this, void 0, void 0, function* () {
                        this.static_functions.set("daily_quote", this.generate_daily_quote());
                        this.static_functions.set("request", this.generate_request());
                        this.static_functions.set("random_picture", this.generate_random_picture());
                    });
                }
                create_dynamic_templates() {
                    return tslib_7.__awaiter(this, void 0, void 0, function* () { });
                }
                teardown() {
                    return tslib_7.__awaiter(this, void 0, void 0, function* () { });
                }
                getRequest(url) {
                    return tslib_7.__awaiter(this, void 0, void 0, function* () {
                        try {
                            const response = yield obsidian_6.requestUrl(url);
                            if (response.status < 200 && response.status >= 300) {
                                throw new Error_6.TemplaterError("Error performing GET request");
                            }
                            return response;
                        }
                        catch (error) {
                            throw new Error_6.TemplaterError("Error performing GET request");
                        }
                    });
                }
                generate_daily_quote() {
                    return () => tslib_7.__awaiter(this, void 0, void 0, function* () {
                        try {
                            const response = yield this.getRequest("https://raw.githubusercontent.com/Zachatoo/quotes-database/refs/heads/main/quotes.json");
                            const quotes = response.json;
                            const random_quote = quotes[Math.floor(Math.random() * quotes.length)];
                            const { quote, author } = random_quote;
                            const new_content = `> [!quote] ${quote}\n> — ${author}`;
                            return new_content;
                        }
                        catch (error) {
                            new Error_6.TemplaterError("Error generating daily quote");
                            return "Error generating daily quote";
                        }
                    });
                }
                generate_random_picture() {
                    return (size, query, include_size = false) => tslib_7.__awaiter(this, void 0, void 0, function* () {
                        try {
                            const response = yield this.getRequest(`https://templater-unsplash-2.fly.dev/${query ? "?q=" + query : ""}`).then((res) => res.json);
                            let url = response.full;
                            if (size && !include_size) {
                                if (size.includes("x")) {
                                    const [width, height] = size.split("x");
                                    url = url.concat(`&w=${width}&h=${height}`);
                                }
                                else {
                                    url = url.concat(`&w=${size}`);
                                }
                            }
                            if (include_size) {
                                return `![photo by ${response.photog}(${response.photogUrl}) on Unsplash|${size}](${url})`;
                            }
                            return `![photo by ${response.photog}(${response.photogUrl}) on Unsplash](${url})`;
                        }
                        catch (error) {
                            new Error_6.TemplaterError("Error generating random picture");
                            return "Error generating random picture";
                        }
                    });
                }
                generate_request() {
                    return (url, path) => tslib_7.__awaiter(this, void 0, void 0, function* () {
                        try {
                            const response = yield this.getRequest(url);
                            const jsonData = yield response.json;
                            if (path && jsonData) {
                                return path.split(".").reduce((obj, key) => {
                                    if (obj && obj.hasOwnProperty(key)) {
                                        return obj[key];
                                    }
                                    else {
                                        throw new Error(`Path ${path} not found in the JSON response`);
                                    }
                                }, jsonData);
                            }
                            return jsonData;
                        }
                        catch (error) {
                            console.error(error);
                            throw new Error_6.TemplaterError("Error fetching and extracting value");
                        }
                    });
                }
            };
            exports_10("InternalModuleWeb", InternalModuleWeb);
        }
    };
});
System.register("src/core/functions/internal_functions/hooks/InternalModuleHooks", ["tslib", "src/utils/Utils", "src/core/functions/internal_functions/InternalModule"], function (exports_11, context_11) {
    "use strict";
    var tslib_8, Utils_2, InternalModule_4, InternalModuleHooks;
    var __moduleName = context_11 && context_11.id;
    return {
        setters: [
            function (tslib_8_1) {
                tslib_8 = tslib_8_1;
            },
            function (Utils_2_1) {
                Utils_2 = Utils_2_1;
            },
            function (InternalModule_4_1) {
                InternalModule_4 = InternalModule_4_1;
            }
        ],
        execute: function () {
            InternalModuleHooks = class InternalModuleHooks extends InternalModule_4.InternalModule {
                constructor() {
                    super(...arguments);
                    this.name = "hooks";
                    this.event_refs = [];
                }
                create_static_templates() {
                    return tslib_8.__awaiter(this, void 0, void 0, function* () {
                        this.static_functions.set("on_all_templates_executed", this.generate_on_all_templates_executed());
                    });
                }
                create_dynamic_templates() {
                    return tslib_8.__awaiter(this, void 0, void 0, function* () { });
                }
                teardown() {
                    return tslib_8.__awaiter(this, void 0, void 0, function* () {
                        this.event_refs.forEach((eventRef) => {
                            eventRef.e.offref(eventRef);
                        });
                        this.event_refs = [];
                    });
                }
                generate_on_all_templates_executed() {
                    return (callback_function) => {
                        const event_ref = this.plugin.app.workspace.on("templater:all-templates-executed", () => tslib_8.__awaiter(this, void 0, void 0, function* () {
                            yield Utils_2.delay(1);
                            callback_function();
                        }));
                        if (event_ref) {
                            this.event_refs.push(event_ref);
                        }
                    };
                }
            };
            exports_11("InternalModuleHooks", InternalModuleHooks);
        }
    };
});
System.register("src/core/functions/internal_functions/frontmatter/InternalModuleFrontmatter", ["tslib", "src/core/functions/internal_functions/InternalModule"], function (exports_12, context_12) {
    "use strict";
    var tslib_9, InternalModule_5, InternalModuleFrontmatter;
    var __moduleName = context_12 && context_12.id;
    return {
        setters: [
            function (tslib_9_1) {
                tslib_9 = tslib_9_1;
            },
            function (InternalModule_5_1) {
                InternalModule_5 = InternalModule_5_1;
            }
        ],
        execute: function () {
            InternalModuleFrontmatter = class InternalModuleFrontmatter extends InternalModule_5.InternalModule {
                constructor() {
                    super(...arguments);
                    this.name = "frontmatter";
                }
                create_static_templates() {
                    return tslib_9.__awaiter(this, void 0, void 0, function* () { });
                }
                create_dynamic_templates() {
                    return tslib_9.__awaiter(this, void 0, void 0, function* () {
                        const cache = this.plugin.app.metadataCache.getFileCache(this.config.target_file);
                        this.dynamic_functions = new Map(Object.entries((cache === null || cache === void 0 ? void 0 : cache.frontmatter) || {}));
                    });
                }
                teardown() {
                    return tslib_9.__awaiter(this, void 0, void 0, function* () { });
                }
            };
            exports_12("InternalModuleFrontmatter", InternalModuleFrontmatter);
        }
    };
});
System.register("src/core/functions/internal_functions/system/PromptModal", ["tslib", "obsidian", "src/utils/Error"], function (exports_13, context_13) {
    "use strict";
    var tslib_10, obsidian_7, Error_7, PromptModal;
    var __moduleName = context_13 && context_13.id;
    return {
        setters: [
            function (tslib_10_1) {
                tslib_10 = tslib_10_1;
            },
            function (obsidian_7_1) {
                obsidian_7 = obsidian_7_1;
            },
            function (Error_7_1) {
                Error_7 = Error_7_1;
            }
        ],
        execute: function () {
            PromptModal = class PromptModal extends obsidian_7.Modal {
                constructor(app, prompt_text, default_value, multi_line) {
                    super(app);
                    this.prompt_text = prompt_text;
                    this.default_value = default_value;
                    this.multi_line = multi_line;
                    this.submitted = false;
                }
                onOpen() {
                    this.titleEl.setText(this.prompt_text);
                    this.createForm();
                }
                onClose() {
                    this.contentEl.empty();
                    if (!this.submitted) {
                        this.reject(new Error_7.TemplaterError("Cancelled prompt"));
                    }
                }
                createForm() {
                    var _a;
                    const div = this.contentEl.createDiv();
                    div.addClass("templater-prompt-div");
                    let textInput;
                    if (this.multi_line) {
                        textInput = new obsidian_7.TextAreaComponent(div);
                        // Add submit button since enter needed for multiline input on mobile
                        const buttonDiv = this.contentEl.createDiv();
                        buttonDiv.addClass("templater-button-div");
                        const submitButton = new obsidian_7.ButtonComponent(buttonDiv);
                        submitButton.buttonEl.addClass("mod-cta");
                        submitButton.setButtonText("Submit").onClick((evt) => {
                            this.resolveAndClose(evt);
                        });
                    }
                    else {
                        textInput = new obsidian_7.TextComponent(div);
                    }
                    this.value = (_a = this.default_value) !== null && _a !== void 0 ? _a : "";
                    textInput.inputEl.addClass("templater-prompt-input");
                    textInput.setPlaceholder("Type text here");
                    textInput.setValue(this.value);
                    textInput.onChange((value) => (this.value = value));
                    textInput.inputEl.focus();
                    textInput.inputEl.addEventListener("keydown", (evt) => this.enterCallback(evt));
                }
                enterCallback(evt) {
                    // Fix for Korean inputs https://github.com/SilentVoid13/Templater/issues/1284
                    if (evt.isComposing || evt.keyCode === 229)
                        return;
                    if (this.multi_line) {
                        if (obsidian_7.Platform.isDesktop && evt.key === "Enter" && !evt.shiftKey) {
                            this.resolveAndClose(evt);
                        }
                    }
                    else {
                        if (evt.key === "Enter") {
                            this.resolveAndClose(evt);
                        }
                    }
                }
                resolveAndClose(evt) {
                    this.submitted = true;
                    evt.preventDefault();
                    this.resolve(this.value);
                    this.close();
                }
                openAndGetValue(resolve, reject) {
                    return tslib_10.__awaiter(this, void 0, void 0, function* () {
                        this.resolve = resolve;
                        this.reject = reject;
                        this.open();
                    });
                }
            };
            exports_13("PromptModal", PromptModal);
        }
    };
});
System.register("src/core/functions/internal_functions/system/SuggesterModal", ["tslib", "src/utils/Error", "obsidian"], function (exports_14, context_14) {
    "use strict";
    var tslib_11, Error_8, obsidian_8, SuggesterModal;
    var __moduleName = context_14 && context_14.id;
    return {
        setters: [
            function (tslib_11_1) {
                tslib_11 = tslib_11_1;
            },
            function (Error_8_1) {
                Error_8 = Error_8_1;
            },
            function (obsidian_8_1) {
                obsidian_8 = obsidian_8_1;
            }
        ],
        execute: function () {
            SuggesterModal = class SuggesterModal extends obsidian_8.FuzzySuggestModal {
                constructor(app, text_items, items, placeholder, limit) {
                    super(app);
                    this.text_items = text_items;
                    this.items = items;
                    this.submitted = false;
                    this.setPlaceholder(placeholder);
                    limit && (this.limit = limit);
                }
                getItems() {
                    return this.items;
                }
                onClose() {
                    if (!this.submitted) {
                        this.reject(new Error_8.TemplaterError("Cancelled prompt"));
                    }
                }
                selectSuggestion(value, evt) {
                    this.submitted = true;
                    this.close();
                    this.onChooseSuggestion(value, evt);
                }
                getItemText(item) {
                    if (this.text_items instanceof Function) {
                        return this.text_items(item);
                    }
                    return (this.text_items[this.items.indexOf(item)] || "Undefined Text Item");
                }
                onChooseItem(item) {
                    this.resolve(item);
                }
                openAndGetValue(resolve, reject) {
                    return tslib_11.__awaiter(this, void 0, void 0, function* () {
                        this.resolve = resolve;
                        this.reject = reject;
                        this.open();
                    });
                }
            };
            exports_14("SuggesterModal", SuggesterModal);
        }
    };
});
System.register("src/core/functions/internal_functions/system/InternalModuleSystem", ["tslib", "src/core/functions/internal_functions/InternalModule", "src/core/functions/internal_functions/system/PromptModal", "src/core/functions/internal_functions/system/SuggesterModal"], function (exports_15, context_15) {
    "use strict";
    var tslib_12, InternalModule_6, PromptModal_1, SuggesterModal_1, InternalModuleSystem;
    var __moduleName = context_15 && context_15.id;
    return {
        setters: [
            function (tslib_12_1) {
                tslib_12 = tslib_12_1;
            },
            function (InternalModule_6_1) {
                InternalModule_6 = InternalModule_6_1;
            },
            function (PromptModal_1_1) {
                PromptModal_1 = PromptModal_1_1;
            },
            function (SuggesterModal_1_1) {
                SuggesterModal_1 = SuggesterModal_1_1;
            }
        ],
        execute: function () {
            InternalModuleSystem = class InternalModuleSystem extends InternalModule_6.InternalModule {
                constructor() {
                    super(...arguments);
                    this.name = "system";
                }
                create_static_templates() {
                    return tslib_12.__awaiter(this, void 0, void 0, function* () {
                        this.static_functions.set("clipboard", this.generate_clipboard());
                        this.static_functions.set("prompt", this.generate_prompt());
                        this.static_functions.set("suggester", this.generate_suggester());
                    });
                }
                create_dynamic_templates() {
                    return tslib_12.__awaiter(this, void 0, void 0, function* () { });
                }
                teardown() {
                    return tslib_12.__awaiter(this, void 0, void 0, function* () { });
                }
                generate_clipboard() {
                    return () => tslib_12.__awaiter(this, void 0, void 0, function* () {
                        return yield navigator.clipboard.readText();
                    });
                }
                generate_prompt() {
                    return (prompt_text, default_value, throw_on_cancel = false, multi_line = false) => tslib_12.__awaiter(this, void 0, void 0, function* () {
                        const prompt = new PromptModal_1.PromptModal(this.plugin.app, prompt_text, default_value, multi_line);
                        const promise = new Promise((resolve, reject) => prompt.openAndGetValue(resolve, reject));
                        try {
                            return yield promise;
                        }
                        catch (error) {
                            if (throw_on_cancel) {
                                throw error;
                            }
                            return null;
                        }
                    });
                }
                generate_suggester() {
                    return (text_items, items, throw_on_cancel = false, placeholder = "", limit) => tslib_12.__awaiter(this, void 0, void 0, function* () {
                        const suggester = new SuggesterModal_1.SuggesterModal(this.plugin.app, text_items, items, placeholder, limit);
                        const promise = new Promise((resolve, reject) => suggester.openAndGetValue(resolve, reject));
                        try {
                            return yield promise;
                        }
                        catch (error) {
                            if (throw_on_cancel) {
                                throw error;
                            }
                            return null;
                        }
                    });
                }
            };
            exports_15("InternalModuleSystem", InternalModuleSystem);
        }
    };
});
System.register("src/core/functions/internal_functions/config/InternalModuleConfig", ["tslib", "src/core/functions/internal_functions/InternalModule"], function (exports_16, context_16) {
    "use strict";
    var tslib_13, InternalModule_7, InternalModuleConfig;
    var __moduleName = context_16 && context_16.id;
    return {
        setters: [
            function (tslib_13_1) {
                tslib_13 = tslib_13_1;
            },
            function (InternalModule_7_1) {
                InternalModule_7 = InternalModule_7_1;
            }
        ],
        execute: function () {
            InternalModuleConfig = class InternalModuleConfig extends InternalModule_7.InternalModule {
                constructor() {
                    super(...arguments);
                    this.name = "config";
                }
                create_static_templates() {
                    return tslib_13.__awaiter(this, void 0, void 0, function* () { });
                }
                create_dynamic_templates() {
                    return tslib_13.__awaiter(this, void 0, void 0, function* () { });
                }
                teardown() {
                    return tslib_13.__awaiter(this, void 0, void 0, function* () { });
                }
                generate_object(config) {
                    return tslib_13.__awaiter(this, void 0, void 0, function* () {
                        return config;
                    });
                }
            };
            exports_16("InternalModuleConfig", InternalModuleConfig);
        }
    };
});
System.register("src/core/functions/internal_functions/InternalFunctions", ["tslib", "src/core/functions/internal_functions/date/InternalModuleDate", "src/core/functions/internal_functions/file/InternalModuleFile", "src/core/functions/internal_functions/web/InternalModuleWeb", "src/core/functions/internal_functions/hooks/InternalModuleHooks", "src/core/functions/internal_functions/frontmatter/InternalModuleFrontmatter", "src/core/functions/internal_functions/system/InternalModuleSystem", "src/core/functions/internal_functions/config/InternalModuleConfig"], function (exports_17, context_17) {
    "use strict";
    var tslib_14, InternalModuleDate_1, InternalModuleFile_1, InternalModuleWeb_1, InternalModuleHooks_1, InternalModuleFrontmatter_1, InternalModuleSystem_1, InternalModuleConfig_1, InternalFunctions;
    var __moduleName = context_17 && context_17.id;
    return {
        setters: [
            function (tslib_14_1) {
                tslib_14 = tslib_14_1;
            },
            function (InternalModuleDate_1_1) {
                InternalModuleDate_1 = InternalModuleDate_1_1;
            },
            function (InternalModuleFile_1_1) {
                InternalModuleFile_1 = InternalModuleFile_1_1;
            },
            function (InternalModuleWeb_1_1) {
                InternalModuleWeb_1 = InternalModuleWeb_1_1;
            },
            function (InternalModuleHooks_1_1) {
                InternalModuleHooks_1 = InternalModuleHooks_1_1;
            },
            function (InternalModuleFrontmatter_1_1) {
                InternalModuleFrontmatter_1 = InternalModuleFrontmatter_1_1;
            },
            function (InternalModuleSystem_1_1) {
                InternalModuleSystem_1 = InternalModuleSystem_1_1;
            },
            function (InternalModuleConfig_1_1) {
                InternalModuleConfig_1 = InternalModuleConfig_1_1;
            }
        ],
        execute: function () {
            InternalFunctions = class InternalFunctions {
                constructor(plugin) {
                    this.plugin = plugin;
                    this.modules_array = [];
                    this.modules_array.push(new InternalModuleDate_1.InternalModuleDate(this.plugin));
                    this.modules_array.push(new InternalModuleFile_1.InternalModuleFile(this.plugin));
                    this.modules_array.push(new InternalModuleWeb_1.InternalModuleWeb(this.plugin));
                    this.modules_array.push(new InternalModuleFrontmatter_1.InternalModuleFrontmatter(this.plugin));
                    this.modules_array.push(new InternalModuleHooks_1.InternalModuleHooks(this.plugin));
                    this.modules_array.push(new InternalModuleSystem_1.InternalModuleSystem(this.plugin));
                    this.modules_array.push(new InternalModuleConfig_1.InternalModuleConfig(this.plugin));
                }
                init() {
                    return tslib_14.__awaiter(this, void 0, void 0, function* () {
                        for (const mod of this.modules_array) {
                            yield mod.init();
                        }
                    });
                }
                teardown() {
                    return tslib_14.__awaiter(this, void 0, void 0, function* () {
                        for (const mod of this.modules_array) {
                            yield mod.teardown();
                        }
                    });
                }
                generate_object(config) {
                    return tslib_14.__awaiter(this, void 0, void 0, function* () {
                        const internal_functions_object = {};
                        for (const mod of this.modules_array) {
                            internal_functions_object[mod.getName()] =
                                yield mod.generate_object(config);
                        }
                        return internal_functions_object;
                    });
                }
            };
            exports_17("InternalFunctions", InternalFunctions);
        }
    };
});
System.register("src/utils/Constants", [], function (exports_18, context_18) {
    "use strict";
    var UNSUPPORTED_MOBILE_TEMPLATE, ICON_DATA;
    var __moduleName = context_18 && context_18.id;
    return {
        setters: [],
        execute: function () {
            exports_18("UNSUPPORTED_MOBILE_TEMPLATE", UNSUPPORTED_MOBILE_TEMPLATE = "Error_MobileUnsupportedTemplate");
            exports_18("ICON_DATA", ICON_DATA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51.1328 28.7"><path d="M0 15.14 0 10.15 18.67 1.51 18.67 6.03 4.72 12.33 4.72 12.76 18.67 19.22 18.67 23.74 0 15.14ZM33.6928 1.84C33.6928 1.84 33.9761 2.1467 34.5428 2.76C35.1094 3.38 35.3928 4.56 35.3928 6.3C35.3928 8.0466 34.8195 9.54 33.6728 10.78C32.5261 12.02 31.0995 12.64 29.3928 12.64C27.6862 12.64 26.2661 12.0267 25.1328 10.8C23.9928 9.5733 23.4228 8.0867 23.4228 6.34C23.4228 4.6 23.9995 3.1066 25.1528 1.86C26.2994.62 27.7261 0 29.4328 0C31.1395 0 32.5594.6133 33.6928 1.84M49.8228.67 29.5328 28.38 24.4128 28.38 44.7128.67 49.8228.67M31.0328 8.38C31.0328 8.38 31.1395 8.2467 31.3528 7.98C31.5662 7.7067 31.6728 7.1733 31.6728 6.38C31.6728 5.5867 31.4461 4.92 30.9928 4.38C30.5461 3.84 29.9995 3.57 29.3528 3.57C28.7061 3.57 28.1695 3.84 27.7428 4.38C27.3228 4.92 27.1128 5.5867 27.1128 6.38C27.1128 7.1733 27.3361 7.84 27.7828 8.38C28.2361 8.9267 28.7861 9.2 29.4328 9.2C30.0795 9.2 30.6128 8.9267 31.0328 8.38M49.4328 17.9C49.4328 17.9 49.7161 18.2067 50.2828 18.82C50.8495 19.4333 51.1328 20.6133 51.1328 22.36C51.1328 24.1 50.5594 25.59 49.4128 26.83C48.2595 28.0766 46.8295 28.7 45.1228 28.7C43.4228 28.7 42.0028 28.0833 40.8628 26.85C39.7295 25.6233 39.1628 24.1366 39.1628 22.39C39.1628 20.65 39.7361 19.16 40.8828 17.92C42.0361 16.6733 43.4628 16.05 45.1628 16.05C46.8694 16.05 48.2928 16.6667 49.4328 17.9M46.8528 24.52C46.8528 24.52 46.9595 24.3833 47.1728 24.11C47.3795 23.8367 47.4828 23.3033 47.4828 22.51C47.4828 21.7167 47.2595 21.05 46.8128 20.51C46.3661 19.97 45.8162 19.7 45.1628 19.7C44.5161 19.7 43.9828 19.97 43.5628 20.51C43.1428 21.05 42.9328 21.7167 42.9328 22.51C42.9328 23.3033 43.1561 23.9733 43.6028 24.52C44.0494 25.06 44.5961 25.33 45.2428 25.33C45.8895 25.33 46.4261 25.06 46.8528 24.52Z" fill="currentColor"/></svg>`);
        }
    };
});
System.register("src/core/functions/user_functions/UserSystemFunctions", ["tslib", "obsidian", "src/utils/Constants", "src/utils/Error", "src/core/functions/FunctionsGenerator"], function (exports_19, context_19) {
    "use strict";
    var tslib_15, obsidian_9, Constants_1, Error_9, FunctionsGenerator_1, UserSystemFunctions;
    var __moduleName = context_19 && context_19.id;
    return {
        setters: [
            function (tslib_15_1) {
                tslib_15 = tslib_15_1;
            },
            function (obsidian_9_1) {
                obsidian_9 = obsidian_9_1;
            },
            function (Constants_1_1) {
                Constants_1 = Constants_1_1;
            },
            function (Error_9_1) {
                Error_9 = Error_9_1;
            },
            function (FunctionsGenerator_1_1) {
                FunctionsGenerator_1 = FunctionsGenerator_1_1;
            }
        ],
        execute: function () {
            UserSystemFunctions = class UserSystemFunctions {
                constructor(plugin) {
                    this.plugin = plugin;
                    if (obsidian_9.Platform.isMobile ||
                        !(this.plugin.app.vault.adapter instanceof obsidian_9.FileSystemAdapter)) {
                        this.cwd = "";
                    }
                    else {
                        this.cwd = this.plugin.app.vault.adapter.getBasePath();
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const { promisify } = require("util");
                        const { exec } = 
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        require("child_process");
                        this.exec_promise = promisify(exec);
                    }
                }
                // TODO: Add mobile support
                generate_system_functions(config) {
                    return tslib_15.__awaiter(this, void 0, void 0, function* () {
                        const user_system_functions = new Map();
                        const internal_functions_object = yield this.plugin.templater.functions_generator.generate_object(config, FunctionsGenerator_1.FunctionsMode.INTERNAL);
                        for (const template_pair of this.plugin.settings.templates_pairs) {
                            const template = template_pair[0];
                            let cmd = template_pair[1];
                            if (!template || !cmd) {
                                continue;
                            }
                            if (obsidian_9.Platform.isMobile) {
                                user_system_functions.set(template, () => {
                                    return new Promise((resolve) => resolve(Constants_1.UNSUPPORTED_MOBILE_TEMPLATE));
                                });
                            }
                            else {
                                cmd = yield this.plugin.templater.parser.parse_commands(cmd, internal_functions_object);
                                user_system_functions.set(template, (user_args) => tslib_15.__awaiter(this, void 0, void 0, function* () {
                                    const process_env = Object.assign(Object.assign({}, process.env), user_args);
                                    const cmd_options = Object.assign({ timeout: this.plugin.settings.command_timeout * 1000, cwd: this.cwd, env: process_env }, (this.plugin.settings.shell_path && {
                                        shell: this.plugin.settings.shell_path,
                                    }));
                                    try {
                                        const { stdout } = yield this.exec_promise(cmd, cmd_options);
                                        return stdout.trimRight();
                                    }
                                    catch (error) {
                                        throw new Error_9.TemplaterError(`Error with User Template ${template}`, error);
                                    }
                                }));
                            }
                        }
                        return user_system_functions;
                    });
                }
                generate_object(config) {
                    return tslib_15.__awaiter(this, void 0, void 0, function* () {
                        const user_system_functions = yield this.generate_system_functions(config);
                        return Object.fromEntries(user_system_functions);
                    });
                }
            };
            exports_19("UserSystemFunctions", UserSystemFunctions);
        }
    };
});
System.register("src/core/functions/user_functions/UserScriptFunctions", ["tslib", "src/utils/Utils", "src/utils/Error"], function (exports_20, context_20) {
    "use strict";
    var tslib_16, Utils_3, Error_10, UserScriptFunctions;
    var __moduleName = context_20 && context_20.id;
    return {
        setters: [
            function (tslib_16_1) {
                tslib_16 = tslib_16_1;
            },
            function (Utils_3_1) {
                Utils_3 = Utils_3_1;
            },
            function (Error_10_1) {
                Error_10 = Error_10_1;
            }
        ],
        execute: function () {
            UserScriptFunctions = class UserScriptFunctions {
                constructor(plugin) {
                    this.plugin = plugin;
                }
                generate_user_script_functions() {
                    return tslib_16.__awaiter(this, void 0, void 0, function* () {
                        const user_script_functions = new Map();
                        const files = Error_10.errorWrapperSync(() => Utils_3.get_tfiles_from_folder(this.plugin.app, this.plugin.settings.user_scripts_folder), `Couldn't find user script folder "${this.plugin.settings.user_scripts_folder}"`);
                        if (!files) {
                            return new Map();
                        }
                        for (const file of files) {
                            if (file.extension.toLowerCase() === "js") {
                                yield this.load_user_script_function(file, user_script_functions);
                            }
                        }
                        return user_script_functions;
                    });
                }
                load_user_script_function(file, user_script_functions) {
                    return tslib_16.__awaiter(this, void 0, void 0, function* () {
                        const req = (s) => {
                            return window.require && window.require(s);
                        };
                        const exp = {};
                        const mod = {
                            exports: exp,
                        };
                        const file_content = yield this.plugin.app.vault.read(file);
                        try {
                            const wrapping_fn = window.eval("(function anonymous(require, module, exports){" +
                                file_content +
                                "\n})");
                            wrapping_fn(req, mod, exp);
                        }
                        catch (err) {
                            throw new Error_10.TemplaterError(`Failed to load user script at "${file.path}".`, err.message);
                        }
                        const user_function = exp["default"] || mod.exports;
                        if (!user_function) {
                            throw new Error_10.TemplaterError(`Failed to load user script at "${file.path}". No exports detected.`);
                        }
                        if (!(user_function instanceof Function)) {
                            throw new Error_10.TemplaterError(`Failed to load user script at "${file.path}". Default export is not a function.`);
                        }
                        user_script_functions.set(`${file.basename}`, user_function);
                    });
                }
                generate_object() {
                    return tslib_16.__awaiter(this, void 0, void 0, function* () {
                        const user_script_functions = yield this.generate_user_script_functions();
                        return Object.fromEntries(user_script_functions);
                    });
                }
            };
            exports_20("UserScriptFunctions", UserScriptFunctions);
        }
    };
});
System.register("src/core/functions/user_functions/UserFunctions", ["tslib", "src/core/functions/user_functions/UserSystemFunctions", "src/core/functions/user_functions/UserScriptFunctions"], function (exports_21, context_21) {
    "use strict";
    var tslib_17, UserSystemFunctions_1, UserScriptFunctions_1, UserFunctions;
    var __moduleName = context_21 && context_21.id;
    return {
        setters: [
            function (tslib_17_1) {
                tslib_17 = tslib_17_1;
            },
            function (UserSystemFunctions_1_1) {
                UserSystemFunctions_1 = UserSystemFunctions_1_1;
            },
            function (UserScriptFunctions_1_1) {
                UserScriptFunctions_1 = UserScriptFunctions_1_1;
            }
        ],
        execute: function () {
            UserFunctions = class UserFunctions {
                constructor(plugin) {
                    this.plugin = plugin;
                    this.user_system_functions = new UserSystemFunctions_1.UserSystemFunctions(plugin);
                    this.user_script_functions = new UserScriptFunctions_1.UserScriptFunctions(plugin);
                }
                generate_object(config) {
                    return tslib_17.__awaiter(this, void 0, void 0, function* () {
                        let user_system_functions = {};
                        let user_script_functions = {};
                        if (this.plugin.settings.enable_system_commands) {
                            user_system_functions =
                                yield this.user_system_functions.generate_object(config);
                        }
                        // user_scripts_folder needs to be explicitly set to '/' to query from root
                        if (this.plugin.settings.user_scripts_folder) {
                            user_script_functions =
                                yield this.user_script_functions.generate_object();
                        }
                        return Object.assign(Object.assign({}, user_system_functions), user_script_functions);
                    });
                }
            };
            exports_21("UserFunctions", UserFunctions);
        }
    };
});
System.register("src/core/functions/FunctionsGenerator", ["tslib", "src/core/functions/internal_functions/InternalFunctions", "src/core/functions/user_functions/UserFunctions", "obsidian"], function (exports_22, context_22) {
    "use strict";
    var tslib_18, InternalFunctions_1, UserFunctions_1, obsidian_module, FunctionsMode, FunctionsGenerator;
    var __moduleName = context_22 && context_22.id;
    return {
        setters: [
            function (tslib_18_1) {
                tslib_18 = tslib_18_1;
            },
            function (InternalFunctions_1_1) {
                InternalFunctions_1 = InternalFunctions_1_1;
            },
            function (UserFunctions_1_1) {
                UserFunctions_1 = UserFunctions_1_1;
            },
            function (obsidian_module_1) {
                obsidian_module = obsidian_module_1;
            }
        ],
        execute: function () {
            (function (FunctionsMode) {
                FunctionsMode[FunctionsMode["INTERNAL"] = 0] = "INTERNAL";
                FunctionsMode[FunctionsMode["USER_INTERNAL"] = 1] = "USER_INTERNAL";
            })(FunctionsMode || (FunctionsMode = {}));
            exports_22("FunctionsMode", FunctionsMode);
            FunctionsGenerator = class FunctionsGenerator {
                constructor(plugin) {
                    this.plugin = plugin;
                    this.internal_functions = new InternalFunctions_1.InternalFunctions(this.plugin);
                    this.user_functions = new UserFunctions_1.UserFunctions(this.plugin);
                }
                init() {
                    return tslib_18.__awaiter(this, void 0, void 0, function* () {
                        yield this.internal_functions.init();
                    });
                }
                teardown() {
                    return tslib_18.__awaiter(this, void 0, void 0, function* () {
                        yield this.internal_functions.teardown();
                    });
                }
                additional_functions() {
                    return {
                        app: this.plugin.app,
                        obsidian: obsidian_module,
                    };
                }
                generate_object(config, functions_mode = FunctionsMode.USER_INTERNAL) {
                    return tslib_18.__awaiter(this, void 0, void 0, function* () {
                        const final_object = {};
                        const additional_functions_object = this.additional_functions();
                        const internal_functions_object = yield this.internal_functions.generate_object(config);
                        let user_functions_object = {};
                        Object.assign(final_object, additional_functions_object);
                        switch (functions_mode) {
                            case FunctionsMode.INTERNAL:
                                Object.assign(final_object, internal_functions_object);
                                break;
                            case FunctionsMode.USER_INTERNAL:
                                user_functions_object =
                                    yield this.user_functions.generate_object(config);
                                Object.assign(final_object, Object.assign(Object.assign({}, internal_functions_object), { user: user_functions_object }));
                                break;
                        }
                        return final_object;
                    });
                }
            };
            exports_22("FunctionsGenerator", FunctionsGenerator);
        }
    };
});
System.register("src/core/parser/Parser", ["tslib", "@silentvoid13/rusty_engine", "../../../node_modules/@silentvoid13/rusty_engine/rusty_engine_bg.wasm"], function (exports_23, context_23) {
    "use strict";
    var tslib_19, rusty_engine_1, rusty_engine_bg_wasm_1, Parser;
    var __moduleName = context_23 && context_23.id;
    return {
        setters: [
            function (tslib_19_1) {
                tslib_19 = tslib_19_1;
            },
            function (rusty_engine_1_1) {
                rusty_engine_1 = rusty_engine_1_1;
            },
            function (rusty_engine_bg_wasm_1_1) {
                rusty_engine_bg_wasm_1 = rusty_engine_bg_wasm_1_1;
            }
        ],
        execute: function () {
            Parser = class Parser {
                init() {
                    return tslib_19.__awaiter(this, void 0, void 0, function* () {
                        yield rusty_engine_1.default(rusty_engine_bg_wasm_1.default);
                        const config = new rusty_engine_1.ParserConfig("<%", "%>", "\0", "*", "-", "_", "tR");
                        this.renderer = new rusty_engine_1.Renderer(config);
                    });
                }
                parse_commands(content, context) {
                    return tslib_19.__awaiter(this, void 0, void 0, function* () {
                        return this.renderer.render_content(content, context);
                    });
                }
            };
            exports_23("Parser", Parser);
        }
    };
});
System.register("src/core/Templater", ["tslib", "obsidian", "src/utils/Utils", "src/core/functions/FunctionsGenerator", "src/utils/Error", "src/core/parser/Parser", "src/utils/Log"], function (exports_24, context_24) {
    "use strict";
    var tslib_20, obsidian_10, Utils_4, FunctionsGenerator_2, Error_11, Parser_1, Log_3, RunMode, Templater;
    var __moduleName = context_24 && context_24.id;
    return {
        setters: [
            function (tslib_20_1) {
                tslib_20 = tslib_20_1;
            },
            function (obsidian_10_1) {
                obsidian_10 = obsidian_10_1;
            },
            function (Utils_4_1) {
                Utils_4 = Utils_4_1;
            },
            function (FunctionsGenerator_2_1) {
                FunctionsGenerator_2 = FunctionsGenerator_2_1;
            },
            function (Error_11_1) {
                Error_11 = Error_11_1;
            },
            function (Parser_1_1) {
                Parser_1 = Parser_1_1;
            },
            function (Log_3_1) {
                Log_3 = Log_3_1;
            }
        ],
        execute: function () {
            (function (RunMode) {
                RunMode[RunMode["CreateNewFromTemplate"] = 0] = "CreateNewFromTemplate";
                RunMode[RunMode["AppendActiveFile"] = 1] = "AppendActiveFile";
                RunMode[RunMode["OverwriteFile"] = 2] = "OverwriteFile";
                RunMode[RunMode["OverwriteActiveFile"] = 3] = "OverwriteActiveFile";
                RunMode[RunMode["DynamicProcessor"] = 4] = "DynamicProcessor";
                RunMode[RunMode["StartupTemplate"] = 5] = "StartupTemplate";
            })(RunMode || (RunMode = {}));
            exports_24("RunMode", RunMode);
            Templater = class Templater {
                constructor(plugin) {
                    this.plugin = plugin;
                    this.functions_generator = new FunctionsGenerator_2.FunctionsGenerator(this.plugin);
                    this.parser = new Parser_1.Parser();
                }
                setup() {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        this.files_with_pending_templates = new Set();
                        yield this.parser.init();
                        yield this.functions_generator.init();
                        this.plugin.registerMarkdownPostProcessor((el, ctx) => this.process_dynamic_templates(el, ctx));
                    });
                }
                create_running_config(template_file, target_file, run_mode) {
                    const active_file = Utils_4.get_active_file(this.plugin.app);
                    return {
                        template_file: template_file,
                        target_file: target_file,
                        run_mode: run_mode,
                        active_file: active_file,
                    };
                }
                read_and_parse_template(config) {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        const template_content = yield this.plugin.app.vault.read(config.template_file);
                        return this.parse_template(config, template_content);
                    });
                }
                parse_template(config, template_content) {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        const functions_object = yield this.functions_generator.generate_object(config, FunctionsGenerator_2.FunctionsMode.USER_INTERNAL);
                        this.current_functions_object = functions_object;
                        const content = yield this.parser.parse_commands(template_content, functions_object);
                        return content;
                    });
                }
                start_templater_task(path) {
                    this.files_with_pending_templates.add(path);
                }
                end_templater_task(path) {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        this.files_with_pending_templates.delete(path);
                        if (this.files_with_pending_templates.size === 0) {
                            this.plugin.app.workspace.trigger("templater:all-templates-executed");
                            yield this.functions_generator.teardown();
                        }
                    });
                }
                create_new_note_from_template(template, folder, filename, open_new_note = true) {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        // TODO: Maybe there is an obsidian API function for that
                        if (!folder) {
                            const new_file_location = this.plugin.app.vault.getConfig("newFileLocation");
                            switch (new_file_location) {
                                case "current": {
                                    const active_file = Utils_4.get_active_file(this.plugin.app);
                                    if (active_file) {
                                        folder = active_file.parent;
                                    }
                                    break;
                                }
                                case "folder":
                                    folder = this.plugin.app.fileManager.getNewFileParent("");
                                    break;
                                case "root":
                                    folder = this.plugin.app.vault.getRoot();
                                    break;
                                default:
                                    break;
                            }
                        }
                        const extension = template instanceof obsidian_10.TFile ? template.extension || "md" : "md";
                        const created_note = yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () {
                            const folderPath = folder instanceof obsidian_10.TFolder ? folder.path : folder;
                            const path = this.plugin.app.vault.getAvailablePath(obsidian_10.normalizePath(`${folderPath !== null && folderPath !== void 0 ? folderPath : ""}/${filename || "Untitled"}`), extension);
                            const folder_path = Utils_4.get_folder_path_from_file_path(path);
                            if (folder_path &&
                                !this.plugin.app.vault.getAbstractFileByPathInsensitive(folder_path)) {
                                yield this.plugin.app.vault.createFolder(folder_path);
                            }
                            return this.plugin.app.vault.create(path, "");
                        }), `Couldn't create ${extension} file.`);
                        if (created_note == null) {
                            return;
                        }
                        const { path } = created_note;
                        this.start_templater_task(path);
                        let running_config;
                        let output_content;
                        if (template instanceof obsidian_10.TFile) {
                            running_config = this.create_running_config(template, created_note, RunMode.CreateNewFromTemplate);
                            output_content = yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), "Template parsing error, aborting.");
                        }
                        else {
                            running_config = this.create_running_config(undefined, created_note, RunMode.CreateNewFromTemplate);
                            output_content = yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () { return this.parse_template(running_config, template); }), "Template parsing error, aborting.");
                        }
                        if (output_content == null) {
                            yield this.plugin.app.vault.delete(created_note);
                            yield this.end_templater_task(path);
                            return;
                        }
                        yield this.plugin.app.vault.modify(created_note, output_content);
                        this.plugin.app.workspace.trigger("templater:new-note-from-template", {
                            file: created_note,
                            content: output_content,
                        });
                        if (open_new_note) {
                            const active_leaf = this.plugin.app.workspace.getLeaf(false);
                            if (!active_leaf) {
                                Log_3.log_error(new Error_11.TemplaterError("No active leaf"));
                                return;
                            }
                            yield active_leaf.openFile(created_note, {
                                state: { mode: "source" },
                            });
                            yield this.plugin.editor_handler.jump_to_next_cursor_location(created_note, true);
                            active_leaf.setEphemeralState({
                                rename: "all",
                            });
                        }
                        yield this.end_templater_task(path);
                        return created_note;
                    });
                }
                append_template_to_active_file(template_file) {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        const active_view = this.plugin.app.workspace.getActiveViewOfType(obsidian_10.MarkdownView);
                        const active_editor = this.plugin.app.workspace.activeEditor;
                        if (!active_editor || !active_editor.file || !active_editor.editor) {
                            Log_3.log_error(new Error_11.TemplaterError("No active editor, can't append templates."));
                            return;
                        }
                        const { path } = active_editor.file;
                        this.start_templater_task(path);
                        const running_config = this.create_running_config(template_file, active_editor.file, RunMode.AppendActiveFile);
                        const output_content = yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), "Template parsing error, aborting.");
                        // errorWrapper failed
                        if (output_content == null) {
                            yield this.end_templater_task(path);
                            return;
                        }
                        const editor = active_editor.editor;
                        const doc = editor.getDoc();
                        const oldSelections = doc.listSelections();
                        doc.replaceSelection(output_content);
                        // Refresh editor to ensure properties widget shows after inserting template in blank file
                        if (active_editor.file) {
                            yield this.plugin.app.vault.append(active_editor.file, "");
                        }
                        this.plugin.app.workspace.trigger("templater:template-appended", {
                            view: active_view,
                            editor: active_editor,
                            content: output_content,
                            oldSelections,
                            newSelections: doc.listSelections(),
                        });
                        yield this.plugin.editor_handler.jump_to_next_cursor_location(active_editor.file, true);
                        yield this.end_templater_task(path);
                    });
                }
                write_template_to_file(template_file, file) {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        const { path } = file;
                        this.start_templater_task(path);
                        const active_editor = this.plugin.app.workspace.activeEditor;
                        const active_file = Utils_4.get_active_file(this.plugin.app);
                        const running_config = this.create_running_config(template_file, file, RunMode.OverwriteFile);
                        const output_content = yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), "Template parsing error, aborting.");
                        // errorWrapper failed
                        if (output_content == null) {
                            yield this.end_templater_task(path);
                            return;
                        }
                        yield this.plugin.app.vault.modify(file, output_content);
                        // Set cursor to first line of editor (below properties)
                        // https://github.com/SilentVoid13/Templater/issues/1231
                        if ((active_file === null || active_file === void 0 ? void 0 : active_file.path) === file.path &&
                            active_editor &&
                            active_editor.editor) {
                            const editor = active_editor.editor;
                            editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 0 });
                        }
                        this.plugin.app.workspace.trigger("templater:new-note-from-template", {
                            file,
                            content: output_content,
                        });
                        yield this.plugin.editor_handler.jump_to_next_cursor_location(file, true);
                        yield this.end_templater_task(path);
                    });
                }
                overwrite_active_file_commands() {
                    const active_editor = this.plugin.app.workspace.activeEditor;
                    if (!active_editor || !active_editor.file) {
                        Log_3.log_error(new Error_11.TemplaterError("Active editor is null, can't overwrite content"));
                        return;
                    }
                    this.overwrite_file_commands(active_editor.file, true);
                }
                overwrite_file_commands(file, active_file = false) {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        const { path } = file;
                        this.start_templater_task(path);
                        const running_config = this.create_running_config(file, file, active_file ? RunMode.OverwriteActiveFile : RunMode.OverwriteFile);
                        const output_content = yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), "Template parsing error, aborting.");
                        // errorWrapper failed
                        if (output_content == null) {
                            yield this.end_templater_task(path);
                            return;
                        }
                        yield this.plugin.app.vault.modify(file, output_content);
                        this.plugin.app.workspace.trigger("templater:overwrite-file", {
                            file,
                            content: output_content,
                        });
                        yield this.plugin.editor_handler.jump_to_next_cursor_location(file, true);
                        yield this.end_templater_task(path);
                    });
                }
                process_dynamic_templates(el, ctx) {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        const dynamic_command_regex = Utils_4.generate_dynamic_command_regex();
                        const walker = document.createNodeIterator(el, NodeFilter.SHOW_TEXT);
                        let node;
                        let pass = false;
                        let functions_object;
                        while ((node = walker.nextNode())) {
                            let content = node.nodeValue;
                            if (content !== null) {
                                let match = dynamic_command_regex.exec(content);
                                if (match !== null) {
                                    const file = this.plugin.app.metadataCache.getFirstLinkpathDest("", ctx.sourcePath);
                                    if (!file || !(file instanceof obsidian_10.TFile)) {
                                        return;
                                    }
                                    if (!pass) {
                                        pass = true;
                                        const config = this.create_running_config(file, file, RunMode.DynamicProcessor);
                                        functions_object =
                                            yield this.functions_generator.generate_object(config, FunctionsGenerator_2.FunctionsMode.USER_INTERNAL);
                                        this.current_functions_object = functions_object;
                                    }
                                }
                                while (match != null) {
                                    // Not the most efficient way to exclude the '+' from the command but I couldn't find something better
                                    const complete_command = match[1] + match[2];
                                    const command_output = yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () {
                                        return yield this.parser.parse_commands(complete_command, functions_object);
                                    }), `Command Parsing error in dynamic command '${complete_command}'`);
                                    if (command_output == null) {
                                        return;
                                    }
                                    const start = dynamic_command_regex.lastIndex - match[0].length;
                                    const end = dynamic_command_regex.lastIndex;
                                    content =
                                        content.substring(0, start) +
                                            command_output +
                                            content.substring(end);
                                    dynamic_command_regex.lastIndex +=
                                        command_output.length - match[0].length;
                                    match = dynamic_command_regex.exec(content);
                                }
                                node.nodeValue = content;
                            }
                        }
                    });
                }
                get_new_file_template_for_folder(folder) {
                    do {
                        const match = this.plugin.settings.folder_templates.find((e) => e.folder == folder.path);
                        if (match && match.template) {
                            return match.template;
                        }
                        folder = folder.parent;
                    } while (folder);
                }
                get_new_file_template_for_file(file) {
                    const match = this.plugin.settings.file_templates.find((e) => {
                        const eRegex = new RegExp(e.regex);
                        return eRegex.test(file.path);
                    });
                    if (match && match.template) {
                        return match.template;
                    }
                }
                static on_file_creation(templater, app, file) {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        if (!(file instanceof obsidian_10.TFile) || file.extension !== "md") {
                            return;
                        }
                        // Avoids template replacement when syncing template files
                        const template_folder = obsidian_10.normalizePath(templater.plugin.settings.templates_folder);
                        if (file.path.includes(template_folder) && template_folder !== "/") {
                            return;
                        }
                        // TODO: find a better way to do this
                        // Currently, I have to wait for the note extractor plugin to add the file content before replacing
                        yield Utils_4.delay(300);
                        // Avoids template replacement when creating file from template without content before delay
                        if (templater.files_with_pending_templates.has(file.path)) {
                            return;
                        }
                        if (file.stat.size == 0 &&
                            templater.plugin.settings.enable_folder_templates) {
                            const folder_template_match = templater.get_new_file_template_for_folder(file.parent);
                            if (!folder_template_match) {
                                return;
                            }
                            const template_file = yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () {
                                return Utils_4.resolve_tfile(app, folder_template_match);
                            }), `Couldn't find template ${folder_template_match}`);
                            // errorWrapper failed
                            if (template_file == null) {
                                return;
                            }
                            yield templater.write_template_to_file(template_file, file);
                        }
                        else if (file.stat.size == 0 &&
                            templater.plugin.settings.enable_file_templates) {
                            const file_template_match = templater.get_new_file_template_for_file(file);
                            if (!file_template_match) {
                                return;
                            }
                            const template_file = yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () {
                                return Utils_4.resolve_tfile(app, file_template_match);
                            }), `Couldn't find template ${file_template_match}`);
                            // errorWrapper failed
                            if (template_file == null) {
                                return;
                            }
                            yield templater.write_template_to_file(template_file, file);
                        }
                        else {
                            if (file.stat.size <= 100000) {
                                //https://github.com/SilentVoid13/Templater/issues/873
                                yield templater.overwrite_file_commands(file);
                            }
                            else {
                                console.log(`Templater skipped parsing ${file.path} because file size exceeds 10000`);
                            }
                        }
                    });
                }
                execute_startup_scripts() {
                    return tslib_20.__awaiter(this, void 0, void 0, function* () {
                        for (const template of this.plugin.settings.startup_templates) {
                            if (!template) {
                                continue;
                            }
                            const file = Error_11.errorWrapperSync(() => Utils_4.resolve_tfile(this.plugin.app, template), `Couldn't find startup template "${template}"`);
                            if (!file) {
                                continue;
                            }
                            const { path } = file;
                            this.start_templater_task(path);
                            const running_config = this.create_running_config(file, file, RunMode.StartupTemplate);
                            yield Error_11.errorWrapper(() => tslib_20.__awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), `Startup Template parsing error, aborting.`);
                            yield this.end_templater_task(path);
                        }
                    });
                }
            };
            exports_24("Templater", Templater);
        }
    };
});
System.register("src/editor/CursorJumper", ["tslib", "obsidian", "src/utils/Utils"], function (exports_25, context_25) {
    "use strict";
    var tslib_21, obsidian_11, Utils_5, CursorJumper;
    var __moduleName = context_25 && context_25.id;
    return {
        setters: [
            function (tslib_21_1) {
                tslib_21 = tslib_21_1;
            },
            function (obsidian_11_1) {
                obsidian_11 = obsidian_11_1;
            },
            function (Utils_5_1) {
                Utils_5 = Utils_5_1;
            }
        ],
        execute: function () {
            CursorJumper = class CursorJumper {
                constructor(app) {
                    this.app = app;
                }
                jump_to_next_cursor_location() {
                    return tslib_21.__awaiter(this, void 0, void 0, function* () {
                        const active_editor = this.app.workspace.activeEditor;
                        if (!active_editor || !active_editor.editor) {
                            return;
                        }
                        const content = active_editor.editor.getValue();
                        const { new_content, positions } = this.replace_and_get_cursor_positions(content);
                        if (positions) {
                            const fold_info = active_editor instanceof obsidian_11.MarkdownView
                                ? active_editor.currentMode.getFoldInfo()
                                : null;
                            active_editor.editor.setValue(new_content);
                            // only expand folds that have a cursor placed within it's bounds
                            if (fold_info && Array.isArray(fold_info.folds)) {
                                positions.forEach((position) => {
                                    fold_info.folds = fold_info.folds.filter((fold) => fold.from > position.line || fold.to < position.line);
                                });
                                if (active_editor instanceof obsidian_11.MarkdownView) {
                                    active_editor.currentMode.applyFoldInfo(fold_info);
                                }
                            }
                            this.set_cursor_location(positions);
                        }
                        // enter insert mode for vim users
                        if (this.app.vault.getConfig("vimMode")) {
                            // @ts-ignore
                            const cm = active_editor.editor.cm.cm;
                            // @ts-ignore
                            window.CodeMirrorAdapter.Vim.handleKey(cm, "i", "mapping");
                        }
                    });
                }
                get_editor_position_from_index(content, index) {
                    const substr = content.slice(0, index);
                    let l = 0;
                    let offset = -1;
                    let r = -1;
                    for (; (r = substr.indexOf("\n", r + 1)) !== -1; l++, offset = r)
                        ;
                    offset += 1;
                    const ch = content.slice(offset, index).length;
                    return { line: l, ch: ch };
                }
                replace_and_get_cursor_positions(content) {
                    let cursor_matches = [];
                    let match;
                    const cursor_regex = new RegExp("<%\\s*tp.file.cursor\\((?<order>[0-9]*)\\)\\s*%>", "g");
                    while ((match = cursor_regex.exec(content)) != null) {
                        cursor_matches.push(match);
                    }
                    if (cursor_matches.length === 0) {
                        return {};
                    }
                    cursor_matches.sort((m1, m2) => {
                        return (Number(m1.groups && m1.groups["order"]) -
                            Number(m2.groups && m2.groups["order"]));
                    });
                    const match_str = cursor_matches[0][0];
                    cursor_matches = cursor_matches.filter((m) => {
                        return m[0] === match_str;
                    });
                    const positions = [];
                    let index_offset = 0;
                    for (const match of cursor_matches) {
                        const index = match.index - index_offset;
                        positions.push(this.get_editor_position_from_index(content, index));
                        content = content.replace(new RegExp(Utils_5.escape_RegExp(match[0])), "");
                        index_offset += match[0].length;
                        // For tp.file.cursor(), we keep the default top to bottom
                        if (match[1] === "") {
                            break;
                        }
                    }
                    return { new_content: content, positions: positions };
                }
                set_cursor_location(positions) {
                    const active_editor = this.app.workspace.activeEditor;
                    if (!active_editor || !active_editor.editor) {
                        return;
                    }
                    const editor = active_editor.editor;
                    const selections = [];
                    for (const pos of positions) {
                        selections.push({ from: pos });
                    }
                    const transaction = {
                        selections: selections,
                    };
                    editor.transaction(transaction);
                }
            };
            exports_25("CursorJumper", CursorJumper);
        }
    };
});
System.register("src/settings/RenderSettings/IntellisenseRenderOption", [], function (exports_26, context_26) {
    "use strict";
    var IntellisenseRenderOption;
    var __moduleName = context_26 && context_26.id;
    /**
     *
     * @param value The intellisense render setting
     * @returns True if the Return Intellisense should render, otherwise false
     */
    function shouldRenderReturns(render_setting) {
        // Render override
        if (isBoolean(render_setting))
            return render_setting;
        return [
            IntellisenseRenderOption.RenderDescriptionParameterReturn,
            IntellisenseRenderOption.RenderDescriptionReturn
        ].includes(render_setting);
    }
    exports_26("shouldRenderReturns", shouldRenderReturns);
    /**
     *
     * @param value The intellisense render setting
     * @returns True if the Parameters Intellisense should render, otherwise false
     */
    function shouldRenderParameters(render_setting) {
        // Render override
        if (isBoolean(render_setting))
            return render_setting;
        return [
            IntellisenseRenderOption.RenderDescriptionParameterReturn,
            IntellisenseRenderOption.RenderDescriptionParameterList
        ].includes(render_setting);
    }
    exports_26("shouldRenderParameters", shouldRenderParameters);
    /**
     *
     * @param value The intellisense render setting
     * @returns True if the Description Intellisense should render, otherwise false
     */
    function shouldRenderDescription(render_setting) {
        // Render override
        if (isBoolean(render_setting))
            return render_setting;
        return render_setting != IntellisenseRenderOption.Off;
    }
    exports_26("shouldRenderDescription", shouldRenderDescription);
    return {
        setters: [],
        execute: function () {
            /**
             * The recongized render setting options
             */
            (function (IntellisenseRenderOption) {
                IntellisenseRenderOption[IntellisenseRenderOption["Off"] = 0] = "Off";
                IntellisenseRenderOption[IntellisenseRenderOption["RenderDescriptionParameterReturn"] = 1] = "RenderDescriptionParameterReturn";
                IntellisenseRenderOption[IntellisenseRenderOption["RenderDescriptionParameterList"] = 2] = "RenderDescriptionParameterList";
                IntellisenseRenderOption[IntellisenseRenderOption["RenderDescriptionReturn"] = 3] = "RenderDescriptionReturn";
                IntellisenseRenderOption[IntellisenseRenderOption["RenderDescriptionOnly"] = 4] = "RenderDescriptionOnly";
            })(IntellisenseRenderOption || (IntellisenseRenderOption = {}));
            exports_26("IntellisenseRenderOption", IntellisenseRenderOption);
        }
    };
});
System.register("src/editor/Autocomplete", ["tslib", "obsidian", "src/editor/TpDocumentation", "src/settings/RenderSettings/IntellisenseRenderOption", "src/utils/Utils"], function (exports_27, context_27) {
    "use strict";
    var tslib_22, obsidian_12, TpDocumentation_1, IntellisenseRenderOption_1, Utils_6, Autocomplete;
    var __moduleName = context_27 && context_27.id;
    return {
        setters: [
            function (tslib_22_1) {
                tslib_22 = tslib_22_1;
            },
            function (obsidian_12_1) {
                obsidian_12 = obsidian_12_1;
            },
            function (TpDocumentation_1_1) {
                TpDocumentation_1 = TpDocumentation_1_1;
            },
            function (IntellisenseRenderOption_1_1) {
                IntellisenseRenderOption_1 = IntellisenseRenderOption_1_1;
            },
            function (Utils_6_1) {
                Utils_6 = Utils_6_1;
            }
        ],
        execute: function () {
            Autocomplete = class Autocomplete extends obsidian_12.EditorSuggest {
                constructor(plugin) {
                    super(plugin.app);
                    //private in_command = false;
                    // https://regex101.com/r/ocmHzR/1
                    this.tp_keyword_regex = /tp\.(?<module>[a-z]*)?(?<fn_trigger>\.(?<fn>[a-zA-Z_.]*)?)?$/;
                    this.documentation = new TpDocumentation_1.Documentation(plugin);
                    this.intellisense_render_setting = plugin.settings.intellisense_render;
                }
                onTrigger(cursor, editor, _file) {
                    const range = editor.getRange({ line: cursor.line, ch: 0 }, { line: cursor.line, ch: cursor.ch });
                    const match = this.tp_keyword_regex.exec(range);
                    if (!match) {
                        return null;
                    }
                    let query;
                    const module_name = (match.groups && match.groups["module"]) || "";
                    this.module_name = module_name;
                    if (match.groups && match.groups["fn_trigger"]) {
                        if (module_name == "" || !TpDocumentation_1.is_module_name(module_name)) {
                            return null;
                        }
                        this.function_trigger = true;
                        this.function_name = match.groups["fn"] || "";
                        query = this.function_name;
                    }
                    else {
                        this.function_trigger = false;
                        query = this.module_name;
                    }
                    const trigger_info = {
                        start: { line: cursor.line, ch: cursor.ch - query.length },
                        end: { line: cursor.line, ch: cursor.ch },
                        query: query,
                    };
                    this.latest_trigger_info = trigger_info;
                    return trigger_info;
                }
                getSuggestions(context) {
                    return tslib_22.__awaiter(this, void 0, void 0, function* () {
                        let suggestions;
                        if (this.module_name && this.function_trigger) {
                            suggestions = (yield this.documentation.get_all_functions_documentation(this.module_name, this.function_name));
                        }
                        else {
                            suggestions = this.documentation.get_all_modules_documentation();
                        }
                        if (!suggestions) {
                            return [];
                        }
                        return suggestions.filter((s) => s.queryKey.toLowerCase().startsWith(context.query.toLowerCase()));
                    });
                }
                renderSuggestion(value, el) {
                    el.createEl("b", { text: value.name });
                    if (TpDocumentation_1.is_function_documentation(value)) {
                        if (value.args &&
                            this.getNumberOfArguments(value.args) > 0 &&
                            IntellisenseRenderOption_1.shouldRenderParameters(this.intellisense_render_setting)) {
                            el.createEl('p', { text: "Parameter list:" });
                            const list = el.createEl("ol");
                            for (const [key, val] of Object.entries(value.args)) {
                                Utils_6.append_bolded_label_with_value_to_parent(list, key, val.description);
                            }
                        }
                        if (value.returns &&
                            IntellisenseRenderOption_1.shouldRenderReturns(this.intellisense_render_setting)) {
                            Utils_6.append_bolded_label_with_value_to_parent(el, 'Returns', value.returns);
                        }
                    }
                    if (this.function_trigger && TpDocumentation_1.is_function_documentation(value)) {
                        el.createEl("code", { text: value.definition });
                    }
                    if (value.description
                        && IntellisenseRenderOption_1.shouldRenderDescription(this.intellisense_render_setting)) {
                        el.createEl("div", { text: value.description });
                    }
                }
                selectSuggestion(value, _evt) {
                    const active_editor = this.app.workspace.activeEditor;
                    if (!active_editor || !active_editor.editor) {
                        // TODO: Error msg
                        return;
                    }
                    active_editor.editor.replaceRange(value.queryKey, this.latest_trigger_info.start, this.latest_trigger_info.end);
                    if (this.latest_trigger_info.start.ch == this.latest_trigger_info.end.ch) {
                        // Dirty hack to prevent the cursor being at the
                        // beginning of the word after completion,
                        // Not sure what's the cause of this bug.
                        const cursor_pos = this.latest_trigger_info.end;
                        cursor_pos.ch += value.queryKey.length;
                        active_editor.editor.setCursor(cursor_pos);
                    }
                }
                getNumberOfArguments(args) {
                    try {
                        return new Map(Object.entries(args)).size;
                    }
                    catch (error) {
                        return 0;
                    }
                }
                updateAutocompleteIntellisenseSetting(value) {
                    this.intellisense_render_setting = value;
                }
            };
            exports_27("Autocomplete", Autocomplete);
        }
    };
});
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
// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
// Utility function that allows modes to be combined. The mode given
// as the base argument takes care of most of the normal mode
// functionality, but a second (typically simple) mode is used, which
// can override the style of text. Both modes get to parse all of the
// text, but when both assign a non-null style to a piece of code, the
// overlay wins, unless the combine argument was true and not overridden,
// or state.overlay.combineTokens was true, in which case the styles are
// combined.
(function (mod) {
    mod(window.CodeMirror);
})(function (CodeMirror) {
    "use strict";
    CodeMirror.customOverlayMode = function (base, overlay, combine) {
        return {
            startState: function () {
                return {
                    base: CodeMirror.startState(base),
                    overlay: CodeMirror.startState(overlay),
                    basePos: 0,
                    baseCur: null,
                    overlayPos: 0,
                    overlayCur: null,
                    streamSeen: null,
                };
            },
            copyState: function (state) {
                return {
                    base: CodeMirror.copyState(base, state.base),
                    overlay: CodeMirror.copyState(overlay, state.overlay),
                    basePos: state.basePos,
                    baseCur: null,
                    overlayPos: state.overlayPos,
                    overlayCur: null,
                };
            },
            token: function (stream, state) {
                if (stream != state.streamSeen ||
                    Math.min(state.basePos, state.overlayPos) < stream.start) {
                    state.streamSeen = stream;
                    state.basePos = state.overlayPos = stream.start;
                }
                if (stream.start == state.basePos) {
                    state.baseCur = base.token(stream, state.base);
                    state.basePos = stream.pos;
                }
                if (stream.start == state.overlayPos) {
                    stream.pos = stream.start;
                    state.overlayCur = overlay.token(stream, state.overlay);
                    state.overlayPos = stream.pos;
                }
                stream.pos = Math.min(state.basePos, state.overlayPos);
                // Edge case for codeblocks in templater mode
                if (state.baseCur &&
                    state.overlayCur &&
                    state.baseCur.contains("line-HyperMD-codeblock")) {
                    state.overlayCur = state.overlayCur.replace("line-templater-inline", "");
                    state.overlayCur += ` line-background-HyperMD-codeblock-bg`;
                }
                // state.overlay.combineTokens always takes precedence over combine,
                // unless set to null
                if (state.overlayCur == null)
                    return state.baseCur;
                else if ((state.baseCur != null && state.overlay.combineTokens) ||
                    (combine && state.overlay.combineTokens == null))
                    return state.baseCur + " " + state.overlayCur;
                else
                    return state.overlayCur;
            },
            indent: base.indent &&
                function (state, textAfter, line) {
                    return base.indent(state.base, textAfter, line);
                },
            electricChars: base.electricChars,
            innerMode: function (state) {
                return { state: state.base, mode: base };
            },
            blankLine: function (state) {
                let baseToken, overlayToken;
                if (base.blankLine)
                    baseToken = base.blankLine(state.base);
                if (overlay.blankLine)
                    overlayToken = overlay.blankLine(state.overlay);
                return overlayToken == null
                    ? baseToken
                    : combine && baseToken != null
                        ? baseToken + " " + overlayToken
                        : overlayToken;
            },
        };
    };
});
System.register("src/editor/Editor", ["tslib", "obsidian", "src/utils/Error", "src/editor/CursorJumper", "src/utils/Log", "src/utils/Utils", "src/editor/Autocomplete", "editor/mode/javascript", "editor/mode/custom_overlay", "@codemirror/language", "@codemirror/state"], function (exports_28, context_28) {
    "use strict";
    var tslib_23, obsidian_13, Error_12, CursorJumper_1, Log_4, Utils_7, Autocomplete_1, language_1, state_1, TEMPLATER_MODE_NAME, TP_CMD_TOKEN_CLASS, TP_INLINE_CLASS, TP_OPENING_TAG_TOKEN_CLASS, TP_CLOSING_TAG_TOKEN_CLASS, TP_INTERPOLATION_TAG_TOKEN_CLASS, TP_EXEC_TAG_TOKEN_CLASS, Editor;
    var __moduleName = context_28 && context_28.id;
    return {
        setters: [
            function (tslib_23_1) {
                tslib_23 = tslib_23_1;
            },
            function (obsidian_13_1) {
                obsidian_13 = obsidian_13_1;
            },
            function (Error_12_1) {
                Error_12 = Error_12_1;
            },
            function (CursorJumper_1_1) {
                CursorJumper_1 = CursorJumper_1_1;
            },
            function (Log_4_1) {
                Log_4 = Log_4_1;
            },
            function (Utils_7_1) {
                Utils_7 = Utils_7_1;
            },
            function (Autocomplete_1_1) {
                Autocomplete_1 = Autocomplete_1_1;
            },
            function (_1) {
            },
            function (_2) {
            },
            function (language_1_1) {
                language_1 = language_1_1;
            },
            function (state_1_1) {
                state_1 = state_1_1;
            }
        ],
        execute: function () {
            //import "editor/mode/show-hint";
            TEMPLATER_MODE_NAME = "templater";
            TP_CMD_TOKEN_CLASS = "templater-command";
            TP_INLINE_CLASS = "templater-inline";
            TP_OPENING_TAG_TOKEN_CLASS = "templater-opening-tag";
            TP_CLOSING_TAG_TOKEN_CLASS = "templater-closing-tag";
            TP_INTERPOLATION_TAG_TOKEN_CLASS = "templater-interpolation-tag";
            TP_EXEC_TAG_TOKEN_CLASS = "templater-execution-tag";
            Editor = class Editor {
                constructor(plugin) {
                    this.plugin = plugin;
                    this.cursor_jumper = new CursorJumper_1.CursorJumper(plugin.app);
                    this.activeEditorExtensions = [];
                }
                desktopShouldHighlight() {
                    return (obsidian_13.Platform.isDesktopApp && this.plugin.settings.syntax_highlighting);
                }
                mobileShouldHighlight() {
                    return (obsidian_13.Platform.isMobile && this.plugin.settings.syntax_highlighting_mobile);
                }
                setup() {
                    return tslib_23.__awaiter(this, void 0, void 0, function* () {
                        this.autocomplete = new Autocomplete_1.Autocomplete(this.plugin);
                        this.plugin.registerEditorSuggest(this.autocomplete);
                        // We define our overlay as a stand-alone extension and keep a reference
                        // to it around. This lets us dynamically turn it on and off as needed.
                        yield this.registerCodeMirrorMode();
                        this.templaterLanguage = state_1.Prec.high(language_1.StreamLanguage.define(window.CodeMirror.getMode({}, TEMPLATER_MODE_NAME)));
                        if (this.templaterLanguage === undefined) {
                            Log_4.log_error(new Error_12.TemplaterError("Unable to enable syntax highlighting. Could not define language."));
                        }
                        // Dynamic reconfiguration is now done by passing an array. If we modify
                        // that array and then call `Workspace.updateOptions` the new extension
                        // will be picked up.
                        this.plugin.registerEditorExtension(this.activeEditorExtensions);
                        // Selectively enable syntax highlighting via per-platform preferences.
                        if (this.desktopShouldHighlight() || this.mobileShouldHighlight()) {
                            yield this.enable_highlighter();
                        }
                    });
                }
                enable_highlighter() {
                    return tslib_23.__awaiter(this, void 0, void 0, function* () {
                        // Make sure it is idempotent
                        if (this.activeEditorExtensions.length === 0 &&
                            this.templaterLanguage) {
                            // There should only ever be this one extension if the array is not
                            // empty.
                            this.activeEditorExtensions.push(this.templaterLanguage);
                            // This is expensive
                            this.plugin.app.workspace.updateOptions();
                        }
                    });
                }
                disable_highlighter() {
                    return tslib_23.__awaiter(this, void 0, void 0, function* () {
                        // Make sure that it is idempotent.
                        if (this.activeEditorExtensions.length > 0) {
                            // There should only ever be one extension if the array is not empty.
                            this.activeEditorExtensions.pop();
                            // This is expensive
                            this.plugin.app.workspace.updateOptions();
                        }
                    });
                }
                jump_to_next_cursor_location(file = null, auto_jump = false) {
                    return tslib_23.__awaiter(this, void 0, void 0, function* () {
                        if (auto_jump && !this.plugin.settings.auto_jump_to_cursor) {
                            return;
                        }
                        if (file && Utils_7.get_active_file(this.plugin.app) !== file) {
                            return;
                        }
                        yield this.cursor_jumper.jump_to_next_cursor_location();
                    });
                }
                registerCodeMirrorMode() {
                    return tslib_23.__awaiter(this, void 0, void 0, function* () {
                        // cm-editor-syntax-highlight-obsidian plugin
                        // https://codemirror.net/doc/manual.html#modeapi
                        // https://codemirror.net/mode/diff/diff.js
                        // https://codemirror.net/demo/mustache.html
                        // https://marijnhaverbeke.nl/blog/codemirror-mode-system.html
                        // If no configuration requests highlighting we should bail.
                        if (!this.desktopShouldHighlight() && !this.mobileShouldHighlight()) {
                            return;
                        }
                        const js_mode = window.CodeMirror.getMode({}, "javascript");
                        if (js_mode.name === "null") {
                            Log_4.log_error(new Error_12.TemplaterError("Javascript syntax mode couldn't be found, can't enable syntax highlighting."));
                            return;
                        }
                        // Custom overlay mode used to handle edge cases
                        // @ts-ignore
                        const overlay_mode = window.CodeMirror.customOverlayMode;
                        if (overlay_mode == null) {
                            Log_4.log_error(new Error_12.TemplaterError("Couldn't find customOverlayMode, can't enable syntax highlighting."));
                            return;
                        }
                        window.CodeMirror.defineMode(TEMPLATER_MODE_NAME, function (config) {
                            const templaterOverlay = {
                                startState: function () {
                                    const js_state = window.CodeMirror.startState(js_mode);
                                    return Object.assign(Object.assign({}, js_state), { inCommand: false, tag_class: "", freeLine: false });
                                },
                                copyState: function (state) {
                                    const js_state = window.CodeMirror.startState(js_mode);
                                    const new_state = Object.assign(Object.assign({}, js_state), { inCommand: state.inCommand, tag_class: state.tag_class, freeLine: state.freeLine });
                                    return new_state;
                                },
                                blankLine: function (state) {
                                    if (state.inCommand) {
                                        return `line-background-templater-command-bg`;
                                    }
                                    return null;
                                },
                                token: function (stream, state) {
                                    if (stream.sol() && state.inCommand) {
                                        state.freeLine = true;
                                    }
                                    if (state.inCommand) {
                                        let keywords = "";
                                        if (stream.match(/[-_]{0,1}%>/, true)) {
                                            state.inCommand = false;
                                            state.freeLine = false;
                                            const tag_class = state.tag_class;
                                            state.tag_class = "";
                                            return `line-${TP_INLINE_CLASS} ${TP_CMD_TOKEN_CLASS} ${TP_CLOSING_TAG_TOKEN_CLASS} ${tag_class}`;
                                        }
                                        const js_result = js_mode.token && js_mode.token(stream, state);
                                        if (stream.peek() == null && state.freeLine) {
                                            keywords += ` line-background-templater-command-bg`;
                                        }
                                        if (!state.freeLine) {
                                            keywords += ` line-${TP_INLINE_CLASS}`;
                                        }
                                        return `${keywords} ${TP_CMD_TOKEN_CLASS} ${js_result}`;
                                    }
                                    const match = stream.match(/<%[-_]{0,1}\s*([*+]{0,1})/, true);
                                    if (match != null) {
                                        switch (match[1]) {
                                            case "*":
                                                state.tag_class = TP_EXEC_TAG_TOKEN_CLASS;
                                                break;
                                            default:
                                                state.tag_class =
                                                    TP_INTERPOLATION_TAG_TOKEN_CLASS;
                                                break;
                                        }
                                        state.inCommand = true;
                                        return `line-${TP_INLINE_CLASS} ${TP_CMD_TOKEN_CLASS} ${TP_OPENING_TAG_TOKEN_CLASS} ${state.tag_class}`;
                                    }
                                    while (stream.next() != null && !stream.match(/<%/, false))
                                        ;
                                    return null;
                                },
                            };
                            return overlay_mode(window.CodeMirror.getMode(config, "hypermd"), templaterOverlay);
                        });
                    });
                }
                updateEditorIntellisenseSetting(value) {
                    this.autocomplete.updateAutocompleteIntellisenseSetting(value);
                }
            };
            exports_28("Editor", Editor);
        }
    };
});
System.register("src/handlers/CommandHandler", ["obsidian", "src/utils/Error", "src/utils/Utils"], function (exports_29, context_29) {
    "use strict";
    var obsidian_14, Error_13, Utils_8, CommandHandler;
    var __moduleName = context_29 && context_29.id;
    return {
        setters: [
            function (obsidian_14_1) {
                obsidian_14 = obsidian_14_1;
            },
            function (Error_13_1) {
                Error_13 = Error_13_1;
            },
            function (Utils_8_1) {
                Utils_8 = Utils_8_1;
            }
        ],
        execute: function () {
            CommandHandler = class CommandHandler {
                constructor(plugin) {
                    this.plugin = plugin;
                }
                setup() {
                    this.plugin.addCommand({
                        id: "insert-templater",
                        name: "Open insert template modal",
                        icon: "templater-icon",
                        hotkeys: obsidian_14.Platform.isMacOS
                            ? undefined
                            : [
                                {
                                    modifiers: ["Alt"],
                                    key: "e",
                                },
                            ],
                        callback: () => {
                            this.plugin.fuzzy_suggester.insert_template();
                        },
                    });
                    this.plugin.addCommand({
                        id: "replace-in-file-templater",
                        name: "Replace templates in the active file",
                        icon: "templater-icon",
                        hotkeys: obsidian_14.Platform.isMacOS
                            ? undefined
                            : [
                                {
                                    modifiers: ["Alt"],
                                    key: "r",
                                },
                            ],
                        callback: () => {
                            this.plugin.templater.overwrite_active_file_commands();
                        },
                    });
                    this.plugin.addCommand({
                        id: "jump-to-next-cursor-location",
                        name: "Jump to next cursor location",
                        icon: "text-cursor",
                        hotkeys: [
                            {
                                modifiers: ["Alt"],
                                key: "Tab",
                            },
                        ],
                        callback: () => {
                            this.plugin.editor_handler.jump_to_next_cursor_location();
                        },
                    });
                    this.plugin.addCommand({
                        id: "create-new-note-from-template",
                        name: "Create new note from template",
                        icon: "templater-icon",
                        hotkeys: obsidian_14.Platform.isMacOS
                            ? undefined
                            : [
                                {
                                    modifiers: ["Alt"],
                                    key: "n",
                                },
                            ],
                        callback: () => {
                            this.plugin.fuzzy_suggester.create_new_note_from_template();
                        },
                    });
                    this.register_templates_hotkeys();
                }
                register_templates_hotkeys() {
                    this.plugin.settings.enabled_templates_hotkeys.forEach((template) => {
                        if (template) {
                            this.add_template_hotkey(null, template);
                        }
                    });
                }
                add_template_hotkey(old_template, new_template) {
                    this.remove_template_hotkey(old_template);
                    if (new_template) {
                        this.plugin.addCommand({
                            id: new_template,
                            name: `Insert ${new_template}`,
                            icon: "templater-icon",
                            callback: () => {
                                const template = Error_13.errorWrapperSync(() => Utils_8.resolve_tfile(this.plugin.app, new_template), `Couldn't find the template file associated with this hotkey`);
                                if (!template) {
                                    return;
                                }
                                this.plugin.templater.append_template_to_active_file(template);
                            },
                        });
                        this.plugin.addCommand({
                            id: `create-${new_template}`,
                            name: `Create ${new_template}`,
                            icon: "templater-icon",
                            callback: () => {
                                const template = Error_13.errorWrapperSync(() => Utils_8.resolve_tfile(this.plugin.app, new_template), `Couldn't find the template file associated with this hotkey`);
                                if (!template) {
                                    return;
                                }
                                this.plugin.templater.create_new_note_from_template(template);
                            },
                        });
                    }
                }
                remove_template_hotkey(template) {
                    if (template) {
                        this.plugin.removeCommand(`${template}`);
                        this.plugin.removeCommand(`create-${template}`);
                    }
                }
            };
            exports_29("CommandHandler", CommandHandler);
        }
    };
});
// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes
System.register("src/settings/suggesters/suggest", ["obsidian", "@popperjs/core"], function (exports_30, context_30) {
    "use strict";
    var obsidian_15, core_1, wrapAround, Suggest, TextInputSuggest;
    var __moduleName = context_30 && context_30.id;
    return {
        setters: [
            function (obsidian_15_1) {
                obsidian_15 = obsidian_15_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            }
        ],
        execute: function () {// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes
            wrapAround = (value, size) => {
                return ((value % size) + size) % size;
            };
            Suggest = class Suggest {
                constructor(owner, containerEl, scope) {
                    this.owner = owner;
                    this.containerEl = containerEl;
                    containerEl.on("click", ".suggestion-item", this.onSuggestionClick.bind(this));
                    containerEl.on("mousemove", ".suggestion-item", this.onSuggestionMouseover.bind(this));
                    scope.register([], "ArrowUp", (event) => {
                        if (!event.isComposing) {
                            this.setSelectedItem(this.selectedItem - 1, true);
                            return false;
                        }
                    });
                    scope.register([], "ArrowDown", (event) => {
                        if (!event.isComposing) {
                            this.setSelectedItem(this.selectedItem + 1, true);
                            return false;
                        }
                    });
                    scope.register([], "Enter", (event) => {
                        if (!event.isComposing) {
                            this.useSelectedItem(event);
                            return false;
                        }
                    });
                }
                onSuggestionClick(event, el) {
                    event.preventDefault();
                    const item = this.suggestions.indexOf(el);
                    this.setSelectedItem(item, false);
                    this.useSelectedItem(event);
                }
                onSuggestionMouseover(_event, el) {
                    const item = this.suggestions.indexOf(el);
                    this.setSelectedItem(item, false);
                }
                setSuggestions(values) {
                    this.containerEl.empty();
                    const suggestionEls = [];
                    values.forEach((value) => {
                        const suggestionEl = this.containerEl.createDiv("suggestion-item");
                        this.owner.renderSuggestion(value, suggestionEl);
                        suggestionEls.push(suggestionEl);
                    });
                    this.values = values;
                    this.suggestions = suggestionEls;
                    this.setSelectedItem(0, false);
                }
                useSelectedItem(event) {
                    const currentValue = this.values[this.selectedItem];
                    if (currentValue) {
                        this.owner.selectSuggestion(currentValue, event);
                    }
                }
                setSelectedItem(selectedIndex, scrollIntoView) {
                    const normalizedIndex = wrapAround(selectedIndex, this.suggestions.length);
                    const prevSelectedSuggestion = this.suggestions[this.selectedItem];
                    const selectedSuggestion = this.suggestions[normalizedIndex];
                    prevSelectedSuggestion === null || prevSelectedSuggestion === void 0 ? void 0 : prevSelectedSuggestion.removeClass("is-selected");
                    selectedSuggestion === null || selectedSuggestion === void 0 ? void 0 : selectedSuggestion.addClass("is-selected");
                    this.selectedItem = normalizedIndex;
                    if (scrollIntoView) {
                        selectedSuggestion.scrollIntoView(false);
                    }
                }
            };
            TextInputSuggest = class TextInputSuggest {
                constructor(app, inputEl) {
                    this.app = app;
                    this.inputEl = inputEl;
                    this.scope = new obsidian_15.Scope();
                    this.suggestEl = createDiv("suggestion-container");
                    const suggestion = this.suggestEl.createDiv("suggestion");
                    this.suggest = new Suggest(this, suggestion, this.scope);
                    this.scope.register([], "Escape", this.close.bind(this));
                    this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
                    this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
                    this.inputEl.addEventListener("blur", this.close.bind(this));
                    this.suggestEl.on("mousedown", ".suggestion-container", (event) => {
                        event.preventDefault();
                    });
                }
                onInputChanged() {
                    const inputStr = this.inputEl.value;
                    const suggestions = this.getSuggestions(inputStr);
                    if (!suggestions) {
                        this.close();
                        return;
                    }
                    if (suggestions.length > 0) {
                        this.suggest.setSuggestions(suggestions);
                        this.open(this.app.dom.appContainerEl, this.inputEl);
                    }
                    else {
                        this.close();
                    }
                }
                open(container, inputEl) {
                    this.app.keymap.pushScope(this.scope);
                    container.appendChild(this.suggestEl);
                    this.popper = core_1.createPopper(inputEl, this.suggestEl, {
                        placement: "bottom-start",
                        modifiers: [
                            {
                                name: "sameWidth",
                                enabled: true,
                                fn: ({ state, instance }) => {
                                    // Note: positioning needs to be calculated twice -
                                    // first pass - positioning it according to the width of the popper
                                    // second pass - position it with the width bound to the reference element
                                    // we need to early exit to avoid an infinite loop
                                    const targetWidth = `${state.rects.reference.width}px`;
                                    if (state.styles.popper.width === targetWidth) {
                                        return;
                                    }
                                    state.styles.popper.width = targetWidth;
                                    instance.update();
                                },
                                phase: "beforeWrite",
                                requires: ["computeStyles"],
                            },
                        ],
                    });
                }
                close() {
                    this.app.keymap.popScope(this.scope);
                    this.suggest.setSuggestions([]);
                    if (this.popper)
                        this.popper.destroy();
                    this.suggestEl.detach();
                }
            };
            exports_30("TextInputSuggest", TextInputSuggest);
        }
    };
});
// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes
System.register("src/settings/suggesters/FileSuggester", ["obsidian", "src/settings/suggesters/suggest", "src/utils/Utils", "src/utils/Error"], function (exports_31, context_31) {
    "use strict";
    var obsidian_16, suggest_1, Utils_9, Error_14, FileSuggestMode, FileSuggest;
    var __moduleName = context_31 && context_31.id;
    return {
        setters: [
            function (obsidian_16_1) {
                obsidian_16 = obsidian_16_1;
            },
            function (suggest_1_1) {
                suggest_1 = suggest_1_1;
            },
            function (Utils_9_1) {
                Utils_9 = Utils_9_1;
            },
            function (Error_14_1) {
                Error_14 = Error_14_1;
            }
        ],
        execute: function () {// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes
            (function (FileSuggestMode) {
                FileSuggestMode[FileSuggestMode["TemplateFiles"] = 0] = "TemplateFiles";
                FileSuggestMode[FileSuggestMode["ScriptFiles"] = 1] = "ScriptFiles";
            })(FileSuggestMode || (FileSuggestMode = {}));
            exports_31("FileSuggestMode", FileSuggestMode);
            FileSuggest = class FileSuggest extends suggest_1.TextInputSuggest {
                constructor(inputEl, plugin, mode) {
                    super(plugin.app, inputEl);
                    this.inputEl = inputEl;
                    this.plugin = plugin;
                    this.mode = mode;
                }
                get_folder(mode) {
                    switch (mode) {
                        case FileSuggestMode.TemplateFiles:
                            return this.plugin.settings.templates_folder;
                        case FileSuggestMode.ScriptFiles:
                            return this.plugin.settings.user_scripts_folder;
                    }
                }
                get_error_msg(mode) {
                    switch (mode) {
                        case FileSuggestMode.TemplateFiles:
                            return `Templates folder doesn't exist`;
                        case FileSuggestMode.ScriptFiles:
                            return `User Scripts folder doesn't exist`;
                    }
                }
                getSuggestions(input_str) {
                    const all_files = Error_14.errorWrapperSync(() => Utils_9.get_tfiles_from_folder(this.plugin.app, this.get_folder(this.mode)), this.get_error_msg(this.mode));
                    if (!all_files) {
                        return [];
                    }
                    const files = [];
                    const lower_input_str = input_str.toLowerCase();
                    all_files.forEach((file) => {
                        if (file instanceof obsidian_16.TFile &&
                            file.extension === "md" &&
                            file.path.toLowerCase().contains(lower_input_str)) {
                            files.push(file);
                        }
                    });
                    return files.slice(0, 1000);
                }
                renderSuggestion(file, el) {
                    el.setText(file.path);
                }
                selectSuggestion(file) {
                    this.inputEl.value = file.path;
                    this.inputEl.trigger("input");
                    this.close();
                }
            };
            exports_31("FileSuggest", FileSuggest);
        }
    };
});
// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes
System.register("src/settings/suggesters/FolderSuggester", ["obsidian", "src/settings/suggesters/suggest"], function (exports_32, context_32) {
    "use strict";
    var obsidian_17, suggest_2, FolderSuggest;
    var __moduleName = context_32 && context_32.id;
    return {
        setters: [
            function (obsidian_17_1) {
                obsidian_17 = obsidian_17_1;
            },
            function (suggest_2_1) {
                suggest_2 = suggest_2_1;
            }
        ],
        execute: function () {// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes
            FolderSuggest = class FolderSuggest extends suggest_2.TextInputSuggest {
                constructor(app, inputEl) {
                    super(app, inputEl);
                }
                getSuggestions(inputStr) {
                    const abstractFiles = this.app.vault.getAllLoadedFiles();
                    const folders = [];
                    const lowerCaseInputStr = inputStr.toLowerCase();
                    abstractFiles.forEach((folder) => {
                        if (folder instanceof obsidian_17.TFolder &&
                            folder.path.toLowerCase().contains(lowerCaseInputStr)) {
                            folders.push(folder);
                        }
                    });
                    return folders.slice(0, 1000);
                }
                renderSuggestion(file, el) {
                    el.setText(file.path);
                }
                selectSuggestion(file) {
                    this.inputEl.value = file.path;
                    this.inputEl.trigger("input");
                    this.close();
                }
            };
            exports_32("FolderSuggest", FolderSuggest);
        }
    };
});
System.register("src/settings/Settings", ["obsidian", "src/utils/Error", "src/utils/Log", "src/utils/Utils", "src/settings/suggesters/FileSuggester", "src/settings/suggesters/FolderSuggester", "src/settings/RenderSettings/IntellisenseRenderOption"], function (exports_33, context_33) {
    "use strict";
    var obsidian_18, Error_15, Log_5, Utils_10, FileSuggester_1, FolderSuggester_1, IntellisenseRenderOption_2, DEFAULT_SETTINGS, TemplaterSettingTab;
    var __moduleName = context_33 && context_33.id;
    return {
        setters: [
            function (obsidian_18_1) {
                obsidian_18 = obsidian_18_1;
            },
            function (Error_15_1) {
                Error_15 = Error_15_1;
            },
            function (Log_5_1) {
                Log_5 = Log_5_1;
            },
            function (Utils_10_1) {
                Utils_10 = Utils_10_1;
            },
            function (FileSuggester_1_1) {
                FileSuggester_1 = FileSuggester_1_1;
            },
            function (FolderSuggester_1_1) {
                FolderSuggester_1 = FolderSuggester_1_1;
            },
            function (IntellisenseRenderOption_2_1) {
                IntellisenseRenderOption_2 = IntellisenseRenderOption_2_1;
            }
        ],
        execute: function () {
            exports_33("DEFAULT_SETTINGS", DEFAULT_SETTINGS = {
                command_timeout: 5,
                templates_folder: "",
                templates_pairs: [["", ""]],
                trigger_on_file_creation: false,
                auto_jump_to_cursor: false,
                enable_system_commands: false,
                shell_path: "",
                user_scripts_folder: "",
                enable_folder_templates: true,
                folder_templates: [{ folder: "", template: "" }],
                enable_file_templates: false,
                file_templates: [{ regex: ".*", template: "" }],
                syntax_highlighting: true,
                syntax_highlighting_mobile: false,
                enabled_templates_hotkeys: [""],
                startup_templates: [""],
                intellisense_render: IntellisenseRenderOption_2.IntellisenseRenderOption.RenderDescriptionParameterReturn
            });
            TemplaterSettingTab = class TemplaterSettingTab extends obsidian_18.PluginSettingTab {
                constructor(plugin) {
                    super(plugin.app, plugin);
                    this.plugin = plugin;
                }
                display() {
                    this.containerEl.empty();
                    this.add_template_folder_setting();
                    this.add_internal_functions_setting();
                    this.add_syntax_highlighting_settings();
                    this.add_auto_jump_to_cursor();
                    this.add_trigger_on_new_file_creation_setting();
                    if (this.plugin.settings.trigger_on_file_creation) {
                        this.add_folder_templates_setting();
                        this.add_file_templates_setting();
                    }
                    this.add_templates_hotkeys_setting();
                    this.add_startup_templates_setting();
                    this.add_user_script_functions_setting();
                    this.add_user_system_command_functions_setting();
                    this.add_donating_setting();
                }
                add_template_folder_setting() {
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Template folder location")
                        .setDesc("Files in this folder will be available as templates.")
                        .addSearch((cb) => {
                        new FolderSuggester_1.FolderSuggest(this.app, cb.inputEl);
                        cb.setPlaceholder("Example: folder1/folder2")
                            .setValue(this.plugin.settings.templates_folder)
                            .onChange((new_folder) => {
                            // Trim folder and Strip ending slash if there
                            new_folder = new_folder.trim();
                            new_folder = new_folder.replace(/\/$/, "");
                            this.plugin.settings.templates_folder = new_folder;
                            this.plugin.save_settings();
                        });
                        // @ts-ignore
                        cb.containerEl.addClass("templater_search");
                    });
                }
                add_internal_functions_setting() {
                    const desc = document.createDocumentFragment();
                    desc.append("Templater provides multiples predefined variables / functions that you can use.", desc.createEl("br"), "Check the ", desc.createEl("a", {
                        href: "https://silentvoid13.github.io/Templater/",
                        text: "documentation",
                    }), " to get a list of all the available internal variables / functions.");
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Internal variables and functions")
                        .setDesc(desc);
                }
                add_syntax_highlighting_settings() {
                    const desktopDesc = document.createDocumentFragment();
                    desktopDesc.append("Adds syntax highlighting for Templater commands in edit mode.");
                    const mobileDesc = document.createDocumentFragment();
                    mobileDesc.append("Adds syntax highlighting for Templater commands in edit mode on " +
                        "mobile. Use with caution: this may break live preview on mobile " +
                        "platforms.");
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Syntax highlighting on desktop")
                        .setDesc(desktopDesc)
                        .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.syntax_highlighting)
                            .onChange((syntax_highlighting) => {
                            this.plugin.settings.syntax_highlighting =
                                syntax_highlighting;
                            this.plugin.save_settings();
                            this.plugin.event_handler.update_syntax_highlighting();
                        });
                    });
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Syntax highlighting on mobile")
                        .setDesc(mobileDesc)
                        .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.syntax_highlighting_mobile)
                            .onChange((syntax_highlighting_mobile) => {
                            this.plugin.settings.syntax_highlighting_mobile =
                                syntax_highlighting_mobile;
                            this.plugin.save_settings();
                            this.plugin.event_handler.update_syntax_highlighting();
                        });
                    });
                }
                add_auto_jump_to_cursor() {
                    const desc = document.createDocumentFragment();
                    desc.append("Automatically triggers ", desc.createEl("code", { text: "tp.file.cursor" }), " after inserting a template.", desc.createEl("br"), "You can also set a hotkey to manually trigger ", desc.createEl("code", { text: "tp.file.cursor" }), ".");
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Automatic jump to cursor")
                        .setDesc(desc)
                        .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.auto_jump_to_cursor)
                            .onChange((auto_jump_to_cursor) => {
                            this.plugin.settings.auto_jump_to_cursor =
                                auto_jump_to_cursor;
                            this.plugin.save_settings();
                        });
                    });
                }
                add_trigger_on_new_file_creation_setting() {
                    const desc = document.createDocumentFragment();
                    desc.append("Templater will listen for the new file creation event, and, if it matches a rule you've set, replace every command it finds in the new file's content. ", "This makes Templater compatible with other plugins like the Daily note core plugin, Calendar plugin, Review plugin, Note refactor plugin, etc. ", desc.createEl("br"), desc.createEl("br"), "Make sure to set up rules under either folder templates or file regex template below.", desc.createEl("br"), desc.createEl("br"), desc.createEl("b", {
                        text: "Warning: ",
                    }), "This can be dangerous if you create new files with unknown / unsafe content on creation. Make sure that every new file's content is safe on creation.");
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Trigger Templater on new file creation")
                        .setDesc(desc)
                        .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.trigger_on_file_creation)
                            .onChange((trigger_on_file_creation) => {
                            this.plugin.settings.trigger_on_file_creation =
                                trigger_on_file_creation;
                            this.plugin.save_settings();
                            this.plugin.event_handler.update_trigger_file_on_creation();
                            // Force refresh
                            this.display();
                        });
                    });
                }
                add_templates_hotkeys_setting() {
                    new obsidian_18.Setting(this.containerEl).setName("Template hotkeys").setHeading();
                    const desc = document.createDocumentFragment();
                    desc.append("Template hotkeys allows you to bind a template to a hotkey.");
                    new obsidian_18.Setting(this.containerEl).setDesc(desc);
                    this.plugin.settings.enabled_templates_hotkeys.forEach((template, index) => {
                        const s = new obsidian_18.Setting(this.containerEl)
                            .addSearch((cb) => {
                            new FileSuggester_1.FileSuggest(cb.inputEl, this.plugin, FileSuggester_1.FileSuggestMode.TemplateFiles);
                            cb.setPlaceholder("Example: folder1/template_file")
                                .setValue(template)
                                .onChange((new_template) => {
                                if (new_template &&
                                    this.plugin.settings.enabled_templates_hotkeys.contains(new_template)) {
                                    Log_5.log_error(new Error_15.TemplaterError("This template is already bound to a hotkey"));
                                    return;
                                }
                                this.plugin.command_handler.add_template_hotkey(this.plugin.settings
                                    .enabled_templates_hotkeys[index], new_template);
                                this.plugin.settings.enabled_templates_hotkeys[index] = new_template;
                                this.plugin.save_settings();
                            });
                            // @ts-ignore
                            cb.containerEl.addClass("templater_search");
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("any-key")
                                .setTooltip("Configure Hotkey")
                                .onClick(() => {
                                // TODO: Replace with future "official" way to do this
                                // @ts-ignore
                                this.app.setting.openTabById("hotkeys");
                                // @ts-ignore
                                const tab = this.app.setting.activeTab;
                                tab.searchComponent.inputEl.value = template;
                                tab.updateHotkeyVisibility();
                            });
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("up-chevron-glyph")
                                .setTooltip("Move up")
                                .onClick(() => {
                                Utils_10.arraymove(this.plugin.settings
                                    .enabled_templates_hotkeys, index, index - 1);
                                this.plugin.save_settings();
                                this.display();
                            });
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("down-chevron-glyph")
                                .setTooltip("Move down")
                                .onClick(() => {
                                Utils_10.arraymove(this.plugin.settings
                                    .enabled_templates_hotkeys, index, index + 1);
                                this.plugin.save_settings();
                                this.display();
                            });
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("cross")
                                .setTooltip("Delete")
                                .onClick(() => {
                                this.plugin.command_handler.remove_template_hotkey(this.plugin.settings
                                    .enabled_templates_hotkeys[index]);
                                this.plugin.settings.enabled_templates_hotkeys.splice(index, 1);
                                this.plugin.save_settings();
                                // Force refresh
                                this.display();
                            });
                        });
                        s.infoEl.remove();
                    });
                    new obsidian_18.Setting(this.containerEl).addButton((cb) => {
                        cb.setButtonText("Add new hotkey for template")
                            .setCta()
                            .onClick(() => {
                            this.plugin.settings.enabled_templates_hotkeys.push("");
                            this.plugin.save_settings();
                            // Force refresh
                            this.display();
                        });
                    });
                }
                add_folder_templates_setting() {
                    new obsidian_18.Setting(this.containerEl).setName("Folder templates").setHeading();
                    const descHeading = document.createDocumentFragment();
                    descHeading.append("Folder templates are triggered when a new ", descHeading.createEl("strong", { text: "empty " }), "file is created in a given folder.", descHeading.createEl("br"), "Templater will fill the empty file with the specified template.", descHeading.createEl("br"), "The deepest match is used. A global default template would be defined on the root ", descHeading.createEl("code", { text: "/" }), ".");
                    new obsidian_18.Setting(this.containerEl).setDesc(descHeading);
                    const descUseNewFileTemplate = document.createDocumentFragment();
                    descUseNewFileTemplate.append("When enabled, Templater will make use of the folder templates defined below. This option is mutually exclusive with file regex templates below, so enabling one will disable the other.");
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Enable folder templates")
                        .setDesc(descUseNewFileTemplate)
                        .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.enable_folder_templates)
                            .onChange((use_new_folder_templates) => {
                            this.plugin.settings.enable_folder_templates =
                                use_new_folder_templates;
                            if (use_new_folder_templates) {
                                this.plugin.settings.enable_file_templates = false;
                            }
                            this.plugin.save_settings();
                            // Force refresh
                            this.display();
                        });
                    });
                    if (!this.plugin.settings.enable_folder_templates) {
                        return;
                    }
                    this.plugin.settings.folder_templates.forEach((folder_template, index) => {
                        const s = new obsidian_18.Setting(this.containerEl)
                            .addSearch((cb) => {
                            new FolderSuggester_1.FolderSuggest(this.app, cb.inputEl);
                            cb.setPlaceholder("Folder")
                                .setValue(folder_template.folder)
                                .onChange((new_folder) => {
                                if (new_folder &&
                                    this.plugin.settings.folder_templates.some((e) => e.folder == new_folder)) {
                                    Log_5.log_error(new Error_15.TemplaterError("This folder already has a template associated with it"));
                                    return;
                                }
                                this.plugin.settings.folder_templates[index].folder = new_folder;
                                this.plugin.save_settings();
                            });
                            // @ts-ignore
                            cb.containerEl.addClass("templater_search");
                        })
                            .addSearch((cb) => {
                            new FileSuggester_1.FileSuggest(cb.inputEl, this.plugin, FileSuggester_1.FileSuggestMode.TemplateFiles);
                            cb.setPlaceholder("Template")
                                .setValue(folder_template.template)
                                .onChange((new_template) => {
                                this.plugin.settings.folder_templates[index].template = new_template;
                                this.plugin.save_settings();
                            });
                            // @ts-ignore
                            cb.containerEl.addClass("templater_search");
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("up-chevron-glyph")
                                .setTooltip("Move up")
                                .onClick(() => {
                                Utils_10.arraymove(this.plugin.settings.folder_templates, index, index - 1);
                                this.plugin.save_settings();
                                this.display();
                            });
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("down-chevron-glyph")
                                .setTooltip("Move down")
                                .onClick(() => {
                                Utils_10.arraymove(this.plugin.settings.folder_templates, index, index + 1);
                                this.plugin.save_settings();
                                this.display();
                            });
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("cross")
                                .setTooltip("Delete")
                                .onClick(() => {
                                this.plugin.settings.folder_templates.splice(index, 1);
                                this.plugin.save_settings();
                                this.display();
                            });
                        });
                        s.infoEl.remove();
                    });
                    new obsidian_18.Setting(this.containerEl).addButton((button) => {
                        button
                            .setButtonText("Add new folder template")
                            .setTooltip("Add additional folder template")
                            .setCta()
                            .onClick(() => {
                            this.plugin.settings.folder_templates.push({
                                folder: "",
                                template: "",
                            });
                            this.plugin.save_settings();
                            this.display();
                        });
                    });
                }
                add_file_templates_setting() {
                    new obsidian_18.Setting(this.containerEl)
                        .setName("File regex templates")
                        .setHeading();
                    const descHeading = document.createDocumentFragment();
                    descHeading.append("File regex templates are triggered when a new ", descHeading.createEl("strong", { text: "empty" }), " file is created that matches one of them. Templater will fill the empty file with the specified template.", descHeading.createEl("br"), "The first match from the top is used, so the order of the rules is important.", descHeading.createEl("br"), "Use ", descHeading.createEl("code", { text: ".*" }), " as a final catch-all, if you need it.");
                    new obsidian_18.Setting(this.containerEl).setDesc(descHeading);
                    const descUseNewFileTemplate = document.createDocumentFragment();
                    descUseNewFileTemplate.append("When enabled, Templater will make use of the file regex templates defined below. This option is mutually exclusive with folder templates above, so enabling one will disable the other.");
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Enable file regex templates")
                        .setDesc(descUseNewFileTemplate)
                        .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.enable_file_templates)
                            .onChange((use_new_file_templates) => {
                            this.plugin.settings.enable_file_templates =
                                use_new_file_templates;
                            if (use_new_file_templates) {
                                this.plugin.settings.enable_folder_templates =
                                    false;
                            }
                            this.plugin.save_settings();
                            // Force refresh
                            this.display();
                        });
                    });
                    if (!this.plugin.settings.enable_file_templates) {
                        return;
                    }
                    this.plugin.settings.file_templates.forEach((file_template, index) => {
                        const s = new obsidian_18.Setting(this.containerEl)
                            .addText((cb) => {
                            cb.setPlaceholder("File regex")
                                .setValue(file_template.regex)
                                .onChange((new_regex) => {
                                this.plugin.settings.file_templates[index].regex =
                                    new_regex;
                                this.plugin.save_settings();
                            });
                            // @ts-ignore
                            cb.inputEl.addClass("templater_search");
                        })
                            .addSearch((cb) => {
                            new FileSuggester_1.FileSuggest(cb.inputEl, this.plugin, FileSuggester_1.FileSuggestMode.TemplateFiles);
                            cb.setPlaceholder("Template")
                                .setValue(file_template.template)
                                .onChange((new_template) => {
                                this.plugin.settings.file_templates[index].template = new_template;
                                this.plugin.save_settings();
                            });
                            // @ts-ignore
                            cb.containerEl.addClass("templater_search");
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("up-chevron-glyph")
                                .setTooltip("Move up")
                                .onClick(() => {
                                Utils_10.arraymove(this.plugin.settings.file_templates, index, index - 1);
                                this.plugin.save_settings();
                                this.display();
                            });
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("down-chevron-glyph")
                                .setTooltip("Move down")
                                .onClick(() => {
                                Utils_10.arraymove(this.plugin.settings.file_templates, index, index + 1);
                                this.plugin.save_settings();
                                this.display();
                            });
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("cross")
                                .setTooltip("Delete")
                                .onClick(() => {
                                this.plugin.settings.file_templates.splice(index, 1);
                                this.plugin.save_settings();
                                this.display();
                            });
                        });
                        s.infoEl.remove();
                    });
                    new obsidian_18.Setting(this.containerEl).addButton((button) => {
                        button
                            .setButtonText("Add new file regex")
                            .setTooltip("Add additional file regex")
                            .setCta()
                            .onClick(() => {
                            this.plugin.settings.file_templates.push({
                                regex: "",
                                template: "",
                            });
                            this.plugin.save_settings();
                            this.display();
                        });
                    });
                }
                add_startup_templates_setting() {
                    new obsidian_18.Setting(this.containerEl).setName("Startup templates").setHeading();
                    const desc = document.createDocumentFragment();
                    desc.append("Startup templates are templates that will get executed once when Templater starts.", desc.createEl("br"), "These templates won't output anything.", desc.createEl("br"), "This can be useful to set up templates adding hooks to Obsidian events for example.");
                    new obsidian_18.Setting(this.containerEl).setDesc(desc);
                    this.plugin.settings.startup_templates.forEach((template, index) => {
                        const s = new obsidian_18.Setting(this.containerEl)
                            .addSearch((cb) => {
                            new FileSuggester_1.FileSuggest(cb.inputEl, this.plugin, FileSuggester_1.FileSuggestMode.TemplateFiles);
                            cb.setPlaceholder("Example: folder1/template_file")
                                .setValue(template)
                                .onChange((new_template) => {
                                if (new_template &&
                                    this.plugin.settings.startup_templates.contains(new_template)) {
                                    Log_5.log_error(new Error_15.TemplaterError("This startup template already exist"));
                                    return;
                                }
                                this.plugin.settings.startup_templates[index] =
                                    new_template;
                                this.plugin.save_settings();
                            });
                            // @ts-ignore
                            cb.containerEl.addClass("templater_search");
                        })
                            .addExtraButton((cb) => {
                            cb.setIcon("cross")
                                .setTooltip("Delete")
                                .onClick(() => {
                                this.plugin.settings.startup_templates.splice(index, 1);
                                this.plugin.save_settings();
                                // Force refresh
                                this.display();
                            });
                        });
                        s.infoEl.remove();
                    });
                    new obsidian_18.Setting(this.containerEl).addButton((cb) => {
                        cb.setButtonText("Add new startup template")
                            .setCta()
                            .onClick(() => {
                            this.plugin.settings.startup_templates.push("");
                            this.plugin.save_settings();
                            // Force refresh
                            this.display();
                        });
                    });
                }
                add_user_script_functions_setting() {
                    new obsidian_18.Setting(this.containerEl)
                        .setName("User script functions")
                        .setHeading();
                    let desc = document.createDocumentFragment();
                    desc.append("All JavaScript files in this folder will be loaded as CommonJS modules, to import custom user functions.", desc.createEl("br"), "The folder needs to be accessible from the vault.", desc.createEl("br"), "Check the ", desc.createEl("a", {
                        href: "https://silentvoid13.github.io/Templater/",
                        text: "documentation",
                    }), " for more information.");
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Script files folder location")
                        .setDesc(desc)
                        .addSearch((cb) => {
                        new FolderSuggester_1.FolderSuggest(this.app, cb.inputEl);
                        cb.setPlaceholder("Example: folder1/folder2")
                            .setValue(this.plugin.settings.user_scripts_folder)
                            .onChange((new_folder) => {
                            this.plugin.settings.user_scripts_folder = new_folder;
                            this.plugin.save_settings();
                        });
                        // @ts-ignore
                        cb.containerEl.addClass("templater_search");
                    });
                    new obsidian_18.Setting(this.containerEl)
                        .setName('User script intellisense')
                        .setDesc('Determine how you\'d like to have user script intellisense render. Note values will not render if not in the script.')
                        .addDropdown(cb => {
                        cb
                            .addOption("0", "Turn off intellisense")
                            .addOption("1", "Render method description, parameters list, and return")
                            .addOption("2", "Render method description and parameters list")
                            .addOption("3", "Render method description and return")
                            .addOption("4", "Render method description")
                            .setValue(this.plugin.settings.intellisense_render.toString())
                            .onChange((value) => {
                            this.plugin.settings.intellisense_render = parseInt(value);
                            this.plugin.save_settings();
                        });
                    });
                    desc = document.createDocumentFragment();
                    let name;
                    if (!this.plugin.settings.user_scripts_folder) {
                        name = "No user scripts folder set";
                    }
                    else {
                        const files = Error_15.errorWrapperSync(() => Utils_10.get_tfiles_from_folder(this.app, this.plugin.settings.user_scripts_folder), `User scripts folder doesn't exist`);
                        if (!files || files.length === 0) {
                            name = "No user scripts detected";
                        }
                        else {
                            let count = 0;
                            for (const file of files) {
                                if (file.extension === "js") {
                                    count++;
                                    desc.append(desc.createEl("li", {
                                        text: `tp.user.${file.basename}`,
                                    }));
                                }
                            }
                            name = `Detected ${count} User Script(s)`;
                        }
                    }
                    new obsidian_18.Setting(this.containerEl)
                        .setName(name)
                        .setDesc(desc)
                        .addExtraButton((extra) => {
                        extra
                            .setIcon("sync")
                            .setTooltip("Refresh")
                            .onClick(() => {
                            // Force refresh
                            this.display();
                        });
                    });
                }
                add_user_system_command_functions_setting() {
                    let desc = document.createDocumentFragment();
                    desc.append("Allows you to create user functions linked to system commands.", desc.createEl("br"), desc.createEl("b", {
                        text: "Warning: ",
                    }), "It can be dangerous to execute arbitrary system commands from untrusted sources. Only run system commands that you understand, from trusted sources.");
                    new obsidian_18.Setting(this.containerEl)
                        .setName("User system command functions")
                        .setHeading();
                    new obsidian_18.Setting(this.containerEl)
                        .setName("Enable user system command functions")
                        .setDesc(desc)
                        .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.enable_system_commands)
                            .onChange((enable_system_commands) => {
                            this.plugin.settings.enable_system_commands =
                                enable_system_commands;
                            this.plugin.save_settings();
                            // Force refresh
                            this.display();
                        });
                    });
                    if (this.plugin.settings.enable_system_commands) {
                        new obsidian_18.Setting(this.containerEl)
                            .setName("Timeout")
                            .setDesc("Maximum timeout in seconds for a system command.")
                            .addText((text) => {
                            text.setPlaceholder("Timeout")
                                .setValue(this.plugin.settings.command_timeout.toString())
                                .onChange((new_value) => {
                                const new_timeout = Number(new_value);
                                if (isNaN(new_timeout)) {
                                    Log_5.log_error(new Error_15.TemplaterError("Timeout must be a number"));
                                    return;
                                }
                                this.plugin.settings.command_timeout = new_timeout;
                                this.plugin.save_settings();
                            });
                        });
                        desc = document.createDocumentFragment();
                        desc.append("Full path to the shell binary to execute the command with.", desc.createEl("br"), "This setting is optional and will default to the system's default shell if not specified.", desc.createEl("br"), "You can use forward slashes ('/') as path separators on all platforms if in doubt.");
                        new obsidian_18.Setting(this.containerEl)
                            .setName("Shell binary location")
                            .setDesc(desc)
                            .addText((text) => {
                            text.setPlaceholder("Example: /bin/bash, ...")
                                .setValue(this.plugin.settings.shell_path)
                                .onChange((shell_path) => {
                                this.plugin.settings.shell_path = shell_path;
                                this.plugin.save_settings();
                            });
                        });
                        let i = 1;
                        this.plugin.settings.templates_pairs.forEach((template_pair) => {
                            const div = this.containerEl.createEl("div");
                            div.addClass("templater_div");
                            const title = this.containerEl.createEl("h4", {
                                text: "User function n°" + i,
                            });
                            title.addClass("templater_title");
                            const setting = new obsidian_18.Setting(this.containerEl)
                                .addExtraButton((extra) => {
                                extra
                                    .setIcon("cross")
                                    .setTooltip("Delete")
                                    .onClick(() => {
                                    const index = this.plugin.settings.templates_pairs.indexOf(template_pair);
                                    if (index > -1) {
                                        this.plugin.settings.templates_pairs.splice(index, 1);
                                        this.plugin.save_settings();
                                        // Force refresh
                                        this.display();
                                    }
                                });
                            })
                                .addText((text) => {
                                const t = text
                                    .setPlaceholder("Function name")
                                    .setValue(template_pair[0])
                                    .onChange((new_value) => {
                                    const index = this.plugin.settings.templates_pairs.indexOf(template_pair);
                                    if (index > -1) {
                                        this.plugin.settings.templates_pairs[index][0] = new_value;
                                        this.plugin.save_settings();
                                    }
                                });
                                t.inputEl.addClass("templater_template");
                                return t;
                            })
                                .addTextArea((text) => {
                                const t = text
                                    .setPlaceholder("System command")
                                    .setValue(template_pair[1])
                                    .onChange((new_cmd) => {
                                    const index = this.plugin.settings.templates_pairs.indexOf(template_pair);
                                    if (index > -1) {
                                        this.plugin.settings.templates_pairs[index][1] = new_cmd;
                                        this.plugin.save_settings();
                                    }
                                });
                                t.inputEl.setAttr("rows", 2);
                                t.inputEl.addClass("templater_cmd");
                                return t;
                            });
                            setting.infoEl.remove();
                            div.appendChild(title);
                            div.appendChild(this.containerEl.lastChild);
                            i += 1;
                        });
                        const div = this.containerEl.createEl("div");
                        div.addClass("templater_div2");
                        const setting = new obsidian_18.Setting(this.containerEl).addButton((button) => {
                            button
                                .setButtonText("Add new user function")
                                .setCta()
                                .onClick(() => {
                                this.plugin.settings.templates_pairs.push(["", ""]);
                                this.plugin.save_settings();
                                // Force refresh
                                this.display();
                            });
                        });
                        setting.infoEl.remove();
                        div.appendChild(this.containerEl.lastChild);
                    }
                }
                add_donating_setting() {
                    const s = new obsidian_18.Setting(this.containerEl)
                        .setName("Donate")
                        .setDesc("If you like this Plugin, consider donating to support continued development.");
                    const a1 = document.createElement("a");
                    a1.setAttribute("href", "https://github.com/sponsors/silentvoid13");
                    a1.addClass("templater_donating");
                    const img1 = document.createElement("img");
                    img1.src =
                        "https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86";
                    a1.appendChild(img1);
                    const a2 = document.createElement("a");
                    a2.setAttribute("href", "https://www.paypal.com/donate?hosted_button_id=U2SRGAFYXT32Q");
                    a2.addClass("templater_donating");
                    const img2 = document.createElement("img");
                    img2.src =
                        "https://img.shields.io/badge/paypal-silentvoid13-yellow?style=social&logo=paypal";
                    a2.appendChild(img2);
                    s.settingEl.appendChild(a1);
                    s.settingEl.appendChild(a2);
                }
            };
            exports_33("TemplaterSettingTab", TemplaterSettingTab);
        }
    };
});
System.register("src/handlers/EventHandler", ["src/core/Templater", "obsidian"], function (exports_34, context_34) {
    "use strict";
    var Templater_1, obsidian_19, EventHandler;
    var __moduleName = context_34 && context_34.id;
    return {
        setters: [
            function (Templater_1_1) {
                Templater_1 = Templater_1_1;
            },
            function (obsidian_19_1) {
                obsidian_19 = obsidian_19_1;
            }
        ],
        execute: function () {
            EventHandler = class EventHandler {
                constructor(plugin, templater, settings) {
                    this.plugin = plugin;
                    this.templater = templater;
                    this.settings = settings;
                }
                setup() {
                    if (Array.isArray(this.plugin.app.workspace.onLayoutReadyCallbacks)) {
                        // Use onLayoutReadyCallbacks instead of onLayoutReady
                        // to ensure that the event is registered before core plugin events (e.g. daily notes autorun)
                        this.plugin.app.workspace.onLayoutReadyCallbacks.push({
                            pluginId: this.plugin.manifest.id,
                            callback: () => {
                                this.update_trigger_file_on_creation();
                            },
                        });
                    }
                    else {
                        // Fallback to onLayoutReady if onLayoutReadyCallbacks is not available
                        this.plugin.app.workspace.onLayoutReady(() => {
                            this.update_trigger_file_on_creation();
                        });
                    }
                    this.update_syntax_highlighting();
                    this.update_file_menu();
                }
                update_syntax_highlighting() {
                    const desktopShouldHighlight = this.plugin.editor_handler.desktopShouldHighlight();
                    const mobileShouldHighlight = this.plugin.editor_handler.mobileShouldHighlight();
                    if (desktopShouldHighlight || mobileShouldHighlight) {
                        this.plugin.editor_handler.enable_highlighter();
                    }
                    else {
                        this.plugin.editor_handler.disable_highlighter();
                    }
                }
                update_trigger_file_on_creation() {
                    if (this.settings.trigger_on_file_creation) {
                        this.trigger_on_file_creation_event = this.plugin.app.vault.on("create", (file) => Templater_1.Templater.on_file_creation(this.templater, this.plugin.app, file));
                        this.plugin.registerEvent(this.trigger_on_file_creation_event);
                    }
                    else {
                        if (this.trigger_on_file_creation_event) {
                            this.plugin.app.vault.offref(this.trigger_on_file_creation_event);
                            this.trigger_on_file_creation_event = undefined;
                        }
                    }
                }
                update_file_menu() {
                    this.plugin.registerEvent(this.plugin.app.workspace.on("file-menu", (menu, file) => {
                        if (file instanceof obsidian_19.TFolder) {
                            menu.addItem((item) => {
                                item.setTitle("Create new note from template")
                                    .setIcon("templater-icon")
                                    .onClick(() => {
                                    this.plugin.fuzzy_suggester.create_new_note_from_template(file);
                                });
                            });
                        }
                    }));
                }
            };
            exports_34("default", EventHandler);
        }
    };
});
System.register("src/handlers/FuzzySuggester", ["obsidian", "src/utils/Utils", "src/utils/Error", "src/utils/Log"], function (exports_35, context_35) {
    "use strict";
    var obsidian_20, Utils_11, Error_16, Log_6, OpenMode, FuzzySuggester;
    var __moduleName = context_35 && context_35.id;
    return {
        setters: [
            function (obsidian_20_1) {
                obsidian_20 = obsidian_20_1;
            },
            function (Utils_11_1) {
                Utils_11 = Utils_11_1;
            },
            function (Error_16_1) {
                Error_16 = Error_16_1;
            },
            function (Log_6_1) {
                Log_6 = Log_6_1;
            }
        ],
        execute: function () {
            (function (OpenMode) {
                OpenMode[OpenMode["InsertTemplate"] = 0] = "InsertTemplate";
                OpenMode[OpenMode["CreateNoteTemplate"] = 1] = "CreateNoteTemplate";
            })(OpenMode || (OpenMode = {}));
            exports_35("OpenMode", OpenMode);
            FuzzySuggester = class FuzzySuggester extends obsidian_20.FuzzySuggestModal {
                constructor(plugin) {
                    super(plugin.app);
                    this.plugin = plugin;
                    this.setPlaceholder("Type name of a template...");
                }
                getItems() {
                    if (!this.plugin.settings.templates_folder) {
                        return this.app.vault.getMarkdownFiles();
                    }
                    const files = Error_16.errorWrapperSync(() => Utils_11.get_tfiles_from_folder(this.plugin.app, this.plugin.settings.templates_folder), `Couldn't retrieve template files from templates folder ${this.plugin.settings.templates_folder}`);
                    if (!files) {
                        return [];
                    }
                    return files;
                }
                getItemText(item) {
                    let relativePath = item.path;
                    if (item.path.startsWith(this.plugin.settings.templates_folder) &&
                        obsidian_20.normalizePath(this.plugin.settings.templates_folder) != "/") {
                        // Modify splice position if folder has a trailing slash
                        const folderLength = this.plugin.settings.templates_folder.length;
                        const position = this.plugin.settings.templates_folder.endsWith('/') ? folderLength : folderLength + 1;
                        relativePath = item.path.slice(position);
                    }
                    return relativePath.split(".").slice(0, -1).join(".");
                }
                onChooseItem(item) {
                    switch (this.open_mode) {
                        case OpenMode.InsertTemplate:
                            this.plugin.templater.append_template_to_active_file(item);
                            break;
                        case OpenMode.CreateNoteTemplate:
                            this.plugin.templater.create_new_note_from_template(item, this.creation_folder);
                            break;
                    }
                }
                start() {
                    try {
                        this.open();
                    }
                    catch (e) {
                        Log_6.log_error(e);
                    }
                }
                insert_template() {
                    this.open_mode = OpenMode.InsertTemplate;
                    this.start();
                }
                create_new_note_from_template(folder) {
                    this.creation_folder = folder;
                    this.open_mode = OpenMode.CreateNoteTemplate;
                    this.start();
                }
            };
            exports_35("FuzzySuggester", FuzzySuggester);
        }
    };
});
// @ts-nocheck
System.register("src/main", ["tslib", "obsidian", "src/core/Templater", "src/editor/Editor", "src/handlers/CommandHandler", "src/handlers/EventHandler", "src/handlers/FuzzySuggester", "src/settings/Settings", "src/utils/Constants"], function (exports_36, context_36) {
    "use strict";
    var tslib_24, obsidian_21, Templater_2, Editor_1, CommandHandler_1, EventHandler_1, FuzzySuggester_1, Settings_1, Constants_2, TemplaterPlugin;
    var __moduleName = context_36 && context_36.id;
    return {
        setters: [
            function (tslib_24_1) {
                tslib_24 = tslib_24_1;
            },
            function (obsidian_21_1) {
                obsidian_21 = obsidian_21_1;
            },
            function (Templater_2_1) {
                Templater_2 = Templater_2_1;
            },
            function (Editor_1_1) {
                Editor_1 = Editor_1_1;
            },
            function (CommandHandler_1_1) {
                CommandHandler_1 = CommandHandler_1_1;
            },
            function (EventHandler_1_1) {
                EventHandler_1 = EventHandler_1_1;
            },
            function (FuzzySuggester_1_1) {
                FuzzySuggester_1 = FuzzySuggester_1_1;
            },
            function (Settings_1_1) {
                Settings_1 = Settings_1_1;
            },
            function (Constants_2_1) {
                Constants_2 = Constants_2_1;
            }
        ],
        execute: function () {// @ts-nocheck
            TemplaterPlugin = class TemplaterPlugin extends obsidian_21.Plugin {
                onload() {
                    return tslib_24.__awaiter(this, void 0, void 0, function* () {
                        yield this.load_settings();
                        this.templater = new Templater_2.Templater(this);
                        yield this.templater.setup();
                        this.editor_handler = new Editor_1.Editor(this);
                        yield this.editor_handler.setup();
                        this.fuzzy_suggester = new FuzzySuggester_1.FuzzySuggester(this);
                        this.event_handler = new EventHandler_1.default(this, this.templater, this.settings);
                        this.event_handler.setup();
                        this.command_handler = new CommandHandler_1.CommandHandler(this);
                        this.command_handler.setup();
                        obsidian_21.addIcon("templater-icon", Constants_2.ICON_DATA);
                        this.addRibbonIcon("templater-icon", "Templater", () => tslib_24.__awaiter(this, void 0, void 0, function* () {
                            this.fuzzy_suggester.insert_template();
                        })).setAttribute("id", "rb-templater-icon");
                        this.addSettingTab(new Settings_1.TemplaterSettingTab(this));
                        // Files might not be created yet
                        this.app.workspace.onLayoutReady(() => {
                            this.templater.execute_startup_scripts();
                        });
                    });
                }
                onunload() {
                    // Failsafe in case teardown doesn't happen immediately after template execution
                    this.templater.functions_generator.teardown();
                }
                save_settings() {
                    return tslib_24.__awaiter(this, void 0, void 0, function* () {
                        yield this.saveData(this.settings);
                        this.editor_handler.updateEditorIntellisenseSetting(this.settings.intellisense_render);
                    });
                }
                load_settings() {
                    return tslib_24.__awaiter(this, void 0, void 0, function* () {
                        this.settings = Object.assign({}, Settings_1.DEFAULT_SETTINGS, yield this.loadData());
                    });
                }
            };
            exports_36("default", TemplaterPlugin);
        }
    };
});
System.register("src/types", [], function (exports_37, context_37) {
    "use strict";
    var __moduleName = context_37 && context_37.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("tests/InternalTemplates/InternalModuleFile.test", ["tslib", "tests/utils.test", "chai"], function (exports_38, context_38) {
    "use strict";
    var tslib_25, utils_test_1, chai_1;
    var __moduleName = context_38 && context_38.id;
    function InternalModuleFileTests(t) {
        t.test("tp.file.content", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            const target_file_content = "This is some content\r\nWith \tsome newlines\n\n";
            yield chai_1.expect(t.run_and_get_output(`<% tp.file.content %>`, target_file_content)).to.eventually.equal(target_file_content);
        }));
        t.test("tp.file.create_new", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            // TODO
        }));
        t.test("tp.file.creation_date", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            const saved_ctime = t.target_file.stat.ctime;
            // 2021-05-01 00:00:00
            t.target_file.stat.ctime = 1619820000000;
            yield chai_1.expect(t.run_and_get_output(`Creation date: <% tp.file.creation_date() %>\n\n`, "", false, true)).to.eventually.equal("Creation date: 2021-05-01 00:00\n\n");
            yield chai_1.expect(t.run_and_get_output(`Creation date: <% tp.file.creation_date("dddd Do MMMM YYYY, ddd") %>\n\n`, "", false, true)).to.eventually.equal("Creation date: Saturday 1st May 2021, Sat\n\n");
            t.target_file.stat.ctime = saved_ctime;
        }));
        t.test("tp.file.cursor", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            yield chai_1.expect(t.run_and_get_output(`Cursor: <%\t\ntp.file.cursor(10)\t\r\n%>\n\n`, "")).to.eventually.equal(`Cursor: <% tp.file.cursor(10) %>\n\n`);
        }));
        t.test("tp.file.cursor_append", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            // TODO
            //await expect(t.run_and_get_output(`Cursor append: <% tp.file.cursor_append("TestTest") %>\n\n`)).to.eventually.equal(`TestTest Cursor append: \n\n`);
        }));
        t.test("tp.file.exists", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            yield chai_1.expect(t.run_and_get_output(`File Exists: <% tp.file.exists("${t.target_file.basename}.md") %>\n\n`)).to.eventually.equal(`File Exists: true\n\n`);
            yield chai_1.expect(t.run_and_get_output(`File Exists: <% tp.file.exists("NonExistingFile.md") %>\n\n`)).to.eventually.equal(`File Exists: false\n\n`);
        }));
        t.test("tp.file.find_tfile", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            yield chai_1.expect(t.run_and_get_output(`File: <% tp.file.find_tfile("${t.target_file.basename}").path %>\n\n`)).to.eventually.equal(`File: ${t.target_file.path}\n\n`);
            yield chai_1.expect(t.run_and_get_output(`File: <% tp.file.find_tfile("NonExistingFile") %>\n\n`)).to.eventually.equal(`File: null\n\n`);
        }));
        t.test("tp.file.folder", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            yield chai_1.expect(t.run_and_get_output(`Folder: <% tp.file.folder() %>\n\n`)).to.eventually.equal(`Folder: \n\n`);
            yield chai_1.expect(t.run_and_get_output(`Folder: <% tp.file.folder(true) %>\n\n`)).to.eventually.equal(`Folder: /\n\n`);
        }));
        t.test("tp.file.include", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            yield t.createFile(`Inc1.md`, `Inc1 content\n<% tp.file.include('[[Inc2]]') %>\n\n`);
            yield t.createFile(`Inc2.md`, `Inc2 content\n\n`);
            yield t.createFile(`Inc3.md`, `Inc3 content\n<% tp.file.include('[[Inc3]]') %>\n\n`);
            yield chai_1.expect(t.run_and_get_output(`Included: <% tp.file.include('[[Inc1]]') %>\n\n`)).to.eventually.equal(`Included: Inc1 content\nInc2 content\n\n\n\n\n\n`);
            yield chai_1.expect(t.run_and_get_output(`Included: <% tp.file.include('[[Inc2]]') %>\n\n`)).to.eventually.equal(`Included: Inc2 content\n\n\n\n`);
            yield chai_1.expect(t.run_and_get_output(`Included: <% tp.file.include('[[Inc3]]') %>\n\n`)).to.eventually.be.rejectedWith(Error, "Reached inclusion depth limit (max = 10)");
            yield chai_1.expect(t.run_and_get_output(`Included: <% tp.file.include('Inc3') %>\n\n`)).to.eventually.be.rejectedWith(Error, "Invalid file format, provide an obsidian link between quotes.");
            yield chai_1.expect(t.run_and_get_output(`Included: <% tp.file.include('[[NonExistingFile]]') %>\n\n`)).to.eventually.be.rejectedWith(Error, "File [[NonExistingFile]] doesn't exist");
        }));
        t.test("tp.file.last_modified_date", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            const saved_mtime = t.target_file.stat.mtime;
            // 2021-05-01 00:00:00
            t.target_file.stat.mtime = 1619820000000;
            chai_1.expect(yield t.run_and_get_output(`Last modif date: <% tp.file.last_modified_date() %>\n\n`, "", false, true)).to.equal("Last modif date: 2021-05-01 00:00\n\n");
            chai_1.expect(yield t.run_and_get_output(`Last modif date: <% tp.file.last_modified_date("dddd Do MMMM YYYY, ddd") %>\n\n`, "", false, true)).to.equal("Last modif date: Saturday 1st May 2021, Sat\n\n");
            t.target_file.stat.ctime = saved_mtime;
        }));
        t.test("tp.file.move", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            const saved_target_file = t.target_file;
            const folder_name = `TestFolder`;
            const nested_name = `TestFolder/nested`;
            const folder = yield t.createFolder(folder_name);
            const file1 = yield t.createFile(`File1.md`);
            const nested1 = yield t.createFile(`Nested1.md`);
            t.target_file = file1;
            yield chai_1.expect(t.run_and_get_output(`Move <% tp.file.move("${folder_name}/File2") %>\n\n`)).to.eventually.equal(`Move \n\n`);
            chai_1.expect(file1.path).to.equal(`${folder_name}/File2.md`);
            t.target_file = nested1;
            yield chai_1.expect(t.run_and_get_output(`Move <% tp.file.move("${nested_name}/Nested2") %>\n\n`)).to.eventually.equal(`Move \n\n`);
            chai_1.expect(nested1.path).to.equal(`${nested_name}/Nested2.md`);
            t.target_file = saved_target_file;
            yield t.app.vault.delete(folder, true);
        }));
        t.test("tp.file.path", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            // TODO
            //expect(await t.run_and_get_output("Path: <% tp.file.path(true) %>\n\n")).to.equal(`Path: ${TEMPLATE_FILE_NAME}\n\n`);
            yield chai_1.expect(t.run_and_get_output(`Path: <% tp.file.path(true) %>\n\n`)).to.eventually.equal(`Path: ${utils_test_1.TARGET_FILE_NAME}.md\n\n`);
        }));
        t.test("tp.file.rename", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            const saved_target_file = t.target_file;
            const file1 = yield t.createFile(`File1.md`);
            t.target_file = file1;
            yield chai_1.expect(t.run_and_get_output(`Rename <% tp.file.rename("File2") %>\n\n`)).to.eventually.equal(`Rename \n\n`);
            chai_1.expect(file1.basename).to.equal("File2");
            yield chai_1.expect(t.run_and_get_output(`Rename <% tp.file.rename("Fail/File2.md") %>\n\n`)).to.eventually.be.rejectedWith(Error, "File name cannot contain any of these characters: \\ / :");
            t.target_file = saved_target_file;
            yield t.app.vault.delete(file1);
        }));
        t.test("tp.file.selection", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            // TODO
        }));
        t.test("tp.file.tags", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            yield chai_1.expect(t.run_and_get_output(`Tags: <% tp.file.tags %>\n\n`, `#tag1\n#tag2\n#tag3\n\n`, true)).to.eventually.equal(`Tags: #tag1,#tag2,#tag3\n\n`);
        }));
        t.test("tp.file.title", () => tslib_25.__awaiter(this, void 0, void 0, function* () {
            yield chai_1.expect(t.run_and_get_output(`Title: <% tp.file.title %>\n\n`)).to.eventually.equal(`Title: ${utils_test_1.TARGET_FILE_NAME}\n\n`);
        }));
    }
    exports_38("InternalModuleFileTests", InternalModuleFileTests);
    return {
        setters: [
            function (tslib_25_1) {
                tslib_25 = tslib_25_1;
            },
            function (utils_test_1_1) {
                utils_test_1 = utils_test_1_1;
            },
            function (chai_1_1) {
                chai_1 = chai_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("tests/InternalTemplates/InternalModuleDate.test", ["tslib"], function (exports_39, context_39) {
    "use strict";
    var tslib_26;
    var __moduleName = context_39 && context_39.id;
    function InternalModuleDateTests(t) {
        t.test("tp.date.now", () => tslib_26.__awaiter(this, void 0, void 0, function* () {
            // TODO
        }));
        t.test("tp.date.tomorrow", () => tslib_26.__awaiter(this, void 0, void 0, function* () {
            // TODO
        }));
        t.test("tp.date.yesterday", () => tslib_26.__awaiter(this, void 0, void 0, function* () {
            // TODO
        }));
        t.test("tp.date.weekday", () => tslib_26.__awaiter(this, void 0, void 0, function* () {
            // TODO
        }));
    }
    exports_39("InternalModuleDateTests", InternalModuleDateTests);
    return {
        setters: [
            function (tslib_26_1) {
                tslib_26 = tslib_26_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("tests/InternalTemplates/InternalModuleFrontmatter.test", ["tslib", "chai"], function (exports_40, context_40) {
    "use strict";
    var tslib_27, chai_2;
    var __moduleName = context_40 && context_40.id;
    function InternalModuleFrontmatterTests(t) {
        t.test("tp.frontmatter", () => tslib_27.__awaiter(this, void 0, void 0, function* () {
            const template_content = `field1: <% tp.frontmatter.field1 %>
field2 with space: <% tp.frontmatter["field2 with space"] %>
field3 array: <% tp.frontmatter.field3 %>
field4 array: <% tp.frontmatter.field4 %>
`;
            const target_content = `---
field1: test
field2 with space: test test
field3: ["a", "b", "c"]
field4:
- a
- b
- c
---`;
            const expected_content = `field1: test
field2 with space: test test
field3 array: a,b,c
field4 array: a,b,c
`;
            yield chai_2.expect(t.run_and_get_output(template_content, target_content, true)).to.eventually.equal(expected_content);
        }));
    }
    exports_40("InternalModuleFrontmatterTests", InternalModuleFrontmatterTests);
    return {
        setters: [
            function (tslib_27_1) {
                tslib_27 = tslib_27_1;
            },
            function (chai_2_1) {
                chai_2 = chai_2_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("tests/InternalTemplates/InternalModuleHooks.test", ["tslib", "chai", "tests/utils.test"], function (exports_41, context_41) {
    "use strict";
    var tslib_28, chai_3, utils_test_2;
    var __moduleName = context_41 && context_41.id;
    function InternalModuleHooksTests(t) {
        t.test("tp.hooks.on_all_templates_executed shows properties in live preview", () => tslib_28.__awaiter(this, void 0, void 0, function* () {
            const template = `<%*
tp.hooks.on_all_templates_executed(async () => {
  const file = tp.file.find_tfile(tp.file.path(true));
  await app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter["key"] = "value";
  });
});
%>
TEXT THAT SHOULD STAY`;
            yield t.run_in_new_leaf(template, "", true);
            chai_3.expect(utils_test_2.properties_are_visible()).to.be.true;
            yield chai_3.expect(t.run_and_get_output(template, "", true)).to.eventually.equal("\nTEXT THAT SHOULD STAY");
            yield chai_3.expect(t.create_new_note_from_template_and_get_output(template)).to.eventually.equal("---\nkey: value\n---\n\nTEXT THAT SHOULD STAY");
        }));
    }
    exports_41("InternalModuleHooksTests", InternalModuleHooksTests);
    return {
        setters: [
            function (tslib_28_1) {
                tslib_28 = tslib_28_1;
            },
            function (chai_3_1) {
                chai_3 = chai_3_1;
            },
            function (utils_test_2_1) {
                utils_test_2 = utils_test_2_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("tests/InternalTemplates/InternalModuleSystem.test", ["tslib", "chai"], function (exports_42, context_42) {
    "use strict";
    var tslib_29, chai_4;
    var __moduleName = context_42 && context_42.id;
    function InternalModuleSystemTests(t) {
        t.test("tp.system.clipboard", () => tslib_29.__awaiter(this, void 0, void 0, function* () {
            const clipboard_content = "This some test\n\ncontent\n\n";
            yield navigator.clipboard.writeText(clipboard_content);
            yield chai_4.expect(t.run_and_get_output(`Clipboard content: <% tp.system.clipboard() %>`)).to.eventually.equal(`Clipboard content: ${clipboard_content}`);
        }));
        t.test("tp.system.prompt", () => tslib_29.__awaiter(this, void 0, void 0, function* () {
            // TODO
        }));
        t.test("tp.system.suggester", () => tslib_29.__awaiter(this, void 0, void 0, function* () {
            // TODO
        }));
    }
    exports_42("InternalModuleSystemTests", InternalModuleSystemTests);
    return {
        setters: [
            function (tslib_29_1) {
                tslib_29 = tslib_29_1;
            },
            function (chai_4_1) {
                chai_4 = chai_4_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("tests/InternalTemplates/InternalModuleConfig.test", ["tslib", "chai"], function (exports_43, context_43) {
    "use strict";
    var tslib_30, chai_5;
    var __moduleName = context_43 && context_43.id;
    function InternalModuleConfigTests(t) {
        t.test("tp.config", () => tslib_30.__awaiter(this, void 0, void 0, function* () {
            yield chai_5.expect(t.run_and_get_output("Template file: <% tp.config.template_file.path %>\n\n", "")).to.eventually.equal(`Template file: ${t.template_file.path}\n\n`);
            yield chai_5.expect(t.run_and_get_output("Target file: <% tp.config.target_file.path %>\n\n", "")).to.eventually.equal(`Target file: ${t.target_file.path}\n\n`);
            yield chai_5.expect(t.run_and_get_output("Run mode: <% tp.config.run_mode %>\n\n", "")).to.eventually.equal("Run mode: 2\n\n");
        }));
    }
    exports_43("InternalModuleConfigTests", InternalModuleConfigTests);
    return {
        setters: [
            function (tslib_30_1) {
                tslib_30 = tslib_30_1;
            },
            function (chai_5_1) {
                chai_5 = chai_5_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("tests/main.test", ["tslib", "obsidian", "chai", "chai-as-promised", "src/core/Templater", "tests/utils.test", "tests/InternalTemplates/InternalModuleFile.test", "tests/InternalTemplates/InternalModuleDate.test", "tests/InternalTemplates/InternalModuleFrontmatter.test", "tests/InternalTemplates/InternalModuleHooks.test", "tests/InternalTemplates/InternalModuleSystem.test", "tests/InternalTemplates/InternalModuleConfig.test", "tests/Templater.test"], function (exports_44, context_44) {
    "use strict";
    var tslib_31, obsidian_22, chai_6, chai_as_promised_1, Templater_3, utils_test_3, InternalModuleFile_test_1, InternalModuleDate_test_1, InternalModuleFrontmatter_test_1, InternalModuleHooks_test_1, InternalModuleSystem_test_1, InternalModuleConfig_test_1, Templater_test_1, TestTemplaterPlugin;
    var __moduleName = context_44 && context_44.id;
    return {
        setters: [
            function (tslib_31_1) {
                tslib_31 = tslib_31_1;
            },
            function (obsidian_22_1) {
                obsidian_22 = obsidian_22_1;
            },
            function (chai_6_1) {
                chai_6 = chai_6_1;
            },
            function (chai_as_promised_1_1) {
                chai_as_promised_1 = chai_as_promised_1_1;
            },
            function (Templater_3_1) {
                Templater_3 = Templater_3_1;
            },
            function (utils_test_3_1) {
                utils_test_3 = utils_test_3_1;
            },
            function (InternalModuleFile_test_1_1) {
                InternalModuleFile_test_1 = InternalModuleFile_test_1_1;
            },
            function (InternalModuleDate_test_1_1) {
                InternalModuleDate_test_1 = InternalModuleDate_test_1_1;
            },
            function (InternalModuleFrontmatter_test_1_1) {
                InternalModuleFrontmatter_test_1 = InternalModuleFrontmatter_test_1_1;
            },
            function (InternalModuleHooks_test_1_1) {
                InternalModuleHooks_test_1 = InternalModuleHooks_test_1_1;
            },
            function (InternalModuleSystem_test_1_1) {
                InternalModuleSystem_test_1 = InternalModuleSystem_test_1_1;
            },
            function (InternalModuleConfig_test_1_1) {
                InternalModuleConfig_test_1 = InternalModuleConfig_test_1_1;
            },
            function (Templater_test_1_1) {
                Templater_test_1 = Templater_test_1_1;
            }
        ],
        execute: function () {
            chai_6.default.use(chai_as_promised_1.default);
            TestTemplaterPlugin = class TestTemplaterPlugin extends obsidian_22.Plugin {
                constructor() {
                    super(...arguments);
                    this.active_files = new Array();
                }
                onload() {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        this.addCommand({
                            id: "run-templater-tests",
                            name: "Run Templater Tests",
                            callback: () => tslib_31.__awaiter(this, void 0, void 0, function* () {
                                yield this.setup();
                                yield this.load_tests();
                                yield this.run_tests();
                                yield this.teardown();
                            }),
                        });
                    });
                }
                setup() {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        yield utils_test_3.delay(300);
                        this.tests = new Array();
                        // @ts-ignore
                        this.plugin = this.app.plugins.getPlugin(utils_test_3.PLUGIN_NAME);
                        this.plugin.settings.trigger_on_file_creation = false;
                        this.plugin.event_handler.update_trigger_file_on_creation();
                        this.target_file = yield this.app.vault.create(`${utils_test_3.TARGET_FILE_NAME}.md`, "");
                        this.template_file = yield this.app.vault.create(`${utils_test_3.TEMPLATE_FILE_NAME}.md`, "");
                        //await this.disable_external_plugins();
                    });
                }
                teardown() {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        this.plugin.settings.trigger_on_file_creation = true;
                        this.plugin.event_handler.update_trigger_file_on_creation();
                        yield this.cleanupFiles();
                        yield this.app.vault.delete(this.target_file, true);
                        yield this.app.vault.delete(this.template_file, true);
                        //await this.enable_external_plugins();
                    });
                }
                disable_external_plugins() {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        // @ts-ignore
                        for (const plugin_name of Object.keys(this.app.plugins.plugins)) {
                            if (plugin_name !== utils_test_3.PLUGIN_NAME &&
                                plugin_name !== this.manifest.id) {
                                // @ts-ignore
                                yield this.app.plugins.plugins[plugin_name].unload();
                            }
                        }
                    });
                }
                enable_external_plugins() {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        // @ts-ignore
                        for (const plugin_name of Object.keys(this.app.plugins.plugins)) {
                            if (plugin_name !== utils_test_3.PLUGIN_NAME &&
                                plugin_name !== this.manifest.id) {
                                // @ts-ignore
                                yield this.app.plugins.plugins[plugin_name].load();
                            }
                        }
                    });
                }
                load_tests() {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        InternalModuleFile_test_1.InternalModuleFileTests(this);
                        InternalModuleDate_test_1.InternalModuleDateTests(this);
                        InternalModuleFrontmatter_test_1.InternalModuleFrontmatterTests(this);
                        InternalModuleHooks_test_1.InternalModuleHooksTests(this);
                        InternalModuleSystem_test_1.InternalModuleSystemTests(this);
                        InternalModuleConfig_test_1.InternalModuleConfigTests(this);
                        Templater_test_1.TemplaterTests(this);
                    });
                }
                test(name, fn) {
                    this.tests.push({ name, fn });
                }
                run_tests() {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        for (let t of this.tests) {
                            try {
                                yield t.fn();
                                console.log("✅", t.name);
                            }
                            catch (e) {
                                console.log("❌", t.name);
                                console.error(e);
                            }
                        }
                    });
                }
                cleanupFiles() {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        let file;
                        while ((file = this.active_files.pop()) !== undefined) {
                            try {
                                yield this.app.vault.delete(file, true);
                            }
                            catch (e) { }
                        }
                    });
                }
                retrieveActiveFile(file_name) {
                    for (const file of this.active_files) {
                        if (file.name === file_name) {
                            return file;
                        }
                    }
                    return null;
                }
                createFolder(folder_name) {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        let folder = this.retrieveActiveFile(folder_name);
                        if (folder && folder instanceof obsidian_22.TFolder) {
                            return folder;
                        }
                        yield this.app.vault.createFolder(folder_name);
                        folder = this.app.vault.getAbstractFileByPath(folder_name);
                        if (!(folder instanceof obsidian_22.TFolder)) {
                            return null;
                        }
                        this.active_files.push(folder);
                        return folder;
                    });
                }
                createFile(file_name, file_content = "") {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        const f = this.retrieveActiveFile(file_name);
                        if (f && f instanceof obsidian_22.TFile) {
                            yield this.app.vault.modify(f, file_content);
                            return f;
                        }
                        const file = yield this.app.vault.create(file_name, file_content);
                        this.active_files.push(file);
                        return file;
                    });
                }
                run_and_get_output(template_content, target_content = "", waitCache = false, skip_modify = false) {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        yield this.app.vault.modify(this.template_file, template_content);
                        if (!skip_modify) {
                            yield this.app.vault.modify(this.target_file, target_content);
                        }
                        if (waitCache) {
                            yield utils_test_3.cache_update(this);
                        }
                        const running_config = {
                            template_file: this.template_file,
                            target_file: this.target_file,
                            run_mode: Templater_3.RunMode.OverwriteFile,
                        };
                        const content = yield this.plugin.templater.read_and_parse_template(running_config);
                        return content;
                    });
                }
                create_new_note_from_template_and_get_output(template_content, delay_ms = 300) {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        const file = yield this.plugin.templater.create_new_note_from_template(template_content);
                        if (file) {
                            this.active_files.push(file);
                            yield utils_test_3.delay(delay_ms);
                            const content = yield this.app.vault.read(file);
                            return content;
                        }
                    });
                }
                run_in_new_leaf(template_content, target_content = "", waitCache = false, skip_modify = false) {
                    return tslib_31.__awaiter(this, void 0, void 0, function* () {
                        yield this.app.vault.modify(this.template_file, template_content);
                        if (!skip_modify) {
                            yield this.app.vault.modify(this.target_file, target_content);
                        }
                        if (waitCache) {
                            yield utils_test_3.cache_update(this);
                        }
                        yield this.app.workspace.getLeaf(true).openFile(this.target_file);
                        yield this.plugin.templater.append_template_to_active_file(this.template_file);
                        yield utils_test_3.delay(300);
                    });
                }
            };
            exports_44("default", TestTemplaterPlugin);
        }
    };
});
System.register("tests/utils.test", [], function (exports_45, context_45) {
    "use strict";
    var PLUGIN_NAME, TEMPLATE_FILE_NAME, TARGET_FILE_NAME;
    var __moduleName = context_45 && context_45.id;
    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    exports_45("delay", delay);
    function cache_update(t) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject("Cache update timeout"), 500);
            const resolve_promise = (file) => {
                if (file === t.target_file) {
                    clearTimeout(timeout);
                    t.app.metadataCache.off("changed", resolve_promise);
                    resolve();
                }
            };
            t.app.metadataCache.on("changed", resolve_promise);
        });
    }
    exports_45("cache_update", cache_update);
    function properties_are_visible() {
        return !!document.querySelector(".workspace-leaf.mod-active .metadata-properties .metadata-property");
    }
    exports_45("properties_are_visible", properties_are_visible);
    return {
        setters: [],
        execute: function () {
            exports_45("PLUGIN_NAME", PLUGIN_NAME = "templater-obsidian");
            exports_45("TEMPLATE_FILE_NAME", TEMPLATE_FILE_NAME = "TemplateFile");
            exports_45("TARGET_FILE_NAME", TARGET_FILE_NAME = "TargetFile");
        }
    };
});
System.register("tests/Templater.test", ["tslib", "chai", "tests/utils.test"], function (exports_46, context_46) {
    "use strict";
    var tslib_32, chai_7, utils_test_4;
    var __moduleName = context_46 && context_46.id;
    function TemplaterTests(t) {
        t.test("append_template_to_active_file shows properties in live preview", () => tslib_32.__awaiter(this, void 0, void 0, function* () {
            yield t.run_in_new_leaf("---\nkey: value\n---\nText");
            chai_7.expect(utils_test_4.properties_are_visible()).to.be.true;
        }));
    }
    exports_46("TemplaterTests", TemplaterTests);
    return {
        setters: [
            function (tslib_32_1) {
                tslib_32 = tslib_32_1;
            },
            function (chai_7_1) {
                chai_7 = chai_7_1;
            },
            function (utils_test_4_1) {
                utils_test_4 = utils_test_4_1;
            }
        ],
        execute: function () {
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy91dGlscy9USkRvY0ZpbGUudHMiLCJzcmMvdXRpbHMvTG9nLnRzIiwic3JjL3V0aWxzL0Vycm9yLnRzIiwic3JjL3V0aWxzL1V0aWxzLnRzIiwic3JjL2NvcmUvZnVuY3Rpb25zL0lHZW5lcmF0ZU9iamVjdC50cyIsInNyYy9lZGl0b3IvVHBEb2N1bWVudGF0aW9uLnRzIiwic3JjL2NvcmUvZnVuY3Rpb25zL2ludGVybmFsX2Z1bmN0aW9ucy9JbnRlcm5hbE1vZHVsZS50cyIsInNyYy9jb3JlL2Z1bmN0aW9ucy9pbnRlcm5hbF9mdW5jdGlvbnMvZGF0ZS9JbnRlcm5hbE1vZHVsZURhdGUudHMiLCJzcmMvY29yZS9mdW5jdGlvbnMvaW50ZXJuYWxfZnVuY3Rpb25zL2ZpbGUvSW50ZXJuYWxNb2R1bGVGaWxlLnRzIiwic3JjL2NvcmUvZnVuY3Rpb25zL2ludGVybmFsX2Z1bmN0aW9ucy93ZWIvSW50ZXJuYWxNb2R1bGVXZWIudHMiLCJzcmMvY29yZS9mdW5jdGlvbnMvaW50ZXJuYWxfZnVuY3Rpb25zL2hvb2tzL0ludGVybmFsTW9kdWxlSG9va3MudHMiLCJzcmMvY29yZS9mdW5jdGlvbnMvaW50ZXJuYWxfZnVuY3Rpb25zL2Zyb250bWF0dGVyL0ludGVybmFsTW9kdWxlRnJvbnRtYXR0ZXIudHMiLCJzcmMvY29yZS9mdW5jdGlvbnMvaW50ZXJuYWxfZnVuY3Rpb25zL3N5c3RlbS9Qcm9tcHRNb2RhbC50cyIsInNyYy9jb3JlL2Z1bmN0aW9ucy9pbnRlcm5hbF9mdW5jdGlvbnMvc3lzdGVtL1N1Z2dlc3Rlck1vZGFsLnRzIiwic3JjL2NvcmUvZnVuY3Rpb25zL2ludGVybmFsX2Z1bmN0aW9ucy9zeXN0ZW0vSW50ZXJuYWxNb2R1bGVTeXN0ZW0udHMiLCJzcmMvY29yZS9mdW5jdGlvbnMvaW50ZXJuYWxfZnVuY3Rpb25zL2NvbmZpZy9JbnRlcm5hbE1vZHVsZUNvbmZpZy50cyIsInNyYy9jb3JlL2Z1bmN0aW9ucy9pbnRlcm5hbF9mdW5jdGlvbnMvSW50ZXJuYWxGdW5jdGlvbnMudHMiLCJzcmMvdXRpbHMvQ29uc3RhbnRzLnRzIiwic3JjL2NvcmUvZnVuY3Rpb25zL3VzZXJfZnVuY3Rpb25zL1VzZXJTeXN0ZW1GdW5jdGlvbnMudHMiLCJzcmMvY29yZS9mdW5jdGlvbnMvdXNlcl9mdW5jdGlvbnMvVXNlclNjcmlwdEZ1bmN0aW9ucy50cyIsInNyYy9jb3JlL2Z1bmN0aW9ucy91c2VyX2Z1bmN0aW9ucy9Vc2VyRnVuY3Rpb25zLnRzIiwic3JjL2NvcmUvZnVuY3Rpb25zL0Z1bmN0aW9uc0dlbmVyYXRvci50cyIsInNyYy9jb3JlL3BhcnNlci9QYXJzZXIudHMiLCJzcmMvY29yZS9UZW1wbGF0ZXIudHMiLCJzcmMvZWRpdG9yL0N1cnNvckp1bXBlci50cyIsInNyYy9zZXR0aW5ncy9SZW5kZXJTZXR0aW5ncy9JbnRlbGxpc2Vuc2VSZW5kZXJPcHRpb24udHMiLCJzcmMvZWRpdG9yL0F1dG9jb21wbGV0ZS50cyIsInNyYy9lZGl0b3IvbW9kZS9qYXZhc2NyaXB0LmpzIiwic3JjL2VkaXRvci9tb2RlL2N1c3RvbV9vdmVybGF5LmpzIiwic3JjL2VkaXRvci9FZGl0b3IudHMiLCJzcmMvaGFuZGxlcnMvQ29tbWFuZEhhbmRsZXIudHMiLCJzcmMvc2V0dGluZ3Mvc3VnZ2VzdGVycy9zdWdnZXN0LnRzIiwic3JjL3NldHRpbmdzL3N1Z2dlc3RlcnMvRmlsZVN1Z2dlc3Rlci50cyIsInNyYy9zZXR0aW5ncy9zdWdnZXN0ZXJzL0ZvbGRlclN1Z2dlc3Rlci50cyIsInNyYy9zZXR0aW5ncy9TZXR0aW5ncy50cyIsInNyYy9oYW5kbGVycy9FdmVudEhhbmRsZXIudHMiLCJzcmMvaGFuZGxlcnMvRnV6enlTdWdnZXN0ZXIudHMiLCJzcmMvbWFpbi50cyIsInNyYy90eXBlcy50cyIsInRlc3RzL0ludGVybmFsVGVtcGxhdGVzL0ludGVybmFsTW9kdWxlRmlsZS50ZXN0LnRzIiwidGVzdHMvSW50ZXJuYWxUZW1wbGF0ZXMvSW50ZXJuYWxNb2R1bGVEYXRlLnRlc3QudHMiLCJ0ZXN0cy9JbnRlcm5hbFRlbXBsYXRlcy9JbnRlcm5hbE1vZHVsZUZyb250bWF0dGVyLnRlc3QudHMiLCJ0ZXN0cy9JbnRlcm5hbFRlbXBsYXRlcy9JbnRlcm5hbE1vZHVsZUhvb2tzLnRlc3QudHMiLCJ0ZXN0cy9JbnRlcm5hbFRlbXBsYXRlcy9JbnRlcm5hbE1vZHVsZVN5c3RlbS50ZXN0LnRzIiwidGVzdHMvSW50ZXJuYWxUZW1wbGF0ZXMvSW50ZXJuYWxNb2R1bGVDb25maWcudGVzdC50cyIsInRlc3RzL21haW4udGVzdC50cyIsInRlc3RzL3V0aWxzLnRlc3QudHMiLCJ0ZXN0cy9UZW1wbGF0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztZQUVBLFlBQUEsTUFBYSxTQUFVLFNBQVEsZ0JBQUs7Z0JBS2hDLFlBQVksSUFBVztvQkFDbkIsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO29CQUM1QixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtnQkFDN0IsQ0FBQzthQUNKLENBQUE7O1lBRUQsb0JBQUEsTUFBYSxpQkFBaUI7Z0JBRzFCLFlBQVksSUFBWSxFQUFFLElBQVk7b0JBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO29CQUNqQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztnQkFDNUIsQ0FBQzthQUNKLENBQUE7O1FBQ0QsQ0FBQzs7Ozs7OztJQ2xCRCxTQUFnQixVQUFVLENBQUMsR0FBVztRQUNsQyxNQUFNLE1BQU0sR0FBRyxJQUFJLGlCQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLGlDQUFpQztRQUNqQyxhQUFhO1FBQ2IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEdBQUcsZ0NBQWdDLEdBQUcsRUFBRSxDQUFDO0lBQ3RFLENBQUM7O0lBRUQsU0FB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QXNCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDO1FBQ2hELENBQUMsQ0FBQSxDQUNKLENBQUM7SUFDTixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7UUFDRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVEZpbGUgfSBmcm9tICdvYnNpZGlhbidcclxuXHJcbmV4cG9ydCBjbGFzcyBUSkRvY0ZpbGUgZXh0ZW5kcyBURmlsZSB7XHJcbiAgICBwdWJsaWMgZGVzY3JpcHRpb246IHN0cmluZ1xyXG4gICAgcHVibGljIHJldHVybnM6IHN0cmluZ1xyXG4gICAgcHVibGljIGFyZ3VtZW50czogVEpEb2NGaWxlQXJndW1lbnRbXVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGZpbGU6IFRGaWxlKSB7XHJcbiAgICAgICAgc3VwZXIoZmlsZS52YXVsdCwgZmlsZS5wYXRoKVxyXG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgZmlsZSlcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRKRG9jRmlsZUFyZ3VtZW50IHtcclxuICAgIHB1YmxpYyBuYW1lOiBzdHJpbmdcclxuICAgIHB1YmxpYyBkZXNjcmlwdGlvbjogc3RyaW5nXHJcbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGRlc2M6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XHJcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2M7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlckVycm9yIH0gZnJvbSBcIi4vRXJyb3JcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2dfdXBkYXRlKG1zZzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICBjb25zdCBub3RpY2UgPSBuZXcgTm90aWNlKFwiXCIsIDE1MDAwKTtcclxuICAgIC8vIFRPRE86IEZpbmQgYmV0dGVyIHdheSBmb3IgdGhpc1xyXG4gICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgbm90aWNlLm5vdGljZUVsLmlubmVySFRNTCA9IGA8Yj5UZW1wbGF0ZXIgdXBkYXRlPC9iPjo8YnIvPiR7bXNnfWA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2dfZXJyb3IoZTogRXJyb3IgfCBUZW1wbGF0ZXJFcnJvcik6IHZvaWQge1xyXG4gICAgY29uc3Qgbm90aWNlID0gbmV3IE5vdGljZShcIlwiLCA4MDAwKTtcclxuICAgIGlmIChlIGluc3RhbmNlb2YgVGVtcGxhdGVyRXJyb3IgJiYgZS5jb25zb2xlX21zZykge1xyXG4gICAgICAgIC8vIFRPRE86IEZpbmQgYSBiZXR0ZXIgd2F5IGZvciB0aGlzXHJcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgIG5vdGljZS5ub3RpY2VFbC5pbm5lckhUTUwgPSBgPGI+VGVtcGxhdGVyIEVycm9yPC9iPjo8YnIvPiR7ZS5tZXNzYWdlfTxici8+Q2hlY2sgY29uc29sZSBmb3IgbW9yZSBpbmZvcm1hdGlvbmA7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgVGVtcGxhdGVyIEVycm9yOmAsIGUubWVzc2FnZSwgXCJcXG5cIiwgZS5jb25zb2xlX21zZyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICBub3RpY2Uubm90aWNlRWwuaW5uZXJIVE1MID0gYDxiPlRlbXBsYXRlciBFcnJvcjwvYj46PGJyLz4ke2UubWVzc2FnZX1gO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IGxvZ19lcnJvciB9IGZyb20gXCIuL0xvZ1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlckVycm9yIGV4dGVuZHMgRXJyb3Ige1xyXG4gICAgY29uc3RydWN0b3IobXNnOiBzdHJpbmcsIHB1YmxpYyBjb25zb2xlX21zZz86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKG1zZyk7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xyXG4gICAgICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xyXG4gICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlcnJvcldyYXBwZXI8VD4oXHJcbiAgICBmbjogKCkgPT4gUHJvbWlzZTxUPixcclxuICAgIG1zZzogc3RyaW5nXHJcbik6IFByb21pc2U8VD4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgZm4oKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBpZiAoIShlIGluc3RhbmNlb2YgVGVtcGxhdGVyRXJyb3IpKSB7XHJcbiAgICAgICAgICAgIGxvZ19lcnJvcihuZXcgVGVtcGxhdGVyRXJyb3IobXNnLCBlLm1lc3NhZ2UpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsb2dfZXJyb3IoZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsIGFzIFQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlcnJvcldyYXBwZXJTeW5jPFQ+KGZuOiAoKSA9PiBULCBtc2c6IHN0cmluZyk6IFQge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXR1cm4gZm4oKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBsb2dfZXJyb3IobmV3IFRlbXBsYXRlckVycm9yKG1zZywgZS5tZXNzYWdlKSk7XHJcbiAgICAgICAgcmV0dXJuIG51bGwgYXMgVDtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBEb2NCbG9jaywgRG9jTm9kZSwgRG9jUGFyYW1CbG9jaywgRG9jUGFyYW1Db2xsZWN0aW9uLCBEb2NQbGFpblRleHQsIERvY1NlY3Rpb24sIFBhcnNlckNvbnRleHQsIFRTRG9jUGFyc2VyIH0gZnJvbSBcIkBtaWNyb3NvZnQvdHNkb2NcIjtcclxuXHJcbmltcG9ydCB7IFRKRG9jRmlsZSwgVEpEb2NGaWxlQXJndW1lbnQgfSBmcm9tIFwiLi9USkRvY0ZpbGVcIjtcclxuXHJcbmltcG9ydCB7IFRlbXBsYXRlckVycm9yIH0gZnJvbSBcIi4vRXJyb3JcIjtcclxuaW1wb3J0IHtcclxuICAgIEFwcCxcclxuICAgIG5vcm1hbGl6ZVBhdGgsXHJcbiAgICBUQWJzdHJhY3RGaWxlLFxyXG4gICAgVEZpbGUsXHJcbiAgICBURm9sZGVyLFxyXG4gICAgVmF1bHQsXHJcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVsYXkobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVfUmVnRXhwKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpOyAvLyAkJiBtZWFucyB0aGUgd2hvbGUgbWF0Y2hlZCBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlX2NvbW1hbmRfcmVnZXgoKTogUmVnRXhwIHtcclxuICAgIHJldHVybiAvPCUoPzotfF8pP1xccypbKn5dezAsMX0oKD86LnxcXHMpKj8pKD86LXxfKT8lPi9nO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVfZHluYW1pY19jb21tYW5kX3JlZ2V4KCk6IFJlZ0V4cCB7XHJcbiAgICByZXR1cm4gLyg8JSg/Oi18Xyk/XFxzKlsqfl17MCwxfSlcXCsoKD86LnxcXHMpKj8lPikvZztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVfdGZvbGRlcihhcHA6IEFwcCwgZm9sZGVyX3N0cjogc3RyaW5nKTogVEZvbGRlciB7XHJcbiAgICBmb2xkZXJfc3RyID0gbm9ybWFsaXplUGF0aChmb2xkZXJfc3RyKTtcclxuXHJcbiAgICBjb25zdCBmb2xkZXIgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZvbGRlcl9zdHIpO1xyXG4gICAgaWYgKCFmb2xkZXIpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoYEZvbGRlciBcIiR7Zm9sZGVyX3N0cn1cIiBkb2Vzbid0IGV4aXN0YCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIShmb2xkZXIgaW5zdGFuY2VvZiBURm9sZGVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihgJHtmb2xkZXJfc3RyfSBpcyBhIGZpbGUsIG5vdCBhIGZvbGRlcmApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmb2xkZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlX3RmaWxlKGFwcDogQXBwLCBmaWxlX3N0cjogc3RyaW5nKTogVEZpbGUge1xyXG4gICAgZmlsZV9zdHIgPSBub3JtYWxpemVQYXRoKGZpbGVfc3RyKTtcclxuXHJcbiAgICBjb25zdCBmaWxlID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmaWxlX3N0cik7XHJcbiAgICBpZiAoIWZpbGUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoYEZpbGUgXCIke2ZpbGVfc3RyfVwiIGRvZXNuJ3QgZXhpc3RgKTtcclxuICAgIH1cclxuICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoYCR7ZmlsZV9zdHJ9IGlzIGEgZm9sZGVyLCBub3QgYSBmaWxlYCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZpbGU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRfdGZpbGVzX2Zyb21fZm9sZGVyKFxyXG4gICAgYXBwOiBBcHAsXHJcbiAgICBmb2xkZXJfc3RyOiBzdHJpbmdcclxuKTogQXJyYXk8VEZpbGU+IHtcclxuICAgIGNvbnN0IGZvbGRlciA9IHJlc29sdmVfdGZvbGRlcihhcHAsIGZvbGRlcl9zdHIpO1xyXG5cclxuICAgIGNvbnN0IGZpbGVzOiBBcnJheTxURmlsZT4gPSBbXTtcclxuICAgIFZhdWx0LnJlY3Vyc2VDaGlsZHJlbihmb2xkZXIsIChmaWxlOiBUQWJzdHJhY3RGaWxlKSA9PiB7XHJcbiAgICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xyXG4gICAgICAgICAgICBmaWxlcy5wdXNoKGZpbGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZpbGVzLnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICByZXR1cm4gYS5wYXRoLmxvY2FsZUNvbXBhcmUoYi5wYXRoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBmaWxlcztcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBvcHVsYXRlX2RvY3NfZnJvbV91c2VyX3NjcmlwdHMoXHJcbiAgICBhcHA6IEFwcCxcclxuICAgIGZpbGVzOiBBcnJheTxURmlsZT5cclxuKTogUHJvbWlzZTxUSkRvY0ZpbGVbXT4ge1xyXG4gICAgY29uc3QgZG9jRmlsZXMgPSBhd2FpdCBQcm9taXNlLmFsbChmaWxlcy5tYXAoYXN5bmMgZmlsZSA9PiB7XHJcbiAgICAgICAgICAgIC8vIEdldCBmaWxlIGNvbnRlbnRzXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQuY2FjaGVkUmVhZChmaWxlKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgbmV3RG9jRmlsZSA9IGdlbmVyYXRlX2pzZG9jKGZpbGUsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIG5ld0RvY0ZpbGU7XHJcbiAgICAgICAgfVxyXG4gICAgKSk7XHJcblxyXG4gICAgcmV0dXJuIGRvY0ZpbGVzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZV9qc2RvYyhcclxuICAgIGZpbGU6IFRGaWxlLFxyXG4gICAgY29udGVudDogc3RyaW5nXHJcbik6IFRKRG9jRmlsZXtcclxuICAgIC8vIFBhcnNlIHRoZSBjb250ZW50XHJcbiAgICBjb25zdCB0c2RvY1BhcnNlciA9IG5ldyBUU0RvY1BhcnNlcigpO1xyXG4gICAgY29uc3QgcGFyc2VkRG9jID0gdHNkb2NQYXJzZXIucGFyc2VTdHJpbmcoY29udGVudCk7XHJcblxyXG4gICAgLy8gQ29weSBhbmQgZXh0cmFjdCBpbmZvcm1hdGlvbiBpbnRvIHRoZSBUSkRvY0ZpbGVcclxuICAgIGNvbnN0IG5ld0RvY0ZpbGUgPSBuZXcgVEpEb2NGaWxlKGZpbGUpO1xyXG5cclxuICAgIG5ld0RvY0ZpbGUuZGVzY3JpcHRpb24gPSBnZW5lcmF0ZV9qc2RvY19kZXNjcmlwdGlvbihwYXJzZWREb2MuZG9jQ29tbWVudC5zdW1tYXJ5U2VjdGlvbik7XHJcbiAgICBuZXdEb2NGaWxlLnJldHVybnMgPSBnZW5lcmF0ZV9qc2RvY19yZXR1cm4ocGFyc2VkRG9jLmRvY0NvbW1lbnQucmV0dXJuc0Jsb2NrKTtcclxuICAgIG5ld0RvY0ZpbGUuYXJndW1lbnRzID0gZ2VuZXJhdGVfanNkb2NfYXJndW1lbnRzKHBhcnNlZERvYy5kb2NDb21tZW50LnBhcmFtcyk7XHJcblxyXG4gICAgcmV0dXJuIG5ld0RvY0ZpbGVcclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVfanNkb2NfZGVzY3JpcHRpb24oXHJcbiAgICBzdW1tYXJ5U2VjdGlvbjogRG9jU2VjdGlvblxyXG4pIDogc3RyaW5nIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSBzdW1tYXJ5U2VjdGlvbi5ub2Rlcy5tYXAoKG5vZGU6IERvY05vZGUpID0+IFxyXG4gICAgICAgICAgICBub2RlLmdldENoaWxkTm9kZXMoKVxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcigobm9kZTogRG9jTm9kZSkgPT4gbm9kZSBpbnN0YW5jZW9mIERvY1BsYWluVGV4dClcclxuICAgICAgICAgICAgICAgIC5tYXAoKHg6IERvY1BsYWluVGV4dCkgPT4geC50ZXh0KVxyXG4gICAgICAgICAgICAgICAgLmpvaW4oXCJcXG5cIilcclxuICAgICAgICApO1xyXG4gICAgXHJcbiAgICAgICAgcmV0dXJuIGRlc2NyaXB0aW9uLmpvaW4oXCJcXG5cIik7ICAgXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBzdW1hbXJ5IHNlY3Rpb24nKTtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVfanNkb2NfcmV0dXJuKFxyXG4gICAgcmV0dXJuU2VjdGlvbiA6IERvY0Jsb2NrIHwgdW5kZWZpbmVkXHJcbik6IHN0cmluZyB7XHJcbiAgICBpZiAoIXJldHVyblNlY3Rpb24pIHJldHVybiBcIlwiO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmV0dXJuVmFsdWUgPSByZXR1cm5TZWN0aW9uLmNvbnRlbnQubm9kZXNbMF0uZ2V0Q2hpbGROb2RlcygpWzBdLnRleHQudHJpbSgpO1xyXG4gICAgICAgIHJldHVybiByZXR1cm5WYWx1ZTsgICBcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlX2pzZG9jX2FyZ3VtZW50cyhcclxuICAgIHBhcmFtU2VjdGlvbjogRG9jUGFyYW1Db2xsZWN0aW9uXHJcbikgOiBUSkRvY0ZpbGVBcmd1bWVudFtdIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgYmxvY2tzID0gcGFyYW1TZWN0aW9uLmJsb2NrcztcclxuICAgICAgICBjb25zdCBhcmdzID0gYmxvY2tzLm1hcCgoYmxvY2spID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBibG9jay5wYXJhbWV0ZXJOYW1lO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSBibG9jay5jb250ZW50LmdldENoaWxkTm9kZXMoKVswXS5nZXRDaGlsZE5vZGVzKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4IGluc3RhbmNlb2YgRG9jUGxhaW5UZXh0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCh4ID0+IHgudGV4dCkuam9pbihcIiBcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVEpEb2NGaWxlQXJndW1lbnQobmFtZSwgZGVzY3JpcHRpb24pO1xyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICByZXR1cm4gYXJnczsgICBcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYXJyYXltb3ZlPFQ+KFxyXG4gICAgYXJyOiBUW10sXHJcbiAgICBmcm9tSW5kZXg6IG51bWJlcixcclxuICAgIHRvSW5kZXg6IG51bWJlclxyXG4pOiB2b2lkIHtcclxuICAgIGlmICh0b0luZGV4IDwgMCB8fCB0b0luZGV4ID09PSBhcnIubGVuZ3RoKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZWxlbWVudCA9IGFycltmcm9tSW5kZXhdO1xyXG4gICAgYXJyW2Zyb21JbmRleF0gPSBhcnJbdG9JbmRleF07XHJcbiAgICBhcnJbdG9JbmRleF0gPSBlbGVtZW50O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0X2FjdGl2ZV9maWxlKGFwcDogQXBwKSB7XHJcbiAgICByZXR1cm4gYXBwLndvcmtzcGFjZS5hY3RpdmVFZGl0b3I/LmZpbGUgPz8gYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAcGFyYW0gcGF0aCBOb3JtYWxpemVkIGZpbGUgcGF0aFxyXG4gKiBAcmV0dXJucyBGb2xkZXIgcGF0aFxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRfZm9sZGVyX3BhdGhfZnJvbV9wYXRoKG5vcm1hbGl6ZVBhdGgoXCJwYXRoL3RvL2ZvbGRlci9maWxlXCIsIFwibWRcIikpIC8vIHBhdGgvdG8vZm9sZGVyXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0X2ZvbGRlcl9wYXRoX2Zyb21fZmlsZV9wYXRoKHBhdGg6IHN0cmluZykge1xyXG4gICAgY29uc3QgcGF0aF9zZXBhcmF0b3IgPSBwYXRoLmxhc3RJbmRleE9mKFwiL1wiKTtcclxuICAgIGlmIChwYXRoX3NlcGFyYXRvciAhPT0gLTEpIHJldHVybiBwYXRoLnNsaWNlKDAsIHBhdGhfc2VwYXJhdG9yKTtcclxuICAgIHJldHVybiBcIlwiO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNfb2JqZWN0KG9iajogdW5rbm93bik6IG9iaiBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XHJcbiAgICByZXR1cm4gb2JqICE9PSBudWxsICYmIHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRfZm5fcGFyYW1zKGZ1bmM6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24pIHtcclxuICAgIGNvbnN0IHN0ciA9IGZ1bmMudG9TdHJpbmcoKTtcclxuICAgIGNvbnN0IGxlbiA9IHN0ci5pbmRleE9mKFwiKFwiKTtcclxuICAgIHJldHVybiBzdHJcclxuICAgICAgICAuc3Vic3RyaW5nKGxlbiArIDEsIHN0ci5pbmRleE9mKFwiKVwiKSlcclxuICAgICAgICAucmVwbGFjZSgvIC9nLCBcIlwiKVxyXG4gICAgICAgIC5zcGxpdChcIixcIik7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBVc2UgYSBwYXJlbnQgSHRtbEVsZW1lbnQgdG8gY3JlYXRlIGEgbGFiZWwgd2l0aCBhIHZhbHVlXHJcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBIdG1sRWxlbWVudDsgVXNlIEh0bWxPTGlzdEVsZW1lbnQgdG8gcmV0dXJuIGEgYGxpYCBlbGVtZW50XHJcbiAqIEBwYXJhbSB0aXRsZSBUaGUgdGl0bGUgZm9yIHRoZSBsYWJlbCB3aGljaCB3aWxsIGJlIGJvbGRlZFxyXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSBsYWJlbFxyXG4gKiBAcmV0dXJucyBBIGxhYmVsIEh0bWxFbGVtZW50IChwIHwgbGkpXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kX2JvbGRlZF9sYWJlbF93aXRoX3ZhbHVlX3RvX3BhcmVudChcclxuICAgIHBhcmVudDogSFRNTEVsZW1lbnQsXHJcbiAgICAgdGl0bGU6IHN0cmluZyxcclxuICAgICB2YWx1ZTogc3RyaW5nXHJcbik6IEhUTUxFbGVtZW50e1xyXG4gICAgY29uc3QgdGFnID0gcGFyZW50IGluc3RhbmNlb2YgSFRNTE9MaXN0RWxlbWVudCA/IFwibGlcIiA6IFwicFwiOyAgXHJcblxyXG4gICAgY29uc3QgcGFyYSA9IHBhcmVudC5jcmVhdGVFbCh0YWcpO1xyXG4gICAgY29uc3QgYm9sZCA9IHBhcmVudC5jcmVhdGVFbCgnYicsIHt0ZXh0OiB0aXRsZX0pO1xyXG4gICAgcGFyYS5hcHBlbmRDaGlsZChib2xkKTtcclxuICAgIHBhcmEuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoYDogJHt2YWx1ZX1gKSlcclxuXHJcbiAgICAvLyBSZXR1cm5zIGEgcCBvciBsaSBlbGVtZW50XHJcbiAgICAvLyBSZXN1bHRpbmcgaW4gPGI+VGl0bGU8L2I+OiB2YWx1ZVxyXG4gICAgcmV0dXJuIHBhcmE7XHJcbn1cclxuIiwiaW1wb3J0IHsgUnVubmluZ0NvbmZpZyB9IGZyb20gXCJjb3JlL1RlbXBsYXRlclwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJR2VuZXJhdGVPYmplY3Qge1xyXG4gICAgZ2VuZXJhdGVfb2JqZWN0KGNvbmZpZzogUnVubmluZ0NvbmZpZyk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+O1xyXG59XHJcbiIsImltcG9ydCBUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIm1haW5cIjtcclxuaW1wb3J0IHsgZXJyb3JXcmFwcGVyIH0gZnJvbSBcInV0aWxzL0Vycm9yXCI7XHJcbmltcG9ydCB7IGdldF9mbl9wYXJhbXMsIGdldF90ZmlsZXNfZnJvbV9mb2xkZXIsIGlzX29iamVjdCwgcG9wdWxhdGVfZG9jc19mcm9tX3VzZXJfc2NyaXB0cyB9IGZyb20gXCJ1dGlscy9VdGlsc1wiO1xyXG5pbXBvcnQgZG9jdW1lbnRhdGlvbiBmcm9tIFwiLi4vLi4vZG9jcy9kb2N1bWVudGF0aW9uLnRvbWxcIjtcclxuXHJcbmNvbnN0IG1vZHVsZV9uYW1lcyA9IFtcclxuICAgIFwiYXBwXCIsXHJcbiAgICBcImNvbmZpZ1wiLFxyXG4gICAgXCJkYXRlXCIsXHJcbiAgICBcImZpbGVcIixcclxuICAgIFwiZnJvbnRtYXR0ZXJcIixcclxuICAgIFwiaG9va3NcIixcclxuICAgIFwib2JzaWRpYW5cIixcclxuICAgIFwic3lzdGVtXCIsXHJcbiAgICBcInVzZXJcIixcclxuICAgIFwid2ViXCIsXHJcbl0gYXMgY29uc3Q7XHJcbmV4cG9ydCB0eXBlIE1vZHVsZU5hbWUgPSAodHlwZW9mIG1vZHVsZV9uYW1lcylbbnVtYmVyXTtcclxuY29uc3QgbW9kdWxlX25hbWVzX2NoZWNrZXI6IFNldDxzdHJpbmc+ID0gbmV3IFNldChtb2R1bGVfbmFtZXMpO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzX21vZHVsZV9uYW1lKHg6IHVua25vd24pOiB4IGlzIE1vZHVsZU5hbWUge1xyXG4gICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcInN0cmluZ1wiICYmIG1vZHVsZV9uYW1lc19jaGVja2VyLmhhcyh4KTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgVHBEb2N1bWVudGF0aW9uID0ge1xyXG4gICAgdHA6IHtcclxuICAgICAgICBba2V5IGluIE1vZHVsZU5hbWVdOiBUcE1vZHVsZURvY3VtZW50YXRpb247XHJcbiAgICB9O1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgVHBNb2R1bGVEb2N1bWVudGF0aW9uID0ge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgcXVlcnlLZXk6IHN0cmluZztcclxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbiAgICBmdW5jdGlvbnM6IHtcclxuICAgICAgICBba2V5OiBzdHJpbmddOiBUcEZ1bmN0aW9uRG9jdW1lbnRhdGlvbjtcclxuICAgIH07XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBUcEZ1bmN0aW9uRG9jdW1lbnRhdGlvbiA9IHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHF1ZXJ5S2V5OiBzdHJpbmc7XHJcbiAgICBkZWZpbml0aW9uOiBzdHJpbmc7XHJcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG4gICAgcmV0dXJuczogc3RyaW5nO1xyXG4gICAgZXhhbXBsZTogc3RyaW5nO1xyXG4gICAgYXJncz86IHtcclxuICAgICAgICBba2V5OiBzdHJpbmddOiBUcEFyZ3VtZW50RG9jdW1lbnRhdGlvbjtcclxuICAgIH07XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBUcEFyZ3VtZW50RG9jdW1lbnRhdGlvbiA9IHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBUcFN1Z2dlc3REb2N1bWVudGF0aW9uID1cclxuICAgIHwgVHBNb2R1bGVEb2N1bWVudGF0aW9uXHJcbiAgICB8IFRwRnVuY3Rpb25Eb2N1bWVudGF0aW9uXHJcbiAgICB8IFRwQXJndW1lbnREb2N1bWVudGF0aW9uO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzX2Z1bmN0aW9uX2RvY3VtZW50YXRpb24oXHJcbiAgICB4OiBUcFN1Z2dlc3REb2N1bWVudGF0aW9uXHJcbik6IHggaXMgVHBGdW5jdGlvbkRvY3VtZW50YXRpb24ge1xyXG4gICAgaWYgKCh4IGFzIFRwRnVuY3Rpb25Eb2N1bWVudGF0aW9uKS5kZWZpbml0aW9uIHx8XHJcbiAgICAgICAgKHggYXMgVHBGdW5jdGlvbkRvY3VtZW50YXRpb24pLnJldHVybnMgfHxcclxuICAgICAgICAoeCBhcyBUcEZ1bmN0aW9uRG9jdW1lbnRhdGlvbikuYXJncykge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRG9jdW1lbnRhdGlvbiB7XHJcbiAgICBwdWJsaWMgZG9jdW1lbnRhdGlvbjogVHBEb2N1bWVudGF0aW9uID0gZG9jdW1lbnRhdGlvbjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luKSB7fVxyXG5cclxuICAgIGdldF9hbGxfbW9kdWxlc19kb2N1bWVudGF0aW9uKCk6IFRwTW9kdWxlRG9jdW1lbnRhdGlvbltdIHtcclxuICAgICAgICBsZXQgdHAgPSB0aGlzLmRvY3VtZW50YXRpb24udHBcclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlICd1c2VyJyBpZiBubyB1c2VyIHNjcmlwdHMgZm91bmRcclxuICAgICAgICBpZiAoIXRoaXMucGx1Z2luLnNldHRpbmdzIHx8XHJcbiAgICAgICAgICAgICF0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VyX3NjcmlwdHNfZm9sZGVyKSB7XHJcbiAgICAgICAgICAgIHRwID0gT2JqZWN0LnZhbHVlcyh0cCkuZmlsdGVyKCh4KSA9PiB4Lm5hbWUgIT09ICd1c2VyJylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBPYmplY3QudmFsdWVzKHRwKS5tYXAoKG1vZCkgPT4ge1xyXG4gICAgICAgICAgICBtb2QucXVlcnlLZXkgPSBtb2QubmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIG1vZDtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZXRfYWxsX2Z1bmN0aW9uc19kb2N1bWVudGF0aW9uKFxyXG4gICAgICAgIG1vZHVsZV9uYW1lOiBNb2R1bGVOYW1lLFxyXG4gICAgICAgIGZ1bmN0aW9uX25hbWU6IHN0cmluZ1xyXG4gICAgKTogUHJvbWlzZTxUcEZ1bmN0aW9uRG9jdW1lbnRhdGlvbltdIHwgdW5kZWZpbmVkPiB7XHJcbiAgICAgICAgaWYgKG1vZHVsZV9uYW1lID09PSBcImFwcFwiKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldF9hcHBfZnVuY3Rpb25zX2RvY3VtZW50YXRpb24oXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbl9uYW1lXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtb2R1bGVfbmFtZSA9PT0gXCJ1c2VyXCIpIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgIXRoaXMucGx1Z2luLnNldHRpbmdzIHx8XHJcbiAgICAgICAgICAgICAgICAhdGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlcl9zY3JpcHRzX2ZvbGRlclxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICAgICAgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gZ2V0X3RmaWxlc19mcm9tX2ZvbGRlcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VyX3NjcmlwdHNfZm9sZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgKS5maWx0ZXIoeCA9PiB4LmV4dGVuc2lvbiA9PSBcImpzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jRmlsZXMgPSBhd2FpdCBwb3B1bGF0ZV9kb2NzX2Zyb21fdXNlcl9zY3JpcHRzKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2NGaWxlcztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBgVXNlciBTY3JpcHRzIGZvbGRlciBkb2Vzbid0IGV4aXN0YFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAoIWZpbGVzIHx8IGZpbGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsZXMucmVkdWNlPFRwRnVuY3Rpb25Eb2N1bWVudGF0aW9uW10+KFxyXG4gICAgICAgICAgICAgICAgKHByb2Nlc3NlZEZpbGVzLCBmaWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUuZXh0ZW5zaW9uICE9PSBcImpzXCIpIHJldHVybiBwcm9jZXNzZWRGaWxlcztcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnByb2Nlc3NlZEZpbGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLmJhc2VuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVlcnlLZXk6IGZpbGUuYmFzZW5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZpbml0aW9uOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGZpbGUuZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5zOiBmaWxlLnJldHVybnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiBmaWxlLmFyZ3VtZW50cy5yZWR1Y2U8e1trZXk6IHN0cmluZ106IFRwQXJndW1lbnREb2N1bWVudGF0aW9ufT4oKGFjYywgYXJnKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjW2FyZy5uYW1lXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXJnLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBhcmcuZGVzY3JpcHRpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7fSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGFtcGxlOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBbXVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRoaXMuZG9jdW1lbnRhdGlvbi50cFttb2R1bGVfbmFtZV0uZnVuY3Rpb25zKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIE9iamVjdC52YWx1ZXModGhpcy5kb2N1bWVudGF0aW9uLnRwW21vZHVsZV9uYW1lXS5mdW5jdGlvbnMpLm1hcChcclxuICAgICAgICAgICAgKG1vZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbW9kLnF1ZXJ5S2V5ID0gbW9kLm5hbWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbW9kO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldF9hcHBfZnVuY3Rpb25zX2RvY3VtZW50YXRpb24oXHJcbiAgICAgICAgb2JqOiB1bmtub3duLFxyXG4gICAgICAgIHBhdGg6IHN0cmluZ1xyXG4gICAgKTogVHBGdW5jdGlvbkRvY3VtZW50YXRpb25bXSB7XHJcbiAgICAgICAgaWYgKCFpc19vYmplY3Qob2JqKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHBhcnRzID0gcGF0aC5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY3VycmVudE9iaiA9IG9iajtcclxuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcGFydHMubGVuZ3RoIC0gMTsgaW5kZXgrKykge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHNbaW5kZXhdO1xyXG4gICAgICAgICAgICBpZiAocGFydCBpbiBjdXJyZW50T2JqKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzX29iamVjdChjdXJyZW50T2JqW3BhcnRdKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGN1cnJlbnRPYmogPSBjdXJyZW50T2JqW3BhcnRdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBkZWZpbml0aW9uUHJlZml4ID0gW1xyXG4gICAgICAgICAgICBcInRwXCIsXHJcbiAgICAgICAgICAgIFwiYXBwXCIsXHJcbiAgICAgICAgICAgIC4uLnBhcnRzLnNsaWNlKDAsIHBhcnRzLmxlbmd0aCAtIDEpLFxyXG4gICAgICAgIF0uam9pbihcIi5cIik7XHJcbiAgICAgICAgY29uc3QgcXVlcnlLZXlQcmVmaXggPSBwYXJ0cy5zbGljZSgwLCBwYXJ0cy5sZW5ndGggLSAxKS5qb2luKFwiLlwiKTtcclxuICAgICAgICBjb25zdCBkb2NzOiBUcEZ1bmN0aW9uRG9jdW1lbnRhdGlvbltdID0gW107XHJcbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gY3VycmVudE9iaikge1xyXG4gICAgICAgICAgICBjb25zdCBkZWZpbml0aW9uID0gYCR7ZGVmaW5pdGlvblByZWZpeH0uJHtrZXl9YDtcclxuICAgICAgICAgICAgY29uc3QgcXVlcnlLZXkgPSBxdWVyeUtleVByZWZpeCA/IGAke3F1ZXJ5S2V5UHJlZml4fS4ke2tleX1gIDoga2V5O1xyXG4gICAgICAgICAgICBkb2NzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbmFtZToga2V5LFxyXG4gICAgICAgICAgICAgICAgcXVlcnlLZXksXHJcbiAgICAgICAgICAgICAgICBkZWZpbml0aW9uOlxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiBjdXJyZW50T2JqW2tleV0gPT09IFwiZnVuY3Rpb25cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGAke2RlZmluaXRpb259KCR7Z2V0X2ZuX3BhcmFtcyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudE9ialtrZXldIGFzICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd25cclxuICAgICAgICAgICAgICAgICAgICAgICAgICApfSlgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogZGVmaW5pdGlvbixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuczogXCJcIixcclxuICAgICAgICAgICAgICAgIGV4YW1wbGU6IFwiXCIsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRvY3M7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0X21vZHVsZV9kb2N1bWVudGF0aW9uKG1vZHVsZV9uYW1lOiBNb2R1bGVOYW1lKTogVHBNb2R1bGVEb2N1bWVudGF0aW9uIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kb2N1bWVudGF0aW9uLnRwW21vZHVsZV9uYW1lXTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRfZnVuY3Rpb25fZG9jdW1lbnRhdGlvbihcclxuICAgICAgICBtb2R1bGVfbmFtZTogTW9kdWxlTmFtZSxcclxuICAgICAgICBmdW5jdGlvbl9uYW1lOiBzdHJpbmdcclxuICAgICk6IFRwRnVuY3Rpb25Eb2N1bWVudGF0aW9uIHwgbnVsbCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRhdGlvbi50cFttb2R1bGVfbmFtZV0uZnVuY3Rpb25zW2Z1bmN0aW9uX25hbWVdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldF9hcmd1bWVudF9kb2N1bWVudGF0aW9uKFxyXG4gICAgICAgIG1vZHVsZV9uYW1lOiBNb2R1bGVOYW1lLFxyXG4gICAgICAgIGZ1bmN0aW9uX25hbWU6IHN0cmluZyxcclxuICAgICAgICBhcmd1bWVudF9uYW1lOiBzdHJpbmdcclxuICAgICk6IFRwQXJndW1lbnREb2N1bWVudGF0aW9uIHwgbnVsbCB7XHJcbiAgICAgICAgY29uc3QgZnVuY3Rpb25fZG9jID0gdGhpcy5nZXRfZnVuY3Rpb25fZG9jdW1lbnRhdGlvbihcclxuICAgICAgICAgICAgbW9kdWxlX25hbWUsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uX25hbWVcclxuICAgICAgICApO1xyXG4gICAgICAgIGlmICghZnVuY3Rpb25fZG9jIHx8ICFmdW5jdGlvbl9kb2MuYXJncykge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uX2RvYy5hcmdzW2FyZ3VtZW50X25hbWVdO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCBUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIm1haW5cIjtcclxuaW1wb3J0IHsgUnVubmluZ0NvbmZpZyB9IGZyb20gXCJjb3JlL1RlbXBsYXRlclwiO1xyXG5pbXBvcnQgeyBJR2VuZXJhdGVPYmplY3QgfSBmcm9tIFwiY29yZS9mdW5jdGlvbnMvSUdlbmVyYXRlT2JqZWN0XCI7XHJcbmltcG9ydCB7IE1vZHVsZU5hbWUgfSBmcm9tIFwiZWRpdG9yL1RwRG9jdW1lbnRhdGlvblwiO1xyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEludGVybmFsTW9kdWxlIGltcGxlbWVudHMgSUdlbmVyYXRlT2JqZWN0IHtcclxuICAgIHB1YmxpYyBhYnN0cmFjdCBuYW1lOiBNb2R1bGVOYW1lO1xyXG4gICAgcHJvdGVjdGVkIHN0YXRpY19mdW5jdGlvbnM6IE1hcDxzdHJpbmcsIHVua25vd24+ID0gbmV3IE1hcCgpO1xyXG4gICAgcHJvdGVjdGVkIGR5bmFtaWNfZnVuY3Rpb25zOiBNYXA8c3RyaW5nLCB1bmtub3duPiA9IG5ldyBNYXAoKTtcclxuICAgIHByb3RlY3RlZCBjb25maWc6IFJ1bm5pbmdDb25maWc7XHJcbiAgICBwcm90ZWN0ZWQgc3RhdGljX29iamVjdDogeyBbeDogc3RyaW5nXTogdW5rbm93biB9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge31cclxuXHJcbiAgICBnZXROYW1lKCk6IE1vZHVsZU5hbWUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgYWJzdHJhY3QgY3JlYXRlX3N0YXRpY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPjtcclxuICAgIGFic3RyYWN0IGNyZWF0ZV9keW5hbWljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+O1xyXG4gICAgYWJzdHJhY3QgdGVhcmRvd24oKTogUHJvbWlzZTx2b2lkPjtcclxuXHJcbiAgICBhc3luYyBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlX3N0YXRpY190ZW1wbGF0ZXMoKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19vYmplY3QgPSBPYmplY3QuZnJvbUVudHJpZXModGhpcy5zdGF0aWNfZnVuY3Rpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZW5lcmF0ZV9vYmplY3QoXHJcbiAgICAgICAgbmV3X2NvbmZpZzogUnVubmluZ0NvbmZpZ1xyXG4gICAgKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xyXG4gICAgICAgIHRoaXMuY29uZmlnID0gbmV3X2NvbmZpZztcclxuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZV9keW5hbWljX3RlbXBsYXRlcygpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAuLi50aGlzLnN0YXRpY19vYmplY3QsXHJcbiAgICAgICAgICAgIC4uLk9iamVjdC5mcm9tRW50cmllcyh0aGlzLmR5bmFtaWNfZnVuY3Rpb25zKSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IG1vbWVudCB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZSB9IGZyb20gXCIuLi9JbnRlcm5hbE1vZHVsZVwiO1xyXG5pbXBvcnQgeyBNb2R1bGVOYW1lIH0gZnJvbSBcImVkaXRvci9UcERvY3VtZW50YXRpb25cIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBJbnRlcm5hbE1vZHVsZURhdGUgZXh0ZW5kcyBJbnRlcm5hbE1vZHVsZSB7XHJcbiAgICBwdWJsaWMgbmFtZTogTW9kdWxlTmFtZSA9IFwiZGF0ZVwiO1xyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9zdGF0aWNfdGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJub3dcIiwgdGhpcy5nZW5lcmF0ZV9ub3coKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcInRvbW9ycm93XCIsIHRoaXMuZ2VuZXJhdGVfdG9tb3Jyb3coKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcIndlZWtkYXlcIiwgdGhpcy5nZW5lcmF0ZV93ZWVrZGF5KCkpO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJ5ZXN0ZXJkYXlcIiwgdGhpcy5nZW5lcmF0ZV95ZXN0ZXJkYXkoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgY3JlYXRlX2R5bmFtaWNfdGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge31cclxuXHJcbiAgICBhc3luYyB0ZWFyZG93bigpOiBQcm9taXNlPHZvaWQ+IHt9XHJcblxyXG4gICAgZ2VuZXJhdGVfbm93KCk6IChcclxuICAgICAgICBmb3JtYXQ/OiBzdHJpbmcsXHJcbiAgICAgICAgb2Zmc2V0PzogbnVtYmVyIHwgc3RyaW5nLFxyXG4gICAgICAgIHJlZmVyZW5jZT86IHN0cmluZyxcclxuICAgICAgICByZWZlcmVuY2VfZm9ybWF0Pzogc3RyaW5nXHJcbiAgICApID0+IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgZm9ybWF0ID0gXCJZWVlZLU1NLUREXCIsXHJcbiAgICAgICAgICAgIG9mZnNldD86IG51bWJlciB8IHN0cmluZyxcclxuICAgICAgICAgICAgcmVmZXJlbmNlPzogc3RyaW5nLFxyXG4gICAgICAgICAgICByZWZlcmVuY2VfZm9ybWF0Pzogc3RyaW5nXHJcbiAgICAgICAgKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZWZlcmVuY2UgJiYgIW1vbWVudChyZWZlcmVuY2UsIHJlZmVyZW5jZV9mb3JtYXQpLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRlbXBsYXRlckVycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiSW52YWxpZCByZWZlcmVuY2UgZGF0ZSBmb3JtYXQsIHRyeSBzcGVjaWZ5aW5nIG9uZSB3aXRoIHRoZSBhcmd1bWVudCAncmVmZXJlbmNlX2Zvcm1hdCdcIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgZHVyYXRpb247XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2Zmc2V0ID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IG1vbWVudC5kdXJhdGlvbihvZmZzZXQpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvZmZzZXQgPT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gbW9tZW50LmR1cmF0aW9uKG9mZnNldCwgXCJkYXlzXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50KHJlZmVyZW5jZSwgcmVmZXJlbmNlX2Zvcm1hdClcclxuICAgICAgICAgICAgICAgIC5hZGQoZHVyYXRpb24pXHJcbiAgICAgICAgICAgICAgICAuZm9ybWF0KGZvcm1hdCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV90b21vcnJvdygpOiAoZm9ybWF0Pzogc3RyaW5nKSA9PiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAoZm9ybWF0ID0gXCJZWVlZLU1NLUREXCIpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudCgpLmFkZCgxLCBcImRheXNcIikuZm9ybWF0KGZvcm1hdCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV93ZWVrZGF5KCk6IChcclxuICAgICAgICBmb3JtYXQ6IHN0cmluZyxcclxuICAgICAgICB3ZWVrZGF5OiBudW1iZXIsXHJcbiAgICAgICAgcmVmZXJlbmNlPzogc3RyaW5nLFxyXG4gICAgICAgIHJlZmVyZW5jZV9mb3JtYXQ/OiBzdHJpbmdcclxuICAgICkgPT4gc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBmb3JtYXQgPSBcIllZWVktTU0tRERcIixcclxuICAgICAgICAgICAgd2Vla2RheTogbnVtYmVyLFxyXG4gICAgICAgICAgICByZWZlcmVuY2U/OiBzdHJpbmcsXHJcbiAgICAgICAgICAgIHJlZmVyZW5jZV9mb3JtYXQ/OiBzdHJpbmdcclxuICAgICAgICApID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlZmVyZW5jZSAmJiAhbW9tZW50KHJlZmVyZW5jZSwgcmVmZXJlbmNlX2Zvcm1hdCkuaXNWYWxpZCgpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJJbnZhbGlkIHJlZmVyZW5jZSBkYXRlIGZvcm1hdCwgdHJ5IHNwZWNpZnlpbmcgb25lIHdpdGggdGhlIGFyZ3VtZW50ICdyZWZlcmVuY2VfZm9ybWF0J1wiXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQocmVmZXJlbmNlLCByZWZlcmVuY2VfZm9ybWF0KVxyXG4gICAgICAgICAgICAgICAgLndlZWtkYXkod2Vla2RheSlcclxuICAgICAgICAgICAgICAgIC5mb3JtYXQoZm9ybWF0KTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX3llc3RlcmRheSgpOiAoZm9ybWF0Pzogc3RyaW5nKSA9PiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAoZm9ybWF0ID0gXCJZWVlZLU1NLUREXCIpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudCgpLmFkZCgtMSwgXCJkYXlzXCIpLmZvcm1hdChmb3JtYXQpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGUgfSBmcm9tIFwiLi4vSW50ZXJuYWxNb2R1bGVcIjtcclxuaW1wb3J0IHsgbG9nX2Vycm9yIH0gZnJvbSBcInV0aWxzL0xvZ1wiO1xyXG5pbXBvcnQge1xyXG4gICAgRmlsZVN5c3RlbUFkYXB0ZXIsXHJcbiAgICBnZXRBbGxUYWdzLFxyXG4gICAgbW9tZW50LFxyXG4gICAgbm9ybWFsaXplUGF0aCxcclxuICAgIHBhcnNlTGlua3RleHQsXHJcbiAgICBQbGF0Zm9ybSxcclxuICAgIHJlc29sdmVTdWJwYXRoLFxyXG4gICAgVEZpbGUsXHJcbiAgICBURm9sZGVyLFxyXG59IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5pbXBvcnQgeyBNb2R1bGVOYW1lIH0gZnJvbSBcImVkaXRvci9UcERvY3VtZW50YXRpb25cIjtcclxuXHJcbmV4cG9ydCBjb25zdCBERVBUSF9MSU1JVCA9IDEwO1xyXG5cclxuZXhwb3J0IGNsYXNzIEludGVybmFsTW9kdWxlRmlsZSBleHRlbmRzIEludGVybmFsTW9kdWxlIHtcclxuICAgIHB1YmxpYyBuYW1lOiBNb2R1bGVOYW1lID0gXCJmaWxlXCI7XHJcbiAgICBwcml2YXRlIGluY2x1ZGVfZGVwdGggPSAwO1xyXG4gICAgcHJpdmF0ZSBjcmVhdGVfbmV3X2RlcHRoID0gMDtcclxuICAgIHByaXZhdGUgbGlua3BhdGhfcmVnZXggPSBuZXcgUmVnRXhwKFwiXlxcXFxbXFxcXFsoLiopXFxcXF1cXFxcXSRcIik7XHJcblxyXG4gICAgYXN5bmMgY3JlYXRlX3N0YXRpY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcclxuICAgICAgICAgICAgXCJjcmVhdGlvbl9kYXRlXCIsXHJcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVfY3JlYXRpb25fZGF0ZSgpXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwiY3JlYXRlX25ld1wiLCB0aGlzLmdlbmVyYXRlX2NyZWF0ZV9uZXcoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcImN1cnNvclwiLCB0aGlzLmdlbmVyYXRlX2N1cnNvcigpKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFxyXG4gICAgICAgICAgICBcImN1cnNvcl9hcHBlbmRcIixcclxuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZV9jdXJzb3JfYXBwZW5kKClcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJleGlzdHNcIiwgdGhpcy5nZW5lcmF0ZV9leGlzdHMoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcImZpbmRfdGZpbGVcIiwgdGhpcy5nZW5lcmF0ZV9maW5kX3RmaWxlKCkpO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJmb2xkZXJcIiwgdGhpcy5nZW5lcmF0ZV9mb2xkZXIoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcImluY2x1ZGVcIiwgdGhpcy5nZW5lcmF0ZV9pbmNsdWRlKCkpO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXHJcbiAgICAgICAgICAgIFwibGFzdF9tb2RpZmllZF9kYXRlXCIsXHJcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVfbGFzdF9tb2RpZmllZF9kYXRlKClcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJtb3ZlXCIsIHRoaXMuZ2VuZXJhdGVfbW92ZSgpKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwicGF0aFwiLCB0aGlzLmdlbmVyYXRlX3BhdGgoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcInJlbmFtZVwiLCB0aGlzLmdlbmVyYXRlX3JlbmFtZSgpKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwic2VsZWN0aW9uXCIsIHRoaXMuZ2VuZXJhdGVfc2VsZWN0aW9uKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9keW5hbWljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLmR5bmFtaWNfZnVuY3Rpb25zLnNldChcImNvbnRlbnRcIiwgYXdhaXQgdGhpcy5nZW5lcmF0ZV9jb250ZW50KCkpO1xyXG4gICAgICAgIHRoaXMuZHluYW1pY19mdW5jdGlvbnMuc2V0KFwidGFnc1wiLCB0aGlzLmdlbmVyYXRlX3RhZ3MoKSk7XHJcbiAgICAgICAgdGhpcy5keW5hbWljX2Z1bmN0aW9ucy5zZXQoXCJ0aXRsZVwiLCB0aGlzLmdlbmVyYXRlX3RpdGxlKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHRlYXJkb3duKCk6IFByb21pc2U8dm9pZD4ge31cclxuXHJcbiAgICBhc3luYyBnZW5lcmF0ZV9jb250ZW50KCk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5yZWFkKHRoaXMuY29uZmlnLnRhcmdldF9maWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9jcmVhdGVfbmV3KCk6IChcclxuICAgICAgICB0ZW1wbGF0ZTogVEZpbGUgfCBzdHJpbmcsXHJcbiAgICAgICAgZmlsZW5hbWU6IHN0cmluZyxcclxuICAgICAgICBvcGVuX25ldzogYm9vbGVhbixcclxuICAgICAgICBmb2xkZXI/OiBURm9sZGVyIHwgc3RyaW5nXHJcbiAgICApID0+IFByb21pc2U8VEZpbGUgfCB1bmRlZmluZWQ+IHtcclxuICAgICAgICByZXR1cm4gYXN5bmMgKFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZTogVEZpbGUgfCBzdHJpbmcsXHJcbiAgICAgICAgICAgIGZpbGVuYW1lOiBzdHJpbmcsXHJcbiAgICAgICAgICAgIG9wZW5fbmV3ID0gZmFsc2UsXHJcbiAgICAgICAgICAgIGZvbGRlcj86IFRGb2xkZXIgfCBzdHJpbmdcclxuICAgICAgICApID0+IHtcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVfbmV3X2RlcHRoICs9IDE7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNyZWF0ZV9uZXdfZGVwdGggPiBERVBUSF9MSU1JVCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVfbmV3X2RlcHRoID0gMDtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBcIlJlYWNoZWQgY3JlYXRlX25ldyBkZXB0aCBsaW1pdCAobWF4ID0gMTApXCJcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IG5ld19maWxlID1cclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnRlbXBsYXRlci5jcmVhdGVfbmV3X25vdGVfZnJvbV90ZW1wbGF0ZShcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZSxcclxuICAgICAgICAgICAgICAgICAgICBmb2xkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgb3Blbl9uZXdcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZV9uZXdfZGVwdGggLT0gMTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXdfZmlsZTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2NyZWF0aW9uX2RhdGUoKTogKGZvcm1hdD86IHN0cmluZykgPT4gc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gKGZvcm1hdCA9IFwiWVlZWS1NTS1ERCBISDptbVwiKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQodGhpcy5jb25maWcudGFyZ2V0X2ZpbGUuc3RhdC5jdGltZSkuZm9ybWF0KGZvcm1hdCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9jdXJzb3IoKTogKG9yZGVyPzogbnVtYmVyKSA9PiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAob3JkZXI/OiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgLy8gSGFjayB0byBwcmV2ZW50IGVtcHR5IG91dHB1dFxyXG4gICAgICAgICAgICByZXR1cm4gYDwlIHRwLmZpbGUuY3Vyc29yKCR7b3JkZXIgPz8gXCJcIn0pICU+YDtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2N1cnNvcl9hcHBlbmQoKTogKGNvbnRlbnQ6IHN0cmluZykgPT4gdm9pZCB7XHJcbiAgICAgICAgcmV0dXJuIChjb250ZW50OiBzdHJpbmcpOiBzdHJpbmcgfCB1bmRlZmluZWQgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVfZWRpdG9yID0gdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5hY3RpdmVFZGl0b3I7XHJcbiAgICAgICAgICAgIGlmICghYWN0aXZlX2VkaXRvciB8fCAhYWN0aXZlX2VkaXRvci5lZGl0b3IpIHtcclxuICAgICAgICAgICAgICAgIGxvZ19lcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiTm8gYWN0aXZlIGVkaXRvciwgY2FuJ3QgYXBwZW5kIHRvIGN1cnNvci5cIlxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGFjdGl2ZV9lZGl0b3IuZWRpdG9yO1xyXG4gICAgICAgICAgICBjb25zdCBkb2MgPSBlZGl0b3IuZ2V0RG9jKCk7XHJcbiAgICAgICAgICAgIGRvYy5yZXBsYWNlU2VsZWN0aW9uKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2V4aXN0cygpOiAoZmlsZXBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jIChmaWxlcGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBub3JtYWxpemVQYXRoKGZpbGVwYXRoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5leGlzdHMocGF0aCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9maW5kX3RmaWxlKCk6IChmaWxlbmFtZTogc3RyaW5nKSA9PiBURmlsZSB8IG51bGwge1xyXG4gICAgICAgIHJldHVybiAoZmlsZW5hbWU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChmaWxlbmFtZSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChwYXRoLCBcIlwiKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2ZvbGRlcigpOiAoYWJzb2x1dGU/OiBib29sZWFuKSA9PiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAoYWJzb2x1dGUgPSBmYWxzZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLmNvbmZpZy50YXJnZXRfZmlsZS5wYXJlbnQ7XHJcbiAgICAgICAgICAgIGxldCBmb2xkZXI7XHJcblxyXG4gICAgICAgICAgICBpZiAoYWJzb2x1dGUpIHtcclxuICAgICAgICAgICAgICAgIGZvbGRlciA9IHBhcmVudC5wYXRoO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZm9sZGVyID0gcGFyZW50Lm5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmb2xkZXI7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9pbmNsdWRlKCk6IChpbmNsdWRlX2xpbms6IHN0cmluZyB8IFRGaWxlKSA9PiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIHJldHVybiBhc3luYyAoaW5jbHVkZV9saW5rOiBzdHJpbmcgfCBURmlsZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgbXV0ZXggZm9yIHRoaXMsIHRoaXMgbWF5IGN1cnJlbnRseSBsZWFkIHRvIGEgcmFjZSBjb25kaXRpb24uXHJcbiAgICAgICAgICAgIC8vIFdoaWxlIG5vdCB2ZXJ5IGltcGFjdGZ1bCwgdGhhdCBjb3VsZCBzdGlsbCBiZSBhbm5veWluZy5cclxuICAgICAgICAgICAgdGhpcy5pbmNsdWRlX2RlcHRoICs9IDE7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmluY2x1ZGVfZGVwdGggPiBERVBUSF9MSU1JVCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbmNsdWRlX2RlcHRoIC09IDE7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJSZWFjaGVkIGluY2x1c2lvbiBkZXB0aCBsaW1pdCAobWF4ID0gMTApXCJcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBpbmNfZmlsZV9jb250ZW50OiBzdHJpbmc7XHJcblxyXG4gICAgICAgICAgICBpZiAoaW5jbHVkZV9saW5rIGluc3RhbmNlb2YgVEZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGluY19maWxlX2NvbnRlbnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5hcHAudmF1bHQucmVhZChcclxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlX2xpbmtcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWF0Y2g7XHJcbiAgICAgICAgICAgICAgICBpZiAoKG1hdGNoID0gdGhpcy5saW5rcGF0aF9yZWdleC5leGVjKGluY2x1ZGVfbGluaykpID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmNsdWRlX2RlcHRoIC09IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRlbXBsYXRlckVycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkludmFsaWQgZmlsZSBmb3JtYXQsIHByb3ZpZGUgYW4gb2JzaWRpYW4gbGluayBiZXR3ZWVuIHF1b3Rlcy5cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7IHBhdGgsIHN1YnBhdGggfSA9IHBhcnNlTGlua3RleHQobWF0Y2hbMV0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGluY19maWxlID1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWluY19maWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmNsdWRlX2RlcHRoIC09IDE7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRlbXBsYXRlckVycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgRmlsZSAke2luY2x1ZGVfbGlua30gZG9lc24ndCBleGlzdGBcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaW5jX2ZpbGVfY29udGVudCA9IGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5yZWFkKGluY19maWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3VicGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhY2hlID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGluY19maWxlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcmVzb2x2ZVN1YnBhdGgoY2FjaGUsIHN1YnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNfZmlsZV9jb250ZW50ID0gaW5jX2ZpbGVfY29udGVudC5zbGljZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQuc3RhcnQub2Zmc2V0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5lbmQ/Lm9mZnNldFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnNlZF9jb250ZW50ID1cclxuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi50ZW1wbGF0ZXIucGFyc2VyLnBhcnNlX2NvbW1hbmRzKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNfZmlsZV9jb250ZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi50ZW1wbGF0ZXIuY3VycmVudF9mdW5jdGlvbnNfb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5jbHVkZV9kZXB0aCAtPSAxO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlZF9jb250ZW50O1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluY2x1ZGVfZGVwdGggLT0gMTtcclxuICAgICAgICAgICAgICAgIHRocm93IGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2xhc3RfbW9kaWZpZWRfZGF0ZSgpOiAoZm9ybWF0Pzogc3RyaW5nKSA9PiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAoZm9ybWF0ID0gXCJZWVlZLU1NLUREIEhIOm1tXCIpOiBzdHJpbmcgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbW9tZW50KHRoaXMuY29uZmlnLnRhcmdldF9maWxlLnN0YXQubXRpbWUpLmZvcm1hdChmb3JtYXQpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfbW92ZSgpOiAocGF0aDogc3RyaW5nLCBmaWxlX3RvX21vdmU/OiBURmlsZSkgPT4gUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgICAgICByZXR1cm4gYXN5bmMgKHBhdGg6IHN0cmluZywgZmlsZV90b19tb3ZlPzogVEZpbGUpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZmlsZSA9IGZpbGVfdG9fbW92ZSB8fCB0aGlzLmNvbmZpZy50YXJnZXRfZmlsZTtcclxuICAgICAgICAgICAgY29uc3QgbmV3X3BhdGggPSBub3JtYWxpemVQYXRoKGAke3BhdGh9LiR7ZmlsZS5leHRlbnNpb259YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGRpcnMgPSBuZXdfcGF0aC5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKS5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgICAgIGRpcnMucG9wKCk7IC8vIHJlbW92ZSBiYXNlbmFtZVxyXG4gICAgICAgICAgICBpZiAoZGlycy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRpciA9IGRpcnMuam9pbihcIi9cIik7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZGlyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZGlyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hcHAuZmlsZU1hbmFnZXIucmVuYW1lRmlsZShmaWxlLCBuZXdfcGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfcGF0aCgpOiAocmVsYXRpdmU6IGJvb2xlYW4pID0+IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIChyZWxhdGl2ZSA9IGZhbHNlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB2YXVsdF9wYXRoID0gXCJcIjtcclxuICAgICAgICAgICAgaWYgKFBsYXRmb3JtLmlzTW9iaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YXVsdF9hZGFwdGVyID0gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmFkYXB0ZXIuZnMudXJpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmF1bHRfYmFzZSA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5hZGFwdGVyLmJhc2VQYXRoO1xyXG4gICAgICAgICAgICAgICAgdmF1bHRfcGF0aCA9IGAke3ZhdWx0X2FkYXB0ZXJ9LyR7dmF1bHRfYmFzZX1gO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC52YXVsdC5hZGFwdGVyIGluc3RhbmNlb2YgRmlsZVN5c3RlbUFkYXB0ZXJcclxuICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhdWx0X3BhdGggPSB0aGlzLnBsdWdpbi5hcHAudmF1bHQuYWRhcHRlci5nZXRCYXNlUGF0aCgpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYXBwLnZhdWx0IGlzIG5vdCBhIEZpbGVTeXN0ZW1BZGFwdGVyIGluc3RhbmNlXCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAocmVsYXRpdmUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy50YXJnZXRfZmlsZS5wYXRoO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke3ZhdWx0X3BhdGh9LyR7dGhpcy5jb25maWcudGFyZ2V0X2ZpbGUucGF0aH1gO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9yZW5hbWUoKTogKG5ld190aXRsZTogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIHJldHVybiBhc3luYyAobmV3X3RpdGxlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgaWYgKG5ld190aXRsZS5tYXRjaCgvW1xcXFwvOl0rL2cpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJGaWxlIG5hbWUgY2Fubm90IGNvbnRhaW4gYW55IG9mIHRoZXNlIGNoYXJhY3RlcnM6IFxcXFwgLyA6XCJcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgbmV3X3BhdGggPSBub3JtYWxpemVQYXRoKFxyXG4gICAgICAgICAgICAgICAgYCR7dGhpcy5jb25maWcudGFyZ2V0X2ZpbGUucGFyZW50LnBhdGh9LyR7bmV3X3RpdGxlfS4ke3RoaXMuY29uZmlnLnRhcmdldF9maWxlLmV4dGVuc2lvbn1gXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcudGFyZ2V0X2ZpbGUsXHJcbiAgICAgICAgICAgICAgICBuZXdfcGF0aFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX3NlbGVjdGlvbigpOiAoKSA9PiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZV9lZGl0b3IgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLmFjdGl2ZUVkaXRvcjtcclxuICAgICAgICAgICAgaWYgKCFhY3RpdmVfZWRpdG9yIHx8ICFhY3RpdmVfZWRpdG9yLmVkaXRvcikge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRlbXBsYXRlckVycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiQWN0aXZlIGVkaXRvciBpcyBudWxsLCBjYW4ndCByZWFkIHNlbGVjdGlvbi5cIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYWN0aXZlX2VkaXRvci5lZGl0b3I7XHJcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPOiBUdXJuIHRoaXMgaW50byBhIGZ1bmN0aW9uXHJcbiAgICBnZW5lcmF0ZV90YWdzKCk6IHN0cmluZ1tdIHwgbnVsbCB7XHJcbiAgICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoXHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLnRhcmdldF9maWxlXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgaWYgKGNhY2hlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRBbGxUYWdzKGNhY2hlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETzogVHVybiB0aGlzIGludG8gYSBmdW5jdGlvblxyXG4gICAgZ2VuZXJhdGVfdGl0bGUoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25maWcudGFyZ2V0X2ZpbGUuYmFzZW5hbWU7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgcmVxdWVzdFVybCwgUmVxdWVzdFVybFJlc3BvbnNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlckVycm9yIH0gZnJvbSBcInV0aWxzL0Vycm9yXCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlIH0gZnJvbSBcIi4uL0ludGVybmFsTW9kdWxlXCI7XHJcbmltcG9ydCB7IE1vZHVsZU5hbWUgfSBmcm9tIFwiZWRpdG9yL1RwRG9jdW1lbnRhdGlvblwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEludGVybmFsTW9kdWxlV2ViIGV4dGVuZHMgSW50ZXJuYWxNb2R1bGUge1xyXG4gICAgbmFtZTogTW9kdWxlTmFtZSA9IFwid2ViXCI7XHJcblxyXG4gICAgYXN5bmMgY3JlYXRlX3N0YXRpY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcImRhaWx5X3F1b3RlXCIsIHRoaXMuZ2VuZXJhdGVfZGFpbHlfcXVvdGUoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcInJlcXVlc3RcIiwgdGhpcy5nZW5lcmF0ZV9yZXF1ZXN0KCkpO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXHJcbiAgICAgICAgICAgIFwicmFuZG9tX3BpY3R1cmVcIixcclxuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZV9yYW5kb21fcGljdHVyZSgpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBjcmVhdGVfZHluYW1pY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICAgIGFzeW5jIHRlYXJkb3duKCk6IFByb21pc2U8dm9pZD4ge31cclxuXHJcbiAgICBhc3luYyBnZXRSZXF1ZXN0KHVybDogc3RyaW5nKTogUHJvbWlzZTxSZXF1ZXN0VXJsUmVzcG9uc2U+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwodXJsKTtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA8IDIwMCAmJiByZXNwb25zZS5zdGF0dXMgPj0gMzAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXCJFcnJvciBwZXJmb3JtaW5nIEdFVCByZXF1ZXN0XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXCJFcnJvciBwZXJmb3JtaW5nIEdFVCByZXF1ZXN0XCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9kYWlseV9xdW90ZSgpOiAoKSA9PiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIHJldHVybiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZ2V0UmVxdWVzdChcclxuICAgICAgICAgICAgICAgICAgICBcImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9aYWNoYXRvby9xdW90ZXMtZGF0YWJhc2UvcmVmcy9oZWFkcy9tYWluL3F1b3Rlcy5qc29uXCJcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBxdW90ZXMgPSByZXNwb25zZS5qc29uO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZG9tX3F1b3RlID1cclxuICAgICAgICAgICAgICAgICAgICBxdW90ZXNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcXVvdGVzLmxlbmd0aCldO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHsgcXVvdGUsIGF1dGhvciB9ID0gcmFuZG9tX3F1b3RlO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3X2NvbnRlbnQgPSBgPiBbIXF1b3RlXSAke3F1b3RlfVxcbj4g4oCUICR7YXV0aG9yfWA7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld19jb250ZW50O1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgbmV3IFRlbXBsYXRlckVycm9yKFwiRXJyb3IgZ2VuZXJhdGluZyBkYWlseSBxdW90ZVwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIkVycm9yIGdlbmVyYXRpbmcgZGFpbHkgcXVvdGVcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfcmFuZG9tX3BpY3R1cmUoKTogKFxyXG4gICAgICAgIHNpemU6IHN0cmluZyxcclxuICAgICAgICBxdWVyeT86IHN0cmluZyxcclxuICAgICAgICBpbmNsdWRlX3NpemU/OiBib29sZWFuXHJcbiAgICApID0+IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jIChzaXplOiBzdHJpbmcsIHF1ZXJ5Pzogc3RyaW5nLCBpbmNsdWRlX3NpemUgPSBmYWxzZSkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmdldFJlcXVlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgYGh0dHBzOi8vdGVtcGxhdGVyLXVuc3BsYXNoLTIuZmx5LmRldi8ke1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWVyeSA/IFwiP3E9XCIgKyBxdWVyeSA6IFwiXCJcclxuICAgICAgICAgICAgICAgICAgICB9YFxyXG4gICAgICAgICAgICAgICAgKS50aGVuKChyZXMpID0+IHJlcy5qc29uKTtcclxuICAgICAgICAgICAgICAgIGxldCB1cmwgPSByZXNwb25zZS5mdWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNpemUgJiYgIWluY2x1ZGVfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaXplLmluY2x1ZGVzKFwieFwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBbd2lkdGgsIGhlaWdodF0gPSBzaXplLnNwbGl0KFwieFwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsID0gdXJsLmNvbmNhdChgJnc9JHt3aWR0aH0maD0ke2hlaWdodH1gKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmwgPSB1cmwuY29uY2F0KGAmdz0ke3NpemV9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgIVtwaG90byBieSAke3Jlc3BvbnNlLnBob3RvZ30oJHtyZXNwb25zZS5waG90b2dVcmx9KSBvbiBVbnNwbGFzaHwke3NpemV9XSgke3VybH0pYDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBgIVtwaG90byBieSAke3Jlc3BvbnNlLnBob3RvZ30oJHtyZXNwb25zZS5waG90b2dVcmx9KSBvbiBVbnNwbGFzaF0oJHt1cmx9KWA7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGVyRXJyb3IoXCJFcnJvciBnZW5lcmF0aW5nIHJhbmRvbSBwaWN0dXJlXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiRXJyb3IgZ2VuZXJhdGluZyByYW5kb20gcGljdHVyZVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9yZXF1ZXN0KCk6ICh1cmw6IHN0cmluZywgcGF0aD86IHN0cmluZykgPT4gUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgICAgICByZXR1cm4gYXN5bmMgKHVybDogc3RyaW5nLCBwYXRoPzogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZ2V0UmVxdWVzdCh1cmwpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QganNvbkRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChwYXRoICYmIGpzb25EYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGguc3BsaXQoXCIuXCIpLnJlZHVjZSgob2JqLCBrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9iaiAmJiBvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBQYXRoICR7cGF0aH0gbm90IGZvdW5kIGluIHRoZSBKU09OIHJlc3BvbnNlYFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sIGpzb25EYXRhKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ganNvbkRhdGE7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcIkVycm9yIGZldGNoaW5nIGFuZCBleHRyYWN0aW5nIHZhbHVlXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBFdmVudFJlZiB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBNb2R1bGVOYW1lIH0gZnJvbSBcImVkaXRvci9UcERvY3VtZW50YXRpb25cIjtcclxuaW1wb3J0IHsgZGVsYXkgfSBmcm9tIFwidXRpbHMvVXRpbHNcIjtcclxuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGUgfSBmcm9tIFwiLi4vSW50ZXJuYWxNb2R1bGVcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBJbnRlcm5hbE1vZHVsZUhvb2tzIGV4dGVuZHMgSW50ZXJuYWxNb2R1bGUge1xyXG4gICAgcHVibGljIG5hbWU6IE1vZHVsZU5hbWUgPSBcImhvb2tzXCI7XHJcbiAgICBwcml2YXRlIGV2ZW50X3JlZnM6IEV2ZW50UmVmW10gPSBbXTtcclxuXHJcbiAgICBhc3luYyBjcmVhdGVfc3RhdGljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFxyXG4gICAgICAgICAgICBcIm9uX2FsbF90ZW1wbGF0ZXNfZXhlY3V0ZWRcIixcclxuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZV9vbl9hbGxfdGVtcGxhdGVzX2V4ZWN1dGVkKClcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9keW5hbWljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHt9XHJcblxyXG4gICAgYXN5bmMgdGVhcmRvd24oKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5ldmVudF9yZWZzLmZvckVhY2goKGV2ZW50UmVmKSA9PiB7XHJcbiAgICAgICAgICAgIGV2ZW50UmVmLmUub2ZmcmVmKGV2ZW50UmVmKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmV2ZW50X3JlZnMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9vbl9hbGxfdGVtcGxhdGVzX2V4ZWN1dGVkKCk6IChcclxuICAgICAgICBjYWxsYmFja19mdW5jdGlvbjogKCkgPT4gdW5rbm93blxyXG4gICAgKSA9PiB2b2lkIHtcclxuICAgICAgICByZXR1cm4gKGNhbGxiYWNrX2Z1bmN0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50X3JlZiA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub24oXHJcbiAgICAgICAgICAgICAgICBcInRlbXBsYXRlcjphbGwtdGVtcGxhdGVzLWV4ZWN1dGVkXCIsXHJcbiAgICAgICAgICAgICAgICBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZGVsYXkoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tfZnVuY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKGV2ZW50X3JlZikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ldmVudF9yZWZzLnB1c2goZXZlbnRfcmVmKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGUgfSBmcm9tIFwiLi4vSW50ZXJuYWxNb2R1bGVcIjtcclxuaW1wb3J0IHsgTW9kdWxlTmFtZSB9IGZyb20gXCJlZGl0b3IvVHBEb2N1bWVudGF0aW9uXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxNb2R1bGVGcm9udG1hdHRlciBleHRlbmRzIEludGVybmFsTW9kdWxlIHtcclxuICAgIHB1YmxpYyBuYW1lOiBNb2R1bGVOYW1lID0gXCJmcm9udG1hdHRlclwiO1xyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9zdGF0aWNfdGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge31cclxuXHJcbiAgICBhc3luYyBjcmVhdGVfZHluYW1pY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoXHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLnRhcmdldF9maWxlXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmR5bmFtaWNfZnVuY3Rpb25zID0gbmV3IE1hcChcclxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMoY2FjaGU/LmZyb250bWF0dGVyIHx8IHt9KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgdGVhcmRvd24oKTogUHJvbWlzZTx2b2lkPiB7fVxyXG59XHJcbiIsImltcG9ydCB7XHJcbiAgICBBcHAsXHJcbiAgICBCdXR0b25Db21wb25lbnQsXHJcbiAgICBNb2RhbCxcclxuICAgIFBsYXRmb3JtLFxyXG4gICAgVGV4dEFyZWFDb21wb25lbnQsXHJcbiAgICBUZXh0Q29tcG9uZW50LFxyXG59IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFByb21wdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG4gICAgcHJpdmF0ZSByZXNvbHZlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZDtcclxuICAgIHByaXZhdGUgcmVqZWN0OiAocmVhc29uPzogVGVtcGxhdGVyRXJyb3IpID0+IHZvaWQ7XHJcbiAgICBwcml2YXRlIHN1Ym1pdHRlZCA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSB2YWx1ZTogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIGFwcDogQXBwLFxyXG4gICAgICAgIHByaXZhdGUgcHJvbXB0X3RleHQ6IHN0cmluZyxcclxuICAgICAgICBwcml2YXRlIGRlZmF1bHRfdmFsdWU6IHN0cmluZyxcclxuICAgICAgICBwcml2YXRlIG11bHRpX2xpbmU6IGJvb2xlYW5cclxuICAgICkge1xyXG4gICAgICAgIHN1cGVyKGFwcCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25PcGVuKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KHRoaXMucHJvbXB0X3RleHQpO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRm9ybSgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uQ2xvc2UoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcclxuICAgICAgICBpZiAoIXRoaXMuc3VibWl0dGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVqZWN0KG5ldyBUZW1wbGF0ZXJFcnJvcihcIkNhbmNlbGxlZCBwcm9tcHRcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVGb3JtKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGRpdiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdigpO1xyXG4gICAgICAgIGRpdi5hZGRDbGFzcyhcInRlbXBsYXRlci1wcm9tcHQtZGl2XCIpO1xyXG4gICAgICAgIGxldCB0ZXh0SW5wdXQ7XHJcbiAgICAgICAgaWYgKHRoaXMubXVsdGlfbGluZSkge1xyXG4gICAgICAgICAgICB0ZXh0SW5wdXQgPSBuZXcgVGV4dEFyZWFDb21wb25lbnQoZGl2KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCBzdWJtaXQgYnV0dG9uIHNpbmNlIGVudGVyIG5lZWRlZCBmb3IgbXVsdGlsaW5lIGlucHV0IG9uIG1vYmlsZVxyXG4gICAgICAgICAgICBjb25zdCBidXR0b25EaXYgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoKTtcclxuICAgICAgICAgICAgYnV0dG9uRGl2LmFkZENsYXNzKFwidGVtcGxhdGVyLWJ1dHRvbi1kaXZcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHN1Ym1pdEJ1dHRvbiA9IG5ldyBCdXR0b25Db21wb25lbnQoYnV0dG9uRGl2KTtcclxuICAgICAgICAgICAgc3VibWl0QnV0dG9uLmJ1dHRvbkVsLmFkZENsYXNzKFwibW9kLWN0YVwiKTtcclxuICAgICAgICAgICAgc3VibWl0QnV0dG9uLnNldEJ1dHRvblRleHQoXCJTdWJtaXRcIikub25DbGljaygoZXZ0OiBFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNvbHZlQW5kQ2xvc2UoZXZ0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGV4dElucHV0ID0gbmV3IFRleHRDb21wb25lbnQoZGl2KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmRlZmF1bHRfdmFsdWUgPz8gXCJcIjtcclxuICAgICAgICB0ZXh0SW5wdXQuaW5wdXRFbC5hZGRDbGFzcyhcInRlbXBsYXRlci1wcm9tcHQtaW5wdXRcIik7XHJcbiAgICAgICAgdGV4dElucHV0LnNldFBsYWNlaG9sZGVyKFwiVHlwZSB0ZXh0IGhlcmVcIik7XHJcbiAgICAgICAgdGV4dElucHV0LnNldFZhbHVlKHRoaXMudmFsdWUpO1xyXG4gICAgICAgIHRleHRJbnB1dC5vbkNoYW5nZSgodmFsdWUpID0+ICh0aGlzLnZhbHVlID0gdmFsdWUpKTtcclxuICAgICAgICB0ZXh0SW5wdXQuaW5wdXRFbC5mb2N1cygpO1xyXG4gICAgICAgIHRleHRJbnB1dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldnQ6IEtleWJvYXJkRXZlbnQpID0+XHJcbiAgICAgICAgICAgIHRoaXMuZW50ZXJDYWxsYmFjayhldnQpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGVudGVyQ2FsbGJhY2soZXZ0OiBLZXlib2FyZEV2ZW50KSB7XHJcbiAgICAgICAgLy8gRml4IGZvciBLb3JlYW4gaW5wdXRzIGh0dHBzOi8vZ2l0aHViLmNvbS9TaWxlbnRWb2lkMTMvVGVtcGxhdGVyL2lzc3Vlcy8xMjg0XHJcbiAgICAgICAgaWYgKGV2dC5pc0NvbXBvc2luZyB8fCBldnQua2V5Q29kZSA9PT0gMjI5KSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm11bHRpX2xpbmUpIHtcclxuICAgICAgICAgICAgaWYgKFBsYXRmb3JtLmlzRGVza3RvcCAmJiBldnQua2V5ID09PSBcIkVudGVyXCIgJiYgIWV2dC5zaGlmdEtleSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNvbHZlQW5kQ2xvc2UoZXZ0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChldnQua2V5ID09PSBcIkVudGVyXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzb2x2ZUFuZENsb3NlKGV2dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZXNvbHZlQW5kQ2xvc2UoZXZ0OiBFdmVudCB8IEtleWJvYXJkRXZlbnQpIHtcclxuICAgICAgICB0aGlzLnN1Ym1pdHRlZCA9IHRydWU7XHJcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5yZXNvbHZlKHRoaXMudmFsdWUpO1xyXG4gICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBvcGVuQW5kR2V0VmFsdWUoXHJcbiAgICAgICAgcmVzb2x2ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXHJcbiAgICAgICAgcmVqZWN0OiAocmVhc29uPzogVGVtcGxhdGVyRXJyb3IpID0+IHZvaWRcclxuICAgICk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XHJcbiAgICAgICAgdGhpcy5yZWplY3QgPSByZWplY3Q7XHJcbiAgICAgICAgdGhpcy5vcGVuKCk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwidXRpbHMvRXJyb3JcIjtcclxuaW1wb3J0IHsgQXBwLCBGdXp6eU1hdGNoLCBGdXp6eVN1Z2dlc3RNb2RhbCB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFN1Z2dlc3Rlck1vZGFsPFQ+IGV4dGVuZHMgRnV6enlTdWdnZXN0TW9kYWw8VD4ge1xyXG4gICAgcHJpdmF0ZSByZXNvbHZlOiAodmFsdWU6IFQpID0+IHZvaWQ7XHJcbiAgICBwcml2YXRlIHJlamVjdDogKHJlYXNvbj86IFRlbXBsYXRlckVycm9yKSA9PiB2b2lkO1xyXG4gICAgcHJpdmF0ZSBzdWJtaXR0ZWQgPSBmYWxzZTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBhcHA6IEFwcCxcclxuICAgICAgICBwcml2YXRlIHRleHRfaXRlbXM6IHN0cmluZ1tdIHwgKChpdGVtOiBUKSA9PiBzdHJpbmcpLFxyXG4gICAgICAgIHByaXZhdGUgaXRlbXM6IFRbXSxcclxuICAgICAgICBwbGFjZWhvbGRlcjogc3RyaW5nLFxyXG4gICAgICAgIGxpbWl0PzogbnVtYmVyXHJcbiAgICApIHtcclxuICAgICAgICBzdXBlcihhcHApO1xyXG4gICAgICAgIHRoaXMuc2V0UGxhY2Vob2xkZXIocGxhY2Vob2xkZXIpO1xyXG4gICAgICAgIGxpbWl0ICYmICh0aGlzLmxpbWl0ID0gbGltaXQpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEl0ZW1zKCk6IFRbXSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXM7XHJcbiAgICB9XHJcblxyXG4gICAgb25DbG9zZSgpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIXRoaXMuc3VibWl0dGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVqZWN0KG5ldyBUZW1wbGF0ZXJFcnJvcihcIkNhbmNlbGxlZCBwcm9tcHRcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3RTdWdnZXN0aW9uKFxyXG4gICAgICAgIHZhbHVlOiBGdXp6eU1hdGNoPFQ+LFxyXG4gICAgICAgIGV2dDogTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnRcclxuICAgICk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuc3VibWl0dGVkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgdGhpcy5vbkNob29zZVN1Z2dlc3Rpb24odmFsdWUsIGV2dCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0SXRlbVRleHQoaXRlbTogVCk6IHN0cmluZyB7XHJcbiAgICAgICAgaWYgKHRoaXMudGV4dF9pdGVtcyBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRleHRfaXRlbXMoaXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMudGV4dF9pdGVtc1t0aGlzLml0ZW1zLmluZGV4T2YoaXRlbSldIHx8IFwiVW5kZWZpbmVkIFRleHQgSXRlbVwiXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBvbkNob29zZUl0ZW0oaXRlbTogVCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucmVzb2x2ZShpdGVtKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBvcGVuQW5kR2V0VmFsdWUoXHJcbiAgICAgICAgcmVzb2x2ZTogKHZhbHVlOiBUKSA9PiB2b2lkLFxyXG4gICAgICAgIHJlamVjdDogKHJlYXNvbj86IFRlbXBsYXRlckVycm9yKSA9PiB2b2lkXHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLnJlc29sdmUgPSByZXNvbHZlO1xyXG4gICAgICAgIHRoaXMucmVqZWN0ID0gcmVqZWN0O1xyXG4gICAgICAgIHRoaXMub3BlbigpO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEludGVybmFsTW9kdWxlIH0gZnJvbSBcIi4uL0ludGVybmFsTW9kdWxlXCI7XHJcbmltcG9ydCB7IFByb21wdE1vZGFsIH0gZnJvbSBcIi4vUHJvbXB0TW9kYWxcIjtcclxuaW1wb3J0IHsgU3VnZ2VzdGVyTW9kYWwgfSBmcm9tIFwiLi9TdWdnZXN0ZXJNb2RhbFwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5pbXBvcnQgeyBNb2R1bGVOYW1lIH0gZnJvbSBcImVkaXRvci9UcERvY3VtZW50YXRpb25cIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBJbnRlcm5hbE1vZHVsZVN5c3RlbSBleHRlbmRzIEludGVybmFsTW9kdWxlIHtcclxuICAgIHB1YmxpYyBuYW1lOiBNb2R1bGVOYW1lID0gXCJzeXN0ZW1cIjtcclxuXHJcbiAgICBhc3luYyBjcmVhdGVfc3RhdGljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwiY2xpcGJvYXJkXCIsIHRoaXMuZ2VuZXJhdGVfY2xpcGJvYXJkKCkpO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJwcm9tcHRcIiwgdGhpcy5nZW5lcmF0ZV9wcm9tcHQoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcInN1Z2dlc3RlclwiLCB0aGlzLmdlbmVyYXRlX3N1Z2dlc3RlcigpKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBjcmVhdGVfZHluYW1pY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICAgIGFzeW5jIHRlYXJkb3duKCk6IFByb21pc2U8dm9pZD4ge31cclxuXHJcbiAgICBnZW5lcmF0ZV9jbGlwYm9hcmQoKTogKCkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQucmVhZFRleHQoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX3Byb21wdCgpOiAoXHJcbiAgICAgICAgcHJvbXB0X3RleHQ6IHN0cmluZyxcclxuICAgICAgICBkZWZhdWx0X3ZhbHVlOiBzdHJpbmcsXHJcbiAgICAgICAgdGhyb3dfb25fY2FuY2VsOiBib29sZWFuLFxyXG4gICAgICAgIG11bHRpX2xpbmU6IGJvb2xlYW5cclxuICAgICkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcclxuICAgICAgICAgICAgcHJvbXB0X3RleHQ6IHN0cmluZyxcclxuICAgICAgICAgICAgZGVmYXVsdF92YWx1ZTogc3RyaW5nLFxyXG4gICAgICAgICAgICB0aHJvd19vbl9jYW5jZWwgPSBmYWxzZSxcclxuICAgICAgICAgICAgbXVsdGlfbGluZSA9IGZhbHNlXHJcbiAgICAgICAgKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb21wdCA9IG5ldyBQcm9tcHRNb2RhbChcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcCxcclxuICAgICAgICAgICAgICAgIHByb21wdF90ZXh0LFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdF92YWx1ZSxcclxuICAgICAgICAgICAgICAgIG11bHRpX2xpbmVcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKFxyXG4gICAgICAgICAgICAgICAgKFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdDogKHJlYXNvbj86IFRlbXBsYXRlckVycm9yKSA9PiB2b2lkXHJcbiAgICAgICAgICAgICAgICApID0+IHByb21wdC5vcGVuQW5kR2V0VmFsdWUocmVzb2x2ZSwgcmVqZWN0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHByb21pc2U7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhyb3dfb25fY2FuY2VsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfc3VnZ2VzdGVyKCk6IDxUPihcclxuICAgICAgICB0ZXh0X2l0ZW1zOiBzdHJpbmdbXSB8ICgoaXRlbTogVCkgPT4gc3RyaW5nKSxcclxuICAgICAgICBpdGVtczogVFtdLFxyXG4gICAgICAgIHRocm93X29uX2NhbmNlbDogYm9vbGVhbixcclxuICAgICAgICBwbGFjZWhvbGRlcjogc3RyaW5nLFxyXG4gICAgICAgIGxpbWl0PzogbnVtYmVyXHJcbiAgICApID0+IFByb21pc2U8VD4ge1xyXG4gICAgICAgIHJldHVybiBhc3luYyA8VD4oXHJcbiAgICAgICAgICAgIHRleHRfaXRlbXM6IHN0cmluZ1tdIHwgKChpdGVtOiBUKSA9PiBzdHJpbmcpLFxyXG4gICAgICAgICAgICBpdGVtczogVFtdLFxyXG4gICAgICAgICAgICB0aHJvd19vbl9jYW5jZWwgPSBmYWxzZSxcclxuICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSBcIlwiLFxyXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlclxyXG4gICAgICAgICk6IFByb21pc2U8VD4gPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBzdWdnZXN0ZXIgPSBuZXcgU3VnZ2VzdGVyTW9kYWwoXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXHJcbiAgICAgICAgICAgICAgICB0ZXh0X2l0ZW1zLFxyXG4gICAgICAgICAgICAgICAgaXRlbXMsXHJcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcixcclxuICAgICAgICAgICAgICAgIGxpbWl0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShcclxuICAgICAgICAgICAgICAgIChcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiAodmFsdWU6IFQpID0+IHZvaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0OiAocmVhc29uPzogVGVtcGxhdGVyRXJyb3IpID0+IHZvaWRcclxuICAgICAgICAgICAgICAgICkgPT4gc3VnZ2VzdGVyLm9wZW5BbmRHZXRWYWx1ZShyZXNvbHZlLCByZWplY3QpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgcHJvbWlzZTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aHJvd19vbl9jYW5jZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsIGFzIFQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEludGVybmFsTW9kdWxlIH0gZnJvbSBcIi4uL0ludGVybmFsTW9kdWxlXCI7XHJcbmltcG9ydCB7IFJ1bm5pbmdDb25maWcgfSBmcm9tIFwiY29yZS9UZW1wbGF0ZXJcIjtcclxuaW1wb3J0IHsgTW9kdWxlTmFtZSB9IGZyb20gXCJlZGl0b3IvVHBEb2N1bWVudGF0aW9uXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxNb2R1bGVDb25maWcgZXh0ZW5kcyBJbnRlcm5hbE1vZHVsZSB7XHJcbiAgICBwdWJsaWMgbmFtZTogTW9kdWxlTmFtZSA9IFwiY29uZmlnXCI7XHJcblxyXG4gICAgYXN5bmMgY3JlYXRlX3N0YXRpY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9keW5hbWljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHt9XHJcblxyXG4gICAgYXN5bmMgdGVhcmRvd24oKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICAgIGFzeW5jIGdlbmVyYXRlX29iamVjdChcclxuICAgICAgICBjb25maWc6IFJ1bm5pbmdDb25maWdcclxuICAgICk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcclxuICAgICAgICByZXR1cm4gY29uZmlnO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCBUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIm1haW5cIjtcclxuaW1wb3J0IHsgSUdlbmVyYXRlT2JqZWN0IH0gZnJvbSBcImNvcmUvZnVuY3Rpb25zL0lHZW5lcmF0ZU9iamVjdFwiO1xyXG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZSB9IGZyb20gXCIuL0ludGVybmFsTW9kdWxlXCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlRGF0ZSB9IGZyb20gXCIuL2RhdGUvSW50ZXJuYWxNb2R1bGVEYXRlXCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlRmlsZSB9IGZyb20gXCIuL2ZpbGUvSW50ZXJuYWxNb2R1bGVGaWxlXCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlV2ViIH0gZnJvbSBcIi4vd2ViL0ludGVybmFsTW9kdWxlV2ViXCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlSG9va3MgfSBmcm9tIFwiLi9ob29rcy9JbnRlcm5hbE1vZHVsZUhvb2tzXCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlRnJvbnRtYXR0ZXIgfSBmcm9tIFwiLi9mcm9udG1hdHRlci9JbnRlcm5hbE1vZHVsZUZyb250bWF0dGVyXCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlU3lzdGVtIH0gZnJvbSBcIi4vc3lzdGVtL0ludGVybmFsTW9kdWxlU3lzdGVtXCI7XHJcbmltcG9ydCB7IFJ1bm5pbmdDb25maWcgfSBmcm9tIFwiY29yZS9UZW1wbGF0ZXJcIjtcclxuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGVDb25maWcgfSBmcm9tIFwiLi9jb25maWcvSW50ZXJuYWxNb2R1bGVDb25maWdcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBJbnRlcm5hbEZ1bmN0aW9ucyBpbXBsZW1lbnRzIElHZW5lcmF0ZU9iamVjdCB7XHJcbiAgICBwcml2YXRlIG1vZHVsZXNfYXJyYXk6IEFycmF5PEludGVybmFsTW9kdWxlPiA9IFtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge1xyXG4gICAgICAgIHRoaXMubW9kdWxlc19hcnJheS5wdXNoKG5ldyBJbnRlcm5hbE1vZHVsZURhdGUodGhpcy5wbHVnaW4pKTtcclxuICAgICAgICB0aGlzLm1vZHVsZXNfYXJyYXkucHVzaChuZXcgSW50ZXJuYWxNb2R1bGVGaWxlKHRoaXMucGx1Z2luKSk7XHJcbiAgICAgICAgdGhpcy5tb2R1bGVzX2FycmF5LnB1c2gobmV3IEludGVybmFsTW9kdWxlV2ViKHRoaXMucGx1Z2luKSk7XHJcbiAgICAgICAgdGhpcy5tb2R1bGVzX2FycmF5LnB1c2gobmV3IEludGVybmFsTW9kdWxlRnJvbnRtYXR0ZXIodGhpcy5wbHVnaW4pKTtcclxuICAgICAgICB0aGlzLm1vZHVsZXNfYXJyYXkucHVzaChuZXcgSW50ZXJuYWxNb2R1bGVIb29rcyh0aGlzLnBsdWdpbikpO1xyXG4gICAgICAgIHRoaXMubW9kdWxlc19hcnJheS5wdXNoKG5ldyBJbnRlcm5hbE1vZHVsZVN5c3RlbSh0aGlzLnBsdWdpbikpO1xyXG4gICAgICAgIHRoaXMubW9kdWxlc19hcnJheS5wdXNoKG5ldyBJbnRlcm5hbE1vZHVsZUNvbmZpZyh0aGlzLnBsdWdpbikpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGluaXQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgZm9yIChjb25zdCBtb2Qgb2YgdGhpcy5tb2R1bGVzX2FycmF5KSB7XHJcbiAgICAgICAgICAgIGF3YWl0IG1vZC5pbml0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHRlYXJkb3duKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGZvciAoY29uc3QgbW9kIG9mIHRoaXMubW9kdWxlc19hcnJheSkge1xyXG4gICAgICAgICAgICBhd2FpdCBtb2QudGVhcmRvd24oKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2VuZXJhdGVfb2JqZWN0KFxyXG4gICAgICAgIGNvbmZpZzogUnVubmluZ0NvbmZpZ1xyXG4gICAgKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xyXG4gICAgICAgIGNvbnN0IGludGVybmFsX2Z1bmN0aW9uc19vYmplY3Q6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9ID0ge307XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgbW9kIG9mIHRoaXMubW9kdWxlc19hcnJheSkge1xyXG4gICAgICAgICAgICBpbnRlcm5hbF9mdW5jdGlvbnNfb2JqZWN0W21vZC5nZXROYW1lKCldID1cclxuICAgICAgICAgICAgICAgIGF3YWl0IG1vZC5nZW5lcmF0ZV9vYmplY3QoY29uZmlnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpbnRlcm5hbF9mdW5jdGlvbnNfb2JqZWN0O1xyXG4gICAgfVxyXG59XHJcbiIsImV4cG9ydCBjb25zdCBVTlNVUFBPUlRFRF9NT0JJTEVfVEVNUExBVEUgPSBcIkVycm9yX01vYmlsZVVuc3VwcG9ydGVkVGVtcGxhdGVcIjtcclxuZXhwb3J0IGNvbnN0IElDT05fREFUQSA9IGA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDUxLjEzMjggMjguN1wiPjxwYXRoIGQ9XCJNMCAxNS4xNCAwIDEwLjE1IDE4LjY3IDEuNTEgMTguNjcgNi4wMyA0LjcyIDEyLjMzIDQuNzIgMTIuNzYgMTguNjcgMTkuMjIgMTguNjcgMjMuNzQgMCAxNS4xNFpNMzMuNjkyOCAxLjg0QzMzLjY5MjggMS44NCAzMy45NzYxIDIuMTQ2NyAzNC41NDI4IDIuNzZDMzUuMTA5NCAzLjM4IDM1LjM5MjggNC41NiAzNS4zOTI4IDYuM0MzNS4zOTI4IDguMDQ2NiAzNC44MTk1IDkuNTQgMzMuNjcyOCAxMC43OEMzMi41MjYxIDEyLjAyIDMxLjA5OTUgMTIuNjQgMjkuMzkyOCAxMi42NEMyNy42ODYyIDEyLjY0IDI2LjI2NjEgMTIuMDI2NyAyNS4xMzI4IDEwLjhDMjMuOTkyOCA5LjU3MzMgMjMuNDIyOCA4LjA4NjcgMjMuNDIyOCA2LjM0QzIzLjQyMjggNC42IDIzLjk5OTUgMy4xMDY2IDI1LjE1MjggMS44NkMyNi4yOTk0LjYyIDI3LjcyNjEgMCAyOS40MzI4IDBDMzEuMTM5NSAwIDMyLjU1OTQuNjEzMyAzMy42OTI4IDEuODRNNDkuODIyOC42NyAyOS41MzI4IDI4LjM4IDI0LjQxMjggMjguMzggNDQuNzEyOC42NyA0OS44MjI4LjY3TTMxLjAzMjggOC4zOEMzMS4wMzI4IDguMzggMzEuMTM5NSA4LjI0NjcgMzEuMzUyOCA3Ljk4QzMxLjU2NjIgNy43MDY3IDMxLjY3MjggNy4xNzMzIDMxLjY3MjggNi4zOEMzMS42NzI4IDUuNTg2NyAzMS40NDYxIDQuOTIgMzAuOTkyOCA0LjM4QzMwLjU0NjEgMy44NCAyOS45OTk1IDMuNTcgMjkuMzUyOCAzLjU3QzI4LjcwNjEgMy41NyAyOC4xNjk1IDMuODQgMjcuNzQyOCA0LjM4QzI3LjMyMjggNC45MiAyNy4xMTI4IDUuNTg2NyAyNy4xMTI4IDYuMzhDMjcuMTEyOCA3LjE3MzMgMjcuMzM2MSA3Ljg0IDI3Ljc4MjggOC4zOEMyOC4yMzYxIDguOTI2NyAyOC43ODYxIDkuMiAyOS40MzI4IDkuMkMzMC4wNzk1IDkuMiAzMC42MTI4IDguOTI2NyAzMS4wMzI4IDguMzhNNDkuNDMyOCAxNy45QzQ5LjQzMjggMTcuOSA0OS43MTYxIDE4LjIwNjcgNTAuMjgyOCAxOC44MkM1MC44NDk1IDE5LjQzMzMgNTEuMTMyOCAyMC42MTMzIDUxLjEzMjggMjIuMzZDNTEuMTMyOCAyNC4xIDUwLjU1OTQgMjUuNTkgNDkuNDEyOCAyNi44M0M0OC4yNTk1IDI4LjA3NjYgNDYuODI5NSAyOC43IDQ1LjEyMjggMjguN0M0My40MjI4IDI4LjcgNDIuMDAyOCAyOC4wODMzIDQwLjg2MjggMjYuODVDMzkuNzI5NSAyNS42MjMzIDM5LjE2MjggMjQuMTM2NiAzOS4xNjI4IDIyLjM5QzM5LjE2MjggMjAuNjUgMzkuNzM2MSAxOS4xNiA0MC44ODI4IDE3LjkyQzQyLjAzNjEgMTYuNjczMyA0My40NjI4IDE2LjA1IDQ1LjE2MjggMTYuMDVDNDYuODY5NCAxNi4wNSA0OC4yOTI4IDE2LjY2NjcgNDkuNDMyOCAxNy45TTQ2Ljg1MjggMjQuNTJDNDYuODUyOCAyNC41MiA0Ni45NTk1IDI0LjM4MzMgNDcuMTcyOCAyNC4xMUM0Ny4zNzk1IDIzLjgzNjcgNDcuNDgyOCAyMy4zMDMzIDQ3LjQ4MjggMjIuNTFDNDcuNDgyOCAyMS43MTY3IDQ3LjI1OTUgMjEuMDUgNDYuODEyOCAyMC41MUM0Ni4zNjYxIDE5Ljk3IDQ1LjgxNjIgMTkuNyA0NS4xNjI4IDE5LjdDNDQuNTE2MSAxOS43IDQzLjk4MjggMTkuOTcgNDMuNTYyOCAyMC41MUM0My4xNDI4IDIxLjA1IDQyLjkzMjggMjEuNzE2NyA0Mi45MzI4IDIyLjUxQzQyLjkzMjggMjMuMzAzMyA0My4xNTYxIDIzLjk3MzMgNDMuNjAyOCAyNC41MkM0NC4wNDk0IDI1LjA2IDQ0LjU5NjEgMjUuMzMgNDUuMjQyOCAyNS4zM0M0NS44ODk1IDI1LjMzIDQ2LjQyNjEgMjUuMDYgNDYuODUyOCAyNC41MlpcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPjwvc3ZnPmA7XHJcbiIsImltcG9ydCB7IEZpbGVTeXN0ZW1BZGFwdGVyLCBQbGF0Zm9ybSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IElHZW5lcmF0ZU9iamVjdCB9IGZyb20gXCIuLi9JR2VuZXJhdGVPYmplY3RcIjtcclxuaW1wb3J0IHsgUnVubmluZ0NvbmZpZyB9IGZyb20gXCJjb3JlL1RlbXBsYXRlclwiO1xyXG5pbXBvcnQgeyBVTlNVUFBPUlRFRF9NT0JJTEVfVEVNUExBVEUgfSBmcm9tIFwidXRpbHMvQ29uc3RhbnRzXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlckVycm9yIH0gZnJvbSBcInV0aWxzL0Vycm9yXCI7XHJcbmltcG9ydCB7IEZ1bmN0aW9uc01vZGUgfSBmcm9tIFwiLi4vRnVuY3Rpb25zR2VuZXJhdG9yXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVXNlclN5c3RlbUZ1bmN0aW9ucyBpbXBsZW1lbnRzIElHZW5lcmF0ZU9iamVjdCB7XHJcbiAgICBwcml2YXRlIGN3ZDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBleGVjX3Byb21pc2U6IChcclxuICAgICAgICBhcmcxOiBzdHJpbmcsXHJcbiAgICAgICAgYXJnMjogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cclxuICAgICkgPT4gUHJvbWlzZTx7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZyB9PjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICBQbGF0Zm9ybS5pc01vYmlsZSB8fFxyXG4gICAgICAgICAgICAhKHRoaXMucGx1Z2luLmFwcC52YXVsdC5hZGFwdGVyIGluc3RhbmNlb2YgRmlsZVN5c3RlbUFkYXB0ZXIpXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3dkID0gXCJcIjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmN3ZCA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5hZGFwdGVyLmdldEJhc2VQYXRoKCk7XHJcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdmFyLXJlcXVpcmVzXHJcbiAgICAgICAgICAgIGNvbnN0IHsgcHJvbWlzaWZ5IH0gPSByZXF1aXJlKFwidXRpbFwiKSBhcyB0eXBlb2YgaW1wb3J0KFwidXRpbFwiKTtcclxuICAgICAgICAgICAgY29uc3QgeyBleGVjIH0gPVxyXG4gICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcclxuICAgICAgICAgICAgICAgIHJlcXVpcmUoXCJjaGlsZF9wcm9jZXNzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJjaGlsZF9wcm9jZXNzXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmV4ZWNfcHJvbWlzZSA9IHByb21pc2lmeShleGVjKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVE9ETzogQWRkIG1vYmlsZSBzdXBwb3J0XHJcbiAgICBhc3luYyBnZW5lcmF0ZV9zeXN0ZW1fZnVuY3Rpb25zKFxyXG4gICAgICAgIGNvbmZpZzogUnVubmluZ0NvbmZpZ1xyXG4gICAgKTogUHJvbWlzZTxcclxuICAgICAgICBNYXA8c3RyaW5nLCAodXNlcl9hcmdzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IFByb21pc2U8c3RyaW5nPj5cclxuICAgID4ge1xyXG4gICAgICAgIGNvbnN0IHVzZXJfc3lzdGVtX2Z1bmN0aW9uczogTWFwPFxyXG4gICAgICAgICAgICBzdHJpbmcsXHJcbiAgICAgICAgICAgICh1c2VyX2FyZ3M/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTxzdHJpbmc+XHJcbiAgICAgICAgPiA9IG5ldyBNYXAoKTtcclxuICAgICAgICBjb25zdCBpbnRlcm5hbF9mdW5jdGlvbnNfb2JqZWN0ID1cclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udGVtcGxhdGVyLmZ1bmN0aW9uc19nZW5lcmF0b3IuZ2VuZXJhdGVfb2JqZWN0KFxyXG4gICAgICAgICAgICAgICAgY29uZmlnLFxyXG4gICAgICAgICAgICAgICAgRnVuY3Rpb25zTW9kZS5JTlRFUk5BTFxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHRlbXBsYXRlX3BhaXIgb2YgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVzX3BhaXJzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gdGVtcGxhdGVfcGFpclswXTtcclxuICAgICAgICAgICAgbGV0IGNtZCA9IHRlbXBsYXRlX3BhaXJbMV07XHJcbiAgICAgICAgICAgIGlmICghdGVtcGxhdGUgfHwgIWNtZCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChQbGF0Zm9ybS5pc01vYmlsZSkge1xyXG4gICAgICAgICAgICAgICAgdXNlcl9zeXN0ZW1fZnVuY3Rpb25zLnNldCh0ZW1wbGF0ZSwgKCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFVOU1VQUE9SVEVEX01PQklMRV9URU1QTEFURSlcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjbWQgPSBhd2FpdCB0aGlzLnBsdWdpbi50ZW1wbGF0ZXIucGFyc2VyLnBhcnNlX2NvbW1hbmRzKFxyXG4gICAgICAgICAgICAgICAgICAgIGNtZCxcclxuICAgICAgICAgICAgICAgICAgICBpbnRlcm5hbF9mdW5jdGlvbnNfb2JqZWN0XHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIHVzZXJfc3lzdGVtX2Z1bmN0aW9ucy5zZXQoXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgYXN5bmMgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyX2FyZ3M/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxyXG4gICAgICAgICAgICAgICAgICAgICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2Nlc3NfZW52ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4ucHJvY2Vzcy5lbnYsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi51c2VyX2FyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjbWRfb3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29tbWFuZF90aW1lb3V0ICogMTAwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN3ZDogdGhpcy5jd2QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnY6IHByb2Nlc3NfZW52LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uKHRoaXMucGx1Z2luLnNldHRpbmdzLnNoZWxsX3BhdGggJiYge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNoZWxsOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaGVsbF9wYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBzdGRvdXQgfSA9IGF3YWl0IHRoaXMuZXhlY19wcm9taXNlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbWRfb3B0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdGRvdXQudHJpbVJpZ2h0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYEVycm9yIHdpdGggVXNlciBUZW1wbGF0ZSAke3RlbXBsYXRlfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1c2VyX3N5c3RlbV9mdW5jdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2VuZXJhdGVfb2JqZWN0KFxyXG4gICAgICAgIGNvbmZpZzogUnVubmluZ0NvbmZpZ1xyXG4gICAgKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj4ge1xyXG4gICAgICAgIGNvbnN0IHVzZXJfc3lzdGVtX2Z1bmN0aW9ucyA9IGF3YWl0IHRoaXMuZ2VuZXJhdGVfc3lzdGVtX2Z1bmN0aW9ucyhcclxuICAgICAgICAgICAgY29uZmlnXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKHVzZXJfc3lzdGVtX2Z1bmN0aW9ucyk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmltcG9ydCBUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIm1haW5cIjtcclxuaW1wb3J0IHsgSUdlbmVyYXRlT2JqZWN0IH0gZnJvbSBcIi4uL0lHZW5lcmF0ZU9iamVjdFwiO1xyXG5pbXBvcnQgeyBnZXRfdGZpbGVzX2Zyb21fZm9sZGVyIH0gZnJvbSBcInV0aWxzL1V0aWxzXCI7XHJcbmltcG9ydCB7IGVycm9yV3JhcHBlclN5bmMsIFRlbXBsYXRlckVycm9yIH0gZnJvbSBcInV0aWxzL0Vycm9yXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVXNlclNjcmlwdEZ1bmN0aW9ucyBpbXBsZW1lbnRzIElHZW5lcmF0ZU9iamVjdCB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luKSB7fVxyXG5cclxuICAgIGFzeW5jIGdlbmVyYXRlX3VzZXJfc2NyaXB0X2Z1bmN0aW9ucygpOiBQcm9taXNlPFxyXG4gICAgICAgIE1hcDxzdHJpbmcsICgpID0+IHVua25vd24+XHJcbiAgICA+IHtcclxuICAgICAgICBjb25zdCB1c2VyX3NjcmlwdF9mdW5jdGlvbnM6IE1hcDxzdHJpbmcsICgpID0+IHVua25vd24+ID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVzID0gZXJyb3JXcmFwcGVyU3luYyhcclxuICAgICAgICAgICAgKCkgPT5cclxuICAgICAgICAgICAgICAgIGdldF90ZmlsZXNfZnJvbV9mb2xkZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZXJfc2NyaXB0c19mb2xkZXJcclxuICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIGBDb3VsZG4ndCBmaW5kIHVzZXIgc2NyaXB0IGZvbGRlciBcIiR7dGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlcl9zY3JpcHRzX2ZvbGRlcn1cImBcclxuICAgICAgICApO1xyXG4gICAgICAgIGlmICghZmlsZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXAoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xyXG4gICAgICAgICAgICBpZiAoZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKSA9PT0gXCJqc1wiKSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmxvYWRfdXNlcl9zY3JpcHRfZnVuY3Rpb24oXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgICAgICAgICB1c2VyX3NjcmlwdF9mdW5jdGlvbnNcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVzZXJfc2NyaXB0X2Z1bmN0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkX3VzZXJfc2NyaXB0X2Z1bmN0aW9uKFxyXG4gICAgICAgIGZpbGU6IFRGaWxlLFxyXG4gICAgICAgIHVzZXJfc2NyaXB0X2Z1bmN0aW9uczogTWFwPHN0cmluZywgKCkgPT4gdW5rbm93bj5cclxuICAgICk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IHJlcSA9IChzOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5yZXF1aXJlICYmIHdpbmRvdy5yZXF1aXJlKHMpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgZXhwOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xyXG4gICAgICAgIGNvbnN0IG1vZCA9IHtcclxuICAgICAgICAgICAgZXhwb3J0czogZXhwLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IGZpbGVfY29udGVudCA9IGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHdyYXBwaW5nX2ZuID0gd2luZG93LmV2YWwoXHJcbiAgICAgICAgICAgICAgICBcIihmdW5jdGlvbiBhbm9ueW1vdXMocmVxdWlyZSwgbW9kdWxlLCBleHBvcnRzKXtcIiArXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZV9jb250ZW50ICtcclxuICAgICAgICAgICAgICAgICAgICBcIlxcbn0pXCJcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgd3JhcHBpbmdfZm4ocmVxLCBtb2QsIGV4cCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgIGBGYWlsZWQgdG8gbG9hZCB1c2VyIHNjcmlwdCBhdCBcIiR7ZmlsZS5wYXRofVwiLmAsXHJcbiAgICAgICAgICAgICAgICBlcnIubWVzc2FnZVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB1c2VyX2Z1bmN0aW9uID0gZXhwW1wiZGVmYXVsdFwiXSB8fCBtb2QuZXhwb3J0cztcclxuXHJcbiAgICAgICAgaWYgKCF1c2VyX2Z1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgIGBGYWlsZWQgdG8gbG9hZCB1c2VyIHNjcmlwdCBhdCBcIiR7ZmlsZS5wYXRofVwiLiBObyBleHBvcnRzIGRldGVjdGVkLmBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCEodXNlcl9mdW5jdGlvbiBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICBgRmFpbGVkIHRvIGxvYWQgdXNlciBzY3JpcHQgYXQgXCIke2ZpbGUucGF0aH1cIi4gRGVmYXVsdCBleHBvcnQgaXMgbm90IGEgZnVuY3Rpb24uYFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB1c2VyX3NjcmlwdF9mdW5jdGlvbnMuc2V0KFxyXG4gICAgICAgICAgICBgJHtmaWxlLmJhc2VuYW1lfWAsXHJcbiAgICAgICAgICAgIHVzZXJfZnVuY3Rpb24gYXMgKCkgPT4gdW5rbm93blxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2VuZXJhdGVfb2JqZWN0KCk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcclxuICAgICAgICBjb25zdCB1c2VyX3NjcmlwdF9mdW5jdGlvbnMgPVxyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmdlbmVyYXRlX3VzZXJfc2NyaXB0X2Z1bmN0aW9ucygpO1xyXG4gICAgICAgIHJldHVybiBPYmplY3QuZnJvbUVudHJpZXModXNlcl9zY3JpcHRfZnVuY3Rpb25zKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IFJ1bm5pbmdDb25maWcgfSBmcm9tIFwiY29yZS9UZW1wbGF0ZXJcIjtcclxuaW1wb3J0IHsgSUdlbmVyYXRlT2JqZWN0IH0gZnJvbSBcIi4uL0lHZW5lcmF0ZU9iamVjdFwiO1xyXG5pbXBvcnQgeyBVc2VyU3lzdGVtRnVuY3Rpb25zIH0gZnJvbSBcIi4vVXNlclN5c3RlbUZ1bmN0aW9uc1wiO1xyXG5pbXBvcnQgeyBVc2VyU2NyaXB0RnVuY3Rpb25zIH0gZnJvbSBcIi4vVXNlclNjcmlwdEZ1bmN0aW9uc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFVzZXJGdW5jdGlvbnMgaW1wbGVtZW50cyBJR2VuZXJhdGVPYmplY3Qge1xyXG4gICAgcHJpdmF0ZSB1c2VyX3N5c3RlbV9mdW5jdGlvbnM6IFVzZXJTeXN0ZW1GdW5jdGlvbnM7XHJcbiAgICBwcml2YXRlIHVzZXJfc2NyaXB0X2Z1bmN0aW9uczogVXNlclNjcmlwdEZ1bmN0aW9ucztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICAgICAgdGhpcy51c2VyX3N5c3RlbV9mdW5jdGlvbnMgPSBuZXcgVXNlclN5c3RlbUZ1bmN0aW9ucyhwbHVnaW4pO1xyXG4gICAgICAgIHRoaXMudXNlcl9zY3JpcHRfZnVuY3Rpb25zID0gbmV3IFVzZXJTY3JpcHRGdW5jdGlvbnMocGx1Z2luKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBnZW5lcmF0ZV9vYmplY3QoXHJcbiAgICAgICAgY29uZmlnOiBSdW5uaW5nQ29uZmlnXHJcbiAgICApOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XHJcbiAgICAgICAgbGV0IHVzZXJfc3lzdGVtX2Z1bmN0aW9ucyA9IHt9O1xyXG4gICAgICAgIGxldCB1c2VyX3NjcmlwdF9mdW5jdGlvbnMgPSB7fTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZV9zeXN0ZW1fY29tbWFuZHMpIHtcclxuICAgICAgICAgICAgdXNlcl9zeXN0ZW1fZnVuY3Rpb25zID1cclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXNlcl9zeXN0ZW1fZnVuY3Rpb25zLmdlbmVyYXRlX29iamVjdChjb25maWcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdXNlcl9zY3JpcHRzX2ZvbGRlciBuZWVkcyB0byBiZSBleHBsaWNpdGx5IHNldCB0byAnLycgdG8gcXVlcnkgZnJvbSByb290XHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZXJfc2NyaXB0c19mb2xkZXIpIHtcclxuICAgICAgICAgICAgdXNlcl9zY3JpcHRfZnVuY3Rpb25zID1cclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXNlcl9zY3JpcHRfZnVuY3Rpb25zLmdlbmVyYXRlX29iamVjdCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgLi4udXNlcl9zeXN0ZW1fZnVuY3Rpb25zLFxyXG4gICAgICAgICAgICAuLi51c2VyX3NjcmlwdF9mdW5jdGlvbnMsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBJbnRlcm5hbEZ1bmN0aW9ucyB9IGZyb20gXCIuL2ludGVybmFsX2Z1bmN0aW9ucy9JbnRlcm5hbEZ1bmN0aW9uc1wiO1xyXG5pbXBvcnQgeyBVc2VyRnVuY3Rpb25zIH0gZnJvbSBcIi4vdXNlcl9mdW5jdGlvbnMvVXNlckZ1bmN0aW9uc1wiO1xyXG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IElHZW5lcmF0ZU9iamVjdCB9IGZyb20gXCIuL0lHZW5lcmF0ZU9iamVjdFwiO1xyXG5pbXBvcnQgeyBSdW5uaW5nQ29uZmlnIH0gZnJvbSBcImNvcmUvVGVtcGxhdGVyXCI7XHJcbmltcG9ydCAqIGFzIG9ic2lkaWFuX21vZHVsZSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmV4cG9ydCBlbnVtIEZ1bmN0aW9uc01vZGUge1xyXG4gICAgSU5URVJOQUwsXHJcbiAgICBVU0VSX0lOVEVSTkFMLFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRnVuY3Rpb25zR2VuZXJhdG9yIGltcGxlbWVudHMgSUdlbmVyYXRlT2JqZWN0IHtcclxuICAgIHB1YmxpYyBpbnRlcm5hbF9mdW5jdGlvbnM6IEludGVybmFsRnVuY3Rpb25zO1xyXG4gICAgcHVibGljIHVzZXJfZnVuY3Rpb25zOiBVc2VyRnVuY3Rpb25zO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcclxuICAgICAgICB0aGlzLmludGVybmFsX2Z1bmN0aW9ucyA9IG5ldyBJbnRlcm5hbEZ1bmN0aW9ucyh0aGlzLnBsdWdpbik7XHJcbiAgICAgICAgdGhpcy51c2VyX2Z1bmN0aW9ucyA9IG5ldyBVc2VyRnVuY3Rpb25zKHRoaXMucGx1Z2luKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuaW50ZXJuYWxfZnVuY3Rpb25zLmluaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyB0ZWFyZG93bigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBhd2FpdCB0aGlzLmludGVybmFsX2Z1bmN0aW9ucy50ZWFyZG93bigpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZGl0aW9uYWxfZnVuY3Rpb25zKCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBhcHA6IHRoaXMucGx1Z2luLmFwcCxcclxuICAgICAgICAgICAgb2JzaWRpYW46IG9ic2lkaWFuX21vZHVsZSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdlbmVyYXRlX29iamVjdChcclxuICAgICAgICBjb25maWc6IFJ1bm5pbmdDb25maWcsXHJcbiAgICAgICAgZnVuY3Rpb25zX21vZGU6IEZ1bmN0aW9uc01vZGUgPSBGdW5jdGlvbnNNb2RlLlVTRVJfSU5URVJOQUxcclxuICAgICk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcclxuICAgICAgICBjb25zdCBmaW5hbF9vYmplY3QgPSB7fTtcclxuICAgICAgICBjb25zdCBhZGRpdGlvbmFsX2Z1bmN0aW9uc19vYmplY3QgPSB0aGlzLmFkZGl0aW9uYWxfZnVuY3Rpb25zKCk7XHJcbiAgICAgICAgY29uc3QgaW50ZXJuYWxfZnVuY3Rpb25zX29iamVjdCA9XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW50ZXJuYWxfZnVuY3Rpb25zLmdlbmVyYXRlX29iamVjdChjb25maWcpO1xyXG4gICAgICAgIGxldCB1c2VyX2Z1bmN0aW9uc19vYmplY3QgPSB7fTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbihmaW5hbF9vYmplY3QsIGFkZGl0aW9uYWxfZnVuY3Rpb25zX29iamVjdCk7XHJcbiAgICAgICAgc3dpdGNoIChmdW5jdGlvbnNfbW9kZSkge1xyXG4gICAgICAgICAgICBjYXNlIEZ1bmN0aW9uc01vZGUuSU5URVJOQUw6XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGZpbmFsX29iamVjdCwgaW50ZXJuYWxfZnVuY3Rpb25zX29iamVjdCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBGdW5jdGlvbnNNb2RlLlVTRVJfSU5URVJOQUw6XHJcbiAgICAgICAgICAgICAgICB1c2VyX2Z1bmN0aW9uc19vYmplY3QgPVxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXNlcl9mdW5jdGlvbnMuZ2VuZXJhdGVfb2JqZWN0KGNvbmZpZyk7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGZpbmFsX29iamVjdCwge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLmludGVybmFsX2Z1bmN0aW9uc19vYmplY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlcjogdXNlcl9mdW5jdGlvbnNfb2JqZWN0LFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmaW5hbF9vYmplY3Q7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IGluaXQsIHsgUGFyc2VyQ29uZmlnLCBSZW5kZXJlciB9IGZyb20gXCJAc2lsZW50dm9pZDEzL3J1c3R5X2VuZ2luZVwiO1xyXG5cclxuLy8gVE9ETzogZmluZCBhIGNsZWFuZXIgd2F5IHRvIGVtYmVkIHdhc21cclxuLy8gQHRzLWlnbm9yZVxyXG5pbXBvcnQgeyBkZWZhdWx0IGFzIHdhc21iaW4gfSBmcm9tIFwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BzaWxlbnR2b2lkMTMvcnVzdHlfZW5naW5lL3J1c3R5X2VuZ2luZV9iZy53YXNtXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUGFyc2VyIHtcclxuICAgIHByaXZhdGUgcmVuZGVyZXI6IFJlbmRlcmVyO1xyXG5cclxuICAgIGFzeW5jIGluaXQoKSB7XHJcbiAgICAgICAgYXdhaXQgaW5pdCh3YXNtYmluKTtcclxuICAgICAgICBjb25zdCBjb25maWcgPSBuZXcgUGFyc2VyQ29uZmlnKFwiPCVcIiwgXCIlPlwiLCBcIlxcMFwiLCBcIipcIiwgXCItXCIsIFwiX1wiLCBcInRSXCIpO1xyXG4gICAgICAgIHRoaXMucmVuZGVyZXIgPSBuZXcgUmVuZGVyZXIoY29uZmlnKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBwYXJzZV9jb21tYW5kcyhcclxuICAgICAgICBjb250ZW50OiBzdHJpbmcsXHJcbiAgICAgICAgY29udGV4dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cclxuICAgICk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVuZGVyZXIucmVuZGVyX2NvbnRlbnQoY29udGVudCwgY29udGV4dCk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHtcclxuICAgIEFwcCxcclxuICAgIE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQsXHJcbiAgICBNYXJrZG93blZpZXcsXHJcbiAgICBub3JtYWxpemVQYXRoLFxyXG4gICAgVEFic3RyYWN0RmlsZSxcclxuICAgIFRGaWxlLFxyXG4gICAgVEZvbGRlcixcclxufSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHtcclxuICAgIGRlbGF5LFxyXG4gICAgZ2VuZXJhdGVfZHluYW1pY19jb21tYW5kX3JlZ2V4LFxyXG4gICAgZ2V0X2FjdGl2ZV9maWxlLFxyXG4gICAgZ2V0X2ZvbGRlcl9wYXRoX2Zyb21fZmlsZV9wYXRoLFxyXG4gICAgcmVzb2x2ZV90ZmlsZSxcclxufSBmcm9tIFwidXRpbHMvVXRpbHNcIjtcclxuaW1wb3J0IFRlbXBsYXRlclBsdWdpbiBmcm9tIFwibWFpblwiO1xyXG5pbXBvcnQge1xyXG4gICAgRnVuY3Rpb25zR2VuZXJhdG9yLFxyXG4gICAgRnVuY3Rpb25zTW9kZSxcclxufSBmcm9tIFwiLi9mdW5jdGlvbnMvRnVuY3Rpb25zR2VuZXJhdG9yXCI7XHJcbmltcG9ydCB7IGVycm9yV3JhcHBlciwgZXJyb3JXcmFwcGVyU3luYywgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwidXRpbHMvRXJyb3JcIjtcclxuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSBcIi4vcGFyc2VyL1BhcnNlclwiO1xyXG5pbXBvcnQgeyBsb2dfZXJyb3IgfSBmcm9tIFwidXRpbHMvTG9nXCI7XHJcblxyXG5leHBvcnQgZW51bSBSdW5Nb2RlIHtcclxuICAgIENyZWF0ZU5ld0Zyb21UZW1wbGF0ZSxcclxuICAgIEFwcGVuZEFjdGl2ZUZpbGUsXHJcbiAgICBPdmVyd3JpdGVGaWxlLFxyXG4gICAgT3ZlcndyaXRlQWN0aXZlRmlsZSxcclxuICAgIER5bmFtaWNQcm9jZXNzb3IsXHJcbiAgICBTdGFydHVwVGVtcGxhdGUsXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFJ1bm5pbmdDb25maWcgPSB7XHJcbiAgICB0ZW1wbGF0ZV9maWxlOiBURmlsZSB8IHVuZGVmaW5lZDtcclxuICAgIHRhcmdldF9maWxlOiBURmlsZTtcclxuICAgIHJ1bl9tb2RlOiBSdW5Nb2RlO1xyXG4gICAgYWN0aXZlX2ZpbGU/OiBURmlsZSB8IG51bGw7XHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVyIHtcclxuICAgIHB1YmxpYyBwYXJzZXI6IFBhcnNlcjtcclxuICAgIHB1YmxpYyBmdW5jdGlvbnNfZ2VuZXJhdG9yOiBGdW5jdGlvbnNHZW5lcmF0b3I7XHJcbiAgICBwdWJsaWMgY3VycmVudF9mdW5jdGlvbnNfb2JqZWN0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgIHB1YmxpYyBmaWxlc193aXRoX3BlbmRpbmdfdGVtcGxhdGVzOiBTZXQ8c3RyaW5nPjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICAgICAgdGhpcy5mdW5jdGlvbnNfZ2VuZXJhdG9yID0gbmV3IEZ1bmN0aW9uc0dlbmVyYXRvcih0aGlzLnBsdWdpbik7XHJcbiAgICAgICAgdGhpcy5wYXJzZXIgPSBuZXcgUGFyc2VyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc2V0dXAoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5maWxlc193aXRoX3BlbmRpbmdfdGVtcGxhdGVzID0gbmV3IFNldCgpO1xyXG4gICAgICAgIGF3YWl0IHRoaXMucGFyc2VyLmluaXQoKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmZ1bmN0aW9uc19nZW5lcmF0b3IuaW5pdCgpO1xyXG4gICAgICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyTWFya2Rvd25Qb3N0UHJvY2Vzc29yKChlbCwgY3R4KSA9PlxyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NfZHluYW1pY190ZW1wbGF0ZXMoZWwsIGN0eClcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZV9ydW5uaW5nX2NvbmZpZyhcclxuICAgICAgICB0ZW1wbGF0ZV9maWxlOiBURmlsZSB8IHVuZGVmaW5lZCxcclxuICAgICAgICB0YXJnZXRfZmlsZTogVEZpbGUsXHJcbiAgICAgICAgcnVuX21vZGU6IFJ1bk1vZGVcclxuICAgICk6IFJ1bm5pbmdDb25maWcge1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZV9maWxlID0gZ2V0X2FjdGl2ZV9maWxlKHRoaXMucGx1Z2luLmFwcCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlX2ZpbGU6IHRlbXBsYXRlX2ZpbGUsXHJcbiAgICAgICAgICAgIHRhcmdldF9maWxlOiB0YXJnZXRfZmlsZSxcclxuICAgICAgICAgICAgcnVuX21vZGU6IHJ1bl9tb2RlLFxyXG4gICAgICAgICAgICBhY3RpdmVfZmlsZTogYWN0aXZlX2ZpbGUsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWFkX2FuZF9wYXJzZV90ZW1wbGF0ZShjb25maWc6IFJ1bm5pbmdDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlX2NvbnRlbnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5hcHAudmF1bHQucmVhZChcclxuICAgICAgICAgICAgY29uZmlnLnRlbXBsYXRlX2ZpbGUgYXMgVEZpbGVcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlX3RlbXBsYXRlKGNvbmZpZywgdGVtcGxhdGVfY29udGVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcGFyc2VfdGVtcGxhdGUoXHJcbiAgICAgICAgY29uZmlnOiBSdW5uaW5nQ29uZmlnLFxyXG4gICAgICAgIHRlbXBsYXRlX2NvbnRlbnQ6IHN0cmluZ1xyXG4gICAgKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgICAgICBjb25zdCBmdW5jdGlvbnNfb2JqZWN0ID0gYXdhaXQgdGhpcy5mdW5jdGlvbnNfZ2VuZXJhdG9yLmdlbmVyYXRlX29iamVjdChcclxuICAgICAgICAgICAgY29uZmlnLFxyXG4gICAgICAgICAgICBGdW5jdGlvbnNNb2RlLlVTRVJfSU5URVJOQUxcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuY3VycmVudF9mdW5jdGlvbnNfb2JqZWN0ID0gZnVuY3Rpb25zX29iamVjdDtcclxuICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5wYXJzZXIucGFyc2VfY29tbWFuZHMoXHJcbiAgICAgICAgICAgIHRlbXBsYXRlX2NvbnRlbnQsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uc19vYmplY3RcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhcnRfdGVtcGxhdGVyX3Rhc2socGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5maWxlc193aXRoX3BlbmRpbmdfdGVtcGxhdGVzLmFkZChwYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmZpbGVzX3dpdGhfcGVuZGluZ190ZW1wbGF0ZXMuZGVsZXRlKHBhdGgpO1xyXG4gICAgICAgIGlmICh0aGlzLmZpbGVzX3dpdGhfcGVuZGluZ190ZW1wbGF0ZXMuc2l6ZSA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnRyaWdnZXIoXHJcbiAgICAgICAgICAgICAgICBcInRlbXBsYXRlcjphbGwtdGVtcGxhdGVzLWV4ZWN1dGVkXCJcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5mdW5jdGlvbnNfZ2VuZXJhdG9yLnRlYXJkb3duKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKFxyXG4gICAgICAgIHRlbXBsYXRlOiBURmlsZSB8IHN0cmluZyxcclxuICAgICAgICBmb2xkZXI/OiBURm9sZGVyIHwgc3RyaW5nLFxyXG4gICAgICAgIGZpbGVuYW1lPzogc3RyaW5nLFxyXG4gICAgICAgIG9wZW5fbmV3X25vdGUgPSB0cnVlXHJcbiAgICApOiBQcm9taXNlPFRGaWxlIHwgdW5kZWZpbmVkPiB7XHJcbiAgICAgICAgLy8gVE9ETzogTWF5YmUgdGhlcmUgaXMgYW4gb2JzaWRpYW4gQVBJIGZ1bmN0aW9uIGZvciB0aGF0XHJcbiAgICAgICAgaWYgKCFmb2xkZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgbmV3X2ZpbGVfbG9jYXRpb24gPVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldENvbmZpZyhcIm5ld0ZpbGVMb2NhdGlvblwiKTtcclxuICAgICAgICAgICAgc3dpdGNoIChuZXdfZmlsZV9sb2NhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImN1cnJlbnRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZV9maWxlID0gZ2V0X2FjdGl2ZV9maWxlKHRoaXMucGx1Z2luLmFwcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZV9maWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbGRlciA9IGFjdGl2ZV9maWxlLnBhcmVudDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZm9sZGVyXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgZm9sZGVyID0gdGhpcy5wbHVnaW4uYXBwLmZpbGVNYW5hZ2VyLmdldE5ld0ZpbGVQYXJlbnQoXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwicm9vdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlciA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRSb290KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBleHRlbnNpb24gPVxyXG4gICAgICAgICAgICB0ZW1wbGF0ZSBpbnN0YW5jZW9mIFRGaWxlID8gdGVtcGxhdGUuZXh0ZW5zaW9uIHx8IFwibWRcIiA6IFwibWRcIjtcclxuICAgICAgICBjb25zdCBjcmVhdGVkX25vdGUgPSBhd2FpdCBlcnJvcldyYXBwZXIoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmb2xkZXJQYXRoID0gZm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlciA/IGZvbGRlci5wYXRoIDogZm9sZGVyO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEF2YWlsYWJsZVBhdGgoXHJcbiAgICAgICAgICAgICAgICBub3JtYWxpemVQYXRoKGAke2ZvbGRlclBhdGggPz8gXCJcIn0vJHtmaWxlbmFtZSB8fCBcIlVudGl0bGVkXCJ9YCksXHJcbiAgICAgICAgICAgICAgICBleHRlbnNpb25cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY29uc3QgZm9sZGVyX3BhdGggPSBnZXRfZm9sZGVyX3BhdGhfZnJvbV9maWxlX3BhdGgocGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIGZvbGRlcl9wYXRoICYmXHJcbiAgICAgICAgICAgICAgICAhdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aEluc2Vuc2l0aXZlKFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlcl9wYXRoXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJfcGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgXCJcIik7XHJcbiAgICAgICAgfSwgYENvdWxkbid0IGNyZWF0ZSAke2V4dGVuc2lvbn0gZmlsZS5gKTtcclxuXHJcbiAgICAgICAgaWYgKGNyZWF0ZWRfbm90ZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHsgcGF0aCB9ID0gY3JlYXRlZF9ub3RlO1xyXG4gICAgICAgIHRoaXMuc3RhcnRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgbGV0IHJ1bm5pbmdfY29uZmlnOiBSdW5uaW5nQ29uZmlnO1xyXG4gICAgICAgIGxldCBvdXRwdXRfY29udGVudDogc3RyaW5nO1xyXG4gICAgICAgIGlmICh0ZW1wbGF0ZSBpbnN0YW5jZW9mIFRGaWxlKSB7XHJcbiAgICAgICAgICAgIHJ1bm5pbmdfY29uZmlnID0gdGhpcy5jcmVhdGVfcnVubmluZ19jb25maWcoXHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZSxcclxuICAgICAgICAgICAgICAgIGNyZWF0ZWRfbm90ZSxcclxuICAgICAgICAgICAgICAgIFJ1bk1vZGUuQ3JlYXRlTmV3RnJvbVRlbXBsYXRlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIG91dHB1dF9jb250ZW50ID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICAgICAgYXN5bmMgKCkgPT4gdGhpcy5yZWFkX2FuZF9wYXJzZV90ZW1wbGF0ZShydW5uaW5nX2NvbmZpZyksXHJcbiAgICAgICAgICAgICAgICBcIlRlbXBsYXRlIHBhcnNpbmcgZXJyb3IsIGFib3J0aW5nLlwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcnVubmluZ19jb25maWcgPSB0aGlzLmNyZWF0ZV9ydW5uaW5nX2NvbmZpZyhcclxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGNyZWF0ZWRfbm90ZSxcclxuICAgICAgICAgICAgICAgIFJ1bk1vZGUuQ3JlYXRlTmV3RnJvbVRlbXBsYXRlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIG91dHB1dF9jb250ZW50ID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICAgICAgYXN5bmMgKCkgPT4gdGhpcy5wYXJzZV90ZW1wbGF0ZShydW5uaW5nX2NvbmZpZywgdGVtcGxhdGUpLFxyXG4gICAgICAgICAgICAgICAgXCJUZW1wbGF0ZSBwYXJzaW5nIGVycm9yLCBhYm9ydGluZy5cIlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG91dHB1dF9jb250ZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmRlbGV0ZShjcmVhdGVkX25vdGUpO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0Lm1vZGlmeShjcmVhdGVkX25vdGUsIG91dHB1dF9jb250ZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwidGVtcGxhdGVyOm5ldy1ub3RlLWZyb20tdGVtcGxhdGVcIiwge1xyXG4gICAgICAgICAgICBmaWxlOiBjcmVhdGVkX25vdGUsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IG91dHB1dF9jb250ZW50LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAob3Blbl9uZXdfbm90ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVfbGVhZiA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XHJcbiAgICAgICAgICAgIGlmICghYWN0aXZlX2xlYWYpIHtcclxuICAgICAgICAgICAgICAgIGxvZ19lcnJvcihuZXcgVGVtcGxhdGVyRXJyb3IoXCJObyBhY3RpdmUgbGVhZlwiKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXdhaXQgYWN0aXZlX2xlYWYub3BlbkZpbGUoY3JlYXRlZF9ub3RlLCB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZTogeyBtb2RlOiBcInNvdXJjZVwiIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uZWRpdG9yX2hhbmRsZXIuanVtcF90b19uZXh0X2N1cnNvcl9sb2NhdGlvbihcclxuICAgICAgICAgICAgICAgIGNyZWF0ZWRfbm90ZSxcclxuICAgICAgICAgICAgICAgIHRydWVcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGFjdGl2ZV9sZWFmLnNldEVwaGVtZXJhbFN0YXRlKHtcclxuICAgICAgICAgICAgICAgIHJlbmFtZTogXCJhbGxcIixcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgICAgICByZXR1cm4gY3JlYXRlZF9ub3RlO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGFwcGVuZF90ZW1wbGF0ZV90b19hY3RpdmVfZmlsZSh0ZW1wbGF0ZV9maWxlOiBURmlsZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZV92aWV3ID1cclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlX2VkaXRvciA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuYWN0aXZlRWRpdG9yO1xyXG4gICAgICAgIGlmICghYWN0aXZlX2VkaXRvciB8fCAhYWN0aXZlX2VkaXRvci5maWxlIHx8ICFhY3RpdmVfZWRpdG9yLmVkaXRvcikge1xyXG4gICAgICAgICAgICBsb2dfZXJyb3IoXHJcbiAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGVyRXJyb3IoXCJObyBhY3RpdmUgZWRpdG9yLCBjYW4ndCBhcHBlbmQgdGVtcGxhdGVzLlwiKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHsgcGF0aCB9ID0gYWN0aXZlX2VkaXRvci5maWxlO1xyXG4gICAgICAgIHRoaXMuc3RhcnRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgY29uc3QgcnVubmluZ19jb25maWcgPSB0aGlzLmNyZWF0ZV9ydW5uaW5nX2NvbmZpZyhcclxuICAgICAgICAgICAgdGVtcGxhdGVfZmlsZSxcclxuICAgICAgICAgICAgYWN0aXZlX2VkaXRvci5maWxlLFxyXG4gICAgICAgICAgICBSdW5Nb2RlLkFwcGVuZEFjdGl2ZUZpbGVcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnN0IG91dHB1dF9jb250ZW50ID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICBhc3luYyAoKSA9PiB0aGlzLnJlYWRfYW5kX3BhcnNlX3RlbXBsYXRlKHJ1bm5pbmdfY29uZmlnKSxcclxuICAgICAgICAgICAgXCJUZW1wbGF0ZSBwYXJzaW5nIGVycm9yLCBhYm9ydGluZy5cIlxyXG4gICAgICAgICk7XHJcbiAgICAgICAgLy8gZXJyb3JXcmFwcGVyIGZhaWxlZFxyXG4gICAgICAgIGlmIChvdXRwdXRfY29udGVudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5kX3RlbXBsYXRlcl90YXNrKHBhdGgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhY3RpdmVfZWRpdG9yLmVkaXRvcjtcclxuICAgICAgICBjb25zdCBkb2MgPSBlZGl0b3IuZ2V0RG9jKCk7XHJcbiAgICAgICAgY29uc3Qgb2xkU2VsZWN0aW9ucyA9IGRvYy5saXN0U2VsZWN0aW9ucygpO1xyXG4gICAgICAgIGRvYy5yZXBsYWNlU2VsZWN0aW9uKG91dHB1dF9jb250ZW50KTtcclxuICAgICAgICAvLyBSZWZyZXNoIGVkaXRvciB0byBlbnN1cmUgcHJvcGVydGllcyB3aWRnZXQgc2hvd3MgYWZ0ZXIgaW5zZXJ0aW5nIHRlbXBsYXRlIGluIGJsYW5rIGZpbGVcclxuICAgICAgICBpZiAoYWN0aXZlX2VkaXRvci5maWxlKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5hcHBlbmQoYWN0aXZlX2VkaXRvci5maWxlLCBcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwidGVtcGxhdGVyOnRlbXBsYXRlLWFwcGVuZGVkXCIsIHtcclxuICAgICAgICAgICAgdmlldzogYWN0aXZlX3ZpZXcsXHJcbiAgICAgICAgICAgIGVkaXRvcjogYWN0aXZlX2VkaXRvcixcclxuICAgICAgICAgICAgY29udGVudDogb3V0cHV0X2NvbnRlbnQsXHJcbiAgICAgICAgICAgIG9sZFNlbGVjdGlvbnMsXHJcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnM6IGRvYy5saXN0U2VsZWN0aW9ucygpLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5lZGl0b3JfaGFuZGxlci5qdW1wX3RvX25leHRfY3Vyc29yX2xvY2F0aW9uKFxyXG4gICAgICAgICAgICBhY3RpdmVfZWRpdG9yLmZpbGUsXHJcbiAgICAgICAgICAgIHRydWVcclxuICAgICAgICApO1xyXG4gICAgICAgIGF3YWl0IHRoaXMuZW5kX3RlbXBsYXRlcl90YXNrKHBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHdyaXRlX3RlbXBsYXRlX3RvX2ZpbGUoXHJcbiAgICAgICAgdGVtcGxhdGVfZmlsZTogVEZpbGUsXHJcbiAgICAgICAgZmlsZTogVEZpbGVcclxuICAgICk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IHsgcGF0aCB9ID0gZmlsZTtcclxuICAgICAgICB0aGlzLnN0YXJ0X3RlbXBsYXRlcl90YXNrKHBhdGgpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZV9lZGl0b3IgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLmFjdGl2ZUVkaXRvcjtcclxuICAgICAgICBjb25zdCBhY3RpdmVfZmlsZSA9IGdldF9hY3RpdmVfZmlsZSh0aGlzLnBsdWdpbi5hcHApO1xyXG4gICAgICAgIGNvbnN0IHJ1bm5pbmdfY29uZmlnID0gdGhpcy5jcmVhdGVfcnVubmluZ19jb25maWcoXHJcbiAgICAgICAgICAgIHRlbXBsYXRlX2ZpbGUsXHJcbiAgICAgICAgICAgIGZpbGUsXHJcbiAgICAgICAgICAgIFJ1bk1vZGUuT3ZlcndyaXRlRmlsZVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0X2NvbnRlbnQgPSBhd2FpdCBlcnJvcldyYXBwZXIoXHJcbiAgICAgICAgICAgIGFzeW5jICgpID0+IHRoaXMucmVhZF9hbmRfcGFyc2VfdGVtcGxhdGUocnVubmluZ19jb25maWcpLFxyXG4gICAgICAgICAgICBcIlRlbXBsYXRlIHBhcnNpbmcgZXJyb3IsIGFib3J0aW5nLlwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICAvLyBlcnJvcldyYXBwZXIgZmFpbGVkXHJcbiAgICAgICAgaWYgKG91dHB1dF9jb250ZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbmRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBvdXRwdXRfY29udGVudCk7XHJcbiAgICAgICAgLy8gU2V0IGN1cnNvciB0byBmaXJzdCBsaW5lIG9mIGVkaXRvciAoYmVsb3cgcHJvcGVydGllcylcclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vU2lsZW50Vm9pZDEzL1RlbXBsYXRlci9pc3N1ZXMvMTIzMVxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgYWN0aXZlX2ZpbGU/LnBhdGggPT09IGZpbGUucGF0aCAmJlxyXG4gICAgICAgICAgICBhY3RpdmVfZWRpdG9yICYmXHJcbiAgICAgICAgICAgIGFjdGl2ZV9lZGl0b3IuZWRpdG9yXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGFjdGl2ZV9lZGl0b3IuZWRpdG9yO1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2V0U2VsZWN0aW9uKHsgbGluZTogMCwgY2g6IDAgfSwgeyBsaW5lOiAwLCBjaDogMCB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwidGVtcGxhdGVyOm5ldy1ub3RlLWZyb20tdGVtcGxhdGVcIiwge1xyXG4gICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICBjb250ZW50OiBvdXRwdXRfY29udGVudCxcclxuICAgICAgICB9KTtcclxuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5lZGl0b3JfaGFuZGxlci5qdW1wX3RvX25leHRfY3Vyc29yX2xvY2F0aW9uKFxyXG4gICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBvdmVyd3JpdGVfYWN0aXZlX2ZpbGVfY29tbWFuZHMoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlX2VkaXRvciA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuYWN0aXZlRWRpdG9yO1xyXG4gICAgICAgIGlmICghYWN0aXZlX2VkaXRvciB8fCAhYWN0aXZlX2VkaXRvci5maWxlKSB7XHJcbiAgICAgICAgICAgIGxvZ19lcnJvcihcclxuICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBcIkFjdGl2ZSBlZGl0b3IgaXMgbnVsbCwgY2FuJ3Qgb3ZlcndyaXRlIGNvbnRlbnRcIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMub3ZlcndyaXRlX2ZpbGVfY29tbWFuZHMoYWN0aXZlX2VkaXRvci5maWxlLCB0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBvdmVyd3JpdGVfZmlsZV9jb21tYW5kcyhcclxuICAgICAgICBmaWxlOiBURmlsZSxcclxuICAgICAgICBhY3RpdmVfZmlsZSA9IGZhbHNlXHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCB7IHBhdGggfSA9IGZpbGU7XHJcbiAgICAgICAgdGhpcy5zdGFydF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgICAgICBjb25zdCBydW5uaW5nX2NvbmZpZyA9IHRoaXMuY3JlYXRlX3J1bm5pbmdfY29uZmlnKFxyXG4gICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICBhY3RpdmVfZmlsZSA/IFJ1bk1vZGUuT3ZlcndyaXRlQWN0aXZlRmlsZSA6IFJ1bk1vZGUuT3ZlcndyaXRlRmlsZVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0X2NvbnRlbnQgPSBhd2FpdCBlcnJvcldyYXBwZXIoXHJcbiAgICAgICAgICAgIGFzeW5jICgpID0+IHRoaXMucmVhZF9hbmRfcGFyc2VfdGVtcGxhdGUocnVubmluZ19jb25maWcpLFxyXG4gICAgICAgICAgICBcIlRlbXBsYXRlIHBhcnNpbmcgZXJyb3IsIGFib3J0aW5nLlwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICAvLyBlcnJvcldyYXBwZXIgZmFpbGVkXHJcbiAgICAgICAgaWYgKG91dHB1dF9jb250ZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbmRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBvdXRwdXRfY29udGVudCk7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwidGVtcGxhdGVyOm92ZXJ3cml0ZS1maWxlXCIsIHtcclxuICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgY29udGVudDogb3V0cHV0X2NvbnRlbnQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uZWRpdG9yX2hhbmRsZXIuanVtcF90b19uZXh0X2N1cnNvcl9sb2NhdGlvbihcclxuICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5lbmRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcHJvY2Vzc19keW5hbWljX3RlbXBsYXRlcyhcclxuICAgICAgICBlbDogSFRNTEVsZW1lbnQsXHJcbiAgICAgICAgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0XHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBkeW5hbWljX2NvbW1hbmRfcmVnZXggPSBnZW5lcmF0ZV9keW5hbWljX2NvbW1hbmRfcmVnZXgoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlTm9kZUl0ZXJhdG9yKGVsLCBOb2RlRmlsdGVyLlNIT1dfVEVYVCk7XHJcbiAgICAgICAgbGV0IG5vZGU7XHJcbiAgICAgICAgbGV0IHBhc3MgPSBmYWxzZTtcclxuICAgICAgICBsZXQgZnVuY3Rpb25zX29iamVjdDogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbiAgICAgICAgd2hpbGUgKChub2RlID0gd2Fsa2VyLm5leHROb2RlKCkpKSB7XHJcbiAgICAgICAgICAgIGxldCBjb250ZW50ID0gbm9kZS5ub2RlVmFsdWU7XHJcbiAgICAgICAgICAgIGlmIChjb250ZW50ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWF0Y2ggPSBkeW5hbWljX2NvbW1hbmRfcmVnZXguZXhlYyhjb250ZW50KTtcclxuICAgICAgICAgICAgICAgIGlmIChtYXRjaCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguc291cmNlUGF0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsZSB8fCAhKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzcyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY3JlYXRlX3J1bm5pbmdfY29uZmlnKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSdW5Nb2RlLkR5bmFtaWNQcm9jZXNzb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25zX29iamVjdCA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmZ1bmN0aW9uc19nZW5lcmF0b3IuZ2VuZXJhdGVfb2JqZWN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGdW5jdGlvbnNNb2RlLlVTRVJfSU5URVJOQUxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudF9mdW5jdGlvbnNfb2JqZWN0ID0gZnVuY3Rpb25zX29iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKG1hdGNoICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOb3QgdGhlIG1vc3QgZWZmaWNpZW50IHdheSB0byBleGNsdWRlIHRoZSAnKycgZnJvbSB0aGUgY29tbWFuZCBidXQgSSBjb3VsZG4ndCBmaW5kIHNvbWV0aGluZyBiZXR0ZXJcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wbGV0ZV9jb21tYW5kID0gbWF0Y2hbMV0gKyBtYXRjaFsyXTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kX291dHB1dDogc3RyaW5nID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJzZXIucGFyc2VfY29tbWFuZHMoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGVfY29tbWFuZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbnNfb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgQ29tbWFuZCBQYXJzaW5nIGVycm9yIGluIGR5bmFtaWMgY29tbWFuZCAnJHtjb21wbGV0ZV9jb21tYW5kfSdgXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tbWFuZF9vdXRwdXQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZHluYW1pY19jb21tYW5kX3JlZ2V4Lmxhc3RJbmRleCAtIG1hdGNoWzBdLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBkeW5hbWljX2NvbW1hbmRfcmVnZXgubGFzdEluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LnN1YnN0cmluZygwLCBzdGFydCkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kX291dHB1dCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuc3Vic3RyaW5nKGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGR5bmFtaWNfY29tbWFuZF9yZWdleC5sYXN0SW5kZXggKz1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZF9vdXRwdXQubGVuZ3RoIC0gbWF0Y2hbMF0ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoID0gZHluYW1pY19jb21tYW5kX3JlZ2V4LmV4ZWMoY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBub2RlLm5vZGVWYWx1ZSA9IGNvbnRlbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0X25ld19maWxlX3RlbXBsYXRlX2Zvcl9mb2xkZXIoZm9sZGVyOiBURm9sZGVyKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlcy5maW5kKFxyXG4gICAgICAgICAgICAgICAgKGUpID0+IGUuZm9sZGVyID09IGZvbGRlci5wYXRoXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2gudGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaC50ZW1wbGF0ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9sZGVyID0gZm9sZGVyLnBhcmVudDtcclxuICAgICAgICB9IHdoaWxlIChmb2xkZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldF9uZXdfZmlsZV90ZW1wbGF0ZV9mb3JfZmlsZShmaWxlOiBURmlsZSk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlX3RlbXBsYXRlcy5maW5kKChlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVSZWdleCA9IG5ldyBSZWdFeHAoZS5yZWdleCk7XHJcbiAgICAgICAgICAgIHJldHVybiBlUmVnZXgudGVzdChmaWxlLnBhdGgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2gudGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnRlbXBsYXRlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgb25fZmlsZV9jcmVhdGlvbihcclxuICAgICAgICB0ZW1wbGF0ZXI6IFRlbXBsYXRlcixcclxuICAgICAgICBhcHA6IEFwcCxcclxuICAgICAgICBmaWxlOiBUQWJzdHJhY3RGaWxlXHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHx8IGZpbGUuZXh0ZW5zaW9uICE9PSBcIm1kXCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQXZvaWRzIHRlbXBsYXRlIHJlcGxhY2VtZW50IHdoZW4gc3luY2luZyB0ZW1wbGF0ZSBmaWxlc1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlX2ZvbGRlciA9IG5vcm1hbGl6ZVBhdGgoXHJcbiAgICAgICAgICAgIHRlbXBsYXRlci5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVzX2ZvbGRlclxyXG4gICAgICAgICk7XHJcbiAgICAgICAgaWYgKGZpbGUucGF0aC5pbmNsdWRlcyh0ZW1wbGF0ZV9mb2xkZXIpICYmIHRlbXBsYXRlX2ZvbGRlciAhPT0gXCIvXCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVE9ETzogZmluZCBhIGJldHRlciB3YXkgdG8gZG8gdGhpc1xyXG4gICAgICAgIC8vIEN1cnJlbnRseSwgSSBoYXZlIHRvIHdhaXQgZm9yIHRoZSBub3RlIGV4dHJhY3RvciBwbHVnaW4gdG8gYWRkIHRoZSBmaWxlIGNvbnRlbnQgYmVmb3JlIHJlcGxhY2luZ1xyXG4gICAgICAgIGF3YWl0IGRlbGF5KDMwMCk7XHJcblxyXG4gICAgICAgIC8vIEF2b2lkcyB0ZW1wbGF0ZSByZXBsYWNlbWVudCB3aGVuIGNyZWF0aW5nIGZpbGUgZnJvbSB0ZW1wbGF0ZSB3aXRob3V0IGNvbnRlbnQgYmVmb3JlIGRlbGF5XHJcbiAgICAgICAgaWYgKHRlbXBsYXRlci5maWxlc193aXRoX3BlbmRpbmdfdGVtcGxhdGVzLmhhcyhmaWxlLnBhdGgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgZmlsZS5zdGF0LnNpemUgPT0gMCAmJlxyXG4gICAgICAgICAgICB0ZW1wbGF0ZXIucGx1Z2luLnNldHRpbmdzLmVuYWJsZV9mb2xkZXJfdGVtcGxhdGVzXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvbGRlcl90ZW1wbGF0ZV9tYXRjaCA9XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZXIuZ2V0X25ld19maWxlX3RlbXBsYXRlX2Zvcl9mb2xkZXIoZmlsZS5wYXJlbnQpO1xyXG4gICAgICAgICAgICBpZiAoIWZvbGRlcl90ZW1wbGF0ZV9tYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlX2ZpbGU6IFRGaWxlID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICAgICAgYXN5bmMgKCk6IFByb21pc2U8VEZpbGU+ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZV90ZmlsZShhcHAsIGZvbGRlcl90ZW1wbGF0ZV9tYXRjaCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYENvdWxkbid0IGZpbmQgdGVtcGxhdGUgJHtmb2xkZXJfdGVtcGxhdGVfbWF0Y2h9YFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAvLyBlcnJvcldyYXBwZXIgZmFpbGVkXHJcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZV9maWxlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhd2FpdCB0ZW1wbGF0ZXIud3JpdGVfdGVtcGxhdGVfdG9fZmlsZSh0ZW1wbGF0ZV9maWxlLCBmaWxlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgICBmaWxlLnN0YXQuc2l6ZSA9PSAwICYmXHJcbiAgICAgICAgICAgIHRlbXBsYXRlci5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlX2ZpbGVfdGVtcGxhdGVzXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVfdGVtcGxhdGVfbWF0Y2ggPVxyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVyLmdldF9uZXdfZmlsZV90ZW1wbGF0ZV9mb3JfZmlsZShmaWxlKTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlX3RlbXBsYXRlX21hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVfZmlsZTogVEZpbGUgPSBhd2FpdCBlcnJvcldyYXBwZXIoXHJcbiAgICAgICAgICAgICAgICBhc3luYyAoKTogUHJvbWlzZTxURmlsZT4gPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlX3RmaWxlKGFwcCwgZmlsZV90ZW1wbGF0ZV9tYXRjaCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYENvdWxkbid0IGZpbmQgdGVtcGxhdGUgJHtmaWxlX3RlbXBsYXRlX21hdGNofWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgLy8gZXJyb3JXcmFwcGVyIGZhaWxlZFxyXG4gICAgICAgICAgICBpZiAodGVtcGxhdGVfZmlsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXdhaXQgdGVtcGxhdGVyLndyaXRlX3RlbXBsYXRlX3RvX2ZpbGUodGVtcGxhdGVfZmlsZSwgZmlsZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGZpbGUuc3RhdC5zaXplIDw9IDEwMDAwMCkge1xyXG4gICAgICAgICAgICAgICAgLy9odHRwczovL2dpdGh1Yi5jb20vU2lsZW50Vm9pZDEzL1RlbXBsYXRlci9pc3N1ZXMvODczXHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0ZW1wbGF0ZXIub3ZlcndyaXRlX2ZpbGVfY29tbWFuZHMoZmlsZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICBgVGVtcGxhdGVyIHNraXBwZWQgcGFyc2luZyAke2ZpbGUucGF0aH0gYmVjYXVzZSBmaWxlIHNpemUgZXhjZWVkcyAxMDAwMGBcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZV9zdGFydHVwX3NjcmlwdHMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgZm9yIChjb25zdCB0ZW1wbGF0ZSBvZiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdGFydHVwX3RlbXBsYXRlcykge1xyXG4gICAgICAgICAgICBpZiAoIXRlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gZXJyb3JXcmFwcGVyU3luYyhcclxuICAgICAgICAgICAgICAgICgpID0+IHJlc29sdmVfdGZpbGUodGhpcy5wbHVnaW4uYXBwLCB0ZW1wbGF0ZSksXHJcbiAgICAgICAgICAgICAgICBgQ291bGRuJ3QgZmluZCBzdGFydHVwIHRlbXBsYXRlIFwiJHt0ZW1wbGF0ZX1cImBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCB7IHBhdGggfSA9IGZpbGU7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJ1bm5pbmdfY29uZmlnID0gdGhpcy5jcmVhdGVfcnVubmluZ19jb25maWcoXHJcbiAgICAgICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgICAgIFJ1bk1vZGUuU3RhcnR1cFRlbXBsYXRlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGF3YWl0IGVycm9yV3JhcHBlcihcclxuICAgICAgICAgICAgICAgIGFzeW5jICgpID0+IHRoaXMucmVhZF9hbmRfcGFyc2VfdGVtcGxhdGUocnVubmluZ19jb25maWcpLFxyXG4gICAgICAgICAgICAgICAgYFN0YXJ0dXAgVGVtcGxhdGUgcGFyc2luZyBlcnJvciwgYWJvcnRpbmcuYFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHtcclxuICAgIEFwcCxcclxuICAgIEVkaXRvclBvc2l0aW9uLFxyXG4gICAgRWRpdG9yUmFuZ2VPckNhcmV0LFxyXG4gICAgRWRpdG9yVHJhbnNhY3Rpb24sXHJcbiAgICBNYXJrZG93blZpZXcsXHJcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IGVzY2FwZV9SZWdFeHAgfSBmcm9tIFwidXRpbHMvVXRpbHNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBDdXJzb3JKdW1wZXIge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhcHA6IEFwcCkge31cclxuXHJcbiAgICBhc3luYyBqdW1wX3RvX25leHRfY3Vyc29yX2xvY2F0aW9uKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZV9lZGl0b3IgPSB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlRWRpdG9yO1xyXG4gICAgICAgIGlmICghYWN0aXZlX2VkaXRvciB8fCAhYWN0aXZlX2VkaXRvci5lZGl0b3IpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBjb250ZW50ID0gYWN0aXZlX2VkaXRvci5lZGl0b3IuZ2V0VmFsdWUoKTtcclxuXHJcbiAgICAgICAgY29uc3QgeyBuZXdfY29udGVudCwgcG9zaXRpb25zIH0gPVxyXG4gICAgICAgICAgICB0aGlzLnJlcGxhY2VfYW5kX2dldF9jdXJzb3JfcG9zaXRpb25zKGNvbnRlbnQpO1xyXG4gICAgICAgIGlmIChwb3NpdGlvbnMpIHtcclxuICAgICAgICAgICAgY29uc3QgZm9sZF9pbmZvID1cclxuICAgICAgICAgICAgICAgIGFjdGl2ZV9lZGl0b3IgaW5zdGFuY2VvZiBNYXJrZG93blZpZXdcclxuICAgICAgICAgICAgICAgICAgICA/IGFjdGl2ZV9lZGl0b3IuY3VycmVudE1vZGUuZ2V0Rm9sZEluZm8oKVxyXG4gICAgICAgICAgICAgICAgICAgIDogbnVsbDtcclxuICAgICAgICAgICAgYWN0aXZlX2VkaXRvci5lZGl0b3Iuc2V0VmFsdWUobmV3X2NvbnRlbnQgYXMgc3RyaW5nKTtcclxuICAgICAgICAgICAgLy8gb25seSBleHBhbmQgZm9sZHMgdGhhdCBoYXZlIGEgY3Vyc29yIHBsYWNlZCB3aXRoaW4gaXQncyBib3VuZHNcclxuICAgICAgICAgICAgaWYgKGZvbGRfaW5mbyAmJiBBcnJheS5pc0FycmF5KGZvbGRfaW5mby5mb2xkcykpIHtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5mb3JFYWNoKChwb3NpdGlvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvbGRfaW5mby5mb2xkcyA9IGZvbGRfaW5mby5mb2xkcy5maWx0ZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChmb2xkKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9sZC5mcm9tID4gcG9zaXRpb24ubGluZSB8fCBmb2xkLnRvIDwgcG9zaXRpb24ubGluZVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGlmIChhY3RpdmVfZWRpdG9yIGluc3RhbmNlb2YgTWFya2Rvd25WaWV3KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlX2VkaXRvci5jdXJyZW50TW9kZS5hcHBseUZvbGRJbmZvKGZvbGRfaW5mbyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5zZXRfY3Vyc29yX2xvY2F0aW9uKHBvc2l0aW9ucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBlbnRlciBpbnNlcnQgbW9kZSBmb3IgdmltIHVzZXJzXHJcbiAgICAgICAgaWYgKHRoaXMuYXBwLnZhdWx0LmdldENvbmZpZyhcInZpbU1vZGVcIikpIHtcclxuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICBjb25zdCBjbSA9IGFjdGl2ZV9lZGl0b3IuZWRpdG9yLmNtLmNtO1xyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHdpbmRvdy5Db2RlTWlycm9yQWRhcHRlci5WaW0uaGFuZGxlS2V5KGNtLCBcImlcIiwgXCJtYXBwaW5nXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRfZWRpdG9yX3Bvc2l0aW9uX2Zyb21faW5kZXgoXHJcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxyXG4gICAgICAgIGluZGV4OiBudW1iZXJcclxuICAgICk6IEVkaXRvclBvc2l0aW9uIHtcclxuICAgICAgICBjb25zdCBzdWJzdHIgPSBjb250ZW50LnNsaWNlKDAsIGluZGV4KTtcclxuXHJcbiAgICAgICAgbGV0IGwgPSAwO1xyXG4gICAgICAgIGxldCBvZmZzZXQgPSAtMTtcclxuICAgICAgICBsZXQgciA9IC0xO1xyXG4gICAgICAgIGZvciAoOyAociA9IHN1YnN0ci5pbmRleE9mKFwiXFxuXCIsIHIgKyAxKSkgIT09IC0xOyBsKyssIG9mZnNldCA9IHIpO1xyXG4gICAgICAgIG9mZnNldCArPSAxO1xyXG5cclxuICAgICAgICBjb25zdCBjaCA9IGNvbnRlbnQuc2xpY2Uob2Zmc2V0LCBpbmRleCkubGVuZ3RoO1xyXG5cclxuICAgICAgICByZXR1cm4geyBsaW5lOiBsLCBjaDogY2ggfTtcclxuICAgIH1cclxuXHJcbiAgICByZXBsYWNlX2FuZF9nZXRfY3Vyc29yX3Bvc2l0aW9ucyhjb250ZW50OiBzdHJpbmcpOiB7XHJcbiAgICAgICAgbmV3X2NvbnRlbnQ/OiBzdHJpbmc7XHJcbiAgICAgICAgcG9zaXRpb25zPzogRWRpdG9yUG9zaXRpb25bXTtcclxuICAgIH0ge1xyXG4gICAgICAgIGxldCBjdXJzb3JfbWF0Y2hlcyA9IFtdO1xyXG4gICAgICAgIGxldCBtYXRjaDtcclxuICAgICAgICBjb25zdCBjdXJzb3JfcmVnZXggPSBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICBcIjwlXFxcXHMqdHAuZmlsZS5jdXJzb3JcXFxcKCg/PG9yZGVyPlswLTldKilcXFxcKVxcXFxzKiU+XCIsXHJcbiAgICAgICAgICAgIFwiZ1wiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgd2hpbGUgKChtYXRjaCA9IGN1cnNvcl9yZWdleC5leGVjKGNvbnRlbnQpKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGN1cnNvcl9tYXRjaGVzLnB1c2gobWF0Y2gpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY3Vyc29yX21hdGNoZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7fTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGN1cnNvcl9tYXRjaGVzLnNvcnQoKG0xLCBtMikgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgTnVtYmVyKG0xLmdyb3VwcyAmJiBtMS5ncm91cHNbXCJvcmRlclwiXSkgLVxyXG4gICAgICAgICAgICAgICAgTnVtYmVyKG0yLmdyb3VwcyAmJiBtMi5ncm91cHNbXCJvcmRlclwiXSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zdCBtYXRjaF9zdHIgPSBjdXJzb3JfbWF0Y2hlc1swXVswXTtcclxuXHJcbiAgICAgICAgY3Vyc29yX21hdGNoZXMgPSBjdXJzb3JfbWF0Y2hlcy5maWx0ZXIoKG0pID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1bMF0gPT09IG1hdGNoX3N0cjtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgcG9zaXRpb25zID0gW107XHJcbiAgICAgICAgbGV0IGluZGV4X29mZnNldCA9IDA7XHJcbiAgICAgICAgZm9yIChjb25zdCBtYXRjaCBvZiBjdXJzb3JfbWF0Y2hlcykge1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IG1hdGNoLmluZGV4IC0gaW5kZXhfb2Zmc2V0O1xyXG4gICAgICAgICAgICBwb3NpdGlvbnMucHVzaCh0aGlzLmdldF9lZGl0b3JfcG9zaXRpb25fZnJvbV9pbmRleChjb250ZW50LCBpbmRleCkpO1xyXG5cclxuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQucmVwbGFjZShuZXcgUmVnRXhwKGVzY2FwZV9SZWdFeHAobWF0Y2hbMF0pKSwgXCJcIik7XHJcbiAgICAgICAgICAgIGluZGV4X29mZnNldCArPSBtYXRjaFswXS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAvLyBGb3IgdHAuZmlsZS5jdXJzb3IoKSwgd2Uga2VlcCB0aGUgZGVmYXVsdCB0b3AgdG8gYm90dG9tXHJcbiAgICAgICAgICAgIGlmIChtYXRjaFsxXSA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7IG5ld19jb250ZW50OiBjb250ZW50LCBwb3NpdGlvbnM6IHBvc2l0aW9ucyB9O1xyXG4gICAgfVxyXG5cclxuICAgIHNldF9jdXJzb3JfbG9jYXRpb24ocG9zaXRpb25zOiBFZGl0b3JQb3NpdGlvbltdKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlX2VkaXRvciA9IHRoaXMuYXBwLndvcmtzcGFjZS5hY3RpdmVFZGl0b3I7XHJcbiAgICAgICAgaWYgKCFhY3RpdmVfZWRpdG9yIHx8ICFhY3RpdmVfZWRpdG9yLmVkaXRvcikge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhY3RpdmVfZWRpdG9yLmVkaXRvcjtcclxuXHJcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uczogQXJyYXk8RWRpdG9yUmFuZ2VPckNhcmV0PiA9IFtdO1xyXG4gICAgICAgIGZvciAoY29uc3QgcG9zIG9mIHBvc2l0aW9ucykge1xyXG4gICAgICAgICAgICBzZWxlY3Rpb25zLnB1c2goeyBmcm9tOiBwb3MgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbjogRWRpdG9yVHJhbnNhY3Rpb24gPSB7XHJcbiAgICAgICAgICAgIHNlbGVjdGlvbnM6IHNlbGVjdGlvbnMsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBlZGl0b3IudHJhbnNhY3Rpb24odHJhbnNhY3Rpb24pO1xyXG4gICAgfVxyXG59XHJcbiIsIi8qKlxyXG4gKiBUaGUgcmVjb25naXplZCByZW5kZXIgc2V0dGluZyBvcHRpb25zXHJcbiAqL1xyXG5leHBvcnQgZW51bSBJbnRlbGxpc2Vuc2VSZW5kZXJPcHRpb24ge1xyXG4gICAgT2ZmID0gMCxcclxuICAgIFJlbmRlckRlc2NyaXB0aW9uUGFyYW1ldGVyUmV0dXJuID0gMSxcclxuICAgIFJlbmRlckRlc2NyaXB0aW9uUGFyYW1ldGVyTGlzdCA9IDIsXHJcbiAgICBSZW5kZXJEZXNjcmlwdGlvblJldHVybiA9IDMsXHJcbiAgICBSZW5kZXJEZXNjcmlwdGlvbk9ubHkgPSA0XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcclxuICogQHBhcmFtIHZhbHVlIFRoZSBpbnRlbGxpc2Vuc2UgcmVuZGVyIHNldHRpbmdcclxuICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgUmV0dXJuIEludGVsbGlzZW5zZSBzaG91bGQgcmVuZGVyLCBvdGhlcndpc2UgZmFsc2VcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRSZW5kZXJSZXR1cm5zKHJlbmRlcl9zZXR0aW5nOiBJbnRlbGxpc2Vuc2VSZW5kZXJPcHRpb24gfCBib29sZWFuKSA6IGJvb2xlYW4ge1xyXG4gICAgLy8gUmVuZGVyIG92ZXJyaWRlXHJcbiAgICBpZiAoaXNCb29sZWFuKHJlbmRlcl9zZXR0aW5nKSkgcmV0dXJuIHJlbmRlcl9zZXR0aW5nXHJcblxyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICBJbnRlbGxpc2Vuc2VSZW5kZXJPcHRpb24uUmVuZGVyRGVzY3JpcHRpb25QYXJhbWV0ZXJSZXR1cm4sXHJcbiAgICAgICAgSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uLlJlbmRlckRlc2NyaXB0aW9uUmV0dXJuXHJcbiAgICBdLmluY2x1ZGVzKHJlbmRlcl9zZXR0aW5nKVxyXG59XHJcblxyXG4vKipcclxuICogXHJcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgaW50ZWxsaXNlbnNlIHJlbmRlciBzZXR0aW5nXHJcbiAqIEByZXR1cm5zIFRydWUgaWYgdGhlIFBhcmFtZXRlcnMgSW50ZWxsaXNlbnNlIHNob3VsZCByZW5kZXIsIG90aGVyd2lzZSBmYWxzZVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZFJlbmRlclBhcmFtZXRlcnMocmVuZGVyX3NldHRpbmc6IEludGVsbGlzZW5zZVJlbmRlck9wdGlvbikgOiBib29sZWFuIHtcclxuICAgIC8vIFJlbmRlciBvdmVycmlkZVxyXG4gICAgaWYgKGlzQm9vbGVhbihyZW5kZXJfc2V0dGluZykpIHJldHVybiByZW5kZXJfc2V0dGluZ1xyXG5cclxuICAgIHJldHVybiBbXHJcbiAgICAgICAgSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uLlJlbmRlckRlc2NyaXB0aW9uUGFyYW1ldGVyUmV0dXJuLFxyXG4gICAgICAgIEludGVsbGlzZW5zZVJlbmRlck9wdGlvbi5SZW5kZXJEZXNjcmlwdGlvblBhcmFtZXRlckxpc3RcclxuICAgIF0uaW5jbHVkZXMocmVuZGVyX3NldHRpbmcpO1xyXG59XHJcblxyXG4vKipcclxuICogXHJcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgaW50ZWxsaXNlbnNlIHJlbmRlciBzZXR0aW5nXHJcbiAqIEByZXR1cm5zIFRydWUgaWYgdGhlIERlc2NyaXB0aW9uIEludGVsbGlzZW5zZSBzaG91bGQgcmVuZGVyLCBvdGhlcndpc2UgZmFsc2VcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRSZW5kZXJEZXNjcmlwdGlvbihyZW5kZXJfc2V0dGluZzogSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uKSA6IGJvb2xlYW4ge1xyXG4gICAgLy8gUmVuZGVyIG92ZXJyaWRlXHJcbiAgICBpZiAoaXNCb29sZWFuKHJlbmRlcl9zZXR0aW5nKSkgcmV0dXJuIHJlbmRlcl9zZXR0aW5nXHJcblxyXG4gICAgcmV0dXJuIHJlbmRlcl9zZXR0aW5nICE9IEludGVsbGlzZW5zZVJlbmRlck9wdGlvbi5PZmZcclxufVxyXG4iLCJpbXBvcnQge1xyXG4gICAgRWRpdG9yLFxyXG4gICAgRWRpdG9yUG9zaXRpb24sXHJcbiAgICBFZGl0b3JTdWdnZXN0LFxyXG4gICAgRWRpdG9yU3VnZ2VzdENvbnRleHQsXHJcbiAgICBFZGl0b3JTdWdnZXN0VHJpZ2dlckluZm8sXHJcbiAgICBURmlsZSxcclxufSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmltcG9ydCB7XHJcbiAgICBEb2N1bWVudGF0aW9uLFxyXG4gICAgaXNfZnVuY3Rpb25fZG9jdW1lbnRhdGlvbixcclxuICAgIGlzX21vZHVsZV9uYW1lLFxyXG4gICAgTW9kdWxlTmFtZSxcclxuICAgIFRwRnVuY3Rpb25Eb2N1bWVudGF0aW9uLFxyXG4gICAgVHBTdWdnZXN0RG9jdW1lbnRhdGlvbixcclxufSBmcm9tIFwiLi9UcERvY3VtZW50YXRpb25cIjtcclxuXHJcbmltcG9ydCB7XHJcbiAgICBJbnRlbGxpc2Vuc2VSZW5kZXJPcHRpb24sXHJcbiAgICBzaG91bGRSZW5kZXJEZXNjcmlwdGlvbixcclxuICAgIHNob3VsZFJlbmRlclBhcmFtZXRlcnMsXHJcbiAgICBzaG91bGRSZW5kZXJSZXR1cm5zXHJcbn0gZnJvbSBcIi4uL3NldHRpbmdzL1JlbmRlclNldHRpbmdzL0ludGVsbGlzZW5zZVJlbmRlck9wdGlvblwiXHJcblxyXG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IGFwcGVuZF9ib2xkZWRfbGFiZWxfd2l0aF92YWx1ZV90b19wYXJlbnQgfSBmcm9tIFwidXRpbHMvVXRpbHNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBBdXRvY29tcGxldGUgZXh0ZW5kcyBFZGl0b3JTdWdnZXN0PFRwU3VnZ2VzdERvY3VtZW50YXRpb24+IHtcclxuICAgIC8vcHJpdmF0ZSBpbl9jb21tYW5kID0gZmFsc2U7XHJcbiAgICAvLyBodHRwczovL3JlZ2V4MTAxLmNvbS9yL29jbUh6Ui8xXHJcbiAgICBwcml2YXRlIHRwX2tleXdvcmRfcmVnZXggPVxyXG4gICAgICAgIC90cFxcLig/PG1vZHVsZT5bYS16XSopPyg/PGZuX3RyaWdnZXI+XFwuKD88Zm4+W2EtekEtWl8uXSopPyk/JC87XHJcbiAgICBwcml2YXRlIGRvY3VtZW50YXRpb246IERvY3VtZW50YXRpb247XHJcbiAgICBwcml2YXRlIGxhdGVzdF90cmlnZ2VyX2luZm86IEVkaXRvclN1Z2dlc3RUcmlnZ2VySW5mbztcclxuICAgIHByaXZhdGUgbW9kdWxlX25hbWU6IE1vZHVsZU5hbWUgfCBzdHJpbmc7XHJcbiAgICBwcml2YXRlIGZ1bmN0aW9uX3RyaWdnZXI6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIGZ1bmN0aW9uX25hbWU6IHN0cmluZztcclxuICAgIHByaXZhdGUgaW50ZWxsaXNlbnNlX3JlbmRlcl9zZXR0aW5nOiBJbnRlbGxpc2Vuc2VSZW5kZXJPcHRpb25cclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge1xyXG4gICAgICAgIHN1cGVyKHBsdWdpbi5hcHApO1xyXG4gICAgICAgIHRoaXMuZG9jdW1lbnRhdGlvbiA9IG5ldyBEb2N1bWVudGF0aW9uKHBsdWdpbik7XHJcbiAgICAgICAgdGhpcy5pbnRlbGxpc2Vuc2VfcmVuZGVyX3NldHRpbmcgPSBwbHVnaW4uc2V0dGluZ3MuaW50ZWxsaXNlbnNlX3JlbmRlclxyXG4gICAgfVxyXG5cclxuICAgIG9uVHJpZ2dlcihcclxuICAgICAgICBjdXJzb3I6IEVkaXRvclBvc2l0aW9uLFxyXG4gICAgICAgIGVkaXRvcjogRWRpdG9yLFxyXG4gICAgICAgIF9maWxlOiBURmlsZVxyXG4gICAgKTogRWRpdG9yU3VnZ2VzdFRyaWdnZXJJbmZvIHwgbnVsbCB7XHJcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBlZGl0b3IuZ2V0UmFuZ2UoXHJcbiAgICAgICAgICAgIHsgbGluZTogY3Vyc29yLmxpbmUsIGNoOiAwIH0sXHJcbiAgICAgICAgICAgIHsgbGluZTogY3Vyc29yLmxpbmUsIGNoOiBjdXJzb3IuY2ggfVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSB0aGlzLnRwX2tleXdvcmRfcmVnZXguZXhlYyhyYW5nZSk7XHJcbiAgICAgICAgaWYgKCFtYXRjaCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBxdWVyeTogc3RyaW5nO1xyXG4gICAgICAgIGNvbnN0IG1vZHVsZV9uYW1lID0gKG1hdGNoLmdyb3VwcyAmJiBtYXRjaC5ncm91cHNbXCJtb2R1bGVcIl0pIHx8IFwiXCI7XHJcbiAgICAgICAgdGhpcy5tb2R1bGVfbmFtZSA9IG1vZHVsZV9uYW1lO1xyXG5cclxuICAgICAgICBpZiAobWF0Y2guZ3JvdXBzICYmIG1hdGNoLmdyb3Vwc1tcImZuX3RyaWdnZXJcIl0pIHtcclxuICAgICAgICAgICAgaWYgKG1vZHVsZV9uYW1lID09IFwiXCIgfHwgIWlzX21vZHVsZV9uYW1lKG1vZHVsZV9uYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5mdW5jdGlvbl90cmlnZ2VyID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5mdW5jdGlvbl9uYW1lID0gbWF0Y2guZ3JvdXBzW1wiZm5cIl0gfHwgXCJcIjtcclxuICAgICAgICAgICAgcXVlcnkgPSB0aGlzLmZ1bmN0aW9uX25hbWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5mdW5jdGlvbl90cmlnZ2VyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHF1ZXJ5ID0gdGhpcy5tb2R1bGVfbmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHRyaWdnZXJfaW5mbzogRWRpdG9yU3VnZ2VzdFRyaWdnZXJJbmZvID0ge1xyXG4gICAgICAgICAgICBzdGFydDogeyBsaW5lOiBjdXJzb3IubGluZSwgY2g6IGN1cnNvci5jaCAtIHF1ZXJ5Lmxlbmd0aCB9LFxyXG4gICAgICAgICAgICBlbmQ6IHsgbGluZTogY3Vyc29yLmxpbmUsIGNoOiBjdXJzb3IuY2ggfSxcclxuICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5LFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5sYXRlc3RfdHJpZ2dlcl9pbmZvID0gdHJpZ2dlcl9pbmZvO1xyXG4gICAgICAgIHJldHVybiB0cmlnZ2VyX2luZm87XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZ2V0U3VnZ2VzdGlvbnMoY29udGV4dDogRWRpdG9yU3VnZ2VzdENvbnRleHQpOiBQcm9taXNlPFRwU3VnZ2VzdERvY3VtZW50YXRpb25bXT4ge1xyXG4gICAgICAgIGxldCBzdWdnZXN0aW9uczogQXJyYXk8VHBTdWdnZXN0RG9jdW1lbnRhdGlvbj47XHJcbiAgICAgICAgaWYgKHRoaXMubW9kdWxlX25hbWUgJiYgdGhpcy5mdW5jdGlvbl90cmlnZ2VyKSB7XHJcbiAgICAgICAgICAgIHN1Z2dlc3Rpb25zID0gYXdhaXQgdGhpcy5kb2N1bWVudGF0aW9uLmdldF9hbGxfZnVuY3Rpb25zX2RvY3VtZW50YXRpb24oXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZHVsZV9uYW1lIGFzIE1vZHVsZU5hbWUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZ1bmN0aW9uX25hbWVcclxuICAgICAgICAgICAgKSBhcyBUcEZ1bmN0aW9uRG9jdW1lbnRhdGlvbltdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN1Z2dlc3Rpb25zID0gdGhpcy5kb2N1bWVudGF0aW9uLmdldF9hbGxfbW9kdWxlc19kb2N1bWVudGF0aW9uKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghc3VnZ2VzdGlvbnMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc3VnZ2VzdGlvbnMuZmlsdGVyKChzKSA9PlxyXG4gICAgICAgICAgICBzLnF1ZXJ5S2V5LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChjb250ZXh0LnF1ZXJ5LnRvTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXJTdWdnZXN0aW9uKHZhbHVlOiBUcFN1Z2dlc3REb2N1bWVudGF0aW9uLCBlbDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcclxuICAgICAgICBlbC5jcmVhdGVFbChcImJcIiwgeyB0ZXh0OiB2YWx1ZS5uYW1lIH0pO1xyXG4gICAgICAgIGlmIChpc19mdW5jdGlvbl9kb2N1bWVudGF0aW9uKHZhbHVlKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5hcmdzICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldE51bWJlck9mQXJndW1lbnRzKHZhbHVlLmFyZ3MpID4gMCAmJlxyXG4gICAgICAgICAgICAgICAgc2hvdWxkUmVuZGVyUGFyYW1ldGVycyh0aGlzLmludGVsbGlzZW5zZV9yZW5kZXJfc2V0dGluZylcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBlbC5jcmVhdGVFbCgncCcsIHt0ZXh0OiBcIlBhcmFtZXRlciBsaXN0OlwifSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxpc3QgPSBlbC5jcmVhdGVFbChcIm9sXCIpO1xyXG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWxdIG9mIE9iamVjdC5lbnRyaWVzKHZhbHVlLmFyZ3MpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kX2JvbGRlZF9sYWJlbF93aXRoX3ZhbHVlX3RvX3BhcmVudChsaXN0LCBrZXksIHZhbC5kZXNjcmlwdGlvbilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmFsdWUucmV0dXJucyAmJlxyXG4gICAgICAgICAgICAgICAgc2hvdWxkUmVuZGVyUmV0dXJucyh0aGlzLmludGVsbGlzZW5zZV9yZW5kZXJfc2V0dGluZylcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBhcHBlbmRfYm9sZGVkX2xhYmVsX3dpdGhfdmFsdWVfdG9fcGFyZW50KGVsLCAnUmV0dXJucycsIHZhbHVlLnJldHVybnMpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuZnVuY3Rpb25fdHJpZ2dlciAmJiBpc19mdW5jdGlvbl9kb2N1bWVudGF0aW9uKHZhbHVlKSkge1xyXG4gICAgICAgICAgICBlbC5jcmVhdGVFbChcImNvZGVcIiwgeyB0ZXh0OiB2YWx1ZS5kZWZpbml0aW9uIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodmFsdWUuZGVzY3JpcHRpb25cclxuICAgICAgICAgICAgJiYgc2hvdWxkUmVuZGVyRGVzY3JpcHRpb24odGhpcy5pbnRlbGxpc2Vuc2VfcmVuZGVyX3NldHRpbmcpKSB7XHJcbiAgICAgICAgICAgIGVsLmNyZWF0ZUVsKFwiZGl2XCIsIHsgdGV4dDogdmFsdWUuZGVzY3JpcHRpb24gfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNlbGVjdFN1Z2dlc3Rpb24oXHJcbiAgICAgICAgdmFsdWU6IFRwU3VnZ2VzdERvY3VtZW50YXRpb24sXHJcbiAgICAgICAgX2V2dDogTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnRcclxuICAgICk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZV9lZGl0b3IgPSB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlRWRpdG9yO1xyXG4gICAgICAgIGlmICghYWN0aXZlX2VkaXRvciB8fCAhYWN0aXZlX2VkaXRvci5lZGl0b3IpIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogRXJyb3IgbXNnXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYWN0aXZlX2VkaXRvci5lZGl0b3IucmVwbGFjZVJhbmdlKFxyXG4gICAgICAgICAgICB2YWx1ZS5xdWVyeUtleSxcclxuICAgICAgICAgICAgdGhpcy5sYXRlc3RfdHJpZ2dlcl9pbmZvLnN0YXJ0LFxyXG4gICAgICAgICAgICB0aGlzLmxhdGVzdF90cmlnZ2VyX2luZm8uZW5kXHJcbiAgICAgICAgKTtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIHRoaXMubGF0ZXN0X3RyaWdnZXJfaW5mby5zdGFydC5jaCA9PSB0aGlzLmxhdGVzdF90cmlnZ2VyX2luZm8uZW5kLmNoXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIC8vIERpcnR5IGhhY2sgdG8gcHJldmVudCB0aGUgY3Vyc29yIGJlaW5nIGF0IHRoZVxyXG4gICAgICAgICAgICAvLyBiZWdpbm5pbmcgb2YgdGhlIHdvcmQgYWZ0ZXIgY29tcGxldGlvbixcclxuICAgICAgICAgICAgLy8gTm90IHN1cmUgd2hhdCdzIHRoZSBjYXVzZSBvZiB0aGlzIGJ1Zy5cclxuICAgICAgICAgICAgY29uc3QgY3Vyc29yX3BvcyA9IHRoaXMubGF0ZXN0X3RyaWdnZXJfaW5mby5lbmQ7XHJcbiAgICAgICAgICAgIGN1cnNvcl9wb3MuY2ggKz0gdmFsdWUucXVlcnlLZXkubGVuZ3RoO1xyXG4gICAgICAgICAgICBhY3RpdmVfZWRpdG9yLmVkaXRvci5zZXRDdXJzb3IoY3Vyc29yX3Bvcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldE51bWJlck9mQXJndW1lbnRzKFxyXG4gICAgICAgIGFyZ3M6IG9iamVjdFxyXG4gICAgKTogbnVtYmVyIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hcChPYmplY3QuZW50cmllcyhhcmdzKSkuc2l6ZTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlQXV0b2NvbXBsZXRlSW50ZWxsaXNlbnNlU2V0dGluZyh2YWx1ZTogSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uKXtcclxuICAgICAgICB0aGlzLmludGVsbGlzZW5zZV9yZW5kZXJfc2V0dGluZyA9IHZhbHVlO1xyXG4gICAgfVxyXG59XHJcbiIsIi8vIENvZGVNaXJyb3IsIGNvcHlyaWdodCAoYykgYnkgTWFyaWpuIEhhdmVyYmVrZSBhbmQgb3RoZXJzXHJcbi8vIERpc3RyaWJ1dGVkIHVuZGVyIGFuIE1JVCBsaWNlbnNlOiBodHRwczovL2NvZGVtaXJyb3IubmV0L0xJQ0VOU0VcclxuXHJcbi8qIGVzbGludC1kaXNhYmxlICovXHJcblxyXG4oZnVuY3Rpb24gKG1vZCkge1xyXG4gICAgbW9kKHdpbmRvdy5Db2RlTWlycm9yKTtcclxufSkoZnVuY3Rpb24gKENvZGVNaXJyb3IpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG5cclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTW9kZShcImphdmFzY3JpcHRcIiwgZnVuY3Rpb24gKGNvbmZpZywgcGFyc2VyQ29uZmlnKSB7XHJcbiAgICAgICAgdmFyIGluZGVudFVuaXQgPSBjb25maWcuaW5kZW50VW5pdDtcclxuICAgICAgICB2YXIgc3RhdGVtZW50SW5kZW50ID0gcGFyc2VyQ29uZmlnLnN0YXRlbWVudEluZGVudDtcclxuICAgICAgICB2YXIganNvbmxkTW9kZSA9IHBhcnNlckNvbmZpZy5qc29ubGQ7XHJcbiAgICAgICAgdmFyIGpzb25Nb2RlID0gcGFyc2VyQ29uZmlnLmpzb24gfHwganNvbmxkTW9kZTtcclxuICAgICAgICB2YXIgdHJhY2tTY29wZSA9IHBhcnNlckNvbmZpZy50cmFja1Njb3BlICE9PSBmYWxzZTtcclxuICAgICAgICB2YXIgaXNUUyA9IHBhcnNlckNvbmZpZy50eXBlc2NyaXB0O1xyXG4gICAgICAgIHZhciB3b3JkUkUgPSBwYXJzZXJDb25maWcud29yZENoYXJhY3RlcnMgfHwgL1tcXHckXFx4YTEtXFx1ZmZmZl0vO1xyXG5cclxuICAgICAgICAvLyBUb2tlbml6ZXJcclxuXHJcbiAgICAgICAgdmFyIGtleXdvcmRzID0gKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24ga3codHlwZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogdHlwZSwgc3R5bGU6IFwia2V5d29yZFwiIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIEEgPSBrdyhcImtleXdvcmQgYVwiKSxcclxuICAgICAgICAgICAgICAgIEIgPSBrdyhcImtleXdvcmQgYlwiKSxcclxuICAgICAgICAgICAgICAgIEMgPSBrdyhcImtleXdvcmQgY1wiKSxcclxuICAgICAgICAgICAgICAgIEQgPSBrdyhcImtleXdvcmQgZFwiKTtcclxuICAgICAgICAgICAgdmFyIG9wZXJhdG9yID0ga3coXCJvcGVyYXRvclwiKSxcclxuICAgICAgICAgICAgICAgIGF0b20gPSB7IHR5cGU6IFwiYXRvbVwiLCBzdHlsZTogXCJhdG9tXCIgfTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBpZjoga3coXCJpZlwiKSxcclxuICAgICAgICAgICAgICAgIHdoaWxlOiBBLFxyXG4gICAgICAgICAgICAgICAgd2l0aDogQSxcclxuICAgICAgICAgICAgICAgIGVsc2U6IEIsXHJcbiAgICAgICAgICAgICAgICBkbzogQixcclxuICAgICAgICAgICAgICAgIHRyeTogQixcclxuICAgICAgICAgICAgICAgIGZpbmFsbHk6IEIsXHJcbiAgICAgICAgICAgICAgICByZXR1cm46IEQsXHJcbiAgICAgICAgICAgICAgICBicmVhazogRCxcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlOiBELFxyXG4gICAgICAgICAgICAgICAgbmV3OiBrdyhcIm5ld1wiKSxcclxuICAgICAgICAgICAgICAgIGRlbGV0ZTogQyxcclxuICAgICAgICAgICAgICAgIHZvaWQ6IEMsXHJcbiAgICAgICAgICAgICAgICB0aHJvdzogQyxcclxuICAgICAgICAgICAgICAgIGRlYnVnZ2VyOiBrdyhcImRlYnVnZ2VyXCIpLFxyXG4gICAgICAgICAgICAgICAgdmFyOiBrdyhcInZhclwiKSxcclxuICAgICAgICAgICAgICAgIGNvbnN0OiBrdyhcInZhclwiKSxcclxuICAgICAgICAgICAgICAgIGxldDoga3coXCJ2YXJcIiksXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbjoga3coXCJmdW5jdGlvblwiKSxcclxuICAgICAgICAgICAgICAgIGNhdGNoOiBrdyhcImNhdGNoXCIpLFxyXG4gICAgICAgICAgICAgICAgZm9yOiBrdyhcImZvclwiKSxcclxuICAgICAgICAgICAgICAgIHN3aXRjaDoga3coXCJzd2l0Y2hcIiksXHJcbiAgICAgICAgICAgICAgICBjYXNlOiBrdyhcImNhc2VcIiksXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBrdyhcImRlZmF1bHRcIiksXHJcbiAgICAgICAgICAgICAgICBpbjogb3BlcmF0b3IsXHJcbiAgICAgICAgICAgICAgICB0eXBlb2Y6IG9wZXJhdG9yLFxyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VvZjogb3BlcmF0b3IsXHJcbiAgICAgICAgICAgICAgICB0cnVlOiBhdG9tLFxyXG4gICAgICAgICAgICAgICAgZmFsc2U6IGF0b20sXHJcbiAgICAgICAgICAgICAgICBudWxsOiBhdG9tLFxyXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkOiBhdG9tLFxyXG4gICAgICAgICAgICAgICAgTmFOOiBhdG9tLFxyXG4gICAgICAgICAgICAgICAgSW5maW5pdHk6IGF0b20sXHJcbiAgICAgICAgICAgICAgICB0aGlzOiBrdyhcInRoaXNcIiksXHJcbiAgICAgICAgICAgICAgICBjbGFzczoga3coXCJjbGFzc1wiKSxcclxuICAgICAgICAgICAgICAgIHN1cGVyOiBrdyhcImF0b21cIiksXHJcbiAgICAgICAgICAgICAgICB5aWVsZDogQyxcclxuICAgICAgICAgICAgICAgIGV4cG9ydDoga3coXCJleHBvcnRcIiksXHJcbiAgICAgICAgICAgICAgICBpbXBvcnQ6IGt3KFwiaW1wb3J0XCIpLFxyXG4gICAgICAgICAgICAgICAgZXh0ZW5kczogQyxcclxuICAgICAgICAgICAgICAgIGF3YWl0OiBDLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pKCk7XHJcblxyXG4gICAgICAgIHZhciBpc09wZXJhdG9yQ2hhciA9IC9bK1xcLSomJT08PiE/fH5eQF0vO1xyXG4gICAgICAgIHZhciBpc0pzb25sZEtleXdvcmQgPVxyXG4gICAgICAgICAgICAvXkAoY29udGV4dHxpZHx2YWx1ZXxsYW5ndWFnZXx0eXBlfGNvbnRhaW5lcnxsaXN0fHNldHxyZXZlcnNlfGluZGV4fGJhc2V8dm9jYWJ8Z3JhcGgpXCIvO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiByZWFkUmVnZXhwKHN0cmVhbSkge1xyXG4gICAgICAgICAgICB2YXIgZXNjYXBlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbmV4dCxcclxuICAgICAgICAgICAgICAgIGluU2V0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHdoaWxlICgobmV4dCA9IHN0cmVhbS5uZXh0KCkpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghZXNjYXBlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0ID09IFwiL1wiICYmICFpblNldCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0ID09IFwiW1wiKSBpblNldCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoaW5TZXQgJiYgbmV4dCA9PSBcIl1cIikgaW5TZXQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVzY2FwZWQgPSAhZXNjYXBlZCAmJiBuZXh0ID09IFwiXFxcXFwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBVc2VkIGFzIHNjcmF0Y2ggdmFyaWFibGVzIHRvIGNvbW11bmljYXRlIG11bHRpcGxlIHZhbHVlcyB3aXRob3V0XHJcbiAgICAgICAgLy8gY29uc2luZyB1cCB0b25zIG9mIG9iamVjdHMuXHJcbiAgICAgICAgdmFyIHR5cGUsIGNvbnRlbnQ7XHJcbiAgICAgICAgZnVuY3Rpb24gcmV0KHRwLCBzdHlsZSwgY29udCkge1xyXG4gICAgICAgICAgICB0eXBlID0gdHA7XHJcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250O1xyXG4gICAgICAgICAgICByZXR1cm4gc3R5bGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHRva2VuQmFzZShzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBjaCA9IHN0cmVhbS5uZXh0KCk7XHJcbiAgICAgICAgICAgIGlmIChjaCA9PSAnXCInIHx8IGNoID09IFwiJ1wiKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IHRva2VuU3RyaW5nKGNoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZS50b2tlbml6ZShzdHJlYW0sIHN0YXRlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgICAgIGNoID09IFwiLlwiICYmXHJcbiAgICAgICAgICAgICAgICBzdHJlYW0ubWF0Y2goL15cXGRbXFxkX10qKD86W2VFXVsrXFwtXT9bXFxkX10rKT8vKVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQoXCJudW1iZXJcIiwgXCJudW1iZXJcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT0gXCIuXCIgJiYgc3RyZWFtLm1hdGNoKFwiLi5cIikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXQoXCJzcHJlYWRcIiwgXCJtZXRhXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKC9bXFxbXFxde31cXChcXCksO1xcOlxcLl0vLnRlc3QoY2gpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0KGNoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PSBcIj1cIiAmJiBzdHJlYW0uZWF0KFwiPlwiKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcIj0+XCIsIFwib3BlcmF0b3JcIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICAgICBjaCA9PSBcIjBcIiAmJlxyXG4gICAgICAgICAgICAgICAgc3RyZWFtLm1hdGNoKC9eKD86eFtcXGRBLUZhLWZfXSt8b1swLTdfXSt8YlswMV9dKyluPy8pXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcIm51bWJlclwiLCBcIm51bWJlclwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgvXFxkLy50ZXN0KGNoKSkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLm1hdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgIC9eW1xcZF9dKig/Om58KD86XFwuW1xcZF9dKik/KD86W2VFXVsrXFwtXT9bXFxkX10rKT8pPy9cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwibnVtYmVyXCIsIFwibnVtYmVyXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09IFwiL1wiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLmVhdChcIipcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS50b2tlbml6ZSA9IHRva2VuQ29tbWVudDtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW5Db21tZW50KHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdHJlYW0uZWF0KFwiL1wiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5za2lwVG9FbmQoKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwiY29tbWVudFwiLCBcImNvbW1lbnRcIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGV4cHJlc3Npb25BbGxvd2VkKHN0cmVhbSwgc3RhdGUsIDEpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVhZFJlZ2V4cChzdHJlYW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5tYXRjaCgvXlxcYigoW2dpbXl1c10pKD8hW2dpbXl1c10qXFwyKSkrXFxiLyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldChcInJlZ2V4cFwiLCBcInN0cmluZy0yXCIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uZWF0KFwiPVwiKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwib3BlcmF0b3JcIiwgXCJvcGVyYXRvclwiLCBzdHJlYW0uY3VycmVudCgpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjaCA9PSBcImBcIikge1xyXG4gICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlblF1YXNpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuUXVhc2koc3RyZWFtLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT0gXCIjXCIgJiYgc3RyZWFtLnBlZWsoKSA9PSBcIiFcIikge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNraXBUb0VuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcIm1ldGFcIiwgXCJtZXRhXCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNoID09IFwiI1wiICYmIHN0cmVhbS5lYXRXaGlsZSh3b3JkUkUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwidmFyaWFibGVcIiwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgICAgIChjaCA9PSBcIjxcIiAmJiBzdHJlYW0ubWF0Y2goXCIhLS1cIikpIHx8XHJcbiAgICAgICAgICAgICAgICAoY2ggPT0gXCItXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ubWF0Y2goXCItPlwiKSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICEvXFxTLy50ZXN0KHN0cmVhbS5zdHJpbmcuc2xpY2UoMCwgc3RyZWFtLnN0YXJ0KSkpXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnNraXBUb0VuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcImNvbW1lbnRcIiwgXCJjb21tZW50XCIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzT3BlcmF0b3JDaGFyLnRlc3QoY2gpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2ggIT0gXCI+XCIgfHwgIXN0YXRlLmxleGljYWwgfHwgc3RhdGUubGV4aWNhbC50eXBlICE9IFwiPlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5lYXQoXCI9XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PSBcIiFcIiB8fCBjaCA9PSBcIj1cIikgc3RyZWFtLmVhdChcIj1cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvWzw+KitcXC18Jj9dLy50ZXN0KGNoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW0uZWF0KGNoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09IFwiPlwiKSBzdHJlYW0uZWF0KGNoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT0gXCI/XCIgJiYgc3RyZWFtLmVhdChcIi5cIikpIHJldHVybiByZXQoXCIuXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcIm9wZXJhdG9yXCIsIFwib3BlcmF0b3JcIiwgc3RyZWFtLmN1cnJlbnQoKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAod29yZFJFLnRlc3QoY2gpKSB7XHJcbiAgICAgICAgICAgICAgICBzdHJlYW0uZWF0V2hpbGUod29yZFJFKTtcclxuICAgICAgICAgICAgICAgIHZhciB3b3JkID0gc3RyZWFtLmN1cnJlbnQoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5sYXN0VHlwZSAhPSBcIi5cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXl3b3Jkcy5wcm9wZXJ0eUlzRW51bWVyYWJsZSh3b3JkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIga3cgPSBrZXl3b3Jkc1t3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldChrdy50eXBlLCBrdy5zdHlsZSwgd29yZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29yZCA9PSBcImFzeW5jXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLm1hdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgL14oXFxzfFxcL1xcKihbXipdfFxcKig/IVxcLykpKj9cXCpcXC8pKltcXFtcXChcXHddLyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXQoXCJhc3luY1wiLCBcImtleXdvcmRcIiwgd29yZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0KFwidmFyaWFibGVcIiwgXCJ2YXJpYWJsZVwiLCB3b3JkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gdG9rZW5TdHJpbmcocXVvdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXNjYXBlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAganNvbmxkTW9kZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbS5wZWVrKCkgPT0gXCJAXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0ubWF0Y2goaXNKc29ubGRLZXl3b3JkKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldChcImpzb25sZC1rZXl3b3JkXCIsIFwibWV0YVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHdoaWxlICgobmV4dCA9IHN0cmVhbS5uZXh0KCkpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCA9PSBxdW90ZSAmJiAhZXNjYXBlZCkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZXNjYXBlZCA9ICFlc2NhcGVkICYmIG5leHQgPT0gXCJcXFxcXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIWVzY2FwZWQpIHN0YXRlLnRva2VuaXplID0gdG9rZW5CYXNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldChcInN0cmluZ1wiLCBcInN0cmluZ1wiKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHRva2VuQ29tbWVudChzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgICAgIHZhciBtYXliZUVuZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgY2g7XHJcbiAgICAgICAgICAgIHdoaWxlICgoY2ggPSBzdHJlYW0ubmV4dCgpKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoID09IFwiL1wiICYmIG1heWJlRW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBtYXliZUVuZCA9IGNoID09IFwiKlwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXQoXCJjb21tZW50XCIsIFwiY29tbWVudFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHRva2VuUXVhc2koc3RyZWFtLCBzdGF0ZSkge1xyXG4gICAgICAgICAgICB2YXIgZXNjYXBlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbmV4dDtcclxuICAgICAgICAgICAgd2hpbGUgKChuZXh0ID0gc3RyZWFtLm5leHQoKSkgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICFlc2NhcGVkICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKG5leHQgPT0gXCJgXCIgfHwgKG5leHQgPT0gXCIkXCIgJiYgc3RyZWFtLmVhdChcIntcIikpKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPSB0b2tlbkJhc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlc2NhcGVkID0gIWVzY2FwZWQgJiYgbmV4dCA9PSBcIlxcXFxcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmV0KFwicXVhc2lcIiwgXCJzdHJpbmctMlwiLCBzdHJlYW0uY3VycmVudCgpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBicmFja2V0cyA9IFwiKFt7fV0pXCI7XHJcbiAgICAgICAgLy8gVGhpcyBpcyBhIGNydWRlIGxvb2thaGVhZCB0cmljayB0byB0cnkgYW5kIG5vdGljZSB0aGF0IHdlJ3JlXHJcbiAgICAgICAgLy8gcGFyc2luZyB0aGUgYXJndW1lbnQgcGF0dGVybnMgZm9yIGEgZmF0LWFycm93IGZ1bmN0aW9uIGJlZm9yZSB3ZVxyXG4gICAgICAgIC8vIGFjdHVhbGx5IGhpdCB0aGUgYXJyb3cgdG9rZW4uIEl0IG9ubHkgd29ya3MgaWYgdGhlIGFycm93IGlzIG9uXHJcbiAgICAgICAgLy8gdGhlIHNhbWUgbGluZSBhcyB0aGUgYXJndW1lbnRzIGFuZCB0aGVyZSdzIG5vIHN0cmFuZ2Ugbm9pc2VcclxuICAgICAgICAvLyAoY29tbWVudHMpIGluIGJldHdlZW4uIEZhbGxiYWNrIGlzIHRvIG9ubHkgbm90aWNlIHdoZW4gd2UgaGl0IHRoZVxyXG4gICAgICAgIC8vIGFycm93LCBhbmQgbm90IGRlY2xhcmUgdGhlIGFyZ3VtZW50cyBhcyBsb2NhbHMgZm9yIHRoZSBhcnJvd1xyXG4gICAgICAgIC8vIGJvZHkuXHJcbiAgICAgICAgZnVuY3Rpb24gZmluZEZhdEFycm93KHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgaWYgKHN0YXRlLmZhdEFycm93QXQpIHN0YXRlLmZhdEFycm93QXQgPSBudWxsO1xyXG4gICAgICAgICAgICB2YXIgYXJyb3cgPSBzdHJlYW0uc3RyaW5nLmluZGV4T2YoXCI9PlwiLCBzdHJlYW0uc3RhcnQpO1xyXG4gICAgICAgICAgICBpZiAoYXJyb3cgPCAwKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNUUykge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIHNraXAgVHlwZVNjcmlwdCByZXR1cm4gdHlwZSBkZWNsYXJhdGlvbnMgYWZ0ZXIgdGhlIGFyZ3VtZW50c1xyXG4gICAgICAgICAgICAgICAgdmFyIG0gPSAvOlxccyooPzpcXHcrKD86PFtePl0qPnxcXFtcXF0pP3xcXHtbXn1dKlxcfSlcXHMqJC8uZXhlYyhcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW0uc3RyaW5nLnNsaWNlKHN0cmVhbS5zdGFydCwgYXJyb3cpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0pIGFycm93ID0gbS5pbmRleDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGRlcHRoID0gMCxcclxuICAgICAgICAgICAgICAgIHNhd1NvbWV0aGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwb3MgPSBhcnJvdyAtIDE7IHBvcyA+PSAwOyAtLXBvcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNoID0gc3RyZWFtLnN0cmluZy5jaGFyQXQocG9zKTtcclxuICAgICAgICAgICAgICAgIHZhciBicmFja2V0ID0gYnJhY2tldHMuaW5kZXhPZihjaCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYnJhY2tldCA+PSAwICYmIGJyYWNrZXQgPCAzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkZXB0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICArK3BvcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICgtLWRlcHRoID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoID09IFwiKFwiKSBzYXdTb21ldGhpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGJyYWNrZXQgPj0gMyAmJiBicmFja2V0IDwgNikge1xyXG4gICAgICAgICAgICAgICAgICAgICsrZGVwdGg7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHdvcmRSRS50ZXN0KGNoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNhd1NvbWV0aGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9bXCInXFwvYF0vLnRlc3QoY2gpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICg7IDsgLS1wb3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBvcyA9PSAwKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gc3RyZWFtLnN0cmluZy5jaGFyQXQocG9zIC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHQgPT0gY2ggJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5zdHJpbmcuY2hhckF0KHBvcyAtIDIpICE9IFwiXFxcXFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zLS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2F3U29tZXRoaW5nICYmICFkZXB0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICsrcG9zO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChzYXdTb21ldGhpbmcgJiYgIWRlcHRoKSBzdGF0ZS5mYXRBcnJvd0F0ID0gcG9zO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUGFyc2VyXHJcblxyXG4gICAgICAgIHZhciBhdG9taWNUeXBlcyA9IHtcclxuICAgICAgICAgICAgYXRvbTogdHJ1ZSxcclxuICAgICAgICAgICAgbnVtYmVyOiB0cnVlLFxyXG4gICAgICAgICAgICB2YXJpYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgc3RyaW5nOiB0cnVlLFxyXG4gICAgICAgICAgICByZWdleHA6IHRydWUsXHJcbiAgICAgICAgICAgIHRoaXM6IHRydWUsXHJcbiAgICAgICAgICAgIGltcG9ydDogdHJ1ZSxcclxuICAgICAgICAgICAgXCJqc29ubGQta2V5d29yZFwiOiB0cnVlLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIEpTTGV4aWNhbChpbmRlbnRlZCwgY29sdW1uLCB0eXBlLCBhbGlnbiwgcHJldiwgaW5mbykge1xyXG4gICAgICAgICAgICB0aGlzLmluZGVudGVkID0gaW5kZW50ZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xyXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xyXG4gICAgICAgICAgICB0aGlzLnByZXYgPSBwcmV2O1xyXG4gICAgICAgICAgICB0aGlzLmluZm8gPSBpbmZvO1xyXG4gICAgICAgICAgICBpZiAoYWxpZ24gIT0gbnVsbCkgdGhpcy5hbGlnbiA9IGFsaWduO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaW5TY29wZShzdGF0ZSwgdmFybmFtZSkge1xyXG4gICAgICAgICAgICBpZiAoIXRyYWNrU2NvcGUpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgZm9yICh2YXIgdiA9IHN0YXRlLmxvY2FsVmFyczsgdjsgdiA9IHYubmV4dClcclxuICAgICAgICAgICAgICAgIGlmICh2Lm5hbWUgPT0gdmFybmFtZSkgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGN4ID0gc3RhdGUuY29udGV4dDsgY3g7IGN4ID0gY3gucHJldikge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdiA9IGN4LnZhcnM7IHY7IHYgPSB2Lm5leHQpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYubmFtZSA9PSB2YXJuYW1lKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gcGFyc2VKUyhzdGF0ZSwgc3R5bGUsIHR5cGUsIGNvbnRlbnQsIHN0cmVhbSkge1xyXG4gICAgICAgICAgICB2YXIgY2MgPSBzdGF0ZS5jYztcclxuICAgICAgICAgICAgLy8gQ29tbXVuaWNhdGUgb3VyIGNvbnRleHQgdG8gdGhlIGNvbWJpbmF0b3JzLlxyXG4gICAgICAgICAgICAvLyAoTGVzcyB3YXN0ZWZ1bCB0aGFuIGNvbnNpbmcgdXAgYSBodW5kcmVkIGNsb3N1cmVzIG9uIGV2ZXJ5IGNhbGwuKVxyXG4gICAgICAgICAgICBjeC5zdGF0ZSA9IHN0YXRlO1xyXG4gICAgICAgICAgICBjeC5zdHJlYW0gPSBzdHJlYW07XHJcbiAgICAgICAgICAgIChjeC5tYXJrZWQgPSBudWxsKSwgKGN4LmNjID0gY2MpO1xyXG4gICAgICAgICAgICBjeC5zdHlsZSA9IHN0eWxlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFzdGF0ZS5sZXhpY2FsLmhhc093blByb3BlcnR5KFwiYWxpZ25cIikpXHJcbiAgICAgICAgICAgICAgICBzdGF0ZS5sZXhpY2FsLmFsaWduID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29tYmluYXRvciA9IGNjLmxlbmd0aFxyXG4gICAgICAgICAgICAgICAgICAgID8gY2MucG9wKClcclxuICAgICAgICAgICAgICAgICAgICA6IGpzb25Nb2RlXHJcbiAgICAgICAgICAgICAgICAgICAgPyBleHByZXNzaW9uXHJcbiAgICAgICAgICAgICAgICAgICAgOiBzdGF0ZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29tYmluYXRvcih0eXBlLCBjb250ZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChjYy5sZW5ndGggJiYgY2NbY2MubGVuZ3RoIC0gMV0ubGV4KSBjYy5wb3AoKSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjeC5tYXJrZWQpIHJldHVybiBjeC5tYXJrZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiICYmIGluU2NvcGUoc3RhdGUsIGNvbnRlbnQpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ2YXJpYWJsZS0yXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0eWxlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb21iaW5hdG9yIHV0aWxzXHJcblxyXG4gICAgICAgIHZhciBjeCA9IHsgc3RhdGU6IG51bGwsIGNvbHVtbjogbnVsbCwgbWFya2VkOiBudWxsLCBjYzogbnVsbCB9O1xyXG4gICAgICAgIGZ1bmN0aW9uIHBhc3MoKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXHJcbiAgICAgICAgICAgICAgICBjeC5jYy5wdXNoKGFyZ3VtZW50c1tpXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGNvbnQoKSB7XHJcbiAgICAgICAgICAgIHBhc3MuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGluTGlzdChuYW1lLCBsaXN0KSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHYgPSBsaXN0OyB2OyB2ID0gdi5uZXh0KSBpZiAodi5uYW1lID09IG5hbWUpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlZ2lzdGVyKHZhcm5hbWUpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXRlID0gY3guc3RhdGU7XHJcbiAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwiZGVmXCI7XHJcbiAgICAgICAgICAgIGlmICghdHJhY2tTY29wZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBpZiAoc3RhdGUuY29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmxleGljYWwuaW5mbyA9PSBcInZhclwiICYmXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuY29udGV4dCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmNvbnRleHQuYmxvY2tcclxuICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FIGZ1bmN0aW9uIGRlY2xzIGFyZSBhbHNvIG5vdCBibG9jayBzY29wZWRcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Q29udGV4dCA9IHJlZ2lzdGVyVmFyU2NvcGVkKHZhcm5hbWUsIHN0YXRlLmNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXdDb250ZXh0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuY29udGV4dCA9IG5ld0NvbnRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFpbkxpc3QodmFybmFtZSwgc3RhdGUubG9jYWxWYXJzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmxvY2FsVmFycyA9IG5ldyBWYXIodmFybmFtZSwgc3RhdGUubG9jYWxWYXJzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gRmFsbCB0aHJvdWdoIG1lYW5zIHRoaXMgaXMgZ2xvYmFsXHJcbiAgICAgICAgICAgIGlmIChwYXJzZXJDb25maWcuZ2xvYmFsVmFycyAmJiAhaW5MaXN0KHZhcm5hbWUsIHN0YXRlLmdsb2JhbFZhcnMpKVxyXG4gICAgICAgICAgICAgICAgc3RhdGUuZ2xvYmFsVmFycyA9IG5ldyBWYXIodmFybmFtZSwgc3RhdGUuZ2xvYmFsVmFycyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlZ2lzdGVyVmFyU2NvcGVkKHZhcm5hbWUsIGNvbnRleHQpIHtcclxuICAgICAgICAgICAgaWYgKCFjb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0LmJsb2NrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5uZXIgPSByZWdpc3RlclZhclNjb3BlZCh2YXJuYW1lLCBjb250ZXh0LnByZXYpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFpbm5lcikgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5uZXIgPT0gY29udGV4dC5wcmV2KSByZXR1cm4gY29udGV4dDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29udGV4dChpbm5lciwgY29udGV4dC52YXJzLCB0cnVlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChpbkxpc3QodmFybmFtZSwgY29udGV4dC52YXJzKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IENvbnRleHQoXHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5wcmV2LFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBWYXIodmFybmFtZSwgY29udGV4dC52YXJzKSxcclxuICAgICAgICAgICAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaXNNb2RpZmllcihuYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICBuYW1lID09IFwicHVibGljXCIgfHxcclxuICAgICAgICAgICAgICAgIG5hbWUgPT0gXCJwcml2YXRlXCIgfHxcclxuICAgICAgICAgICAgICAgIG5hbWUgPT0gXCJwcm90ZWN0ZWRcIiB8fFxyXG4gICAgICAgICAgICAgICAgbmFtZSA9PSBcImFic3RyYWN0XCIgfHxcclxuICAgICAgICAgICAgICAgIG5hbWUgPT0gXCJyZWFkb25seVwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb21iaW5hdG9yc1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBDb250ZXh0KHByZXYsIHZhcnMsIGJsb2NrKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJldiA9IHByZXY7XHJcbiAgICAgICAgICAgIHRoaXMudmFycyA9IHZhcnM7XHJcbiAgICAgICAgICAgIHRoaXMuYmxvY2sgPSBibG9jaztcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gVmFyKG5hbWUsIG5leHQpIHtcclxuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0ID0gbmV4dDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkZWZhdWx0VmFycyA9IG5ldyBWYXIoXCJ0aGlzXCIsIG5ldyBWYXIoXCJhcmd1bWVudHNcIiwgbnVsbCkpO1xyXG4gICAgICAgIGZ1bmN0aW9uIHB1c2hjb250ZXh0KCkge1xyXG4gICAgICAgICAgICBjeC5zdGF0ZS5jb250ZXh0ID0gbmV3IENvbnRleHQoXHJcbiAgICAgICAgICAgICAgICBjeC5zdGF0ZS5jb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgY3guc3RhdGUubG9jYWxWYXJzLFxyXG4gICAgICAgICAgICAgICAgZmFsc2VcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY3guc3RhdGUubG9jYWxWYXJzID0gZGVmYXVsdFZhcnM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHB1c2hibG9ja2NvbnRleHQoKSB7XHJcbiAgICAgICAgICAgIGN4LnN0YXRlLmNvbnRleHQgPSBuZXcgQ29udGV4dChcclxuICAgICAgICAgICAgICAgIGN4LnN0YXRlLmNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICBjeC5zdGF0ZS5sb2NhbFZhcnMsXHJcbiAgICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGN4LnN0YXRlLmxvY2FsVmFycyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHBvcGNvbnRleHQoKSB7XHJcbiAgICAgICAgICAgIGN4LnN0YXRlLmxvY2FsVmFycyA9IGN4LnN0YXRlLmNvbnRleHQudmFycztcclxuICAgICAgICAgICAgY3guc3RhdGUuY29udGV4dCA9IGN4LnN0YXRlLmNvbnRleHQucHJldjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcG9wY29udGV4dC5sZXggPSB0cnVlO1xyXG4gICAgICAgIGZ1bmN0aW9uIHB1c2hsZXgodHlwZSwgaW5mbykge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gY3guc3RhdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZW50ID0gc3RhdGUuaW5kZW50ZWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUubGV4aWNhbC50eXBlID09IFwic3RhdFwiKVxyXG4gICAgICAgICAgICAgICAgICAgIGluZGVudCA9IHN0YXRlLmxleGljYWwuaW5kZW50ZWQ7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG91dGVyID0gc3RhdGUubGV4aWNhbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXIgJiYgb3V0ZXIudHlwZSA9PSBcIilcIiAmJiBvdXRlci5hbGlnbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0ZXIgPSBvdXRlci5wcmV2XHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRlbnQgPSBvdXRlci5pbmRlbnRlZDtcclxuICAgICAgICAgICAgICAgIHN0YXRlLmxleGljYWwgPSBuZXcgSlNMZXhpY2FsKFxyXG4gICAgICAgICAgICAgICAgICAgIGluZGVudCxcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdHJlYW0uY29sdW1uKCksXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmxleGljYWwsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5mb1xyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVzdWx0LmxleCA9IHRydWU7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHBvcGxleCgpIHtcclxuICAgICAgICAgICAgdmFyIHN0YXRlID0gY3guc3RhdGU7XHJcbiAgICAgICAgICAgIGlmIChzdGF0ZS5sZXhpY2FsLnByZXYpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5sZXhpY2FsLnR5cGUgPT0gXCIpXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuaW5kZW50ZWQgPSBzdGF0ZS5sZXhpY2FsLmluZGVudGVkO1xyXG4gICAgICAgICAgICAgICAgc3RhdGUubGV4aWNhbCA9IHN0YXRlLmxleGljYWwucHJldjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwb3BsZXgubGV4ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZXhwZWN0KHdhbnRlZCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBleHAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gd2FudGVkKSByZXR1cm4gY29udCgpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgd2FudGVkID09IFwiO1wiIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9PSBcIn1cIiB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGUgPT0gXCIpXCIgfHxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlID09IFwiXVwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhc3MoKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIGNvbnQoZXhwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZXhwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3RhdGVtZW50KHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwidmFyZGVmXCIsIHZhbHVlKSxcclxuICAgICAgICAgICAgICAgICAgICB2YXJkZWYsXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwiO1wiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXhcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwia2V5d29yZCBhXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgcGFyZW5FeHByLCBzdGF0ZW1lbnQsIHBvcGxleCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwia2V5d29yZCBiXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KFwiZm9ybVwiKSwgc3RhdGVtZW50LCBwb3BsZXgpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImtleXdvcmQgZFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGN4LnN0cmVhbS5tYXRjaCgvXlxccyokLywgZmFsc2UpXHJcbiAgICAgICAgICAgICAgICAgICAgPyBjb250KClcclxuICAgICAgICAgICAgICAgICAgICA6IGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcInN0YXRcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbWF5YmVleHByZXNzaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChcIjtcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wbGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImRlYnVnZ2VyXCIpIHJldHVybiBjb250KGV4cGVjdChcIjtcIikpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIntcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJ9XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hibG9ja2NvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgYmxvY2ssXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGNvbnRleHRcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiO1wiKSByZXR1cm4gY29udCgpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImlmXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdGF0ZS5sZXhpY2FsLmluZm8gPT0gXCJlbHNlXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdGF0ZS5jY1tjeC5zdGF0ZS5jYy5sZW5ndGggLSAxXSA9PSBwb3BsZXhcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdGF0ZS5jYy5wb3AoKSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcImZvcm1cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyZW5FeHByLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF5YmVlbHNlXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImZvclwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcImZvcm1cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGJsb2NrY29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICBmb3JzcGVjLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3Bjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGxleFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJjbGFzc1wiIHx8IChpc1RTICYmIHZhbHVlID09IFwiaW50ZXJmYWNlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJmb3JtXCIsIHR5cGUgPT0gXCJjbGFzc1wiID8gdHlwZSA6IHZhbHVlKSxcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCJkZWNsYXJlXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udChzdGF0ZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcclxuICAgICAgICAgICAgICAgICAgICBpc1RTICYmXHJcbiAgICAgICAgICAgICAgICAgICAgKHZhbHVlID09IFwibW9kdWxlXCIgfHwgdmFsdWUgPT0gXCJlbnVtXCIgfHwgdmFsdWUgPT0gXCJ0eXBlXCIpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgY3guc3RyZWFtLm1hdGNoKC9eXFxzKlxcdy8sIGZhbHNlKVxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiZW51bVwiKSByZXR1cm4gY29udChlbnVtZGVmKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcInR5cGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChcIm9wZXJhdG9yXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZWV4cHIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3QoXCI7XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJmb3JtXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0dGVybixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdChcIntcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwifVwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wbGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCJuYW1lc3BhY2VcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBleHByZXNzaW9uLCBzdGF0ZW1lbnQsIHBvcGxleCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCJhYnN0cmFjdFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoc3RhdGVtZW50KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocHVzaGxleChcInN0YXRcIiksIG1heWJlbGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwic3dpdGNoXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiZm9ybVwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwYXJlbkV4cHIsXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwie1wiKSxcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwifVwiLCBcInN3aXRjaFwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwdXNoYmxvY2tjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGxleCxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJjYXNlXCIpIHJldHVybiBjb250KGV4cHJlc3Npb24sIGV4cGVjdChcIjpcIikpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImRlZmF1bHRcIikgcmV0dXJuIGNvbnQoZXhwZWN0KFwiOlwiKSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiY2F0Y2hcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJmb3JtXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgIG1heWJlQ2F0Y2hCaW5kaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJleHBvcnRcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJzdGF0XCIpLCBhZnRlckV4cG9ydCwgcG9wbGV4KTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJpbXBvcnRcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJzdGF0XCIpLCBhZnRlckltcG9ydCwgcG9wbGV4KTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJhc3luY1wiKSByZXR1cm4gY29udChzdGF0ZW1lbnQpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJAXCIpIHJldHVybiBjb250KGV4cHJlc3Npb24sIHN0YXRlbWVudCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHB1c2hsZXgoXCJzdGF0XCIpLCBleHByZXNzaW9uLCBleHBlY3QoXCI7XCIpLCBwb3BsZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZUNhdGNoQmluZGluZyh0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gY29udChmdW5hcmcsIGV4cGVjdChcIilcIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBleHByZXNzaW9uKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBleHByZXNzaW9uSW5uZXIodHlwZSwgdmFsdWUsIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZXhwcmVzc2lvbk5vQ29tbWEodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGV4cHJlc3Npb25Jbm5lcih0eXBlLCB2YWx1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHBhcmVuRXhwcih0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlICE9IFwiKFwiKSByZXR1cm4gcGFzcygpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KFwiKVwiKSwgbWF5YmVleHByZXNzaW9uLCBleHBlY3QoXCIpXCIpLCBwb3BsZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBleHByZXNzaW9uSW5uZXIodHlwZSwgdmFsdWUsIG5vQ29tbWEpIHtcclxuICAgICAgICAgICAgaWYgKGN4LnN0YXRlLmZhdEFycm93QXQgPT0gY3guc3RyZWFtLnN0YXJ0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYm9keSA9IG5vQ29tbWEgPyBhcnJvd0JvZHlOb0NvbW1hIDogYXJyb3dCb2R5O1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIoXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiKVwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFzZXAoZnVuYXJnLCBcIilcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcGxleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwiPT5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvZHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcGNvbnRleHRcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhc3MoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hjb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBlY3QoXCI9PlwiKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYm9keSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBtYXliZW9wID0gbm9Db21tYSA/IG1heWJlb3BlcmF0b3JOb0NvbW1hIDogbWF5YmVvcGVyYXRvckNvbW1hO1xyXG4gICAgICAgICAgICBpZiAoYXRvbWljVHlwZXMuaGFzT3duUHJvcGVydHkodHlwZSkpIHJldHVybiBjb250KG1heWJlb3ApO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBjb250KGZ1bmN0aW9uZGVmLCBtYXliZW9wKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJjbGFzc1wiIHx8IChpc1RTICYmIHZhbHVlID09IFwiaW50ZXJmYWNlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHB1c2hsZXgoXCJmb3JtXCIpLCBjbGFzc0V4cHJlc3Npb24sIHBvcGxleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJrZXl3b3JkIGNcIiB8fCB0eXBlID09IFwiYXN5bmNcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KG5vQ29tbWEgPyBleHByZXNzaW9uTm9Db21tYSA6IGV4cHJlc3Npb24pO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIihcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCIpXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1heWJlZXhwcmVzc2lvbixcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3QoXCIpXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGxleCxcclxuICAgICAgICAgICAgICAgICAgICBtYXliZW9wXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIm9wZXJhdG9yXCIgfHwgdHlwZSA9PSBcInNwcmVhZFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQobm9Db21tYSA/IGV4cHJlc3Npb25Ob0NvbW1hIDogZXhwcmVzc2lvbik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocHVzaGxleChcIl1cIiksIGFycmF5TGl0ZXJhbCwgcG9wbGV4LCBtYXliZW9wKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ7XCIpIHJldHVybiBjb250Q29tbWFzZXAob2JqcHJvcCwgXCJ9XCIsIG51bGwsIG1heWJlb3ApO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInF1YXNpXCIpIHJldHVybiBwYXNzKHF1YXNpLCBtYXliZW9wKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJuZXdcIikgcmV0dXJuIGNvbnQobWF5YmVUYXJnZXQobm9Db21tYSkpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZWV4cHJlc3Npb24odHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZS5tYXRjaCgvWztcXH1cXClcXF0sXS8pKSByZXR1cm4gcGFzcygpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhleHByZXNzaW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlb3BlcmF0b3JDb21tYSh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIixcIikgcmV0dXJuIGNvbnQobWF5YmVleHByZXNzaW9uKTtcclxuICAgICAgICAgICAgcmV0dXJuIG1heWJlb3BlcmF0b3JOb0NvbW1hKHR5cGUsIHZhbHVlLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlb3BlcmF0b3JOb0NvbW1hKHR5cGUsIHZhbHVlLCBub0NvbW1hKSB7XHJcbiAgICAgICAgICAgIHZhciBtZSA9XHJcbiAgICAgICAgICAgICAgICBub0NvbW1hID09IGZhbHNlID8gbWF5YmVvcGVyYXRvckNvbW1hIDogbWF5YmVvcGVyYXRvck5vQ29tbWE7XHJcbiAgICAgICAgICAgIHZhciBleHByID0gbm9Db21tYSA9PSBmYWxzZSA/IGV4cHJlc3Npb24gOiBleHByZXNzaW9uTm9Db21tYTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCI9PlwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgbm9Db21tYSA/IGFycm93Qm9keU5vQ29tbWEgOiBhcnJvd0JvZHksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJvcGVyYXRvclwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoL1xcK1xcK3wtLS8udGVzdCh2YWx1ZSkgfHwgKGlzVFMgJiYgdmFsdWUgPT0gXCIhXCIpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250KG1lKTtcclxuICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICBpc1RTICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPT0gXCI8XCIgJiZcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdHJlYW0ubWF0Y2goL14oW148Pl18PFtePD5dKj4pKj5cXHMqXFwoLywgZmFsc2UpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCI+XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYXNlcCh0eXBlZXhwciwgXCI+XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIj9cIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiOlwiKSwgZXhwcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChleHByKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInF1YXNpXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXNzKHF1YXNpLCBtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCI7XCIpIHJldHVybjtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIoXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udENvbW1hc2VwKGV4cHJlc3Npb25Ob0NvbW1hLCBcIilcIiwgXCJjYWxsXCIsIG1lKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIuXCIpIHJldHVybiBjb250KHByb3BlcnR5LCBtZSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcIl1cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgbWF5YmVleHByZXNzaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChcIl1cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIG1lXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAoaXNUUyAmJiB2YWx1ZSA9PSBcImFzXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQodHlwZWV4cHIsIG1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInJlZ2V4cFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5zdGF0ZS5sYXN0VHlwZSA9IGN4Lm1hcmtlZCA9IFwib3BlcmF0b3JcIjtcclxuICAgICAgICAgICAgICAgIGN4LnN0cmVhbS5iYWNrVXAoY3guc3RyZWFtLnBvcyAtIGN4LnN0cmVhbS5zdGFydCAtIDEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gcXVhc2kodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgIT0gXCJxdWFzaVwiKSByZXR1cm4gcGFzcygpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUuc2xpY2UodmFsdWUubGVuZ3RoIC0gMikgIT0gXCIke1wiKSByZXR1cm4gY29udChxdWFzaSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250KG1heWJlZXhwcmVzc2lvbiwgY29udGludWVRdWFzaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGNvbnRpbnVlUXVhc2kodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIn1cIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJzdHJpbmctMlwiO1xyXG4gICAgICAgICAgICAgICAgY3guc3RhdGUudG9rZW5pemUgPSB0b2tlblF1YXNpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocXVhc2kpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGFycm93Qm9keSh0eXBlKSB7XHJcbiAgICAgICAgICAgIGZpbmRGYXRBcnJvdyhjeC5zdHJlYW0sIGN4LnN0YXRlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHBhc3ModHlwZSA9PSBcIntcIiA/IHN0YXRlbWVudCA6IGV4cHJlc3Npb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBhcnJvd0JvZHlOb0NvbW1hKHR5cGUpIHtcclxuICAgICAgICAgICAgZmluZEZhdEFycm93KGN4LnN0cmVhbSwgY3guc3RhdGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyh0eXBlID09IFwie1wiID8gc3RhdGVtZW50IDogZXhwcmVzc2lvbk5vQ29tbWEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZVRhcmdldChub0NvbW1hKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIuXCIpIHJldHVybiBjb250KG5vQ29tbWEgPyB0YXJnZXROb0NvbW1hIDogdGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiICYmIGlzVFMpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heWJlVHlwZUFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vQ29tbWEgPyBtYXliZW9wZXJhdG9yTm9Db21tYSA6IG1heWJlb3BlcmF0b3JDb21tYVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBwYXNzKG5vQ29tbWEgPyBleHByZXNzaW9uTm9Db21tYSA6IGV4cHJlc3Npb24pO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0YXJnZXQoXywgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwidGFyZ2V0XCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQobWF5YmVvcGVyYXRvckNvbW1hKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0YXJnZXROb0NvbW1hKF8sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcInRhcmdldFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KG1heWJlb3BlcmF0b3JOb0NvbW1hKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZWxhYmVsKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCI6XCIpIHJldHVybiBjb250KHBvcGxleCwgc3RhdGVtZW50KTtcclxuICAgICAgICAgICAgcmV0dXJuIHBhc3MobWF5YmVvcGVyYXRvckNvbW1hLCBleHBlY3QoXCI7XCIpLCBwb3BsZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBwcm9wZXJ0eSh0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBvYmpwcm9wKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiYXN5bmNcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQob2JqcHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgfHwgY3guc3R5bGUgPT0gXCJrZXl3b3JkXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImdldFwiIHx8IHZhbHVlID09IFwic2V0XCIpIHJldHVybiBjb250KGdldHRlclNldHRlcik7XHJcbiAgICAgICAgICAgICAgICB2YXIgbTsgLy8gV29yayBhcm91bmQgZmF0LWFycm93LWRldGVjdGlvbiBjb21wbGljYXRpb24gZm9yIGRldGVjdGluZyB0eXBlc2NyaXB0IHR5cGVkIGFycm93IHBhcmFtc1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIGlzVFMgJiZcclxuICAgICAgICAgICAgICAgICAgICBjeC5zdGF0ZS5mYXRBcnJvd0F0ID09IGN4LnN0cmVhbS5zdGFydCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIChtID0gY3guc3RyZWFtLm1hdGNoKC9eXFxzKjpcXHMqLywgZmFsc2UpKVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgIGN4LnN0YXRlLmZhdEFycm93QXQgPSBjeC5zdHJlYW0ucG9zICsgbVswXS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJudW1iZXJcIiB8fCB0eXBlID09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IGpzb25sZE1vZGUgPyBcInByb3BlcnR5XCIgOiBjeC5zdHlsZSArIFwiIHByb3BlcnR5XCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJqc29ubGQta2V5d29yZFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChhZnRlcnByb3ApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzVFMgJiYgaXNNb2RpZmllcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQob2JqcHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIltcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgbWF5YmV0eXBlLCBleHBlY3QoXCJdXCIpLCBhZnRlcnByb3ApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJzcHJlYWRcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbk5vQ29tbWEsIGFmdGVycHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT0gXCIqXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQob2JqcHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIjpcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhc3MoYWZ0ZXJwcm9wKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBnZXR0ZXJTZXR0ZXIodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSAhPSBcInZhcmlhYmxlXCIpIHJldHVybiBwYXNzKGFmdGVycHJvcCk7XHJcbiAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBhZnRlcnByb3AodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIjpcIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbk5vQ29tbWEpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIihcIikgcmV0dXJuIHBhc3MoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjb21tYXNlcCh3aGF0LCBlbmQsIHNlcCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBwcm9jZWVkKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2VwID8gc2VwLmluZGV4T2YodHlwZSkgPiAtMSA6IHR5cGUgPT0gXCIsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGV4ID0gY3guc3RhdGUubGV4aWNhbDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobGV4LmluZm8gPT0gXCJjYWxsXCIpIGxleC5wb3MgPSAobGV4LnBvcyB8fCAwKSArIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb24gKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlID09IGVuZCB8fCB2YWx1ZSA9PSBlbmQpIHJldHVybiBwYXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXNzKHdoYXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHByb2NlZWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gZW5kIHx8IHZhbHVlID09IGVuZCkgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgICAgIGlmIChzZXAgJiYgc2VwLmluZGV4T2YoXCI7XCIpID4gLTEpIHJldHVybiBwYXNzKHdoYXQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwZWN0KGVuZCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlID09IGVuZCB8fCB2YWx1ZSA9PSBlbmQpIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFzcyh3aGF0LCBwcm9jZWVkKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gY29udENvbW1hc2VwKHdoYXQsIGVuZCwgaW5mbykge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMzsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgY3guY2MucHVzaChhcmd1bWVudHNbaV0pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KGVuZCwgaW5mbyksIGNvbW1hc2VwKHdoYXQsIGVuZCksIHBvcGxleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGJsb2NrKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ9XCIpIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHN0YXRlbWVudCwgYmxvY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZXR5cGUodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKGlzVFMpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlID09IFwiOlwiKSByZXR1cm4gY29udCh0eXBlZXhwcik7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI/XCIpIHJldHVybiBjb250KG1heWJldHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmV0eXBlT3JJbih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNUUyAmJiAodHlwZSA9PSBcIjpcIiB8fCB2YWx1ZSA9PSBcImluXCIpKSByZXR1cm4gY29udCh0eXBlZXhwcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlcmV0dHlwZSh0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmIChpc1RTICYmIHR5cGUgPT0gXCI6XCIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjeC5zdHJlYW0ubWF0Y2goL15cXHMqXFx3K1xccytpc1xcYi8sIGZhbHNlKSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udChleHByZXNzaW9uLCBpc0tXLCB0eXBlZXhwcik7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBpc0tXKF8sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImlzXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0eXBlZXhwcih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PSBcImtleW9mXCIgfHxcclxuICAgICAgICAgICAgICAgIHZhbHVlID09IFwidHlwZW9mXCIgfHxcclxuICAgICAgICAgICAgICAgIHZhbHVlID09IFwiaW5mZXJcIiB8fFxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPT0gXCJyZWFkb25seVwiXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCh2YWx1ZSA9PSBcInR5cGVvZlwiID8gZXhwcmVzc2lvbk5vQ29tbWEgOiB0eXBlZXhwcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiIHx8IHZhbHVlID09IFwidm9pZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcInR5cGVcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGFmdGVyVHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifFwiIHx8IHZhbHVlID09IFwiJlwiKSByZXR1cm4gY29udCh0eXBlZXhwcik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwic3RyaW5nXCIgfHwgdHlwZSA9PSBcIm51bWJlclwiIHx8IHR5cGUgPT0gXCJhdG9tXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChhZnRlclR5cGUpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIltcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJdXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hc2VwKHR5cGVleHByLCBcIl1cIiwgXCIsXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGxleCxcclxuICAgICAgICAgICAgICAgICAgICBhZnRlclR5cGVcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwie1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocHVzaGxleChcIn1cIiksIHR5cGVwcm9wcywgcG9wbGV4LCBhZnRlclR5cGUpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIihcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGNvbW1hc2VwKHR5cGVhcmcsIFwiKVwiKSwgbWF5YmVSZXR1cm5UeXBlLCBhZnRlclR5cGUpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIjxcIikgcmV0dXJuIGNvbnQoY29tbWFzZXAodHlwZWV4cHIsIFwiPlwiKSwgdHlwZWV4cHIpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInF1YXNpXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXNzKHF1YXNpVHlwZSwgYWZ0ZXJUeXBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZVJldHVyblR5cGUodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIj0+XCIpIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdHlwZXByb3BzKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUubWF0Y2goL1tcXH1cXClcXF1dLykpIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiLFwiIHx8IHR5cGUgPT0gXCI7XCIpIHJldHVybiBjb250KHR5cGVwcm9wcyk7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHR5cGVwcm9wLCB0eXBlcHJvcHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0eXBlcHJvcCh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIgfHwgY3guc3R5bGUgPT0gXCJrZXl3b3JkXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwicHJvcGVydHlcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHR5cGVwcm9wKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBcIj9cIiB8fCB0eXBlID09IFwibnVtYmVyXCIgfHwgdHlwZSA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCh0eXBlcHJvcCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PSBcIjpcIikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQodHlwZWV4cHIpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT0gXCJbXCIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdChcInZhcmlhYmxlXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1heWJldHlwZU9ySW4sXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwiXVwiKSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlcHJvcFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09IFwiKFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFzcyhmdW5jdGlvbmRlY2wsIHR5cGVwcm9wKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICghdHlwZS5tYXRjaCgvWztcXH1cXClcXF0sXS8pKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHF1YXNpVHlwZSh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSAhPSBcInF1YXNpXCIpIHJldHVybiBwYXNzKCk7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5zbGljZSh2YWx1ZS5sZW5ndGggLSAyKSAhPSBcIiR7XCIpIHJldHVybiBjb250KHF1YXNpVHlwZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjb250KHR5cGVleHByLCBjb250aW51ZVF1YXNpVHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGNvbnRpbnVlUXVhc2lUeXBlKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ9XCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwic3RyaW5nLTJcIjtcclxuICAgICAgICAgICAgICAgIGN4LnN0YXRlLnRva2VuaXplID0gdG9rZW5RdWFzaTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHF1YXNpVHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdHlwZWFyZyh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAodHlwZSA9PSBcInZhcmlhYmxlXCIgJiYgY3guc3RyZWFtLm1hdGNoKC9eXFxzKls/Ol0vLCBmYWxzZSkpIHx8XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PSBcIj9cIlxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCh0eXBlYXJnKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCI6XCIpIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJzcHJlYWRcIikgcmV0dXJuIGNvbnQodHlwZWFyZyk7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHR5cGVleHByKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gYWZ0ZXJUeXBlKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIjxcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KFxyXG4gICAgICAgICAgICAgICAgICAgIHB1c2hsZXgoXCI+XCIpLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hc2VwKHR5cGVleHByLCBcIj5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIGFmdGVyVHlwZVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifFwiIHx8IHR5cGUgPT0gXCIuXCIgfHwgdmFsdWUgPT0gXCImXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udCh0eXBlZXhwcik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKSByZXR1cm4gY29udCh0eXBlZXhwciwgZXhwZWN0KFwiXVwiKSwgYWZ0ZXJUeXBlKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiZXh0ZW5kc1wiIHx8IHZhbHVlID09IFwiaW1wbGVtZW50c1wiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI/XCIpIHJldHVybiBjb250KHR5cGVleHByLCBleHBlY3QoXCI6XCIpLCB0eXBlZXhwcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlVHlwZUFyZ3MoXywgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiPFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcIj5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFzZXAodHlwZWV4cHIsIFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgYWZ0ZXJUeXBlXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB0eXBlcGFyYW0oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHR5cGVleHByLCBtYXliZVR5cGVEZWZhdWx0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmVUeXBlRGVmYXVsdChfLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI9XCIpIHJldHVybiBjb250KHR5cGVleHByKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdmFyZGVmKF8sIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImVudW1cIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChlbnVtZGVmKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhwYXR0ZXJuLCBtYXliZXR5cGUsIG1heWJlQXNzaWduLCB2YXJkZWZDb250KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gcGF0dGVybih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAoaXNUUyAmJiBpc01vZGlmaWVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChwYXR0ZXJuKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlZ2lzdGVyKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJzcHJlYWRcIikgcmV0dXJuIGNvbnQocGF0dGVybik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKSByZXR1cm4gY29udENvbW1hc2VwKGVsdHBhdHRlcm4sIFwiXVwiKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ7XCIpIHJldHVybiBjb250Q29tbWFzZXAocHJvcHBhdHRlcm4sIFwifVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gcHJvcHBhdHRlcm4odHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJpYWJsZVwiICYmICFjeC5zdHJlYW0ubWF0Y2goL15cXHMqOi8sIGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgcmVnaXN0ZXIodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQobWF5YmVBc3NpZ24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInNwcmVhZFwiKSByZXR1cm4gY29udChwYXR0ZXJuKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ9XCIpIHJldHVybiBwYXNzKCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiXVwiKSwgZXhwZWN0KFwiOlwiKSwgcHJvcHBhdHRlcm4pO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udChleHBlY3QoXCI6XCIpLCBwYXR0ZXJuLCBtYXliZUFzc2lnbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGVsdHBhdHRlcm4oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHBhdHRlcm4sIG1heWJlQXNzaWduKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmVBc3NpZ24oX3R5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIj1cIikgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbk5vQ29tbWEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiB2YXJkZWZDb250KHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIsXCIpIHJldHVybiBjb250KHZhcmRlZik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIG1heWJlZWxzZSh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImtleXdvcmQgYlwiICYmIHZhbHVlID09IFwiZWxzZVwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQocHVzaGxleChcImZvcm1cIiwgXCJlbHNlXCIpLCBzdGF0ZW1lbnQsIHBvcGxleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGZvcnNwZWModHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiYXdhaXRcIikgcmV0dXJuIGNvbnQoZm9yc3BlYyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiKFwiKSByZXR1cm4gY29udChwdXNobGV4KFwiKVwiKSwgZm9yc3BlYzEsIHBvcGxleCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGZvcnNwZWMxKHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ2YXJcIikgcmV0dXJuIGNvbnQodmFyZGVmLCBmb3JzcGVjMik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmV0dXJuIGNvbnQoZm9yc3BlYzIpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhmb3JzcGVjMik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGZvcnNwZWMyKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiKVwiKSByZXR1cm4gY29udCgpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIjtcIikgcmV0dXJuIGNvbnQoZm9yc3BlYzIpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJpblwiIHx8IHZhbHVlID09IFwib2ZcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChleHByZXNzaW9uLCBmb3JzcGVjMik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHBhc3MoZXhwcmVzc2lvbiwgZm9yc3BlYzIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBmdW5jdGlvbmRlZih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIqXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikge1xyXG4gICAgICAgICAgICAgICAgcmVnaXN0ZXIodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiKFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcIilcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFzZXAoZnVuYXJnLCBcIilcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIG1heWJlcmV0dHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wY29udGV4dFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKGlzVFMgJiYgdmFsdWUgPT0gXCI8XCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBjb21tYXNlcCh0eXBlcGFyYW0sIFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25kZWZcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGZ1bmN0aW9uZGVjbCh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIqXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZnVuY3Rpb25kZWNsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlZ2lzdGVyKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGZ1bmN0aW9uZGVjbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIoXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNoY29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiKVwiKSxcclxuICAgICAgICAgICAgICAgICAgICBjb21tYXNlcChmdW5hcmcsIFwiKVwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF5YmVyZXR0eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcGNvbnRleHRcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmIChpc1RTICYmIHZhbHVlID09IFwiPFwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgcHVzaGxleChcIj5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFzZXAodHlwZXBhcmFtLCBcIj5cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uZGVjbFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdHlwZW5hbWUodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJrZXl3b3JkXCIgfHwgdHlwZSA9PSBcInZhcmlhYmxlXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwidHlwZVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQodHlwZW5hbWUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHZhbHVlID09IFwiPFwiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChwdXNobGV4KFwiPlwiKSwgY29tbWFzZXAodHlwZXBhcmFtLCBcIj5cIiksIHBvcGxleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gZnVuYXJnKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIkBcIikgY29udChleHByZXNzaW9uLCBmdW5hcmcpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInNwcmVhZFwiKSByZXR1cm4gY29udChmdW5hcmcpO1xyXG4gICAgICAgICAgICBpZiAoaXNUUyAmJiBpc01vZGlmaWVyKHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChmdW5hcmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpc1RTICYmIHR5cGUgPT0gXCJ0aGlzXCIpIHJldHVybiBjb250KG1heWJldHlwZSwgbWF5YmVBc3NpZ24pO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhwYXR0ZXJuLCBtYXliZXR5cGUsIG1heWJlQXNzaWduKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gY2xhc3NFeHByZXNzaW9uKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIENsYXNzIGV4cHJlc3Npb25zIG1heSBoYXZlIGFuIG9wdGlvbmFsIG5hbWUuXHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmV0dXJuIGNsYXNzTmFtZSh0eXBlLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiBjbGFzc05hbWVBZnRlcih0eXBlLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGNsYXNzTmFtZSh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHtcclxuICAgICAgICAgICAgICAgIHJlZ2lzdGVyKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGNsYXNzTmFtZUFmdGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjbGFzc05hbWVBZnRlcih0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI8XCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChcclxuICAgICAgICAgICAgICAgICAgICBwdXNobGV4KFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBjb21tYXNlcCh0eXBlcGFyYW0sIFwiPlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBwb3BsZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lQWZ0ZXJcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIHZhbHVlID09IFwiZXh0ZW5kc1wiIHx8XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9PSBcImltcGxlbWVudHNcIiB8fFxyXG4gICAgICAgICAgICAgICAgKGlzVFMgJiYgdHlwZSA9PSBcIixcIilcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJpbXBsZW1lbnRzXCIpIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoaXNUUyA/IHR5cGVleHByIDogZXhwcmVzc2lvbiwgY2xhc3NOYW1lQWZ0ZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwie1wiKSByZXR1cm4gY29udChwdXNobGV4KFwifVwiKSwgY2xhc3NCb2R5LCBwb3BsZXgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjbGFzc0JvZHkodHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgdHlwZSA9PSBcImFzeW5jXCIgfHxcclxuICAgICAgICAgICAgICAgICh0eXBlID09IFwidmFyaWFibGVcIiAmJlxyXG4gICAgICAgICAgICAgICAgICAgICh2YWx1ZSA9PSBcInN0YXRpY1wiIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID09IFwiZ2V0XCIgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPT0gXCJzZXRcIiB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoaXNUUyAmJiBpc01vZGlmaWVyKHZhbHVlKSkpICYmXHJcbiAgICAgICAgICAgICAgICAgICAgY3guc3RyZWFtLm1hdGNoKC9eXFxzK1tcXHckXFx4YTEtXFx1ZmZmZl0vLCBmYWxzZSkpXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChjbGFzc0JvZHkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIiB8fCBjeC5zdHlsZSA9PSBcImtleXdvcmRcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJwcm9wZXJ0eVwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoY2xhc3NmaWVsZCwgY2xhc3NCb2R5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIm51bWJlclwiIHx8IHR5cGUgPT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGNsYXNzZmllbGQsIGNsYXNzQm9keSk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiW1wiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwcmVzc2lvbixcclxuICAgICAgICAgICAgICAgICAgICBtYXliZXR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KFwiXVwiKSxcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc2ZpZWxkLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzQm9keVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiKlwiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGNsYXNzQm9keSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlzVFMgJiYgdHlwZSA9PSBcIihcIikgcmV0dXJuIHBhc3MoZnVuY3Rpb25kZWNsLCBjbGFzc0JvZHkpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIjtcIiB8fCB0eXBlID09IFwiLFwiKSByZXR1cm4gY29udChjbGFzc0JvZHkpO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIn1cIikgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiQFwiKSByZXR1cm4gY29udChleHByZXNzaW9uLCBjbGFzc0JvZHkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBjbGFzc2ZpZWxkKHR5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIiFcIikgcmV0dXJuIGNvbnQoY2xhc3NmaWVsZCk7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIj9cIikgcmV0dXJuIGNvbnQoY2xhc3NmaWVsZCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiOlwiKSByZXR1cm4gY29udCh0eXBlZXhwciwgbWF5YmVBc3NpZ24pO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCI9XCIpIHJldHVybiBjb250KGV4cHJlc3Npb25Ob0NvbW1hKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBjeC5zdGF0ZS5sZXhpY2FsLnByZXYsXHJcbiAgICAgICAgICAgICAgICBpc0ludGVyZmFjZSA9IGNvbnRleHQgJiYgY29udGV4dC5pbmZvID09IFwiaW50ZXJmYWNlXCI7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKGlzSW50ZXJmYWNlID8gZnVuY3Rpb25kZWNsIDogZnVuY3Rpb25kZWYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBhZnRlckV4cG9ydCh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIqXCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQobWF5YmVGcm9tLCBleHBlY3QoXCI7XCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJkZWZhdWx0XCIpIHtcclxuICAgICAgICAgICAgICAgIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnQoZXhwcmVzc2lvbiwgZXhwZWN0KFwiO1wiKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJ7XCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChjb21tYXNlcChleHBvcnRGaWVsZCwgXCJ9XCIpLCBtYXliZUZyb20sIGV4cGVjdChcIjtcIikpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFzcyhzdGF0ZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBleHBvcnRGaWVsZCh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCJhc1wiKSB7XHJcbiAgICAgICAgICAgICAgICBjeC5tYXJrZWQgPSBcImtleXdvcmRcIjtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjb250KGV4cGVjdChcInZhcmlhYmxlXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmlhYmxlXCIpIHJldHVybiBwYXNzKGV4cHJlc3Npb25Ob0NvbW1hLCBleHBvcnRGaWVsZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGFmdGVySW1wb3J0KHR5cGUpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJzdHJpbmdcIikgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCIoXCIpIHJldHVybiBwYXNzKGV4cHJlc3Npb24pO1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIi5cIikgcmV0dXJuIHBhc3MobWF5YmVvcGVyYXRvckNvbW1hKTtcclxuICAgICAgICAgICAgcmV0dXJuIHBhc3MoaW1wb3J0U3BlYywgbWF5YmVNb3JlSW1wb3J0cywgbWF5YmVGcm9tKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gaW1wb3J0U3BlYyh0eXBlLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIntcIikgcmV0dXJuIGNvbnRDb21tYXNlcChpbXBvcnRTcGVjLCBcIn1cIik7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwidmFyaWFibGVcIikgcmVnaXN0ZXIodmFsdWUpO1xyXG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIqXCIpIGN4Lm1hcmtlZCA9IFwia2V5d29yZFwiO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udChtYXliZUFzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmVNb3JlSW1wb3J0cyh0eXBlKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09IFwiLFwiKSByZXR1cm4gY29udChpbXBvcnRTcGVjLCBtYXliZU1vcmVJbXBvcnRzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gbWF5YmVBcyhfdHlwZSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiYXNcIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChpbXBvcnRTcGVjKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBtYXliZUZyb20oX3R5cGUsIHZhbHVlKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcImZyb21cIikge1xyXG4gICAgICAgICAgICAgICAgY3gubWFya2VkID0gXCJrZXl3b3JkXCI7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udChleHByZXNzaW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBhcnJheUxpdGVyYWwodHlwZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcIl1cIikgcmV0dXJuIGNvbnQoKTtcclxuICAgICAgICAgICAgcmV0dXJuIHBhc3MoY29tbWFzZXAoZXhwcmVzc2lvbk5vQ29tbWEsIFwiXVwiKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGVudW1kZWYoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKFxyXG4gICAgICAgICAgICAgICAgcHVzaGxleChcImZvcm1cIiksXHJcbiAgICAgICAgICAgICAgICBwYXR0ZXJuLFxyXG4gICAgICAgICAgICAgICAgZXhwZWN0KFwie1wiKSxcclxuICAgICAgICAgICAgICAgIHB1c2hsZXgoXCJ9XCIpLFxyXG4gICAgICAgICAgICAgICAgY29tbWFzZXAoZW51bW1lbWJlciwgXCJ9XCIpLFxyXG4gICAgICAgICAgICAgICAgcG9wbGV4LFxyXG4gICAgICAgICAgICAgICAgcG9wbGV4XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGVudW1tZW1iZXIoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXNzKHBhdHRlcm4sIG1heWJlQXNzaWduKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGlzQ29udGludWVkU3RhdGVtZW50KHN0YXRlLCB0ZXh0QWZ0ZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIHN0YXRlLmxhc3RUeXBlID09IFwib3BlcmF0b3JcIiB8fFxyXG4gICAgICAgICAgICAgICAgc3RhdGUubGFzdFR5cGUgPT0gXCIsXCIgfHxcclxuICAgICAgICAgICAgICAgIGlzT3BlcmF0b3JDaGFyLnRlc3QodGV4dEFmdGVyLmNoYXJBdCgwKSkgfHxcclxuICAgICAgICAgICAgICAgIC9bLC5dLy50ZXN0KHRleHRBZnRlci5jaGFyQXQoMCkpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBleHByZXNzaW9uQWxsb3dlZChzdHJlYW0sIHN0YXRlLCBiYWNrVXApIHtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIChzdGF0ZS50b2tlbml6ZSA9PSB0b2tlbkJhc2UgJiZcclxuICAgICAgICAgICAgICAgICAgICAvXig/Om9wZXJhdG9yfHNvZnxrZXl3b3JkIFtiY2RdfGNhc2V8bmV3fGV4cG9ydHxkZWZhdWx0fHNwcmVhZHxbXFxbe31cXCgsOzpdfD0+KSQvLnRlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLmxhc3RUeXBlXHJcbiAgICAgICAgICAgICAgICAgICAgKSkgfHxcclxuICAgICAgICAgICAgICAgIChzdGF0ZS5sYXN0VHlwZSA9PSBcInF1YXNpXCIgJiZcclxuICAgICAgICAgICAgICAgICAgICAvXFx7XFxzKiQvLnRlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbS5zdHJpbmcuc2xpY2UoMCwgc3RyZWFtLnBvcyAtIChiYWNrVXAgfHwgMCkpXHJcbiAgICAgICAgICAgICAgICAgICAgKSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEludGVyZmFjZVxyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdGFydFN0YXRlOiBmdW5jdGlvbiAoYmFzZWNvbHVtbikge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRva2VuaXplOiB0b2tlbkJhc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFR5cGU6IFwic29mXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2M6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIGxleGljYWw6IG5ldyBKU0xleGljYWwoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIChiYXNlY29sdW1uIHx8IDApIC0gaW5kZW50VW5pdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJibG9ja1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxWYXJzOiBwYXJzZXJDb25maWcubG9jYWxWYXJzLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlckNvbmZpZy5sb2NhbFZhcnMgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IENvbnRleHQobnVsbCwgbnVsbCwgZmFsc2UpLFxyXG4gICAgICAgICAgICAgICAgICAgIGluZGVudGVkOiBiYXNlY29sdW1uIHx8IDAsXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlckNvbmZpZy5nbG9iYWxWYXJzICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIHBhcnNlckNvbmZpZy5nbG9iYWxWYXJzID09IFwib2JqZWN0XCJcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5nbG9iYWxWYXJzID0gcGFyc2VyQ29uZmlnLmdsb2JhbFZhcnM7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICB0b2tlbjogZnVuY3Rpb24gKHN0cmVhbSwgc3RhdGUpIHtcclxuICAgICAgICAgICAgICAgIGlmIChzdHJlYW0uc29sKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YXRlLmxleGljYWwuaGFzT3duUHJvcGVydHkoXCJhbGlnblwiKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUubGV4aWNhbC5hbGlnbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmluZGVudGVkID0gc3RyZWFtLmluZGVudGF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmluZEZhdEFycm93KHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLnRva2VuaXplICE9IHRva2VuQ29tbWVudCAmJiBzdHJlYW0uZWF0U3BhY2UoKSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIHZhciBzdHlsZSA9IHN0YXRlLnRva2VuaXplKHN0cmVhbSwgc3RhdGUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT0gXCJjb21tZW50XCIpIHJldHVybiBzdHlsZTtcclxuICAgICAgICAgICAgICAgIHN0YXRlLmxhc3RUeXBlID1cclxuICAgICAgICAgICAgICAgICAgICB0eXBlID09IFwib3BlcmF0b3JcIiAmJiAoY29udGVudCA9PSBcIisrXCIgfHwgY29udGVudCA9PSBcIi0tXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgID8gXCJpbmNkZWNcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHR5cGU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VKUyhzdGF0ZSwgc3R5bGUsIHR5cGUsIGNvbnRlbnQsIHN0cmVhbSk7XHJcbiAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBpbmRlbnQ6IGZ1bmN0aW9uIChzdGF0ZSwgdGV4dEFmdGVyKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPT0gdG9rZW5Db21tZW50IHx8XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUudG9rZW5pemUgPT0gdG9rZW5RdWFzaVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBDb2RlTWlycm9yLlBhc3M7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUudG9rZW5pemUgIT0gdG9rZW5CYXNlKSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdENoYXIgPSB0ZXh0QWZ0ZXIgJiYgdGV4dEFmdGVyLmNoYXJBdCgwKSxcclxuICAgICAgICAgICAgICAgICAgICBsZXhpY2FsID0gc3RhdGUubGV4aWNhbCxcclxuICAgICAgICAgICAgICAgICAgICB0b3A7XHJcbiAgICAgICAgICAgICAgICAvLyBLbHVkZ2UgdG8gcHJldmVudCAnbWF5YmVsc2UnIGZyb20gYmxvY2tpbmcgbGV4aWNhbCBzY29wZSBwb3BzXHJcbiAgICAgICAgICAgICAgICBpZiAoIS9eXFxzKmVsc2VcXGIvLnRlc3QodGV4dEFmdGVyKSlcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhdGUuY2MubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGMgPSBzdGF0ZS5jY1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGMgPT0gcG9wbGV4KSBsZXhpY2FsID0gbGV4aWNhbC5wcmV2O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChjICE9IG1heWJlZWxzZSAmJiBjICE9IHBvcGNvbnRleHQpIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHdoaWxlIChcclxuICAgICAgICAgICAgICAgICAgICAobGV4aWNhbC50eXBlID09IFwic3RhdFwiIHx8IGxleGljYWwudHlwZSA9PSBcImZvcm1cIikgJiZcclxuICAgICAgICAgICAgICAgICAgICAoZmlyc3RDaGFyID09IFwifVwiIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgodG9wID0gc3RhdGUuY2Nbc3RhdGUuY2MubGVuZ3RoIC0gMV0pICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAodG9wID09IG1heWJlb3BlcmF0b3JDb21tYSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvcCA9PSBtYXliZW9wZXJhdG9yTm9Db21tYSkgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICEvXlssXFwuPStcXC0qOj9bXFwoXS8udGVzdCh0ZXh0QWZ0ZXIpKSlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICBsZXhpY2FsID0gbGV4aWNhbC5wcmV2O1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlbWVudEluZGVudCAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGxleGljYWwudHlwZSA9PSBcIilcIiAmJlxyXG4gICAgICAgICAgICAgICAgICAgIGxleGljYWwucHJldi50eXBlID09IFwic3RhdFwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgbGV4aWNhbCA9IGxleGljYWwucHJldjtcclxuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gbGV4aWNhbC50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NpbmcgPSBmaXJzdENoYXIgPT0gdHlwZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PSBcInZhcmRlZlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxleGljYWwuaW5kZW50ZWQgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAoc3RhdGUubGFzdFR5cGUgPT0gXCJvcGVyYXRvclwiIHx8IHN0YXRlLmxhc3RUeXBlID09IFwiLFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGxleGljYWwuaW5mby5sZW5ndGggKyAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDApXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHR5cGUgPT0gXCJmb3JtXCIgJiYgZmlyc3RDaGFyID09IFwie1wiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZXhpY2FsLmluZGVudGVkO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBcImZvcm1cIikgcmV0dXJuIGxleGljYWwuaW5kZW50ZWQgKyBpbmRlbnRVbml0O1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodHlwZSA9PSBcInN0YXRcIilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXhpY2FsLmluZGVudGVkICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgKGlzQ29udGludWVkU3RhdGVtZW50KHN0YXRlLCB0ZXh0QWZ0ZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHN0YXRlbWVudEluZGVudCB8fCBpbmRlbnRVbml0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDApXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIGxleGljYWwuaW5mbyA9PSBcInN3aXRjaFwiICYmXHJcbiAgICAgICAgICAgICAgICAgICAgIWNsb3NpbmcgJiZcclxuICAgICAgICAgICAgICAgICAgICBwYXJzZXJDb25maWcuZG91YmxlSW5kZW50U3dpdGNoICE9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV4aWNhbC5pbmRlbnRlZCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgvXig/OmNhc2V8ZGVmYXVsdClcXGIvLnRlc3QodGV4dEFmdGVyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBpbmRlbnRVbml0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IDIgKiBpbmRlbnRVbml0KVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChsZXhpY2FsLmFsaWduKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBsZXhpY2FsLmNvbHVtbiArIChjbG9zaW5nID8gMCA6IDEpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gbGV4aWNhbC5pbmRlbnRlZCArIChjbG9zaW5nID8gMCA6IGluZGVudFVuaXQpO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgZWxlY3RyaWNJbnB1dDogL15cXHMqKD86Y2FzZSAuKj86fGRlZmF1bHQ6fFxce3xcXH0pJC8sXHJcbiAgICAgICAgICAgIGJsb2NrQ29tbWVudFN0YXJ0OiBqc29uTW9kZSA/IG51bGwgOiBcIi8qXCIsXHJcbiAgICAgICAgICAgIGJsb2NrQ29tbWVudEVuZDoganNvbk1vZGUgPyBudWxsIDogXCIqL1wiLFxyXG4gICAgICAgICAgICBibG9ja0NvbW1lbnRDb250aW51ZToganNvbk1vZGUgPyBudWxsIDogXCIgKiBcIixcclxuICAgICAgICAgICAgbGluZUNvbW1lbnQ6IGpzb25Nb2RlID8gbnVsbCA6IFwiLy9cIixcclxuICAgICAgICAgICAgZm9sZDogXCJicmFjZVwiLFxyXG4gICAgICAgICAgICBjbG9zZUJyYWNrZXRzOiBcIigpW117fScnXFxcIlxcXCJgYFwiLFxyXG5cclxuICAgICAgICAgICAgaGVscGVyVHlwZToganNvbk1vZGUgPyBcImpzb25cIiA6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICAgICAgICBqc29ubGRNb2RlOiBqc29ubGRNb2RlLFxyXG4gICAgICAgICAgICBqc29uTW9kZToganNvbk1vZGUsXHJcblxyXG4gICAgICAgICAgICBleHByZXNzaW9uQWxsb3dlZDogZXhwcmVzc2lvbkFsbG93ZWQsXHJcblxyXG4gICAgICAgICAgICBza2lwRXhwcmVzc2lvbjogZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJzZUpTKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYXRvbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYXRvbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBDb2RlTWlycm9yLlN0cmluZ1N0cmVhbShcIlwiLCAyLCBudWxsKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgQ29kZU1pcnJvci5yZWdpc3RlckhlbHBlcihcIndvcmRDaGFyc1wiLCBcImphdmFzY3JpcHRcIiwgL1tcXHckXS8pO1xyXG5cclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTUlNRShcInRleHQvamF2YXNjcmlwdFwiLCBcImphdmFzY3JpcHRcIik7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJ0ZXh0L2VjbWFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0XCIpO1xyXG4gICAgQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vamF2YXNjcmlwdFwiLCBcImphdmFzY3JpcHRcIik7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi94LWphdmFzY3JpcHRcIiwgXCJqYXZhc2NyaXB0XCIpO1xyXG4gICAgQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwiYXBwbGljYXRpb24vZWNtYXNjcmlwdFwiLCBcImphdmFzY3JpcHRcIik7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi9qc29uXCIsIHtcclxuICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIixcclxuICAgICAgICBqc29uOiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi94LWpzb25cIiwge1xyXG4gICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICAgIGpzb246IHRydWUsXHJcbiAgICB9KTtcclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL21hbmlmZXN0K2pzb25cIiwge1xyXG4gICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICAgIGpzb246IHRydWUsXHJcbiAgICB9KTtcclxuICAgIENvZGVNaXJyb3IuZGVmaW5lTUlNRShcImFwcGxpY2F0aW9uL2xkK2pzb25cIiwge1xyXG4gICAgICAgIG5hbWU6IFwiamF2YXNjcmlwdFwiLFxyXG4gICAgICAgIGpzb25sZDogdHJ1ZSxcclxuICAgIH0pO1xyXG4gICAgQ29kZU1pcnJvci5kZWZpbmVNSU1FKFwidGV4dC90eXBlc2NyaXB0XCIsIHtcclxuICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIixcclxuICAgICAgICB0eXBlc2NyaXB0OiB0cnVlLFxyXG4gICAgfSk7XHJcbiAgICBDb2RlTWlycm9yLmRlZmluZU1JTUUoXCJhcHBsaWNhdGlvbi90eXBlc2NyaXB0XCIsIHtcclxuICAgICAgICBuYW1lOiBcImphdmFzY3JpcHRcIixcclxuICAgICAgICB0eXBlc2NyaXB0OiB0cnVlLFxyXG4gICAgfSk7XHJcbn0pO1xyXG4iLCIvLyBDb2RlTWlycm9yLCBjb3B5cmlnaHQgKGMpIGJ5IE1hcmlqbiBIYXZlcmJla2UgYW5kIG90aGVyc1xyXG4vLyBEaXN0cmlidXRlZCB1bmRlciBhbiBNSVQgbGljZW5zZTogaHR0cHM6Ly9jb2RlbWlycm9yLm5ldC9MSUNFTlNFXHJcblxyXG4vLyBVdGlsaXR5IGZ1bmN0aW9uIHRoYXQgYWxsb3dzIG1vZGVzIHRvIGJlIGNvbWJpbmVkLiBUaGUgbW9kZSBnaXZlblxyXG4vLyBhcyB0aGUgYmFzZSBhcmd1bWVudCB0YWtlcyBjYXJlIG9mIG1vc3Qgb2YgdGhlIG5vcm1hbCBtb2RlXHJcbi8vIGZ1bmN0aW9uYWxpdHksIGJ1dCBhIHNlY29uZCAodHlwaWNhbGx5IHNpbXBsZSkgbW9kZSBpcyB1c2VkLCB3aGljaFxyXG4vLyBjYW4gb3ZlcnJpZGUgdGhlIHN0eWxlIG9mIHRleHQuIEJvdGggbW9kZXMgZ2V0IHRvIHBhcnNlIGFsbCBvZiB0aGVcclxuLy8gdGV4dCwgYnV0IHdoZW4gYm90aCBhc3NpZ24gYSBub24tbnVsbCBzdHlsZSB0byBhIHBpZWNlIG9mIGNvZGUsIHRoZVxyXG4vLyBvdmVybGF5IHdpbnMsIHVubGVzcyB0aGUgY29tYmluZSBhcmd1bWVudCB3YXMgdHJ1ZSBhbmQgbm90IG92ZXJyaWRkZW4sXHJcbi8vIG9yIHN0YXRlLm92ZXJsYXkuY29tYmluZVRva2VucyB3YXMgdHJ1ZSwgaW4gd2hpY2ggY2FzZSB0aGUgc3R5bGVzIGFyZVxyXG4vLyBjb21iaW5lZC5cclxuXHJcbihmdW5jdGlvbiAobW9kKSB7XHJcbiAgICBtb2Qod2luZG93LkNvZGVNaXJyb3IpO1xyXG59KShmdW5jdGlvbiAoQ29kZU1pcnJvcikge1xyXG4gICAgXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG4gICAgQ29kZU1pcnJvci5jdXN0b21PdmVybGF5TW9kZSA9IGZ1bmN0aW9uIChiYXNlLCBvdmVybGF5LCBjb21iaW5lKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3RhcnRTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBiYXNlOiBDb2RlTWlycm9yLnN0YXJ0U3RhdGUoYmFzZSksXHJcbiAgICAgICAgICAgICAgICAgICAgb3ZlcmxheTogQ29kZU1pcnJvci5zdGFydFN0YXRlKG92ZXJsYXkpLFxyXG4gICAgICAgICAgICAgICAgICAgIGJhc2VQb3M6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFzZUN1cjogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBvdmVybGF5UG9zOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXlDdXI6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtU2VlbjogbnVsbCxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvcHlTdGF0ZTogZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGJhc2U6IENvZGVNaXJyb3IuY29weVN0YXRlKGJhc2UsIHN0YXRlLmJhc2UpLFxyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXk6IENvZGVNaXJyb3IuY29weVN0YXRlKG92ZXJsYXksIHN0YXRlLm92ZXJsYXkpLFxyXG4gICAgICAgICAgICAgICAgICAgIGJhc2VQb3M6IHN0YXRlLmJhc2VQb3MsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFzZUN1cjogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBvdmVybGF5UG9zOiBzdGF0ZS5vdmVybGF5UG9zLFxyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXlDdXI6IG51bGwsXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgdG9rZW46IGZ1bmN0aW9uIChzdHJlYW0sIHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtICE9IHN0YXRlLnN0cmVhbVNlZW4gfHxcclxuICAgICAgICAgICAgICAgICAgICBNYXRoLm1pbihzdGF0ZS5iYXNlUG9zLCBzdGF0ZS5vdmVybGF5UG9zKSA8IHN0cmVhbS5zdGFydFxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuc3RyZWFtU2VlbiA9IHN0cmVhbTtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5iYXNlUG9zID0gc3RhdGUub3ZlcmxheVBvcyA9IHN0cmVhbS5zdGFydDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLnN0YXJ0ID09IHN0YXRlLmJhc2VQb3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5iYXNlQ3VyID0gYmFzZS50b2tlbihzdHJlYW0sIHN0YXRlLmJhc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmJhc2VQb3MgPSBzdHJlYW0ucG9zO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5zdGFydCA9PSBzdGF0ZS5vdmVybGF5UG9zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLnBvcyA9IHN0cmVhbS5zdGFydDtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5vdmVybGF5Q3VyID0gb3ZlcmxheS50b2tlbihzdHJlYW0sIHN0YXRlLm92ZXJsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLm92ZXJsYXlQb3MgPSBzdHJlYW0ucG9zO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RyZWFtLnBvcyA9IE1hdGgubWluKHN0YXRlLmJhc2VQb3MsIHN0YXRlLm92ZXJsYXlQb3MpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEVkZ2UgY2FzZSBmb3IgY29kZWJsb2NrcyBpbiB0ZW1wbGF0ZXIgbW9kZVxyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLmJhc2VDdXIgJiZcclxuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5vdmVybGF5Q3VyICYmXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuYmFzZUN1ci5jb250YWlucyhcImxpbmUtSHlwZXJNRC1jb2RlYmxvY2tcIilcclxuICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLm92ZXJsYXlDdXIgPSBzdGF0ZS5vdmVybGF5Q3VyLnJlcGxhY2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGluZS10ZW1wbGF0ZXItaW5saW5lXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiXCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLm92ZXJsYXlDdXIgKz0gYCBsaW5lLWJhY2tncm91bmQtSHlwZXJNRC1jb2RlYmxvY2stYmdgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHN0YXRlLm92ZXJsYXkuY29tYmluZVRva2VucyBhbHdheXMgdGFrZXMgcHJlY2VkZW5jZSBvdmVyIGNvbWJpbmUsXHJcbiAgICAgICAgICAgICAgICAvLyB1bmxlc3Mgc2V0IHRvIG51bGxcclxuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5vdmVybGF5Q3VyID09IG51bGwpIHJldHVybiBzdGF0ZS5iYXNlQ3VyO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgKHN0YXRlLmJhc2VDdXIgIT0gbnVsbCAmJiBzdGF0ZS5vdmVybGF5LmNvbWJpbmVUb2tlbnMpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgKGNvbWJpbmUgJiYgc3RhdGUub3ZlcmxheS5jb21iaW5lVG9rZW5zID09IG51bGwpXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlLmJhc2VDdXIgKyBcIiBcIiArIHN0YXRlLm92ZXJsYXlDdXI7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVybiBzdGF0ZS5vdmVybGF5Q3VyO1xyXG4gICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgaW5kZW50OlxyXG4gICAgICAgICAgICAgICAgYmFzZS5pbmRlbnQgJiZcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChzdGF0ZSwgdGV4dEFmdGVyLCBsaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJhc2UuaW5kZW50KHN0YXRlLmJhc2UsIHRleHRBZnRlciwgbGluZSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlbGVjdHJpY0NoYXJzOiBiYXNlLmVsZWN0cmljQ2hhcnMsXHJcblxyXG4gICAgICAgICAgICBpbm5lck1vZGU6IGZ1bmN0aW9uIChzdGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3RhdGU6IHN0YXRlLmJhc2UsIG1vZGU6IGJhc2UgfTtcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIGJsYW5rTGluZTogZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYmFzZVRva2VuLCBvdmVybGF5VG9rZW47XHJcbiAgICAgICAgICAgICAgICBpZiAoYmFzZS5ibGFua0xpbmUpIGJhc2VUb2tlbiA9IGJhc2UuYmxhbmtMaW5lKHN0YXRlLmJhc2UpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG92ZXJsYXkuYmxhbmtMaW5lKVxyXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXlUb2tlbiA9IG92ZXJsYXkuYmxhbmtMaW5lKHN0YXRlLm92ZXJsYXkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBvdmVybGF5VG9rZW4gPT0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgID8gYmFzZVRva2VuXHJcbiAgICAgICAgICAgICAgICAgICAgOiBjb21iaW5lICYmIGJhc2VUb2tlbiAhPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgPyBiYXNlVG9rZW4gKyBcIiBcIiArIG92ZXJsYXlUb2tlblxyXG4gICAgICAgICAgICAgICAgICAgIDogb3ZlcmxheVRva2VuO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG59KTtcclxuIiwiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xyXG5pbXBvcnQgeyBQbGF0Zm9ybSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IFRlbXBsYXRlclBsdWdpbiBmcm9tIFwibWFpblwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5pbXBvcnQgeyBDdXJzb3JKdW1wZXIgfSBmcm9tIFwiZWRpdG9yL0N1cnNvckp1bXBlclwiO1xyXG5pbXBvcnQgeyBsb2dfZXJyb3IgfSBmcm9tIFwidXRpbHMvTG9nXCI7XHJcbmltcG9ydCB7IGdldF9hY3RpdmVfZmlsZSB9IGZyb20gXCJ1dGlscy9VdGlsc1wiO1xyXG5pbXBvcnQgeyBBdXRvY29tcGxldGUgfSBmcm9tIFwiZWRpdG9yL0F1dG9jb21wbGV0ZVwiO1xyXG5cclxuaW1wb3J0IFwiZWRpdG9yL21vZGUvamF2YXNjcmlwdFwiO1xyXG5pbXBvcnQgXCJlZGl0b3IvbW9kZS9jdXN0b21fb3ZlcmxheVwiO1xyXG5pbXBvcnQgeyBTdHJlYW1MYW5ndWFnZSB9IGZyb20gXCJAY29kZW1pcnJvci9sYW5ndWFnZVwiO1xyXG5pbXBvcnQgeyBFeHRlbnNpb24sIFByZWMgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivc3RhdGVcIjtcclxuLy9pbXBvcnQgXCJlZGl0b3IvbW9kZS9zaG93LWhpbnRcIjtcclxuXHJcbmNvbnN0IFRFTVBMQVRFUl9NT0RFX05BTUUgPSBcInRlbXBsYXRlclwiO1xyXG5cclxuY29uc3QgVFBfQ01EX1RPS0VOX0NMQVNTID0gXCJ0ZW1wbGF0ZXItY29tbWFuZFwiO1xyXG5jb25zdCBUUF9JTkxJTkVfQ0xBU1MgPSBcInRlbXBsYXRlci1pbmxpbmVcIjtcclxuXHJcbmNvbnN0IFRQX09QRU5JTkdfVEFHX1RPS0VOX0NMQVNTID0gXCJ0ZW1wbGF0ZXItb3BlbmluZy10YWdcIjtcclxuY29uc3QgVFBfQ0xPU0lOR19UQUdfVE9LRU5fQ0xBU1MgPSBcInRlbXBsYXRlci1jbG9zaW5nLXRhZ1wiO1xyXG5cclxuY29uc3QgVFBfSU5URVJQT0xBVElPTl9UQUdfVE9LRU5fQ0xBU1MgPSBcInRlbXBsYXRlci1pbnRlcnBvbGF0aW9uLXRhZ1wiO1xyXG5jb25zdCBUUF9FWEVDX1RBR19UT0tFTl9DTEFTUyA9IFwidGVtcGxhdGVyLWV4ZWN1dGlvbi10YWdcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFZGl0b3Ige1xyXG4gICAgcHJpdmF0ZSBjdXJzb3JfanVtcGVyOiBDdXJzb3JKdW1wZXI7XHJcbiAgICBwcml2YXRlIGFjdGl2ZUVkaXRvckV4dGVuc2lvbnM6IEFycmF5PEV4dGVuc2lvbj47XHJcblxyXG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgaXMgYHVuZGVmaW5lZGAgdW50aWwgYHNldHVwYCBoYXMgcnVuLlxyXG4gICAgcHJpdmF0ZSB0ZW1wbGF0ZXJMYW5ndWFnZTogRXh0ZW5zaW9uIHwgdW5kZWZpbmVkO1xyXG5cclxuICAgIHByaXZhdGUgYXV0b2NvbXBsZXRlOiBBdXRvY29tcGxldGU7XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcclxuICAgICAgICB0aGlzLmN1cnNvcl9qdW1wZXIgPSBuZXcgQ3Vyc29ySnVtcGVyKHBsdWdpbi5hcHApO1xyXG4gICAgICAgIHRoaXMuYWN0aXZlRWRpdG9yRXh0ZW5zaW9ucyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGRlc2t0b3BTaG91bGRIaWdobGlnaHQoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgUGxhdGZvcm0uaXNEZXNrdG9wQXBwICYmIHRoaXMucGx1Z2luLnNldHRpbmdzLnN5bnRheF9oaWdobGlnaHRpbmdcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIG1vYmlsZVNob3VsZEhpZ2hsaWdodCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBQbGF0Zm9ybS5pc01vYmlsZSAmJiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zeW50YXhfaGlnaGxpZ2h0aW5nX21vYmlsZVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc2V0dXAoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5hdXRvY29tcGxldGUgPSBuZXcgQXV0b2NvbXBsZXRlKHRoaXMucGx1Z2luKTtcclxuICAgICAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvclN1Z2dlc3QodGhpcy5hdXRvY29tcGxldGUpO1xyXG5cclxuICAgICAgICAvLyBXZSBkZWZpbmUgb3VyIG92ZXJsYXkgYXMgYSBzdGFuZC1hbG9uZSBleHRlbnNpb24gYW5kIGtlZXAgYSByZWZlcmVuY2VcclxuICAgICAgICAvLyB0byBpdCBhcm91bmQuIFRoaXMgbGV0cyB1cyBkeW5hbWljYWxseSB0dXJuIGl0IG9uIGFuZCBvZmYgYXMgbmVlZGVkLlxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVnaXN0ZXJDb2RlTWlycm9yTW9kZSgpO1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGVyTGFuZ3VhZ2UgPSBQcmVjLmhpZ2goXHJcbiAgICAgICAgICAgIFN0cmVhbUxhbmd1YWdlLmRlZmluZShcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5Db2RlTWlycm9yLmdldE1vZGUoe30sIFRFTVBMQVRFUl9NT0RFX05BTUUpIGFzIGFueVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgICBpZiAodGhpcy50ZW1wbGF0ZXJMYW5ndWFnZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxvZ19lcnJvcihcclxuICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBcIlVuYWJsZSB0byBlbmFibGUgc3ludGF4IGhpZ2hsaWdodGluZy4gQ291bGQgbm90IGRlZmluZSBsYW5ndWFnZS5cIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRHluYW1pYyByZWNvbmZpZ3VyYXRpb24gaXMgbm93IGRvbmUgYnkgcGFzc2luZyBhbiBhcnJheS4gSWYgd2UgbW9kaWZ5XHJcbiAgICAgICAgLy8gdGhhdCBhcnJheSBhbmQgdGhlbiBjYWxsIGBXb3Jrc3BhY2UudXBkYXRlT3B0aW9uc2AgdGhlIG5ldyBleHRlbnNpb25cclxuICAgICAgICAvLyB3aWxsIGJlIHBpY2tlZCB1cC5cclxuICAgICAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbih0aGlzLmFjdGl2ZUVkaXRvckV4dGVuc2lvbnMpO1xyXG5cclxuICAgICAgICAvLyBTZWxlY3RpdmVseSBlbmFibGUgc3ludGF4IGhpZ2hsaWdodGluZyB2aWEgcGVyLXBsYXRmb3JtIHByZWZlcmVuY2VzLlxyXG4gICAgICAgIGlmICh0aGlzLmRlc2t0b3BTaG91bGRIaWdobGlnaHQoKSB8fCB0aGlzLm1vYmlsZVNob3VsZEhpZ2hsaWdodCgpKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5hYmxlX2hpZ2hsaWdodGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVuYWJsZV9oaWdobGlnaHRlcigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICAvLyBNYWtlIHN1cmUgaXQgaXMgaWRlbXBvdGVudFxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVFZGl0b3JFeHRlbnNpb25zLmxlbmd0aCA9PT0gMCAmJlxyXG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlckxhbmd1YWdlXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIHNob3VsZCBvbmx5IGV2ZXIgYmUgdGhpcyBvbmUgZXh0ZW5zaW9uIGlmIHRoZSBhcnJheSBpcyBub3RcclxuICAgICAgICAgICAgLy8gZW1wdHkuXHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlRWRpdG9yRXh0ZW5zaW9ucy5wdXNoKHRoaXMudGVtcGxhdGVyTGFuZ3VhZ2UpO1xyXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGV4cGVuc2l2ZVxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnVwZGF0ZU9wdGlvbnMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZGlzYWJsZV9oaWdobGlnaHRlcigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBpdCBpcyBpZGVtcG90ZW50LlxyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZUVkaXRvckV4dGVuc2lvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBzaG91bGQgb25seSBldmVyIGJlIG9uZSBleHRlbnNpb24gaWYgdGhlIGFycmF5IGlzIG5vdCBlbXB0eS5cclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVFZGl0b3JFeHRlbnNpb25zLnBvcCgpO1xyXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGV4cGVuc2l2ZVxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnVwZGF0ZU9wdGlvbnMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMganVtcF90b19uZXh0X2N1cnNvcl9sb2NhdGlvbihcclxuICAgICAgICBmaWxlOiBURmlsZSB8IG51bGwgPSBudWxsLFxyXG4gICAgICAgIGF1dG9fanVtcCA9IGZhbHNlXHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAoYXV0b19qdW1wICYmICF0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvX2p1bXBfdG9fY3Vyc29yKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGZpbGUgJiYgZ2V0X2FjdGl2ZV9maWxlKHRoaXMucGx1Z2luLmFwcCkgIT09IGZpbGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhd2FpdCB0aGlzLmN1cnNvcl9qdW1wZXIuanVtcF90b19uZXh0X2N1cnNvcl9sb2NhdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlZ2lzdGVyQ29kZU1pcnJvck1vZGUoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgLy8gY20tZWRpdG9yLXN5bnRheC1oaWdobGlnaHQtb2JzaWRpYW4gcGx1Z2luXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9jb2RlbWlycm9yLm5ldC9kb2MvbWFudWFsLmh0bWwjbW9kZWFwaVxyXG4gICAgICAgIC8vIGh0dHBzOi8vY29kZW1pcnJvci5uZXQvbW9kZS9kaWZmL2RpZmYuanNcclxuICAgICAgICAvLyBodHRwczovL2NvZGVtaXJyb3IubmV0L2RlbW8vbXVzdGFjaGUuaHRtbFxyXG4gICAgICAgIC8vIGh0dHBzOi8vbWFyaWpuaGF2ZXJiZWtlLm5sL2Jsb2cvY29kZW1pcnJvci1tb2RlLXN5c3RlbS5odG1sXHJcblxyXG4gICAgICAgIC8vIElmIG5vIGNvbmZpZ3VyYXRpb24gcmVxdWVzdHMgaGlnaGxpZ2h0aW5nIHdlIHNob3VsZCBiYWlsLlxyXG4gICAgICAgIGlmICghdGhpcy5kZXNrdG9wU2hvdWxkSGlnaGxpZ2h0KCkgJiYgIXRoaXMubW9iaWxlU2hvdWxkSGlnaGxpZ2h0KCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QganNfbW9kZSA9IHdpbmRvdy5Db2RlTWlycm9yLmdldE1vZGUoe30sIFwiamF2YXNjcmlwdFwiKTtcclxuICAgICAgICBpZiAoanNfbW9kZS5uYW1lID09PSBcIm51bGxcIikge1xyXG4gICAgICAgICAgICBsb2dfZXJyb3IoXHJcbiAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJKYXZhc2NyaXB0IHN5bnRheCBtb2RlIGNvdWxkbid0IGJlIGZvdW5kLCBjYW4ndCBlbmFibGUgc3ludGF4IGhpZ2hsaWdodGluZy5cIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDdXN0b20gb3ZlcmxheSBtb2RlIHVzZWQgdG8gaGFuZGxlIGVkZ2UgY2FzZXNcclxuICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgY29uc3Qgb3ZlcmxheV9tb2RlID0gd2luZG93LkNvZGVNaXJyb3IuY3VzdG9tT3ZlcmxheU1vZGU7XHJcbiAgICAgICAgaWYgKG92ZXJsYXlfbW9kZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxvZ19lcnJvcihcclxuICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBcIkNvdWxkbid0IGZpbmQgY3VzdG9tT3ZlcmxheU1vZGUsIGNhbid0IGVuYWJsZSBzeW50YXggaGlnaGxpZ2h0aW5nLlwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdpbmRvdy5Db2RlTWlycm9yLmRlZmluZU1vZGUoVEVNUExBVEVSX01PREVfTkFNRSwgZnVuY3Rpb24gKGNvbmZpZykge1xyXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZXJPdmVybGF5ID0ge1xyXG4gICAgICAgICAgICAgICAgc3RhcnRTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGpzX3N0YXRlID0gd2luZG93LkNvZGVNaXJyb3Iuc3RhcnRTdGF0ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAganNfbW9kZVxyXG4gICAgICAgICAgICAgICAgICAgICkgYXMgT2JqZWN0O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmpzX3N0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbkNvbW1hbmQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdfY2xhc3M6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyZWVMaW5lOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNvcHlTdGF0ZTogZnVuY3Rpb24gKHN0YXRlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBqc19zdGF0ZSA9IHdpbmRvdy5Db2RlTWlycm9yLnN0YXJ0U3RhdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzX21vZGVcclxuICAgICAgICAgICAgICAgICAgICApIGFzIE9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdfc3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmpzX3N0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbkNvbW1hbmQ6IHN0YXRlLmluQ29tbWFuZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnX2NsYXNzOiBzdGF0ZS50YWdfY2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyZWVMaW5lOiBzdGF0ZS5mcmVlTGluZSxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdfc3RhdGU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYmxhbmtMaW5lOiBmdW5jdGlvbiAoc3RhdGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5pbkNvbW1hbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBsaW5lLWJhY2tncm91bmQtdGVtcGxhdGVyLWNvbW1hbmQtYmdgO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB0b2tlbjogZnVuY3Rpb24gKHN0cmVhbTogYW55LCBzdGF0ZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5zb2woKSAmJiBzdGF0ZS5pbkNvbW1hbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZnJlZUxpbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlLmluQ29tbWFuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQga2V5d29yZHMgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLm1hdGNoKC9bLV9dezAsMX0lPi8sIHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5pbkNvbW1hbmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLmZyZWVMaW5lID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWdfY2xhc3MgPSBzdGF0ZS50YWdfY2xhc3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS50YWdfY2xhc3MgPSBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgbGluZS0ke1RQX0lOTElORV9DTEFTU30gJHtUUF9DTURfVE9LRU5fQ0xBU1N9ICR7VFBfQ0xPU0lOR19UQUdfVE9LRU5fQ0xBU1N9ICR7dGFnX2NsYXNzfWA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGpzX3Jlc3VsdCA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc19tb2RlLnRva2VuICYmIGpzX21vZGUudG9rZW4oc3RyZWFtLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ucGVlaygpID09IG51bGwgJiYgc3RhdGUuZnJlZUxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXdvcmRzICs9IGAgbGluZS1iYWNrZ3JvdW5kLXRlbXBsYXRlci1jb21tYW5kLWJnYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YXRlLmZyZWVMaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXl3b3JkcyArPSBgIGxpbmUtJHtUUF9JTkxJTkVfQ0xBU1N9YDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2tleXdvcmRzfSAke1RQX0NNRF9UT0tFTl9DTEFTU30gJHtqc19yZXN1bHR9YDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gc3RyZWFtLm1hdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvPCVbLV9dezAsMX1cXHMqKFsqK117MCwxfSkvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2ggIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKG1hdGNoWzFdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiKlwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLnRhZ19jbGFzcyA9IFRQX0VYRUNfVEFHX1RPS0VOX0NMQVNTO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS50YWdfY2xhc3MgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUUF9JTlRFUlBPTEFUSU9OX1RBR19UT0tFTl9DTEFTUztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5pbkNvbW1hbmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYGxpbmUtJHtUUF9JTkxJTkVfQ0xBU1N9ICR7VFBfQ01EX1RPS0VOX0NMQVNTfSAke1RQX09QRU5JTkdfVEFHX1RPS0VOX0NMQVNTfSAke3N0YXRlLnRhZ19jbGFzc31gO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHN0cmVhbS5uZXh0KCkgIT0gbnVsbCAmJiAhc3RyZWFtLm1hdGNoKC88JS8sIGZhbHNlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gb3ZlcmxheV9tb2RlKFxyXG4gICAgICAgICAgICAgICAgd2luZG93LkNvZGVNaXJyb3IuZ2V0TW9kZShjb25maWcsIFwiaHlwZXJtZFwiKSxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlck92ZXJsYXlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVFZGl0b3JJbnRlbGxpc2Vuc2VTZXR0aW5nKHZhbHVlOiBhbnkpe1xyXG4gICAgICAgIHRoaXMuYXV0b2NvbXBsZXRlLnVwZGF0ZUF1dG9jb21wbGV0ZUludGVsbGlzZW5zZVNldHRpbmcodmFsdWUpXHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IFRlbXBsYXRlclBsdWdpbiBmcm9tIFwibWFpblwiO1xyXG5pbXBvcnQgeyBQbGF0Zm9ybSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBlcnJvcldyYXBwZXJTeW5jIH0gZnJvbSBcInV0aWxzL0Vycm9yXCI7XHJcbmltcG9ydCB7IHJlc29sdmVfdGZpbGUgfSBmcm9tIFwidXRpbHMvVXRpbHNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb21tYW5kSGFuZGxlciB7XHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luKSB7fVxyXG5cclxuICAgIHNldHVwKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICBpZDogXCJpbnNlcnQtdGVtcGxhdGVyXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiT3BlbiBpbnNlcnQgdGVtcGxhdGUgbW9kYWxcIixcclxuICAgICAgICAgICAgaWNvbjogXCJ0ZW1wbGF0ZXItaWNvblwiLFxyXG4gICAgICAgICAgICBob3RrZXlzOiBQbGF0Zm9ybS5pc01hY09TXHJcbiAgICAgICAgICAgICAgICA/IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZpZXJzOiBbXCJBbHRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBcImVcIixcclxuICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5mdXp6eV9zdWdnZXN0ZXIuaW5zZXJ0X3RlbXBsYXRlKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICBpZDogXCJyZXBsYWNlLWluLWZpbGUtdGVtcGxhdGVyXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiUmVwbGFjZSB0ZW1wbGF0ZXMgaW4gdGhlIGFjdGl2ZSBmaWxlXCIsXHJcbiAgICAgICAgICAgIGljb246IFwidGVtcGxhdGVyLWljb25cIixcclxuICAgICAgICAgICAgaG90a2V5czogUGxhdGZvcm0uaXNNYWNPU1xyXG4gICAgICAgICAgICAgICAgPyB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIDogW1xyXG4gICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmaWVyczogW1wiQWx0XCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogXCJyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udGVtcGxhdGVyLm92ZXJ3cml0ZV9hY3RpdmVfZmlsZV9jb21tYW5kcygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLnBsdWdpbi5hZGRDb21tYW5kKHtcclxuICAgICAgICAgICAgaWQ6IFwianVtcC10by1uZXh0LWN1cnNvci1sb2NhdGlvblwiLFxyXG4gICAgICAgICAgICBuYW1lOiBcIkp1bXAgdG8gbmV4dCBjdXJzb3IgbG9jYXRpb25cIixcclxuICAgICAgICAgICAgaWNvbjogXCJ0ZXh0LWN1cnNvclwiLFxyXG4gICAgICAgICAgICBob3RrZXlzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kaWZpZXJzOiBbXCJBbHRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAga2V5OiBcIlRhYlwiLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmVkaXRvcl9oYW5kbGVyLmp1bXBfdG9fbmV4dF9jdXJzb3JfbG9jYXRpb24oKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgICAgIGlkOiBcImNyZWF0ZS1uZXctbm90ZS1mcm9tLXRlbXBsYXRlXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiQ3JlYXRlIG5ldyBub3RlIGZyb20gdGVtcGxhdGVcIixcclxuICAgICAgICAgICAgaWNvbjogXCJ0ZW1wbGF0ZXItaWNvblwiLFxyXG4gICAgICAgICAgICBob3RrZXlzOiBQbGF0Zm9ybS5pc01hY09TXHJcbiAgICAgICAgICAgICAgICA/IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZpZXJzOiBbXCJBbHRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBcIm5cIixcclxuICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5mdXp6eV9zdWdnZXN0ZXIuY3JlYXRlX25ld19ub3RlX2Zyb21fdGVtcGxhdGUoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWdpc3Rlcl90ZW1wbGF0ZXNfaG90a2V5cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlZ2lzdGVyX3RlbXBsYXRlc19ob3RrZXlzKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZWRfdGVtcGxhdGVzX2hvdGtleXMuZm9yRWFjaCgodGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZF90ZW1wbGF0ZV9ob3RrZXkobnVsbCwgdGVtcGxhdGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkX3RlbXBsYXRlX2hvdGtleShcclxuICAgICAgICBvbGRfdGVtcGxhdGU6IHN0cmluZyB8IG51bGwsXHJcbiAgICAgICAgbmV3X3RlbXBsYXRlOiBzdHJpbmdcclxuICAgICk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlX3RlbXBsYXRlX2hvdGtleShvbGRfdGVtcGxhdGUpO1xyXG5cclxuICAgICAgICBpZiAobmV3X3RlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICAgICAgaWQ6IG5ld190ZW1wbGF0ZSxcclxuICAgICAgICAgICAgICAgIG5hbWU6IGBJbnNlcnQgJHtuZXdfdGVtcGxhdGV9YCxcclxuICAgICAgICAgICAgICAgIGljb246IFwidGVtcGxhdGVyLWljb25cIixcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBlcnJvcldyYXBwZXJTeW5jKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiByZXNvbHZlX3RmaWxlKHRoaXMucGx1Z2luLmFwcCwgbmV3X3RlbXBsYXRlKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYENvdWxkbid0IGZpbmQgdGhlIHRlbXBsYXRlIGZpbGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgaG90a2V5YFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnRlbXBsYXRlci5hcHBlbmRfdGVtcGxhdGVfdG9fYWN0aXZlX2ZpbGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hZGRDb21tYW5kKHtcclxuICAgICAgICAgICAgICAgIGlkOiBgY3JlYXRlLSR7bmV3X3RlbXBsYXRlfWAsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBgQ3JlYXRlICR7bmV3X3RlbXBsYXRlfWAsXHJcbiAgICAgICAgICAgICAgICBpY29uOiBcInRlbXBsYXRlci1pY29uXCIsXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZXJyb3JXcmFwcGVyU3luYyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4gcmVzb2x2ZV90ZmlsZSh0aGlzLnBsdWdpbi5hcHAsIG5ld190ZW1wbGF0ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGBDb3VsZG4ndCBmaW5kIHRoZSB0ZW1wbGF0ZSBmaWxlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhvdGtleWBcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi50ZW1wbGF0ZXIuY3JlYXRlX25ld19ub3RlX2Zyb21fdGVtcGxhdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVfdGVtcGxhdGVfaG90a2V5KHRlbXBsYXRlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnJlbW92ZUNvbW1hbmQoYCR7dGVtcGxhdGV9YCk7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnJlbW92ZUNvbW1hbmQoYGNyZWF0ZS0ke3RlbXBsYXRlfWApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCIvLyBDcmVkaXRzIGdvIHRvIExpYW0ncyBQZXJpb2RpYyBOb3RlcyBQbHVnaW46IGh0dHBzOi8vZ2l0aHViLmNvbS9saWFtY2Fpbi9vYnNpZGlhbi1wZXJpb2RpYy1ub3Rlc1xyXG5cclxuaW1wb3J0IHsgQXBwLCBJU3VnZ2VzdE93bmVyLCBTY29wZSB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBjcmVhdGVQb3BwZXIsIEluc3RhbmNlIGFzIFBvcHBlckluc3RhbmNlIH0gZnJvbSBcIkBwb3BwZXJqcy9jb3JlXCI7XHJcblxyXG5jb25zdCB3cmFwQXJvdW5kID0gKHZhbHVlOiBudW1iZXIsIHNpemU6IG51bWJlcik6IG51bWJlciA9PiB7XHJcbiAgICByZXR1cm4gKCh2YWx1ZSAlIHNpemUpICsgc2l6ZSkgJSBzaXplO1xyXG59O1xyXG5cclxuY2xhc3MgU3VnZ2VzdDxUPiB7XHJcbiAgICBwcml2YXRlIG93bmVyOiBJU3VnZ2VzdE93bmVyPFQ+O1xyXG4gICAgcHJpdmF0ZSB2YWx1ZXM6IFRbXTtcclxuICAgIHByaXZhdGUgc3VnZ2VzdGlvbnM6IEhUTUxEaXZFbGVtZW50W107XHJcbiAgICBwcml2YXRlIHNlbGVjdGVkSXRlbTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBjb250YWluZXJFbDogSFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgb3duZXI6IElTdWdnZXN0T3duZXI8VD4sXHJcbiAgICAgICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxyXG4gICAgICAgIHNjb3BlOiBTY29wZVxyXG4gICAgKSB7XHJcbiAgICAgICAgdGhpcy5vd25lciA9IG93bmVyO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyRWwgPSBjb250YWluZXJFbDtcclxuXHJcbiAgICAgICAgY29udGFpbmVyRWwub24oXHJcbiAgICAgICAgICAgIFwiY2xpY2tcIixcclxuICAgICAgICAgICAgXCIuc3VnZ2VzdGlvbi1pdGVtXCIsXHJcbiAgICAgICAgICAgIHRoaXMub25TdWdnZXN0aW9uQ2xpY2suYmluZCh0aGlzKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29udGFpbmVyRWwub24oXHJcbiAgICAgICAgICAgIFwibW91c2Vtb3ZlXCIsXHJcbiAgICAgICAgICAgIFwiLnN1Z2dlc3Rpb24taXRlbVwiLFxyXG4gICAgICAgICAgICB0aGlzLm9uU3VnZ2VzdGlvbk1vdXNlb3Zlci5iaW5kKHRoaXMpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc2NvcGUucmVnaXN0ZXIoW10sIFwiQXJyb3dVcFwiLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKCFldmVudC5pc0NvbXBvc2luZykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTZWxlY3RlZEl0ZW0odGhpcy5zZWxlY3RlZEl0ZW0gLSAxLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzY29wZS5yZWdpc3RlcihbXSwgXCJBcnJvd0Rvd25cIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghZXZlbnQuaXNDb21wb3NpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U2VsZWN0ZWRJdGVtKHRoaXMuc2VsZWN0ZWRJdGVtICsgMSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2NvcGUucmVnaXN0ZXIoW10sIFwiRW50ZXJcIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghZXZlbnQuaXNDb21wb3NpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlU2VsZWN0ZWRJdGVtKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU3VnZ2VzdGlvbkNsaWNrKGV2ZW50OiBNb3VzZUV2ZW50LCBlbDogSFRNTERpdkVsZW1lbnQpOiB2b2lkIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5zdWdnZXN0aW9ucy5pbmRleE9mKGVsKTtcclxuICAgICAgICB0aGlzLnNldFNlbGVjdGVkSXRlbShpdGVtLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy51c2VTZWxlY3RlZEl0ZW0oZXZlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU3VnZ2VzdGlvbk1vdXNlb3ZlcihfZXZlbnQ6IE1vdXNlRXZlbnQsIGVsOiBIVE1MRGl2RWxlbWVudCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLnN1Z2dlc3Rpb25zLmluZGV4T2YoZWwpO1xyXG4gICAgICAgIHRoaXMuc2V0U2VsZWN0ZWRJdGVtKGl0ZW0sIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRTdWdnZXN0aW9ucyh2YWx1ZXM6IFRbXSkge1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyRWwuZW1wdHkoKTtcclxuICAgICAgICBjb25zdCBzdWdnZXN0aW9uRWxzOiBIVE1MRGl2RWxlbWVudFtdID0gW107XHJcblxyXG4gICAgICAgIHZhbHVlcy5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBzdWdnZXN0aW9uRWwgPSB0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZURpdihcInN1Z2dlc3Rpb24taXRlbVwiKTtcclxuICAgICAgICAgICAgdGhpcy5vd25lci5yZW5kZXJTdWdnZXN0aW9uKHZhbHVlLCBzdWdnZXN0aW9uRWwpO1xyXG4gICAgICAgICAgICBzdWdnZXN0aW9uRWxzLnB1c2goc3VnZ2VzdGlvbkVsKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB2YWx1ZXM7XHJcbiAgICAgICAgdGhpcy5zdWdnZXN0aW9ucyA9IHN1Z2dlc3Rpb25FbHM7XHJcbiAgICAgICAgdGhpcy5zZXRTZWxlY3RlZEl0ZW0oMCwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHVzZVNlbGVjdGVkSXRlbShldmVudDogTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnQpIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSB0aGlzLnZhbHVlc1t0aGlzLnNlbGVjdGVkSXRlbV07XHJcbiAgICAgICAgaWYgKGN1cnJlbnRWYWx1ZSkge1xyXG4gICAgICAgICAgICB0aGlzLm93bmVyLnNlbGVjdFN1Z2dlc3Rpb24oY3VycmVudFZhbHVlLCBldmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldFNlbGVjdGVkSXRlbShzZWxlY3RlZEluZGV4OiBudW1iZXIsIHNjcm9sbEludG9WaWV3OiBib29sZWFuKSB7XHJcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZEluZGV4ID0gd3JhcEFyb3VuZChcclxuICAgICAgICAgICAgc2VsZWN0ZWRJbmRleCxcclxuICAgICAgICAgICAgdGhpcy5zdWdnZXN0aW9ucy5sZW5ndGhcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnN0IHByZXZTZWxlY3RlZFN1Z2dlc3Rpb24gPSB0aGlzLnN1Z2dlc3Rpb25zW3RoaXMuc2VsZWN0ZWRJdGVtXTtcclxuICAgICAgICBjb25zdCBzZWxlY3RlZFN1Z2dlc3Rpb24gPSB0aGlzLnN1Z2dlc3Rpb25zW25vcm1hbGl6ZWRJbmRleF07XHJcblxyXG4gICAgICAgIHByZXZTZWxlY3RlZFN1Z2dlc3Rpb24/LnJlbW92ZUNsYXNzKFwiaXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgc2VsZWN0ZWRTdWdnZXN0aW9uPy5hZGRDbGFzcyhcImlzLXNlbGVjdGVkXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdGVkSXRlbSA9IG5vcm1hbGl6ZWRJbmRleDtcclxuXHJcbiAgICAgICAgaWYgKHNjcm9sbEludG9WaWV3KSB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkU3VnZ2VzdGlvbi5zY3JvbGxJbnRvVmlldyhmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVGV4dElucHV0U3VnZ2VzdDxUPiBpbXBsZW1lbnRzIElTdWdnZXN0T3duZXI8VD4ge1xyXG4gICAgcHJvdGVjdGVkIGFwcDogQXBwO1xyXG4gICAgcHJvdGVjdGVkIGlucHV0RWw6IEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50O1xyXG5cclxuICAgIHByaXZhdGUgcG9wcGVyOiBQb3BwZXJJbnN0YW5jZTtcclxuICAgIHByaXZhdGUgc2NvcGU6IFNjb3BlO1xyXG4gICAgcHJpdmF0ZSBzdWdnZXN0RWw6IEhUTUxFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBzdWdnZXN0OiBTdWdnZXN0PFQ+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBpbnB1dEVsOiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCkge1xyXG4gICAgICAgIHRoaXMuYXBwID0gYXBwO1xyXG4gICAgICAgIHRoaXMuaW5wdXRFbCA9IGlucHV0RWw7XHJcbiAgICAgICAgdGhpcy5zY29wZSA9IG5ldyBTY29wZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnN1Z2dlc3RFbCA9IGNyZWF0ZURpdihcInN1Z2dlc3Rpb24tY29udGFpbmVyXCIpO1xyXG4gICAgICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSB0aGlzLnN1Z2dlc3RFbC5jcmVhdGVEaXYoXCJzdWdnZXN0aW9uXCIpO1xyXG4gICAgICAgIHRoaXMuc3VnZ2VzdCA9IG5ldyBTdWdnZXN0KHRoaXMsIHN1Z2dlc3Rpb24sIHRoaXMuc2NvcGUpO1xyXG5cclxuICAgICAgICB0aGlzLnNjb3BlLnJlZ2lzdGVyKFtdLCBcIkVzY2FwZVwiLCB0aGlzLmNsb3NlLmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICB0aGlzLmlucHV0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIHRoaXMub25JbnB1dENoYW5nZWQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c1wiLCB0aGlzLm9uSW5wdXRDaGFuZ2VkLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuaW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCB0aGlzLmNsb3NlLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuc3VnZ2VzdEVsLm9uKFxyXG4gICAgICAgICAgICBcIm1vdXNlZG93blwiLFxyXG4gICAgICAgICAgICBcIi5zdWdnZXN0aW9uLWNvbnRhaW5lclwiLFxyXG4gICAgICAgICAgICAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIG9uSW5wdXRDaGFuZ2VkKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGlucHV0U3RyID0gdGhpcy5pbnB1dEVsLnZhbHVlO1xyXG4gICAgICAgIGNvbnN0IHN1Z2dlc3Rpb25zID0gdGhpcy5nZXRTdWdnZXN0aW9ucyhpbnB1dFN0cik7XHJcblxyXG4gICAgICAgIGlmICghc3VnZ2VzdGlvbnMpIHtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3VnZ2VzdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnN1Z2dlc3Quc2V0U3VnZ2VzdGlvbnMoc3VnZ2VzdGlvbnMpO1xyXG4gICAgICAgICAgICB0aGlzLm9wZW4odGhpcy5hcHAuZG9tLmFwcENvbnRhaW5lckVsLCB0aGlzLmlucHV0RWwpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgb3Blbihjb250YWluZXI6IEhUTUxFbGVtZW50LCBpbnB1dEVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYXBwLmtleW1hcC5wdXNoU2NvcGUodGhpcy5zY29wZSk7XHJcblxyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLnN1Z2dlc3RFbCk7XHJcbiAgICAgICAgdGhpcy5wb3BwZXIgPSBjcmVhdGVQb3BwZXIoaW5wdXRFbCwgdGhpcy5zdWdnZXN0RWwsIHtcclxuICAgICAgICAgICAgcGxhY2VtZW50OiBcImJvdHRvbS1zdGFydFwiLFxyXG4gICAgICAgICAgICBtb2RpZmllcnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcInNhbWVXaWR0aFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZm46ICh7IHN0YXRlLCBpbnN0YW5jZSB9KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGU6IHBvc2l0aW9uaW5nIG5lZWRzIHRvIGJlIGNhbGN1bGF0ZWQgdHdpY2UgLVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdCBwYXNzIC0gcG9zaXRpb25pbmcgaXQgYWNjb3JkaW5nIHRvIHRoZSB3aWR0aCBvZiB0aGUgcG9wcGVyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlY29uZCBwYXNzIC0gcG9zaXRpb24gaXQgd2l0aCB0aGUgd2lkdGggYm91bmQgdG8gdGhlIHJlZmVyZW5jZSBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gZWFybHkgZXhpdCB0byBhdm9pZCBhbiBpbmZpbml0ZSBsb29wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFdpZHRoID0gYCR7c3RhdGUucmVjdHMucmVmZXJlbmNlLndpZHRofXB4YDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlLnN0eWxlcy5wb3BwZXIud2lkdGggPT09IHRhcmdldFdpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuc3R5bGVzLnBvcHBlci53aWR0aCA9IHRhcmdldFdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZS51cGRhdGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHBoYXNlOiBcImJlZm9yZVdyaXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZXM6IFtcImNvbXB1dGVTdHlsZXNcIl0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNsb3NlKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYXBwLmtleW1hcC5wb3BTY29wZSh0aGlzLnNjb3BlKTtcclxuXHJcbiAgICAgICAgdGhpcy5zdWdnZXN0LnNldFN1Z2dlc3Rpb25zKFtdKTtcclxuICAgICAgICBpZiAodGhpcy5wb3BwZXIpIHRoaXMucG9wcGVyLmRlc3Ryb3koKTtcclxuICAgICAgICB0aGlzLnN1Z2dlc3RFbC5kZXRhY2goKTtcclxuICAgIH1cclxuXHJcbiAgICBhYnN0cmFjdCBnZXRTdWdnZXN0aW9ucyhpbnB1dFN0cjogc3RyaW5nKTogVFtdO1xyXG4gICAgYWJzdHJhY3QgcmVuZGVyU3VnZ2VzdGlvbihpdGVtOiBULCBlbDogSFRNTEVsZW1lbnQpOiB2b2lkO1xyXG4gICAgYWJzdHJhY3Qgc2VsZWN0U3VnZ2VzdGlvbihpdGVtOiBUKTogdm9pZDtcclxufVxyXG4iLCIvLyBDcmVkaXRzIGdvIHRvIExpYW0ncyBQZXJpb2RpYyBOb3RlcyBQbHVnaW46IGh0dHBzOi8vZ2l0aHViLmNvbS9saWFtY2Fpbi9vYnNpZGlhbi1wZXJpb2RpYy1ub3Rlc1xyXG5cclxuaW1wb3J0IHsgVEFic3RyYWN0RmlsZSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgVGV4dElucHV0U3VnZ2VzdCB9IGZyb20gXCIuL3N1Z2dlc3RcIjtcclxuaW1wb3J0IHsgZ2V0X3RmaWxlc19mcm9tX2ZvbGRlciB9IGZyb20gXCJ1dGlscy9VdGlsc1wiO1xyXG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IGVycm9yV3JhcHBlclN5bmMgfSBmcm9tIFwidXRpbHMvRXJyb3JcIjtcclxuXHJcbmV4cG9ydCBlbnVtIEZpbGVTdWdnZXN0TW9kZSB7XHJcbiAgICBUZW1wbGF0ZUZpbGVzLFxyXG4gICAgU2NyaXB0RmlsZXMsXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBGaWxlU3VnZ2VzdCBleHRlbmRzIFRleHRJbnB1dFN1Z2dlc3Q8VEZpbGU+IHtcclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHB1YmxpYyBpbnB1dEVsOiBIVE1MSW5wdXRFbGVtZW50LFxyXG4gICAgICAgIHByaXZhdGUgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4sXHJcbiAgICAgICAgcHJpdmF0ZSBtb2RlOiBGaWxlU3VnZ2VzdE1vZGVcclxuICAgICkge1xyXG4gICAgICAgIHN1cGVyKHBsdWdpbi5hcHAsIGlucHV0RWwpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldF9mb2xkZXIobW9kZTogRmlsZVN1Z2dlc3RNb2RlKTogc3RyaW5nIHtcclxuICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcclxuICAgICAgICAgICAgY2FzZSBGaWxlU3VnZ2VzdE1vZGUuVGVtcGxhdGVGaWxlczpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfZm9sZGVyO1xyXG4gICAgICAgICAgICBjYXNlIEZpbGVTdWdnZXN0TW9kZS5TY3JpcHRGaWxlczpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VyX3NjcmlwdHNfZm9sZGVyO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRfZXJyb3JfbXNnKG1vZGU6IEZpbGVTdWdnZXN0TW9kZSk6IHN0cmluZyB7XHJcbiAgICAgICAgc3dpdGNoIChtb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgRmlsZVN1Z2dlc3RNb2RlLlRlbXBsYXRlRmlsZXM6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYFRlbXBsYXRlcyBmb2xkZXIgZG9lc24ndCBleGlzdGA7XHJcbiAgICAgICAgICAgIGNhc2UgRmlsZVN1Z2dlc3RNb2RlLlNjcmlwdEZpbGVzOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGBVc2VyIFNjcmlwdHMgZm9sZGVyIGRvZXNuJ3QgZXhpc3RgO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRTdWdnZXN0aW9ucyhpbnB1dF9zdHI6IHN0cmluZyk6IFRGaWxlW10ge1xyXG4gICAgICAgIGNvbnN0IGFsbF9maWxlcyA9IGVycm9yV3JhcHBlclN5bmMoXHJcbiAgICAgICAgICAgICgpID0+XHJcbiAgICAgICAgICAgICAgICBnZXRfdGZpbGVzX2Zyb21fZm9sZGVyKFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldF9mb2xkZXIodGhpcy5tb2RlKVxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgdGhpcy5nZXRfZXJyb3JfbXNnKHRoaXMubW9kZSlcclxuICAgICAgICApO1xyXG4gICAgICAgIGlmICghYWxsX2ZpbGVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZpbGVzOiBURmlsZVtdID0gW107XHJcbiAgICAgICAgY29uc3QgbG93ZXJfaW5wdXRfc3RyID0gaW5wdXRfc3RyLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGFsbF9maWxlcy5mb3JFYWNoKChmaWxlOiBUQWJzdHJhY3RGaWxlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIGZpbGUgaW5zdGFuY2VvZiBURmlsZSAmJlxyXG4gICAgICAgICAgICAgICAgZmlsZS5leHRlbnNpb24gPT09IFwibWRcIiAmJlxyXG4gICAgICAgICAgICAgICAgZmlsZS5wYXRoLnRvTG93ZXJDYXNlKCkuY29udGFpbnMobG93ZXJfaW5wdXRfc3RyKVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goZmlsZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZpbGVzLnNsaWNlKDAsIDEwMDApO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlclN1Z2dlc3Rpb24oZmlsZTogVEZpbGUsIGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gICAgICAgIGVsLnNldFRleHQoZmlsZS5wYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3RTdWdnZXN0aW9uKGZpbGU6IFRGaWxlKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pbnB1dEVsLnZhbHVlID0gZmlsZS5wYXRoO1xyXG4gICAgICAgIHRoaXMuaW5wdXRFbC50cmlnZ2VyKFwiaW5wdXRcIik7XHJcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgfVxyXG59XHJcbiIsIi8vIENyZWRpdHMgZ28gdG8gTGlhbSdzIFBlcmlvZGljIE5vdGVzIFBsdWdpbjogaHR0cHM6Ly9naXRodWIuY29tL2xpYW1jYWluL29ic2lkaWFuLXBlcmlvZGljLW5vdGVzXHJcblxyXG5pbXBvcnQgeyBBcHAsIFRBYnN0cmFjdEZpbGUsIFRGb2xkZXIgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgVGV4dElucHV0U3VnZ2VzdCB9IGZyb20gXCIuL3N1Z2dlc3RcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBGb2xkZXJTdWdnZXN0IGV4dGVuZHMgVGV4dElucHV0U3VnZ2VzdDxURm9sZGVyPiB7XHJcbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgaW5wdXRFbDogSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQpIHtcclxuICAgICAgICBzdXBlcihhcHAsIGlucHV0RWwpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFN1Z2dlc3Rpb25zKGlucHV0U3RyOiBzdHJpbmcpOiBURm9sZGVyW10ge1xyXG4gICAgICAgIGNvbnN0IGFic3RyYWN0RmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRBbGxMb2FkZWRGaWxlcygpO1xyXG4gICAgICAgIGNvbnN0IGZvbGRlcnM6IFRGb2xkZXJbXSA9IFtdO1xyXG4gICAgICAgIGNvbnN0IGxvd2VyQ2FzZUlucHV0U3RyID0gaW5wdXRTdHIudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgYWJzdHJhY3RGaWxlcy5mb3JFYWNoKChmb2xkZXI6IFRBYnN0cmFjdEZpbGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgZm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlciAmJlxyXG4gICAgICAgICAgICAgICAgZm9sZGVyLnBhdGgudG9Mb3dlckNhc2UoKS5jb250YWlucyhsb3dlckNhc2VJbnB1dFN0cilcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBmb2xkZXJzLnB1c2goZm9sZGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZm9sZGVycy5zbGljZSgwLCAxMDAwKTtcclxuICAgIH1cclxuXHJcbiAgICByZW5kZXJTdWdnZXN0aW9uKGZpbGU6IFRGb2xkZXIsIGVsOiBIVE1MRWxlbWVudCk6IHZvaWQge1xyXG4gICAgICAgIGVsLnNldFRleHQoZmlsZS5wYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3RTdWdnZXN0aW9uKGZpbGU6IFRGb2xkZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmlucHV0RWwudmFsdWUgPSBmaWxlLnBhdGg7XHJcbiAgICAgICAgdGhpcy5pbnB1dEVsLnRyaWdnZXIoXCJpbnB1dFwiKTtcclxuICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IFRlbXBsYXRlclBsdWdpbiBmcm9tIFwibWFpblwiO1xyXG5pbXBvcnQgeyBCdXR0b25Db21wb25lbnQsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgZXJyb3JXcmFwcGVyU3luYywgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwidXRpbHMvRXJyb3JcIjtcclxuaW1wb3J0IHsgbG9nX2Vycm9yIH0gZnJvbSBcInV0aWxzL0xvZ1wiO1xyXG5pbXBvcnQgeyBhcnJheW1vdmUsIGdldF90ZmlsZXNfZnJvbV9mb2xkZXIgfSBmcm9tIFwidXRpbHMvVXRpbHNcIjtcclxuaW1wb3J0IHsgRmlsZVN1Z2dlc3QsIEZpbGVTdWdnZXN0TW9kZSB9IGZyb20gXCIuL3N1Z2dlc3RlcnMvRmlsZVN1Z2dlc3RlclwiO1xyXG5pbXBvcnQgeyBGb2xkZXJTdWdnZXN0IH0gZnJvbSBcIi4vc3VnZ2VzdGVycy9Gb2xkZXJTdWdnZXN0ZXJcIjtcclxuaW1wb3J0IHsgSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uIH0gZnJvbSBcIi4vUmVuZGVyU2V0dGluZ3MvSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uXCJcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRm9sZGVyVGVtcGxhdGUge1xyXG4gICAgZm9sZGVyOiBzdHJpbmc7XHJcbiAgICB0ZW1wbGF0ZTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEZpbGVUZW1wbGF0ZSB7XHJcbiAgICByZWdleDogc3RyaW5nO1xyXG4gICAgdGVtcGxhdGU6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNldHRpbmdzID0ge1xyXG4gICAgY29tbWFuZF90aW1lb3V0OiA1LFxyXG4gICAgdGVtcGxhdGVzX2ZvbGRlcjogXCJcIixcclxuICAgIHRlbXBsYXRlc19wYWlyczogW1tcIlwiLCBcIlwiXV0sXHJcbiAgICB0cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb246IGZhbHNlLFxyXG4gICAgYXV0b19qdW1wX3RvX2N1cnNvcjogZmFsc2UsXHJcbiAgICBlbmFibGVfc3lzdGVtX2NvbW1hbmRzOiBmYWxzZSxcclxuICAgIHNoZWxsX3BhdGg6IFwiXCIsXHJcbiAgICB1c2VyX3NjcmlwdHNfZm9sZGVyOiBcIlwiLFxyXG4gICAgZW5hYmxlX2ZvbGRlcl90ZW1wbGF0ZXM6IHRydWUsXHJcbiAgICBmb2xkZXJfdGVtcGxhdGVzOiBbeyBmb2xkZXI6IFwiXCIsIHRlbXBsYXRlOiBcIlwiIH1dLFxyXG4gICAgZW5hYmxlX2ZpbGVfdGVtcGxhdGVzOiBmYWxzZSxcclxuICAgIGZpbGVfdGVtcGxhdGVzOiBbeyByZWdleDogXCIuKlwiLCB0ZW1wbGF0ZTogXCJcIiB9XSxcclxuICAgIHN5bnRheF9oaWdobGlnaHRpbmc6IHRydWUsXHJcbiAgICBzeW50YXhfaGlnaGxpZ2h0aW5nX21vYmlsZTogZmFsc2UsXHJcbiAgICBlbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzOiBbXCJcIl0sXHJcbiAgICBzdGFydHVwX3RlbXBsYXRlczogW1wiXCJdLFxyXG4gICAgaW50ZWxsaXNlbnNlX3JlbmRlcjogSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uLlJlbmRlckRlc2NyaXB0aW9uUGFyYW1ldGVyUmV0dXJuXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzIHtcclxuICAgIGNvbW1hbmRfdGltZW91dDogbnVtYmVyO1xyXG4gICAgdGVtcGxhdGVzX2ZvbGRlcjogc3RyaW5nO1xyXG4gICAgdGVtcGxhdGVzX3BhaXJzOiBBcnJheTxbc3RyaW5nLCBzdHJpbmddPjtcclxuICAgIHRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbjogYm9vbGVhbjtcclxuICAgIGF1dG9fanVtcF90b19jdXJzb3I6IGJvb2xlYW47XHJcbiAgICBlbmFibGVfc3lzdGVtX2NvbW1hbmRzOiBib29sZWFuO1xyXG4gICAgc2hlbGxfcGF0aDogc3RyaW5nO1xyXG4gICAgdXNlcl9zY3JpcHRzX2ZvbGRlcjogc3RyaW5nO1xyXG4gICAgZW5hYmxlX2ZvbGRlcl90ZW1wbGF0ZXM6IGJvb2xlYW47XHJcbiAgICBmb2xkZXJfdGVtcGxhdGVzOiBBcnJheTxGb2xkZXJUZW1wbGF0ZT47XHJcbiAgICBlbmFibGVfZmlsZV90ZW1wbGF0ZXM6IGJvb2xlYW47XHJcbiAgICBmaWxlX3RlbXBsYXRlczogQXJyYXk8RmlsZVRlbXBsYXRlPjtcclxuICAgIHN5bnRheF9oaWdobGlnaHRpbmc6IGJvb2xlYW47XHJcbiAgICBzeW50YXhfaGlnaGxpZ2h0aW5nX21vYmlsZTogYm9vbGVhbjtcclxuICAgIGVuYWJsZWRfdGVtcGxhdGVzX2hvdGtleXM6IEFycmF5PHN0cmluZz47XHJcbiAgICBzdGFydHVwX3RlbXBsYXRlczogQXJyYXk8c3RyaW5nPjtcclxuICAgIGludGVsbGlzZW5zZV9yZW5kZXI6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlclNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcclxuICAgICAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3BsYXkoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJFbC5lbXB0eSgpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZF90ZW1wbGF0ZV9mb2xkZXJfc2V0dGluZygpO1xyXG4gICAgICAgIHRoaXMuYWRkX2ludGVybmFsX2Z1bmN0aW9uc19zZXR0aW5nKCk7XHJcbiAgICAgICAgdGhpcy5hZGRfc3ludGF4X2hpZ2hsaWdodGluZ19zZXR0aW5ncygpO1xyXG4gICAgICAgIHRoaXMuYWRkX2F1dG9fanVtcF90b19jdXJzb3IoKTtcclxuICAgICAgICB0aGlzLmFkZF90cmlnZ2VyX29uX25ld19maWxlX2NyZWF0aW9uX3NldHRpbmcoKTtcclxuICAgICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkX2ZvbGRlcl90ZW1wbGF0ZXNfc2V0dGluZygpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZF9maWxlX3RlbXBsYXRlc19zZXR0aW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWRkX3RlbXBsYXRlc19ob3RrZXlzX3NldHRpbmcoKTtcclxuICAgICAgICB0aGlzLmFkZF9zdGFydHVwX3RlbXBsYXRlc19zZXR0aW5nKCk7XHJcbiAgICAgICAgdGhpcy5hZGRfdXNlcl9zY3JpcHRfZnVuY3Rpb25zX3NldHRpbmcoKTtcclxuICAgICAgICB0aGlzLmFkZF91c2VyX3N5c3RlbV9jb21tYW5kX2Z1bmN0aW9uc19zZXR0aW5nKCk7XHJcbiAgICAgICAgdGhpcy5hZGRfZG9uYXRpbmdfc2V0dGluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF90ZW1wbGF0ZV9mb2xkZXJfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlRlbXBsYXRlIGZvbGRlciBsb2NhdGlvblwiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIkZpbGVzIGluIHRoaXMgZm9sZGVyIHdpbGwgYmUgYXZhaWxhYmxlIGFzIHRlbXBsYXRlcy5cIilcclxuICAgICAgICAgICAgLmFkZFNlYXJjaCgoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgIG5ldyBGb2xkZXJTdWdnZXN0KHRoaXMuYXBwLCBjYi5pbnB1dEVsKTtcclxuICAgICAgICAgICAgICAgIGNiLnNldFBsYWNlaG9sZGVyKFwiRXhhbXBsZTogZm9sZGVyMS9mb2xkZXIyXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19mb2xkZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKChuZXdfZm9sZGVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyaW0gZm9sZGVyIGFuZCBTdHJpcCBlbmRpbmcgc2xhc2ggaWYgdGhlcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZvbGRlciA9IG5ld19mb2xkZXIudHJpbSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mb2xkZXIgPSBuZXdfZm9sZGVyLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19mb2xkZXIgPSBuZXdfZm9sZGVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICBjYi5jb250YWluZXJFbC5hZGRDbGFzcyhcInRlbXBsYXRlcl9zZWFyY2hcIik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF9pbnRlcm5hbF9mdW5jdGlvbnNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGRlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIlRlbXBsYXRlciBwcm92aWRlcyBtdWx0aXBsZXMgcHJlZGVmaW5lZCB2YXJpYWJsZXMgLyBmdW5jdGlvbnMgdGhhdCB5b3UgY2FuIHVzZS5cIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIkNoZWNrIHRoZSBcIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImFcIiwge1xyXG4gICAgICAgICAgICAgICAgaHJlZjogXCJodHRwczovL3NpbGVudHZvaWQxMy5naXRodWIuaW8vVGVtcGxhdGVyL1wiLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogXCJkb2N1bWVudGF0aW9uXCIsXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBcIiB0byBnZXQgYSBsaXN0IG9mIGFsbCB0aGUgYXZhaWxhYmxlIGludGVybmFsIHZhcmlhYmxlcyAvIGZ1bmN0aW9ucy5cIlxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiSW50ZXJuYWwgdmFyaWFibGVzIGFuZCBmdW5jdGlvbnNcIilcclxuICAgICAgICAgICAgLnNldERlc2MoZGVzYyk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkX3N5bnRheF9oaWdobGlnaHRpbmdfc2V0dGluZ3MoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgZGVza3RvcERlc2MgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZGVza3RvcERlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIkFkZHMgc3ludGF4IGhpZ2hsaWdodGluZyBmb3IgVGVtcGxhdGVyIGNvbW1hbmRzIGluIGVkaXQgbW9kZS5cIlxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1vYmlsZURlc2MgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgbW9iaWxlRGVzYy5hcHBlbmQoXHJcbiAgICAgICAgICAgIFwiQWRkcyBzeW50YXggaGlnaGxpZ2h0aW5nIGZvciBUZW1wbGF0ZXIgY29tbWFuZHMgaW4gZWRpdCBtb2RlIG9uIFwiICtcclxuICAgICAgICAgICAgICAgIFwibW9iaWxlLiBVc2Ugd2l0aCBjYXV0aW9uOiB0aGlzIG1heSBicmVhayBsaXZlIHByZXZpZXcgb24gbW9iaWxlIFwiICtcclxuICAgICAgICAgICAgICAgIFwicGxhdGZvcm1zLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJTeW50YXggaGlnaGxpZ2h0aW5nIG9uIGRlc2t0b3BcIilcclxuICAgICAgICAgICAgLnNldERlc2MoZGVza3RvcERlc2MpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnN5bnRheF9oaWdobGlnaHRpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKChzeW50YXhfaGlnaGxpZ2h0aW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN5bnRheF9oaWdobGlnaHRpbmcgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ludGF4X2hpZ2hsaWdodGluZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5ldmVudF9oYW5kbGVyLnVwZGF0ZV9zeW50YXhfaGlnaGxpZ2h0aW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlN5bnRheCBoaWdobGlnaHRpbmcgb24gbW9iaWxlXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKG1vYmlsZURlc2MpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnN5bnRheF9oaWdobGlnaHRpbmdfbW9iaWxlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgoc3ludGF4X2hpZ2hsaWdodGluZ19tb2JpbGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3ludGF4X2hpZ2hsaWdodGluZ19tb2JpbGUgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ludGF4X2hpZ2hsaWdodGluZ19tb2JpbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZXZlbnRfaGFuZGxlci51cGRhdGVfc3ludGF4X2hpZ2hsaWdodGluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfYXV0b19qdW1wX3RvX2N1cnNvcigpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGRlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIkF1dG9tYXRpY2FsbHkgdHJpZ2dlcnMgXCIsXHJcbiAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJjb2RlXCIsIHsgdGV4dDogXCJ0cC5maWxlLmN1cnNvclwiIH0pLFxyXG4gICAgICAgICAgICBcIiBhZnRlciBpbnNlcnRpbmcgYSB0ZW1wbGF0ZS5cIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIllvdSBjYW4gYWxzbyBzZXQgYSBob3RrZXkgdG8gbWFudWFsbHkgdHJpZ2dlciBcIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImNvZGVcIiwgeyB0ZXh0OiBcInRwLmZpbGUuY3Vyc29yXCIgfSksXHJcbiAgICAgICAgICAgIFwiLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJBdXRvbWF0aWMganVtcCB0byBjdXJzb3JcIilcclxuICAgICAgICAgICAgLnNldERlc2MoZGVzYylcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b19qdW1wX3RvX2N1cnNvcilcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKGF1dG9fanVtcF90b19jdXJzb3IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b19qdW1wX3RvX2N1cnNvciA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvX2p1bXBfdG9fY3Vyc29yO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF90cmlnZ2VyX29uX25ld19maWxlX2NyZWF0aW9uX3NldHRpbmcoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjLmFwcGVuZChcclxuICAgICAgICAgICAgXCJUZW1wbGF0ZXIgd2lsbCBsaXN0ZW4gZm9yIHRoZSBuZXcgZmlsZSBjcmVhdGlvbiBldmVudCwgYW5kLCBpZiBpdCBtYXRjaGVzIGEgcnVsZSB5b3UndmUgc2V0LCByZXBsYWNlIGV2ZXJ5IGNvbW1hbmQgaXQgZmluZHMgaW4gdGhlIG5ldyBmaWxlJ3MgY29udGVudC4gXCIsXHJcbiAgICAgICAgICAgIFwiVGhpcyBtYWtlcyBUZW1wbGF0ZXIgY29tcGF0aWJsZSB3aXRoIG90aGVyIHBsdWdpbnMgbGlrZSB0aGUgRGFpbHkgbm90ZSBjb3JlIHBsdWdpbiwgQ2FsZW5kYXIgcGx1Z2luLCBSZXZpZXcgcGx1Z2luLCBOb3RlIHJlZmFjdG9yIHBsdWdpbiwgZXRjLiBcIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIFwiTWFrZSBzdXJlIHRvIHNldCB1cCBydWxlcyB1bmRlciBlaXRoZXIgZm9sZGVyIHRlbXBsYXRlcyBvciBmaWxlIHJlZ2V4IHRlbXBsYXRlIGJlbG93LlwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJcIiwge1xyXG4gICAgICAgICAgICAgICAgdGV4dDogXCJXYXJuaW5nOiBcIixcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIFwiVGhpcyBjYW4gYmUgZGFuZ2Vyb3VzIGlmIHlvdSBjcmVhdGUgbmV3IGZpbGVzIHdpdGggdW5rbm93biAvIHVuc2FmZSBjb250ZW50IG9uIGNyZWF0aW9uLiBNYWtlIHN1cmUgdGhhdCBldmVyeSBuZXcgZmlsZSdzIGNvbnRlbnQgaXMgc2FmZSBvbiBjcmVhdGlvbi5cIlxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiVHJpZ2dlciBUZW1wbGF0ZXIgb24gbmV3IGZpbGUgY3JlYXRpb25cIilcclxuICAgICAgICAgICAgLnNldERlc2MoZGVzYylcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbiA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZXZlbnRfaGFuZGxlci51cGRhdGVfdHJpZ2dlcl9maWxlX29uX2NyZWF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvcmNlIHJlZnJlc2hcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF90ZW1wbGF0ZXNfaG90a2V5c19zZXR0aW5nKCk6IHZvaWQge1xyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpLnNldE5hbWUoXCJUZW1wbGF0ZSBob3RrZXlzXCIpLnNldEhlYWRpbmcoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjLmFwcGVuZChcclxuICAgICAgICAgICAgXCJUZW1wbGF0ZSBob3RrZXlzIGFsbG93cyB5b3UgdG8gYmluZCBhIHRlbXBsYXRlIHRvIGEgaG90a2V5LlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbCkuc2V0RGVzYyhkZXNjKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlZF90ZW1wbGF0ZXNfaG90a2V5cy5mb3JFYWNoKFxyXG4gICAgICAgICAgICAodGVtcGxhdGUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgICAgICAgICAuYWRkU2VhcmNoKChjYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRmlsZVN1Z2dlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYi5pbnB1dEVsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGaWxlU3VnZ2VzdE1vZGUuVGVtcGxhdGVGaWxlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYi5zZXRQbGFjZWhvbGRlcihcIkV4YW1wbGU6IGZvbGRlcjEvdGVtcGxhdGVfZmlsZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRlbXBsYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKChuZXdfdGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld190ZW1wbGF0ZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzLmNvbnRhaW5zKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X3RlbXBsYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nX2Vycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFRlbXBsYXRlckVycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhpcyB0ZW1wbGF0ZSBpcyBhbHJlYWR5IGJvdW5kIHRvIGEgaG90a2V5XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5jb21tYW5kX2hhbmRsZXIuYWRkX3RlbXBsYXRlX2hvdGtleShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzW2luZGV4XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X3RlbXBsYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0gPSBuZXdfdGVtcGxhdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2IuY29udGFpbmVyRWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfc2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChjYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYi5zZXRJY29uKFwiYW55LWtleVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJDb25maWd1cmUgSG90a2V5XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogUmVwbGFjZSB3aXRoIGZ1dHVyZSBcIm9mZmljaWFsXCIgd2F5IHRvIGRvIHRoaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAuc2V0dGluZy5vcGVuVGFiQnlJZChcImhvdGtleXNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhYiA9IHRoaXMuYXBwLnNldHRpbmcuYWN0aXZlVGFiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhYi5zZWFyY2hDb21wb25lbnQuaW5wdXRFbC52YWx1ZSA9IHRlbXBsYXRlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhYi51cGRhdGVIb3RrZXlWaXNpYmlsaXR5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcInVwLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiTW92ZSB1cFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5bW92ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggLSAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcImRvd24tY2hldnJvbi1nbHlwaFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJNb3ZlIGRvd25cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheW1vdmUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZW5hYmxlZF90ZW1wbGF0ZXNfaG90a2V5cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICsgMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLnNldEljb24oXCJjcm9zc1wiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJEZWxldGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5jb21tYW5kX2hhbmRsZXIucmVtb3ZlX3RlbXBsYXRlX2hvdGtleShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzW2luZGV4XVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlZF90ZW1wbGF0ZXNfaG90a2V5cy5zcGxpY2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBzLmluZm9FbC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpLmFkZEJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgY2Iuc2V0QnV0dG9uVGV4dChcIkFkZCBuZXcgaG90a2V5IGZvciB0ZW1wbGF0ZVwiKVxyXG4gICAgICAgICAgICAgICAgLnNldEN0YSgpXHJcbiAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlZF90ZW1wbGF0ZXNfaG90a2V5cy5wdXNoKFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSByZWZyZXNoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfZm9sZGVyX3RlbXBsYXRlc19zZXR0aW5nKCk6IHZvaWQge1xyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpLnNldE5hbWUoXCJGb2xkZXIgdGVtcGxhdGVzXCIpLnNldEhlYWRpbmcoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVzY0hlYWRpbmcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZGVzY0hlYWRpbmcuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIkZvbGRlciB0ZW1wbGF0ZXMgYXJlIHRyaWdnZXJlZCB3aGVuIGEgbmV3IFwiLFxyXG4gICAgICAgICAgICBkZXNjSGVhZGluZy5jcmVhdGVFbChcInN0cm9uZ1wiLCB7IHRleHQ6IFwiZW1wdHkgXCIgfSksXHJcbiAgICAgICAgICAgIFwiZmlsZSBpcyBjcmVhdGVkIGluIGEgZ2l2ZW4gZm9sZGVyLlwiLFxyXG4gICAgICAgICAgICBkZXNjSGVhZGluZy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIlRlbXBsYXRlciB3aWxsIGZpbGwgdGhlIGVtcHR5IGZpbGUgd2l0aCB0aGUgc3BlY2lmaWVkIHRlbXBsYXRlLlwiLFxyXG4gICAgICAgICAgICBkZXNjSGVhZGluZy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIlRoZSBkZWVwZXN0IG1hdGNoIGlzIHVzZWQuIEEgZ2xvYmFsIGRlZmF1bHQgdGVtcGxhdGUgd291bGQgYmUgZGVmaW5lZCBvbiB0aGUgcm9vdCBcIixcclxuICAgICAgICAgICAgZGVzY0hlYWRpbmcuY3JlYXRlRWwoXCJjb2RlXCIsIHsgdGV4dDogXCIvXCIgfSksXHJcbiAgICAgICAgICAgIFwiLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbCkuc2V0RGVzYyhkZXNjSGVhZGluZyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRlc2NVc2VOZXdGaWxlVGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZGVzY1VzZU5ld0ZpbGVUZW1wbGF0ZS5hcHBlbmQoXHJcbiAgICAgICAgICAgIFwiV2hlbiBlbmFibGVkLCBUZW1wbGF0ZXIgd2lsbCBtYWtlIHVzZSBvZiB0aGUgZm9sZGVyIHRlbXBsYXRlcyBkZWZpbmVkIGJlbG93LiBUaGlzIG9wdGlvbiBpcyBtdXR1YWxseSBleGNsdXNpdmUgd2l0aCBmaWxlIHJlZ2V4IHRlbXBsYXRlcyBiZWxvdywgc28gZW5hYmxpbmcgb25lIHdpbGwgZGlzYWJsZSB0aGUgb3RoZXIuXCJcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIkVuYWJsZSBmb2xkZXIgdGVtcGxhdGVzXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKGRlc2NVc2VOZXdGaWxlVGVtcGxhdGUpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZV9mb2xkZXJfdGVtcGxhdGVzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodXNlX25ld19mb2xkZXJfdGVtcGxhdGVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZV9mb2xkZXJfdGVtcGxhdGVzID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZV9uZXdfZm9sZGVyX3RlbXBsYXRlcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZV9uZXdfZm9sZGVyX3RlbXBsYXRlcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlX2ZpbGVfdGVtcGxhdGVzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSByZWZyZXNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfZm9sZGVyX3RlbXBsYXRlcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb2xkZXJfdGVtcGxhdGVzLmZvckVhY2goXHJcbiAgICAgICAgICAgIChmb2xkZXJfdGVtcGxhdGUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgICAgICAgICAuYWRkU2VhcmNoKChjYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRm9sZGVyU3VnZ2VzdCh0aGlzLmFwcCwgY2IuaW5wdXRFbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLnNldFBsYWNlaG9sZGVyKFwiRm9sZGVyXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoZm9sZGVyX3RlbXBsYXRlLmZvbGRlcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X2ZvbGRlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZvbGRlciAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb2xkZXJfdGVtcGxhdGVzLnNvbWUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZSkgPT4gZS5mb2xkZXIgPT0gbmV3X2ZvbGRlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ19lcnJvcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlRoaXMgZm9sZGVyIGFscmVhZHkgaGFzIGEgdGVtcGxhdGUgYXNzb2NpYXRlZCB3aXRoIGl0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlc1tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLmZvbGRlciA9IG5ld19mb2xkZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2IuY29udGFpbmVyRWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfc2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZFNlYXJjaCgoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEZpbGVTdWdnZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IuaW5wdXRFbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRmlsZVN1Z2dlc3RNb2RlLlRlbXBsYXRlRmlsZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0UGxhY2Vob2xkZXIoXCJUZW1wbGF0ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKGZvbGRlcl90ZW1wbGF0ZS50ZW1wbGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X3RlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlc1tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLnRlbXBsYXRlID0gbmV3X3RlbXBsYXRlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLmNvbnRhaW5lckVsLmFkZENsYXNzKFwidGVtcGxhdGVyX3NlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcInVwLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiTW92ZSB1cFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5bW92ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4IC0gMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLnNldEljb24oXCJkb3duLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiTW92ZSBkb3duXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXltb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb2xkZXJfdGVtcGxhdGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKyAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcImNyb3NzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcChcIkRlbGV0ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZvbGRlcl90ZW1wbGF0ZXMuc3BsaWNlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBzLmluZm9FbC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpLmFkZEJ1dHRvbigoYnV0dG9uOiBCdXR0b25Db21wb25lbnQpID0+IHtcclxuICAgICAgICAgICAgYnV0dG9uXHJcbiAgICAgICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkFkZCBuZXcgZm9sZGVyIHRlbXBsYXRlXCIpXHJcbiAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcChcIkFkZCBhZGRpdGlvbmFsIGZvbGRlciB0ZW1wbGF0ZVwiKVxyXG4gICAgICAgICAgICAgICAgLnNldEN0YSgpXHJcbiAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9sZGVyOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfZmlsZV90ZW1wbGF0ZXNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIkZpbGUgcmVnZXggdGVtcGxhdGVzXCIpXHJcbiAgICAgICAgICAgIC5zZXRIZWFkaW5nKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRlc2NIZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGRlc2NIZWFkaW5nLmFwcGVuZChcclxuICAgICAgICAgICAgXCJGaWxlIHJlZ2V4IHRlbXBsYXRlcyBhcmUgdHJpZ2dlcmVkIHdoZW4gYSBuZXcgXCIsXHJcbiAgICAgICAgICAgIGRlc2NIZWFkaW5nLmNyZWF0ZUVsKFwic3Ryb25nXCIsIHsgdGV4dDogXCJlbXB0eVwiIH0pLFxyXG4gICAgICAgICAgICBcIiBmaWxlIGlzIGNyZWF0ZWQgdGhhdCBtYXRjaGVzIG9uZSBvZiB0aGVtLiBUZW1wbGF0ZXIgd2lsbCBmaWxsIHRoZSBlbXB0eSBmaWxlIHdpdGggdGhlIHNwZWNpZmllZCB0ZW1wbGF0ZS5cIixcclxuICAgICAgICAgICAgZGVzY0hlYWRpbmcuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgXCJUaGUgZmlyc3QgbWF0Y2ggZnJvbSB0aGUgdG9wIGlzIHVzZWQsIHNvIHRoZSBvcmRlciBvZiB0aGUgcnVsZXMgaXMgaW1wb3J0YW50LlwiLFxyXG4gICAgICAgICAgICBkZXNjSGVhZGluZy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIlVzZSBcIixcclxuICAgICAgICAgICAgZGVzY0hlYWRpbmcuY3JlYXRlRWwoXCJjb2RlXCIsIHsgdGV4dDogXCIuKlwiIH0pLFxyXG4gICAgICAgICAgICBcIiBhcyBhIGZpbmFsIGNhdGNoLWFsbCwgaWYgeW91IG5lZWQgaXQuXCJcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5zZXREZXNjKGRlc2NIZWFkaW5nKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVzY1VzZU5ld0ZpbGVUZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjVXNlTmV3RmlsZVRlbXBsYXRlLmFwcGVuZChcclxuICAgICAgICAgICAgXCJXaGVuIGVuYWJsZWQsIFRlbXBsYXRlciB3aWxsIG1ha2UgdXNlIG9mIHRoZSBmaWxlIHJlZ2V4IHRlbXBsYXRlcyBkZWZpbmVkIGJlbG93LiBUaGlzIG9wdGlvbiBpcyBtdXR1YWxseSBleGNsdXNpdmUgd2l0aCBmb2xkZXIgdGVtcGxhdGVzIGFib3ZlLCBzbyBlbmFibGluZyBvbmUgd2lsbCBkaXNhYmxlIHRoZSBvdGhlci5cIlxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiRW5hYmxlIGZpbGUgcmVnZXggdGVtcGxhdGVzXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKGRlc2NVc2VOZXdGaWxlVGVtcGxhdGUpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZV9maWxlX3RlbXBsYXRlcylcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKHVzZV9uZXdfZmlsZV90ZW1wbGF0ZXMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlX2ZpbGVfdGVtcGxhdGVzID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZV9uZXdfZmlsZV90ZW1wbGF0ZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1c2VfbmV3X2ZpbGVfdGVtcGxhdGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfZm9sZGVyX3RlbXBsYXRlcyA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSByZWZyZXNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfZmlsZV90ZW1wbGF0ZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZmlsZV90ZW1wbGF0ZXMuZm9yRWFjaCgoZmlsZV90ZW1wbGF0ZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcyA9IG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkVGV4dCgoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjYi5zZXRQbGFjZWhvbGRlcihcIkZpbGUgcmVnZXhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKGZpbGVfdGVtcGxhdGUucmVnZXgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X3JlZ2V4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlX3RlbXBsYXRlc1tpbmRleF0ucmVnZXggPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19yZWdleDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIGNiLmlucHV0RWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfc2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5hZGRTZWFyY2goKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IEZpbGVTdWdnZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYi5pbnB1dEVsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZVN1Z2dlc3RNb2RlLlRlbXBsYXRlRmlsZXNcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNiLnNldFBsYWNlaG9sZGVyKFwiVGVtcGxhdGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKGZpbGVfdGVtcGxhdGUudGVtcGxhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X3RlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlX3RlbXBsYXRlc1tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXS50ZW1wbGF0ZSA9IG5ld190ZW1wbGF0ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIGNiLmNvbnRhaW5lckVsLmFkZENsYXNzKFwidGVtcGxhdGVyX3NlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcInVwLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJNb3ZlIHVwXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5bW92ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlX3RlbXBsYXRlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCAtIDFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChjYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNiLnNldEljb24oXCJkb3duLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJNb3ZlIGRvd25cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXltb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZpbGVfdGVtcGxhdGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICsgMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcImNyb3NzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiRGVsZXRlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZpbGVfdGVtcGxhdGVzLnNwbGljZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHMuaW5mb0VsLnJlbW92ZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5hZGRCdXR0b24oKGJ1dHRvbjogQnV0dG9uQ29tcG9uZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJBZGQgbmV3IGZpbGUgcmVnZXhcIilcclxuICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiQWRkIGFkZGl0aW9uYWwgZmlsZSByZWdleFwiKVxyXG4gICAgICAgICAgICAgICAgLnNldEN0YSgpXHJcbiAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZmlsZV90ZW1wbGF0ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2V4OiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfc3RhcnR1cF90ZW1wbGF0ZXNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5zZXROYW1lKFwiU3RhcnR1cCB0ZW1wbGF0ZXNcIikuc2V0SGVhZGluZygpO1xyXG5cclxuICAgICAgICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGRlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIlN0YXJ0dXAgdGVtcGxhdGVzIGFyZSB0ZW1wbGF0ZXMgdGhhdCB3aWxsIGdldCBleGVjdXRlZCBvbmNlIHdoZW4gVGVtcGxhdGVyIHN0YXJ0cy5cIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIlRoZXNlIHRlbXBsYXRlcyB3b24ndCBvdXRwdXQgYW55dGhpbmcuXCIsXHJcbiAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgXCJUaGlzIGNhbiBiZSB1c2VmdWwgdG8gc2V0IHVwIHRlbXBsYXRlcyBhZGRpbmcgaG9va3MgdG8gT2JzaWRpYW4gZXZlbnRzIGZvciBleGFtcGxlLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbCkuc2V0RGVzYyhkZXNjKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3RhcnR1cF90ZW1wbGF0ZXMuZm9yRWFjaCgodGVtcGxhdGUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHMgPSBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAgICAgLmFkZFNlYXJjaCgoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBuZXcgRmlsZVN1Z2dlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLmlucHV0RWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlU3VnZ2VzdE1vZGUuVGVtcGxhdGVGaWxlc1xyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2Iuc2V0UGxhY2Vob2xkZXIoXCJFeGFtcGxlOiBmb2xkZXIxL3RlbXBsYXRlX2ZpbGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRlbXBsYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKG5ld190ZW1wbGF0ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld190ZW1wbGF0ZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0dXBfdGVtcGxhdGVzLmNvbnRhaW5zKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfdGVtcGxhdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dfZXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhpcyBzdGFydHVwIHRlbXBsYXRlIGFscmVhZHkgZXhpc3RcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdGFydHVwX3RlbXBsYXRlc1tpbmRleF0gPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld190ZW1wbGF0ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIGNiLmNvbnRhaW5lckVsLmFkZENsYXNzKFwidGVtcGxhdGVyX3NlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcImNyb3NzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiRGVsZXRlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0dXBfdGVtcGxhdGVzLnNwbGljZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHMuaW5mb0VsLnJlbW92ZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5hZGRCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgIGNiLnNldEJ1dHRvblRleHQoXCJBZGQgbmV3IHN0YXJ0dXAgdGVtcGxhdGVcIilcclxuICAgICAgICAgICAgICAgIC5zZXRDdGEoKVxyXG4gICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0dXBfdGVtcGxhdGVzLnB1c2goXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZvcmNlIHJlZnJlc2hcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF91c2VyX3NjcmlwdF9mdW5jdGlvbnNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlVzZXIgc2NyaXB0IGZ1bmN0aW9uc1wiKVxyXG4gICAgICAgICAgICAuc2V0SGVhZGluZygpO1xyXG5cclxuICAgICAgICBsZXQgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjLmFwcGVuZChcclxuICAgICAgICAgICAgXCJBbGwgSmF2YVNjcmlwdCBmaWxlcyBpbiB0aGlzIGZvbGRlciB3aWxsIGJlIGxvYWRlZCBhcyBDb21tb25KUyBtb2R1bGVzLCB0byBpbXBvcnQgY3VzdG9tIHVzZXIgZnVuY3Rpb25zLlwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIFwiVGhlIGZvbGRlciBuZWVkcyB0byBiZSBhY2Nlc3NpYmxlIGZyb20gdGhlIHZhdWx0LlwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIFwiQ2hlY2sgdGhlIFwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYVwiLCB7XHJcbiAgICAgICAgICAgICAgICBocmVmOiBcImh0dHBzOi8vc2lsZW50dm9pZDEzLmdpdGh1Yi5pby9UZW1wbGF0ZXIvXCIsXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBcImRvY3VtZW50YXRpb25cIixcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIFwiIGZvciBtb3JlIGluZm9ybWF0aW9uLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJTY3JpcHQgZmlsZXMgZm9sZGVyIGxvY2F0aW9uXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKGRlc2MpXHJcbiAgICAgICAgICAgIC5hZGRTZWFyY2goKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBuZXcgRm9sZGVyU3VnZ2VzdCh0aGlzLmFwcCwgY2IuaW5wdXRFbCk7XHJcbiAgICAgICAgICAgICAgICBjYi5zZXRQbGFjZWhvbGRlcihcIkV4YW1wbGU6IGZvbGRlcjEvZm9sZGVyMlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VyX3NjcmlwdHNfZm9sZGVyKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X2ZvbGRlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VyX3NjcmlwdHNfZm9sZGVyID0gbmV3X2ZvbGRlcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgY2IuY29udGFpbmVyRWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfc2VhcmNoXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAuc2V0TmFtZSgnVXNlciBzY3JpcHQgaW50ZWxsaXNlbnNlJylcclxuICAgICAgICAuc2V0RGVzYygnRGV0ZXJtaW5lIGhvdyB5b3VcXCdkIGxpa2UgdG8gaGF2ZSB1c2VyIHNjcmlwdCBpbnRlbGxpc2Vuc2UgcmVuZGVyLiBOb3RlIHZhbHVlcyB3aWxsIG5vdCByZW5kZXIgaWYgbm90IGluIHRoZSBzY3JpcHQuJylcclxuICAgICAgICAuYWRkRHJvcGRvd24oY2IgPT4ge1xyXG4gICAgICAgICAgICBjYlxyXG4gICAgICAgICAgICAgICAgLmFkZE9wdGlvbihcIjBcIiwgXCJUdXJuIG9mZiBpbnRlbGxpc2Vuc2VcIilcclxuICAgICAgICAgICAgICAgIC5hZGRPcHRpb24oXCIxXCIsIFwiUmVuZGVyIG1ldGhvZCBkZXNjcmlwdGlvbiwgcGFyYW1ldGVycyBsaXN0LCBhbmQgcmV0dXJuXCIpXHJcbiAgICAgICAgICAgICAgICAuYWRkT3B0aW9uKFwiMlwiLCBcIlJlbmRlciBtZXRob2QgZGVzY3JpcHRpb24gYW5kIHBhcmFtZXRlcnMgbGlzdFwiKVxyXG4gICAgICAgICAgICAgICAgLmFkZE9wdGlvbihcIjNcIiwgXCJSZW5kZXIgbWV0aG9kIGRlc2NyaXB0aW9uIGFuZCByZXR1cm5cIilcclxuICAgICAgICAgICAgICAgIC5hZGRPcHRpb24oXCI0XCIsIFwiUmVuZGVyIG1ldGhvZCBkZXNjcmlwdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmludGVsbGlzZW5zZV9yZW5kZXIudG9TdHJpbmcoKSlcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnRlbGxpc2Vuc2VfcmVuZGVyID0gcGFyc2VJbnQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBsZXQgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlcl9zY3JpcHRzX2ZvbGRlcikge1xyXG4gICAgICAgICAgICBuYW1lID0gXCJObyB1c2VyIHNjcmlwdHMgZm9sZGVyIHNldFwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gZXJyb3JXcmFwcGVyU3luYyhcclxuICAgICAgICAgICAgICAgICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0X3RmaWxlc19mcm9tX2ZvbGRlcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZXJfc2NyaXB0c19mb2xkZXJcclxuICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgYFVzZXIgc2NyaXB0cyBmb2xkZXIgZG9lc24ndCBleGlzdGBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlcyB8fCBmaWxlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIG5hbWUgPSBcIk5vIHVzZXIgc2NyaXB0cyBkZXRlY3RlZFwiO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvdW50ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLmV4dGVuc2lvbiA9PT0gXCJqc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImxpXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBgdHAudXNlci4ke2ZpbGUuYmFzZW5hbWV9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbmFtZSA9IGBEZXRlY3RlZCAke2NvdW50fSBVc2VyIFNjcmlwdChzKWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKG5hbWUpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKGRlc2MpXHJcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoZXh0cmEpID0+IHtcclxuICAgICAgICAgICAgICAgIGV4dHJhXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJzeW5jXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJSZWZyZXNoXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSByZWZyZXNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfdXNlcl9zeXN0ZW1fY29tbWFuZF9mdW5jdGlvbnNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBsZXQgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjLmFwcGVuZChcclxuICAgICAgICAgICAgXCJBbGxvd3MgeW91IHRvIGNyZWF0ZSB1c2VyIGZ1bmN0aW9ucyBsaW5rZWQgdG8gc3lzdGVtIGNvbW1hbmRzLlwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiXCIsIHtcclxuICAgICAgICAgICAgICAgIHRleHQ6IFwiV2FybmluZzogXCIsXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBcIkl0IGNhbiBiZSBkYW5nZXJvdXMgdG8gZXhlY3V0ZSBhcmJpdHJhcnkgc3lzdGVtIGNvbW1hbmRzIGZyb20gdW50cnVzdGVkIHNvdXJjZXMuIE9ubHkgcnVuIHN5c3RlbSBjb21tYW5kcyB0aGF0IHlvdSB1bmRlcnN0YW5kLCBmcm9tIHRydXN0ZWQgc291cmNlcy5cIlxyXG4gICAgICAgICk7XHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJVc2VyIHN5c3RlbSBjb21tYW5kIGZ1bmN0aW9uc1wiKVxyXG4gICAgICAgICAgICAuc2V0SGVhZGluZygpO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIkVuYWJsZSB1c2VyIHN5c3RlbSBjb21tYW5kIGZ1bmN0aW9uc1wiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhkZXNjKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHRvZ2dsZVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfc3lzdGVtX2NvbW1hbmRzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgoZW5hYmxlX3N5c3RlbV9jb21tYW5kcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfc3lzdGVtX2NvbW1hbmRzID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZV9zeXN0ZW1fY29tbWFuZHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfc3lzdGVtX2NvbW1hbmRzKSB7XHJcbiAgICAgICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgICAgICAuc2V0TmFtZShcIlRpbWVvdXRcIilcclxuICAgICAgICAgICAgICAgIC5zZXREZXNjKFwiTWF4aW11bSB0aW1lb3V0IGluIHNlY29uZHMgZm9yIGEgc3lzdGVtIGNvbW1hbmQuXCIpXHJcbiAgICAgICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJUaW1lb3V0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbW1hbmRfdGltZW91dC50b1N0cmluZygpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKChuZXdfdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld190aW1lb3V0ID0gTnVtYmVyKG5ld192YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4obmV3X3RpbWVvdXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nX2Vycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlRpbWVvdXQgbXVzdCBiZSBhIG51bWJlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbW1hbmRfdGltZW91dCA9IG5ld190aW1lb3V0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICAgICAgZGVzYy5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICBcIkZ1bGwgcGF0aCB0byB0aGUgc2hlbGwgYmluYXJ5IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQgd2l0aC5cIixcclxuICAgICAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgICAgIFwiVGhpcyBzZXR0aW5nIGlzIG9wdGlvbmFsIGFuZCB3aWxsIGRlZmF1bHQgdG8gdGhlIHN5c3RlbSdzIGRlZmF1bHQgc2hlbGwgaWYgbm90IHNwZWNpZmllZC5cIixcclxuICAgICAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgICAgIFwiWW91IGNhbiB1c2UgZm9yd2FyZCBzbGFzaGVzICgnLycpIGFzIHBhdGggc2VwYXJhdG9ycyBvbiBhbGwgcGxhdGZvcm1zIGlmIGluIGRvdWJ0LlwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgICAgICAuc2V0TmFtZShcIlNoZWxsIGJpbmFyeSBsb2NhdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgLnNldERlc2MoZGVzYylcclxuICAgICAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkV4YW1wbGU6IC9iaW4vYmFzaCwgLi4uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaGVsbF9wYXRoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKHNoZWxsX3BhdGgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNoZWxsX3BhdGggPSBzaGVsbF9wYXRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgbGV0IGkgPSAxO1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuZm9yRWFjaCgodGVtcGxhdGVfcGFpcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGl2ID0gdGhpcy5jb250YWluZXJFbC5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIGRpdi5hZGRDbGFzcyhcInRlbXBsYXRlcl9kaXZcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgdGl0bGUgPSB0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiVXNlciBmdW5jdGlvbiBuwrBcIiArIGksXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRpdGxlLmFkZENsYXNzKFwidGVtcGxhdGVyX3RpdGxlXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoZXh0cmEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwiY3Jvc3NcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiRGVsZXRlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuaW5kZXhPZihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlX3BhaXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuc3BsaWNlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSB0ZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJGdW5jdGlvbiBuYW1lXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGVtcGxhdGVfcGFpclswXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X3ZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuaW5kZXhPZihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlX3BhaXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnNbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdWzBdID0gbmV3X3ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHQuaW5wdXRFbC5hZGRDbGFzcyhcInRlbXBsYXRlcl90ZW1wbGF0ZVwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSB0ZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJTeXN0ZW0gY29tbWFuZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRlbXBsYXRlX3BhaXJbMV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKG5ld19jbWQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19wYWlycy5pbmRleE9mKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVfcGFpclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19wYWlyc1tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1bMV0gPSBuZXdfY21kO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0LmlucHV0RWwuc2V0QXR0cihcInJvd3NcIiwgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHQuaW5wdXRFbC5hZGRDbGFzcyhcInRlbXBsYXRlcl9jbWRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZXR0aW5nLmluZm9FbC5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQodGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyRWwubGFzdENoaWxkIGFzIE5vZGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGkgKz0gMTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBkaXYgPSB0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiZGl2XCIpO1xyXG4gICAgICAgICAgICBkaXYuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfZGl2MlwiKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5hZGRCdXR0b24oXHJcbiAgICAgICAgICAgICAgICAoYnV0dG9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiQWRkIG5ldyB1c2VyIGZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRDdGEoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMucHVzaChbXCJcIiwgXCJcIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBzZXR0aW5nLmluZm9FbC5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZCh0aGlzLmNvbnRhaW5lckVsLmxhc3RDaGlsZCBhcyBOb2RlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkX2RvbmF0aW5nX3NldHRpbmcoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgcyA9IG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiRG9uYXRlXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFxyXG4gICAgICAgICAgICAgICAgXCJJZiB5b3UgbGlrZSB0aGlzIFBsdWdpbiwgY29uc2lkZXIgZG9uYXRpbmcgdG8gc3VwcG9ydCBjb250aW51ZWQgZGV2ZWxvcG1lbnQuXCJcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3QgYTEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICBhMS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwiaHR0cHM6Ly9naXRodWIuY29tL3Nwb25zb3JzL3NpbGVudHZvaWQxM1wiKTtcclxuICAgICAgICBhMS5hZGRDbGFzcyhcInRlbXBsYXRlcl9kb25hdGluZ1wiKTtcclxuICAgICAgICBjb25zdCBpbWcxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuICAgICAgICBpbWcxLnNyYyA9XHJcbiAgICAgICAgICAgIFwiaHR0cHM6Ly9pbWcuc2hpZWxkcy5pby9zdGF0aWMvdjE/bGFiZWw9U3BvbnNvciZtZXNzYWdlPSVFMiU5RCVBNCZsb2dvPUdpdEh1YiZjb2xvcj0lMjNmZThlODZcIjtcclxuICAgICAgICBhMS5hcHBlbmRDaGlsZChpbWcxKTtcclxuXHJcbiAgICAgICAgY29uc3QgYTIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICBhMi5zZXRBdHRyaWJ1dGUoXHJcbiAgICAgICAgICAgIFwiaHJlZlwiLFxyXG4gICAgICAgICAgICBcImh0dHBzOi8vd3d3LnBheXBhbC5jb20vZG9uYXRlP2hvc3RlZF9idXR0b25faWQ9VTJTUkdBRllYVDMyUVwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhMi5hZGRDbGFzcyhcInRlbXBsYXRlcl9kb25hdGluZ1wiKTtcclxuICAgICAgICBjb25zdCBpbWcyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuICAgICAgICBpbWcyLnNyYyA9XHJcbiAgICAgICAgICAgIFwiaHR0cHM6Ly9pbWcuc2hpZWxkcy5pby9iYWRnZS9wYXlwYWwtc2lsZW50dm9pZDEzLXllbGxvdz9zdHlsZT1zb2NpYWwmbG9nbz1wYXlwYWxcIjtcclxuICAgICAgICBhMi5hcHBlbmRDaGlsZChpbWcyKTtcclxuXHJcbiAgICAgICAgcy5zZXR0aW5nRWwuYXBwZW5kQ2hpbGQoYTEpO1xyXG4gICAgICAgIHMuc2V0dGluZ0VsLmFwcGVuZENoaWxkKGEyKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlciB9IGZyb20gXCJjb3JlL1RlbXBsYXRlclwiO1xyXG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCJzZXR0aW5ncy9TZXR0aW5nc1wiO1xyXG5pbXBvcnQge1xyXG4gICAgRXZlbnRSZWYsXHJcbiAgICBNZW51LFxyXG4gICAgTWVudUl0ZW0sXHJcbiAgICBUQWJzdHJhY3RGaWxlLFxyXG4gICAgVEZpbGUsXHJcbiAgICBURm9sZGVyLFxyXG59IGZyb20gXCJvYnNpZGlhblwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXZlbnRIYW5kbGVyIHtcclxuICAgIHByaXZhdGUgdHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uX2V2ZW50OiBFdmVudFJlZiB8IHVuZGVmaW5lZDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luLFxyXG4gICAgICAgIHByaXZhdGUgdGVtcGxhdGVyOiBUZW1wbGF0ZXIsXHJcbiAgICAgICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3NcclxuICAgICkge31cclxuXHJcbiAgICBzZXR1cCgpOiB2b2lkIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHlDYWxsYmFja3MpKSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBvbkxheW91dFJlYWR5Q2FsbGJhY2tzIGluc3RlYWQgb2Ygb25MYXlvdXRSZWFkeVxyXG4gICAgICAgICAgICAvLyB0byBlbnN1cmUgdGhhdCB0aGUgZXZlbnQgaXMgcmVnaXN0ZXJlZCBiZWZvcmUgY29yZSBwbHVnaW4gZXZlbnRzIChlLmcuIGRhaWx5IG5vdGVzIGF1dG9ydW4pXHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub25MYXlvdXRSZWFkeUNhbGxiYWNrcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHBsdWdpbklkOiB0aGlzLnBsdWdpbi5tYW5pZmVzdC5pZCxcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVfdHJpZ2dlcl9maWxlX29uX2NyZWF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBGYWxsYmFjayB0byBvbkxheW91dFJlYWR5IGlmIG9uTGF5b3V0UmVhZHlDYWxsYmFja3MgaXMgbm90IGF2YWlsYWJsZVxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVfdHJpZ2dlcl9maWxlX29uX2NyZWF0aW9uKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZV9zeW50YXhfaGlnaGxpZ2h0aW5nKCk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVfZmlsZV9tZW51KCk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlX3N5bnRheF9oaWdobGlnaHRpbmcoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgZGVza3RvcFNob3VsZEhpZ2hsaWdodCA9XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmVkaXRvcl9oYW5kbGVyLmRlc2t0b3BTaG91bGRIaWdobGlnaHQoKTtcclxuICAgICAgICBjb25zdCBtb2JpbGVTaG91bGRIaWdobGlnaHQgPVxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5lZGl0b3JfaGFuZGxlci5tb2JpbGVTaG91bGRIaWdobGlnaHQoKTtcclxuXHJcbiAgICAgICAgaWYgKGRlc2t0b3BTaG91bGRIaWdobGlnaHQgfHwgbW9iaWxlU2hvdWxkSGlnaGxpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmVkaXRvcl9oYW5kbGVyLmVuYWJsZV9oaWdobGlnaHRlcigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmVkaXRvcl9oYW5kbGVyLmRpc2FibGVfaGlnaGxpZ2h0ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlX3RyaWdnZXJfZmlsZV9vbl9jcmVhdGlvbigpOiB2b2lkIHtcclxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy50cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb25fZXZlbnQgPSB0aGlzLnBsdWdpbi5hcHAudmF1bHQub24oXHJcbiAgICAgICAgICAgICAgICBcImNyZWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgKGZpbGU6IFRBYnN0cmFjdEZpbGUpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgVGVtcGxhdGVyLm9uX2ZpbGVfY3JlYXRpb24oXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGVtcGxhdGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRXZlbnQodGhpcy50cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb25fZXZlbnQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbl9ldmVudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0Lm9mZnJlZihcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbl9ldmVudFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uX2V2ZW50ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZV9maWxlX21lbnUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJFdmVudChcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5vbihcclxuICAgICAgICAgICAgICAgIFwiZmlsZS1tZW51XCIsXHJcbiAgICAgICAgICAgICAgICAobWVudTogTWVudSwgZmlsZTogVEZpbGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zZXRUaXRsZShcIkNyZWF0ZSBuZXcgbm90ZSBmcm9tIHRlbXBsYXRlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJ0ZW1wbGF0ZXItaWNvblwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZnV6enlfc3VnZ2VzdGVyLmNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEZ1enp5U3VnZ2VzdE1vZGFsLCBURmlsZSwgVEZvbGRlciwgbm9ybWFsaXplUGF0aCB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBnZXRfdGZpbGVzX2Zyb21fZm9sZGVyIH0gZnJvbSBcInV0aWxzL1V0aWxzXCI7XHJcbmltcG9ydCBUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIm1haW5cIjtcclxuaW1wb3J0IHsgZXJyb3JXcmFwcGVyU3luYyB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5pbXBvcnQgeyBsb2dfZXJyb3IgfSBmcm9tIFwidXRpbHMvTG9nXCI7XHJcblxyXG5leHBvcnQgZW51bSBPcGVuTW9kZSB7XHJcbiAgICBJbnNlcnRUZW1wbGF0ZSxcclxuICAgIENyZWF0ZU5vdGVUZW1wbGF0ZSxcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZ1enp5U3VnZ2VzdGVyIGV4dGVuZHMgRnV6enlTdWdnZXN0TW9kYWw8VEZpbGU+IHtcclxuICAgIHByaXZhdGUgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW47XHJcbiAgICBwcml2YXRlIG9wZW5fbW9kZTogT3Blbk1vZGU7XHJcbiAgICBwcml2YXRlIGNyZWF0aW9uX2ZvbGRlcjogVEZvbGRlciB8IHVuZGVmaW5lZDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge1xyXG4gICAgICAgIHN1cGVyKHBsdWdpbi5hcHApO1xyXG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xyXG4gICAgICAgIHRoaXMuc2V0UGxhY2Vob2xkZXIoXCJUeXBlIG5hbWUgb2YgYSB0ZW1wbGF0ZS4uLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRJdGVtcygpOiBURmlsZVtdIHtcclxuICAgICAgICBpZiAoIXRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19mb2xkZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXBwLnZhdWx0LmdldE1hcmtkb3duRmlsZXMoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZmlsZXMgPSBlcnJvcldyYXBwZXJTeW5jKFxyXG4gICAgICAgICAgICAoKSA9PlxyXG4gICAgICAgICAgICAgICAgZ2V0X3RmaWxlc19mcm9tX2ZvbGRlcihcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVzX2ZvbGRlclxyXG4gICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgYENvdWxkbid0IHJldHJpZXZlIHRlbXBsYXRlIGZpbGVzIGZyb20gdGVtcGxhdGVzIGZvbGRlciAke3RoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19mb2xkZXJ9YFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgaWYgKCFmaWxlcykge1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmaWxlcztcclxuICAgIH1cclxuXHJcbiAgICBnZXRJdGVtVGV4dChpdGVtOiBURmlsZSk6IHN0cmluZyB7XHJcbiAgICAgICAgbGV0IHJlbGF0aXZlUGF0aCA9IGl0ZW0ucGF0aDtcclxuICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgIGl0ZW0ucGF0aC5zdGFydHNXaXRoKHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19mb2xkZXIpICYmXHJcbiAgICAgICAgICAgIG5vcm1hbGl6ZVBhdGgodGhpcy5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVzX2ZvbGRlcikgIT0gXCIvXCJcclxuICAgICAgICApIHtcclxuICAgICAgICAgICAgLy8gTW9kaWZ5IHNwbGljZSBwb3NpdGlvbiBpZiBmb2xkZXIgaGFzIGEgdHJhaWxpbmcgc2xhc2hcclxuICAgICAgICAgICAgY29uc3QgZm9sZGVyTGVuZ3RoID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVzX2ZvbGRlci5sZW5ndGhcclxuICAgICAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfZm9sZGVyLmVuZHNXaXRoKCcvJykgPyBmb2xkZXJMZW5ndGggOiBmb2xkZXJMZW5ndGggKyAxXHJcbiAgICAgICAgICAgIHJlbGF0aXZlUGF0aCA9IGl0ZW0ucGF0aC5zbGljZShcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZWxhdGl2ZVBhdGguc3BsaXQoXCIuXCIpLnNsaWNlKDAsIC0xKS5qb2luKFwiLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICBvbkNob29zZUl0ZW0oaXRlbTogVEZpbGUpOiB2b2lkIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMub3Blbl9tb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgT3Blbk1vZGUuSW5zZXJ0VGVtcGxhdGU6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi50ZW1wbGF0ZXIuYXBwZW5kX3RlbXBsYXRlX3RvX2FjdGl2ZV9maWxlKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgT3Blbk1vZGUuQ3JlYXRlTm90ZVRlbXBsYXRlOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udGVtcGxhdGVyLmNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKFxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGlvbl9mb2xkZXJcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnQoKTogdm9pZCB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBsb2dfZXJyb3IoZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluc2VydF90ZW1wbGF0ZSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLm9wZW5fbW9kZSA9IE9wZW5Nb2RlLkluc2VydFRlbXBsYXRlO1xyXG4gICAgICAgIHRoaXMuc3RhcnQoKTtcclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVfbmV3X25vdGVfZnJvbV90ZW1wbGF0ZShmb2xkZXI/OiBURm9sZGVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jcmVhdGlvbl9mb2xkZXIgPSBmb2xkZXI7XHJcbiAgICAgICAgdGhpcy5vcGVuX21vZGUgPSBPcGVuTW9kZS5DcmVhdGVOb3RlVGVtcGxhdGU7XHJcbiAgICAgICAgdGhpcy5zdGFydCgpO1xyXG4gICAgfVxyXG59XHJcbiIsIi8vIEB0cy1ub2NoZWNrXHJcblxyXG5pbXBvcnQgeyBhZGRJY29uLCBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmltcG9ydCB7IFRlbXBsYXRlciB9IGZyb20gXCJjb3JlL1RlbXBsYXRlclwiO1xyXG5pbXBvcnQgeyBFZGl0b3IgfSBmcm9tIFwiZWRpdG9yL0VkaXRvclwiO1xyXG5pbXBvcnQgeyBDb21tYW5kSGFuZGxlciB9IGZyb20gXCJoYW5kbGVycy9Db21tYW5kSGFuZGxlclwiO1xyXG5pbXBvcnQgRXZlbnRIYW5kbGVyIGZyb20gXCJoYW5kbGVycy9FdmVudEhhbmRsZXJcIjtcclxuaW1wb3J0IHsgRnV6enlTdWdnZXN0ZXIgfSBmcm9tIFwiaGFuZGxlcnMvRnV6enlTdWdnZXN0ZXJcIjtcclxuaW1wb3J0IHtcclxuICAgIERFRkFVTFRfU0VUVElOR1MsXHJcbiAgICBTZXR0aW5ncyxcclxuICAgIFRlbXBsYXRlclNldHRpbmdUYWIsXHJcbn0gZnJvbSBcInNldHRpbmdzL1NldHRpbmdzXCI7XHJcbmltcG9ydCB7IElDT05fREFUQSB9IGZyb20gXCJ1dGlscy9Db25zdGFudHNcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRlbXBsYXRlclBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XHJcbiAgICBwdWJsaWMgc2V0dGluZ3M6IFNldHRpbmdzO1xyXG4gICAgcHVibGljIHRlbXBsYXRlcjogVGVtcGxhdGVyO1xyXG4gICAgcHVibGljIGV2ZW50X2hhbmRsZXI6IEV2ZW50SGFuZGxlcjtcclxuICAgIHB1YmxpYyBjb21tYW5kX2hhbmRsZXI6IENvbW1hbmRIYW5kbGVyO1xyXG4gICAgcHVibGljIGZ1enp5X3N1Z2dlc3RlcjogRnV6enlTdWdnZXN0ZXI7XHJcbiAgICBwdWJsaWMgZWRpdG9yX2hhbmRsZXI6IEVkaXRvcjtcclxuXHJcbiAgICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkX3NldHRpbmdzKCk7XHJcblxyXG4gICAgICAgIHRoaXMudGVtcGxhdGVyID0gbmV3IFRlbXBsYXRlcih0aGlzKTtcclxuICAgICAgICBhd2FpdCB0aGlzLnRlbXBsYXRlci5zZXR1cCgpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvcl9oYW5kbGVyID0gbmV3IEVkaXRvcih0aGlzKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmVkaXRvcl9oYW5kbGVyLnNldHVwKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZnV6enlfc3VnZ2VzdGVyID0gbmV3IEZ1enp5U3VnZ2VzdGVyKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLmV2ZW50X2hhbmRsZXIgPSBuZXcgRXZlbnRIYW5kbGVyKFxyXG4gICAgICAgICAgICB0aGlzLFxyXG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlcixcclxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncyxcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuZXZlbnRfaGFuZGxlci5zZXR1cCgpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbW1hbmRfaGFuZGxlciA9IG5ldyBDb21tYW5kSGFuZGxlcih0aGlzKTtcclxuICAgICAgICB0aGlzLmNvbW1hbmRfaGFuZGxlci5zZXR1cCgpO1xyXG5cclxuICAgICAgICBhZGRJY29uKFwidGVtcGxhdGVyLWljb25cIiwgSUNPTl9EQVRBKTtcclxuICAgICAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJ0ZW1wbGF0ZXItaWNvblwiLCBcIlRlbXBsYXRlclwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZnV6enlfc3VnZ2VzdGVyLmluc2VydF90ZW1wbGF0ZSgpO1xyXG4gICAgICAgIH0pLnNldEF0dHJpYnV0ZShcImlkXCIsIFwicmItdGVtcGxhdGVyLWljb25cIik7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgVGVtcGxhdGVyU2V0dGluZ1RhYih0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIEZpbGVzIG1pZ2h0IG5vdCBiZSBjcmVhdGVkIHlldFxyXG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZXIuZXhlY3V0ZV9zdGFydHVwX3NjcmlwdHMoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvbnVubG9hZCgpOiB2b2lkIHtcclxuICAgICAgICAvLyBGYWlsc2FmZSBpbiBjYXNlIHRlYXJkb3duIGRvZXNuJ3QgaGFwcGVuIGltbWVkaWF0ZWx5IGFmdGVyIHRlbXBsYXRlIGV4ZWN1dGlvblxyXG4gICAgICAgIHRoaXMudGVtcGxhdGVyLmZ1bmN0aW9uc19nZW5lcmF0b3IudGVhcmRvd24oKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzYXZlX3NldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XHJcbiAgICAgICAgdGhpcy5lZGl0b3JfaGFuZGxlci51cGRhdGVFZGl0b3JJbnRlbGxpc2Vuc2VTZXR0aW5nKFxyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLmludGVsbGlzZW5zZV9yZW5kZXIsXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkX3NldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKFxyXG4gICAgICAgICAgICB7fSxcclxuICAgICAgICAgICAgREVGQVVMVF9TRVRUSU5HUyxcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkRGF0YSgpLFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuIiwiZGVjbGFyZSBtb2R1bGUgXCJvYnNpZGlhblwiIHtcclxuICAgIGludGVyZmFjZSBBcHAge1xyXG4gICAgICAgIGRvbToge1xyXG4gICAgICAgICAgICBhcHBDb250YWluZXJFbDogSFRNTEVsZW1lbnQ7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgVmF1bHQge1xyXG4gICAgICAgIGdldENvbmZpZzogKGtleTogc3RyaW5nKSA9PiBzdHJpbmc7XHJcbiAgICAgICAgZXhpc3RzOiAocGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPGJvb2xlYW4+O1xyXG4gICAgICAgIGdldEF2YWlsYWJsZVBhdGg6IChwYXRoOiBzdHJpbmcsIGV4dGVuc2lvbjogc3RyaW5nKSA9PiBzdHJpbmc7XHJcbiAgICAgICAgZ2V0QWJzdHJhY3RGaWxlQnlQYXRoSW5zZW5zaXRpdmU6IChwYXRoOiBzdHJpbmcpID0+IHN0cmluZztcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgRGF0YUFkYXB0ZXIge1xyXG4gICAgICAgIGJhc2VQYXRoOiBzdHJpbmc7XHJcbiAgICAgICAgZnM6IHtcclxuICAgICAgICAgICAgdXJpOiBzdHJpbmc7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgV29ya3NwYWNlIHtcclxuICAgICAgICBvbihcclxuICAgICAgICAgICAgbmFtZTogXCJ0ZW1wbGF0ZXI6YWxsLXRlbXBsYXRlcy1leGVjdXRlZFwiLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4gdW5rbm93blxyXG4gICAgICAgICk6IEV2ZW50UmVmO1xyXG4gICAgICAgIG9uTGF5b3V0UmVhZHlDYWxsYmFja3M/OiB7XHJcbiAgICAgICAgICAgIHBsdWdpbklkOiBzdHJpbmc7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB2b2lkO1xyXG4gICAgICAgIH1bXTtcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgRXZlbnRSZWYge1xyXG4gICAgICAgIGU6IEV2ZW50cztcclxuICAgIH1cclxuXHJcbiAgICBpbnRlcmZhY2UgTWFya2Rvd25TdWJWaWV3IHtcclxuICAgICAgICBhcHBseUZvbGRJbmZvKGZvbGRJbmZvOiBGb2xkSW5mbyk6IHZvaWQ7XHJcbiAgICAgICAgZ2V0Rm9sZEluZm8oKTogRm9sZEluZm8gfCBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGludGVyZmFjZSBGb2xkSW5mbyB7XHJcbiAgICAgICAgZm9sZHM6IEZvbGRSYW5nZVtdO1xyXG4gICAgICAgIGxpbmVzOiBudW1iZXI7XHJcbiAgICB9XHJcblxyXG4gICAgaW50ZXJmYWNlIEZvbGRSYW5nZSB7XHJcbiAgICAgICAgZnJvbTogbnVtYmVyO1xyXG4gICAgICAgIHRvOiBudW1iZXI7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB7fTtcclxuIiwiaW1wb3J0IFRlc3RUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIi4uL21haW4udGVzdFwiO1xyXG5pbXBvcnQgeyBUQVJHRVRfRklMRV9OQU1FIH0gZnJvbSBcIi4uL3V0aWxzLnRlc3RcIjtcclxuaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcImNoYWlcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBJbnRlcm5hbE1vZHVsZUZpbGVUZXN0cyh0OiBUZXN0VGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICB0LnRlc3QoXCJ0cC5maWxlLmNvbnRlbnRcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHRhcmdldF9maWxlX2NvbnRlbnQgPVxyXG4gICAgICAgICAgICBcIlRoaXMgaXMgc29tZSBjb250ZW50XFxyXFxuV2l0aCBcXHRzb21lIG5ld2xpbmVzXFxuXFxuXCI7XHJcbiAgICAgICAgYXdhaXQgZXhwZWN0KFxyXG4gICAgICAgICAgICB0LnJ1bl9hbmRfZ2V0X291dHB1dChgPCUgdHAuZmlsZS5jb250ZW50ICU+YCwgdGFyZ2V0X2ZpbGVfY29udGVudClcclxuICAgICAgICApLnRvLmV2ZW50dWFsbHkuZXF1YWwodGFyZ2V0X2ZpbGVfY29udGVudCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0LnRlc3QoXCJ0cC5maWxlLmNyZWF0ZV9uZXdcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIC8vIFRPRE9cclxuICAgIH0pO1xyXG5cclxuICAgIHQudGVzdChcInRwLmZpbGUuY3JlYXRpb25fZGF0ZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc2F2ZWRfY3RpbWUgPSB0LnRhcmdldF9maWxlLnN0YXQuY3RpbWU7XHJcbiAgICAgICAgLy8gMjAyMS0wNS0wMSAwMDowMDowMFxyXG4gICAgICAgIHQudGFyZ2V0X2ZpbGUuc3RhdC5jdGltZSA9IDE2MTk4MjAwMDAwMDA7XHJcblxyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgQ3JlYXRpb24gZGF0ZTogPCUgdHAuZmlsZS5jcmVhdGlvbl9kYXRlKCkgJT5cXG5cXG5gLFxyXG4gICAgICAgICAgICAgICAgXCJcIixcclxuICAgICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKFwiQ3JlYXRpb24gZGF0ZTogMjAyMS0wNS0wMSAwMDowMFxcblxcblwiKTtcclxuICAgICAgICBhd2FpdCBleHBlY3QoXHJcbiAgICAgICAgICAgIHQucnVuX2FuZF9nZXRfb3V0cHV0KFxyXG4gICAgICAgICAgICAgICAgYENyZWF0aW9uIGRhdGU6IDwlIHRwLmZpbGUuY3JlYXRpb25fZGF0ZShcImRkZGQgRG8gTU1NTSBZWVlZLCBkZGRcIikgJT5cXG5cXG5gLFxyXG4gICAgICAgICAgICAgICAgXCJcIixcclxuICAgICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKFwiQ3JlYXRpb24gZGF0ZTogU2F0dXJkYXkgMXN0IE1heSAyMDIxLCBTYXRcXG5cXG5cIik7XHJcblxyXG4gICAgICAgIHQudGFyZ2V0X2ZpbGUuc3RhdC5jdGltZSA9IHNhdmVkX2N0aW1lO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdC50ZXN0KFwidHAuZmlsZS5jdXJzb3JcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgQ3Vyc29yOiA8JVxcdFxcbnRwLmZpbGUuY3Vyc29yKDEwKVxcdFxcclxcbiU+XFxuXFxuYCxcclxuICAgICAgICAgICAgICAgIFwiXCJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkudG8uZXZlbnR1YWxseS5lcXVhbChgQ3Vyc29yOiA8JSB0cC5maWxlLmN1cnNvcigxMCkgJT5cXG5cXG5gKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHQudGVzdChcInRwLmZpbGUuY3Vyc29yX2FwcGVuZFwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgIC8vYXdhaXQgZXhwZWN0KHQucnVuX2FuZF9nZXRfb3V0cHV0KGBDdXJzb3IgYXBwZW5kOiA8JSB0cC5maWxlLmN1cnNvcl9hcHBlbmQoXCJUZXN0VGVzdFwiKSAlPlxcblxcbmApKS50by5ldmVudHVhbGx5LmVxdWFsKGBUZXN0VGVzdCBDdXJzb3IgYXBwZW5kOiBcXG5cXG5gKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHQudGVzdChcInRwLmZpbGUuZXhpc3RzXCIsIGFzeW5jICgpID0+IHtcclxuICAgICAgICBhd2FpdCBleHBlY3QoXHJcbiAgICAgICAgICAgIHQucnVuX2FuZF9nZXRfb3V0cHV0KFxyXG4gICAgICAgICAgICAgICAgYEZpbGUgRXhpc3RzOiA8JSB0cC5maWxlLmV4aXN0cyhcIiR7dC50YXJnZXRfZmlsZS5iYXNlbmFtZX0ubWRcIikgJT5cXG5cXG5gXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApLnRvLmV2ZW50dWFsbHkuZXF1YWwoYEZpbGUgRXhpc3RzOiB0cnVlXFxuXFxuYCk7XHJcblxyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgRmlsZSBFeGlzdHM6IDwlIHRwLmZpbGUuZXhpc3RzKFwiTm9uRXhpc3RpbmdGaWxlLm1kXCIpICU+XFxuXFxuYFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKGBGaWxlIEV4aXN0czogZmFsc2VcXG5cXG5gKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHQudGVzdChcInRwLmZpbGUuZmluZF90ZmlsZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgYXdhaXQgZXhwZWN0KFxyXG4gICAgICAgICAgICB0LnJ1bl9hbmRfZ2V0X291dHB1dChcclxuICAgICAgICAgICAgICAgIGBGaWxlOiA8JSB0cC5maWxlLmZpbmRfdGZpbGUoXCIke3QudGFyZ2V0X2ZpbGUuYmFzZW5hbWV9XCIpLnBhdGggJT5cXG5cXG5gXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApLnRvLmV2ZW50dWFsbHkuZXF1YWwoYEZpbGU6ICR7dC50YXJnZXRfZmlsZS5wYXRofVxcblxcbmApO1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgRmlsZTogPCUgdHAuZmlsZS5maW5kX3RmaWxlKFwiTm9uRXhpc3RpbmdGaWxlXCIpICU+XFxuXFxuYFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKGBGaWxlOiBudWxsXFxuXFxuYCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0LnRlc3QoXCJ0cC5maWxlLmZvbGRlclwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgYXdhaXQgZXhwZWN0KFxyXG4gICAgICAgICAgICB0LnJ1bl9hbmRfZ2V0X291dHB1dChgRm9sZGVyOiA8JSB0cC5maWxlLmZvbGRlcigpICU+XFxuXFxuYClcclxuICAgICAgICApLnRvLmV2ZW50dWFsbHkuZXF1YWwoYEZvbGRlcjogXFxuXFxuYCk7XHJcbiAgICAgICAgYXdhaXQgZXhwZWN0KFxyXG4gICAgICAgICAgICB0LnJ1bl9hbmRfZ2V0X291dHB1dChgRm9sZGVyOiA8JSB0cC5maWxlLmZvbGRlcih0cnVlKSAlPlxcblxcbmApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKGBGb2xkZXI6IC9cXG5cXG5gKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHQudGVzdChcInRwLmZpbGUuaW5jbHVkZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgYXdhaXQgdC5jcmVhdGVGaWxlKFxyXG4gICAgICAgICAgICBgSW5jMS5tZGAsXHJcbiAgICAgICAgICAgIGBJbmMxIGNvbnRlbnRcXG48JSB0cC5maWxlLmluY2x1ZGUoJ1tbSW5jMl1dJykgJT5cXG5cXG5gXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhd2FpdCB0LmNyZWF0ZUZpbGUoYEluYzIubWRgLCBgSW5jMiBjb250ZW50XFxuXFxuYCk7XHJcbiAgICAgICAgYXdhaXQgdC5jcmVhdGVGaWxlKFxyXG4gICAgICAgICAgICBgSW5jMy5tZGAsXHJcbiAgICAgICAgICAgIGBJbmMzIGNvbnRlbnRcXG48JSB0cC5maWxlLmluY2x1ZGUoJ1tbSW5jM11dJykgJT5cXG5cXG5gXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgYXdhaXQgZXhwZWN0KFxyXG4gICAgICAgICAgICB0LnJ1bl9hbmRfZ2V0X291dHB1dChcclxuICAgICAgICAgICAgICAgIGBJbmNsdWRlZDogPCUgdHAuZmlsZS5pbmNsdWRlKCdbW0luYzFdXScpICU+XFxuXFxuYFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKFxyXG4gICAgICAgICAgICBgSW5jbHVkZWQ6IEluYzEgY29udGVudFxcbkluYzIgY29udGVudFxcblxcblxcblxcblxcblxcbmBcclxuICAgICAgICApO1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgSW5jbHVkZWQ6IDwlIHRwLmZpbGUuaW5jbHVkZSgnW1tJbmMyXV0nKSAlPlxcblxcbmBcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkudG8uZXZlbnR1YWxseS5lcXVhbChgSW5jbHVkZWQ6IEluYzIgY29udGVudFxcblxcblxcblxcbmApO1xyXG5cclxuICAgICAgICBhd2FpdCBleHBlY3QoXHJcbiAgICAgICAgICAgIHQucnVuX2FuZF9nZXRfb3V0cHV0KFxyXG4gICAgICAgICAgICAgICAgYEluY2x1ZGVkOiA8JSB0cC5maWxlLmluY2x1ZGUoJ1tbSW5jM11dJykgJT5cXG5cXG5gXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApLnRvLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKFxyXG4gICAgICAgICAgICBFcnJvcixcclxuICAgICAgICAgICAgXCJSZWFjaGVkIGluY2x1c2lvbiBkZXB0aCBsaW1pdCAobWF4ID0gMTApXCJcclxuICAgICAgICApO1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoYEluY2x1ZGVkOiA8JSB0cC5maWxlLmluY2x1ZGUoJ0luYzMnKSAlPlxcblxcbmApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmJlLnJlamVjdGVkV2l0aChcclxuICAgICAgICAgICAgRXJyb3IsXHJcbiAgICAgICAgICAgIFwiSW52YWxpZCBmaWxlIGZvcm1hdCwgcHJvdmlkZSBhbiBvYnNpZGlhbiBsaW5rIGJldHdlZW4gcXVvdGVzLlwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhd2FpdCBleHBlY3QoXHJcbiAgICAgICAgICAgIHQucnVuX2FuZF9nZXRfb3V0cHV0KFxyXG4gICAgICAgICAgICAgICAgYEluY2x1ZGVkOiA8JSB0cC5maWxlLmluY2x1ZGUoJ1tbTm9uRXhpc3RpbmdGaWxlXV0nKSAlPlxcblxcbmBcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkudG8uZXZlbnR1YWxseS5iZS5yZWplY3RlZFdpdGgoXHJcbiAgICAgICAgICAgIEVycm9yLFxyXG4gICAgICAgICAgICBcIkZpbGUgW1tOb25FeGlzdGluZ0ZpbGVdXSBkb2Vzbid0IGV4aXN0XCJcclxuICAgICAgICApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdC50ZXN0KFwidHAuZmlsZS5sYXN0X21vZGlmaWVkX2RhdGVcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHNhdmVkX210aW1lID0gdC50YXJnZXRfZmlsZS5zdGF0Lm10aW1lO1xyXG4gICAgICAgIC8vIDIwMjEtMDUtMDEgMDA6MDA6MDBcclxuICAgICAgICB0LnRhcmdldF9maWxlLnN0YXQubXRpbWUgPSAxNjE5ODIwMDAwMDAwO1xyXG5cclxuICAgICAgICBleHBlY3QoXHJcbiAgICAgICAgICAgIGF3YWl0IHQucnVuX2FuZF9nZXRfb3V0cHV0KFxyXG4gICAgICAgICAgICAgICAgYExhc3QgbW9kaWYgZGF0ZTogPCUgdHAuZmlsZS5sYXN0X21vZGlmaWVkX2RhdGUoKSAlPlxcblxcbmAsXHJcbiAgICAgICAgICAgICAgICBcIlwiLFxyXG4gICAgICAgICAgICAgICAgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApLnRvLmVxdWFsKFwiTGFzdCBtb2RpZiBkYXRlOiAyMDIxLTA1LTAxIDAwOjAwXFxuXFxuXCIpO1xyXG4gICAgICAgIGV4cGVjdChcclxuICAgICAgICAgICAgYXdhaXQgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgTGFzdCBtb2RpZiBkYXRlOiA8JSB0cC5maWxlLmxhc3RfbW9kaWZpZWRfZGF0ZShcImRkZGQgRG8gTU1NTSBZWVlZLCBkZGRcIikgJT5cXG5cXG5gLFxyXG4gICAgICAgICAgICAgICAgXCJcIixcclxuICAgICAgICAgICAgICAgIGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKS50by5lcXVhbChcIkxhc3QgbW9kaWYgZGF0ZTogU2F0dXJkYXkgMXN0IE1heSAyMDIxLCBTYXRcXG5cXG5cIik7XHJcblxyXG4gICAgICAgIHQudGFyZ2V0X2ZpbGUuc3RhdC5jdGltZSA9IHNhdmVkX210aW1lO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdC50ZXN0KFwidHAuZmlsZS5tb3ZlXCIsIGFzeW5jICgpID0+IHtcclxuICAgICAgICBjb25zdCBzYXZlZF90YXJnZXRfZmlsZSA9IHQudGFyZ2V0X2ZpbGU7XHJcbiAgICAgICAgY29uc3QgZm9sZGVyX25hbWUgPSBgVGVzdEZvbGRlcmA7XHJcbiAgICAgICAgY29uc3QgbmVzdGVkX25hbWUgPSBgVGVzdEZvbGRlci9uZXN0ZWRgO1xyXG4gICAgICAgIGNvbnN0IGZvbGRlciA9IGF3YWl0IHQuY3JlYXRlRm9sZGVyKGZvbGRlcl9uYW1lKTtcclxuICAgICAgICBjb25zdCBmaWxlMSA9IGF3YWl0IHQuY3JlYXRlRmlsZShgRmlsZTEubWRgKTtcclxuICAgICAgICBjb25zdCBuZXN0ZWQxID0gYXdhaXQgdC5jcmVhdGVGaWxlKGBOZXN0ZWQxLm1kYCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdC50YXJnZXRfZmlsZSA9IGZpbGUxO1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgTW92ZSA8JSB0cC5maWxlLm1vdmUoXCIke2ZvbGRlcl9uYW1lfS9GaWxlMlwiKSAlPlxcblxcbmBcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkudG8uZXZlbnR1YWxseS5lcXVhbChgTW92ZSBcXG5cXG5gKTtcclxuICAgICAgICBleHBlY3QoZmlsZTEucGF0aCkudG8uZXF1YWwoYCR7Zm9sZGVyX25hbWV9L0ZpbGUyLm1kYCk7XHJcblxyXG4gICAgICAgIHQudGFyZ2V0X2ZpbGUgPSBuZXN0ZWQxO1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgTW92ZSA8JSB0cC5maWxlLm1vdmUoXCIke25lc3RlZF9uYW1lfS9OZXN0ZWQyXCIpICU+XFxuXFxuYFxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKGBNb3ZlIFxcblxcbmApO1xyXG4gICAgICAgIGV4cGVjdChuZXN0ZWQxLnBhdGgpLnRvLmVxdWFsKGAke25lc3RlZF9uYW1lfS9OZXN0ZWQyLm1kYCk7XHJcblxyXG4gICAgICAgIHQudGFyZ2V0X2ZpbGUgPSBzYXZlZF90YXJnZXRfZmlsZTtcclxuICAgICAgICBhd2FpdCB0LmFwcC52YXVsdC5kZWxldGUoZm9sZGVyLCB0cnVlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHQudGVzdChcInRwLmZpbGUucGF0aFwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgLy8gVE9ET1xyXG5cclxuICAgICAgICAvL2V4cGVjdChhd2FpdCB0LnJ1bl9hbmRfZ2V0X291dHB1dChcIlBhdGg6IDwlIHRwLmZpbGUucGF0aCh0cnVlKSAlPlxcblxcblwiKSkudG8uZXF1YWwoYFBhdGg6ICR7VEVNUExBVEVfRklMRV9OQU1FfVxcblxcbmApO1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoYFBhdGg6IDwlIHRwLmZpbGUucGF0aCh0cnVlKSAlPlxcblxcbmApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKGBQYXRoOiAke1RBUkdFVF9GSUxFX05BTUV9Lm1kXFxuXFxuYCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0LnRlc3QoXCJ0cC5maWxlLnJlbmFtZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgY29uc3Qgc2F2ZWRfdGFyZ2V0X2ZpbGUgPSB0LnRhcmdldF9maWxlO1xyXG4gICAgICAgIGNvbnN0IGZpbGUxID0gYXdhaXQgdC5jcmVhdGVGaWxlKGBGaWxlMS5tZGApO1xyXG4gICAgICAgIHQudGFyZ2V0X2ZpbGUgPSBmaWxlMTtcclxuXHJcbiAgICAgICAgYXdhaXQgZXhwZWN0KFxyXG4gICAgICAgICAgICB0LnJ1bl9hbmRfZ2V0X291dHB1dChgUmVuYW1lIDwlIHRwLmZpbGUucmVuYW1lKFwiRmlsZTJcIikgJT5cXG5cXG5gKVxyXG4gICAgICAgICkudG8uZXZlbnR1YWxseS5lcXVhbChgUmVuYW1lIFxcblxcbmApO1xyXG4gICAgICAgIGV4cGVjdChmaWxlMS5iYXNlbmFtZSkudG8uZXF1YWwoXCJGaWxlMlwiKTtcclxuICAgICAgICBhd2FpdCBleHBlY3QoXHJcbiAgICAgICAgICAgIHQucnVuX2FuZF9nZXRfb3V0cHV0KFxyXG4gICAgICAgICAgICAgICAgYFJlbmFtZSA8JSB0cC5maWxlLnJlbmFtZShcIkZhaWwvRmlsZTIubWRcIikgJT5cXG5cXG5gXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApLnRvLmV2ZW50dWFsbHkuYmUucmVqZWN0ZWRXaXRoKFxyXG4gICAgICAgICAgICBFcnJvcixcclxuICAgICAgICAgICAgXCJGaWxlIG5hbWUgY2Fubm90IGNvbnRhaW4gYW55IG9mIHRoZXNlIGNoYXJhY3RlcnM6IFxcXFwgLyA6XCJcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB0LnRhcmdldF9maWxlID0gc2F2ZWRfdGFyZ2V0X2ZpbGU7XHJcbiAgICAgICAgYXdhaXQgdC5hcHAudmF1bHQuZGVsZXRlKGZpbGUxKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHQudGVzdChcInRwLmZpbGUuc2VsZWN0aW9uXCIsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAvLyBUT0RPXHJcbiAgICB9KTtcclxuXHJcbiAgICB0LnRlc3QoXCJ0cC5maWxlLnRhZ3NcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgVGFnczogPCUgdHAuZmlsZS50YWdzICU+XFxuXFxuYCxcclxuICAgICAgICAgICAgICAgIGAjdGFnMVxcbiN0YWcyXFxuI3RhZzNcXG5cXG5gLFxyXG4gICAgICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKGBUYWdzOiAjdGFnMSwjdGFnMiwjdGFnM1xcblxcbmApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdC50ZXN0KFwidHAuZmlsZS50aXRsZVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgYXdhaXQgZXhwZWN0KFxyXG4gICAgICAgICAgICB0LnJ1bl9hbmRfZ2V0X291dHB1dChgVGl0bGU6IDwlIHRwLmZpbGUudGl0bGUgJT5cXG5cXG5gKVxyXG4gICAgICAgICkudG8uZXZlbnR1YWxseS5lcXVhbChgVGl0bGU6ICR7VEFSR0VUX0ZJTEVfTkFNRX1cXG5cXG5gKTtcclxuICAgIH0pO1xyXG59XHJcbiIsImltcG9ydCBUZXN0VGVtcGxhdGVyUGx1Z2luIGZyb20gXCIuLi8uLi9tYWluLnRlc3RcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBJbnRlcm5hbE1vZHVsZURhdGVUZXN0cyh0OiBUZXN0VGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICB0LnRlc3QoXCJ0cC5kYXRlLm5vd1wiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgfSk7XHJcblxyXG4gICAgdC50ZXN0KFwidHAuZGF0ZS50b21vcnJvd1wiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgfSk7XHJcblxyXG4gICAgdC50ZXN0KFwidHAuZGF0ZS55ZXN0ZXJkYXlcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIC8vIFRPRE9cclxuICAgIH0pO1xyXG5cclxuICAgIHQudGVzdChcInRwLmRhdGUud2Vla2RheVwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgLy8gVE9ET1xyXG4gICAgfSk7XHJcbn1cclxuIiwiaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcImNoYWlcIjtcclxuaW1wb3J0IFRlc3RUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIi4uLy4uL21haW4udGVzdFwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIEludGVybmFsTW9kdWxlRnJvbnRtYXR0ZXJUZXN0cyh0OiBUZXN0VGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICB0LnRlc3QoXCJ0cC5mcm9udG1hdHRlclwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgY29uc3QgdGVtcGxhdGVfY29udGVudCA9IGBmaWVsZDE6IDwlIHRwLmZyb250bWF0dGVyLmZpZWxkMSAlPlxyXG5maWVsZDIgd2l0aCBzcGFjZTogPCUgdHAuZnJvbnRtYXR0ZXJbXCJmaWVsZDIgd2l0aCBzcGFjZVwiXSAlPlxyXG5maWVsZDMgYXJyYXk6IDwlIHRwLmZyb250bWF0dGVyLmZpZWxkMyAlPlxyXG5maWVsZDQgYXJyYXk6IDwlIHRwLmZyb250bWF0dGVyLmZpZWxkNCAlPlxyXG5gO1xyXG5cclxuICAgICAgICBjb25zdCB0YXJnZXRfY29udGVudCA9IGAtLS1cclxuZmllbGQxOiB0ZXN0XHJcbmZpZWxkMiB3aXRoIHNwYWNlOiB0ZXN0IHRlc3RcclxuZmllbGQzOiBbXCJhXCIsIFwiYlwiLCBcImNcIl1cclxuZmllbGQ0OlxyXG4tIGFcclxuLSBiXHJcbi0gY1xyXG4tLS1gO1xyXG5cclxuICAgICAgICBjb25zdCBleHBlY3RlZF9jb250ZW50ID0gYGZpZWxkMTogdGVzdFxyXG5maWVsZDIgd2l0aCBzcGFjZTogdGVzdCB0ZXN0XHJcbmZpZWxkMyBhcnJheTogYSxiLGNcclxuZmllbGQ0IGFycmF5OiBhLGIsY1xyXG5gO1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQodGVtcGxhdGVfY29udGVudCwgdGFyZ2V0X2NvbnRlbnQsIHRydWUpXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKGV4cGVjdGVkX2NvbnRlbnQpO1xyXG4gICAgfSk7XHJcbn1cclxuIiwiaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSBcImNoYWlcIjtcclxuaW1wb3J0IFRlc3RUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIi4uLy4uL21haW4udGVzdFwiO1xyXG5pbXBvcnQgeyBwcm9wZXJ0aWVzX2FyZV92aXNpYmxlIH0gZnJvbSBcIi4uL3V0aWxzLnRlc3RcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBJbnRlcm5hbE1vZHVsZUhvb2tzVGVzdHModDogVGVzdFRlbXBsYXRlclBsdWdpbikge1xyXG4gICAgdC50ZXN0KFxyXG4gICAgICAgIFwidHAuaG9va3Mub25fYWxsX3RlbXBsYXRlc19leGVjdXRlZCBzaG93cyBwcm9wZXJ0aWVzIGluIGxpdmUgcHJldmlld1wiLFxyXG4gICAgICAgIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBgPCUqXHJcbnRwLmhvb2tzLm9uX2FsbF90ZW1wbGF0ZXNfZXhlY3V0ZWQoYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IGZpbGUgPSB0cC5maWxlLmZpbmRfdGZpbGUodHAuZmlsZS5wYXRoKHRydWUpKTtcclxuICBhd2FpdCBhcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKGZpbGUsIChmcm9udG1hdHRlcikgPT4ge1xyXG4gICAgZnJvbnRtYXR0ZXJbXCJrZXlcIl0gPSBcInZhbHVlXCI7XHJcbiAgfSk7XHJcbn0pO1xyXG4lPlxyXG5URVhUIFRIQVQgU0hPVUxEIFNUQVlgO1xyXG4gICAgICAgICAgICBhd2FpdCB0LnJ1bl9pbl9uZXdfbGVhZih0ZW1wbGF0ZSwgXCJcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGV4cGVjdChwcm9wZXJ0aWVzX2FyZV92aXNpYmxlKCkpLnRvLmJlLnRydWU7XHJcbiAgICAgICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgICAgIHQucnVuX2FuZF9nZXRfb3V0cHV0KHRlbXBsYXRlLCBcIlwiLCB0cnVlKVxyXG4gICAgICAgICAgICApLnRvLmV2ZW50dWFsbHkuZXF1YWwoXCJcXG5URVhUIFRIQVQgU0hPVUxEIFNUQVlcIik7XHJcbiAgICAgICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgICAgIHQuY3JlYXRlX25ld19ub3RlX2Zyb21fdGVtcGxhdGVfYW5kX2dldF9vdXRwdXQodGVtcGxhdGUpXHJcbiAgICAgICAgICAgICkudG8uZXZlbnR1YWxseS5lcXVhbChcclxuICAgICAgICAgICAgICAgIFwiLS0tXFxua2V5OiB2YWx1ZVxcbi0tLVxcblxcblRFWFQgVEhBVCBTSE9VTEQgU1RBWVwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxufVxyXG4iLCJpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiY2hhaVwiO1xyXG5pbXBvcnQgVGVzdFRlbXBsYXRlclBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpbi50ZXN0XCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gSW50ZXJuYWxNb2R1bGVTeXN0ZW1UZXN0cyh0OiBUZXN0VGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICB0LnRlc3QoXCJ0cC5zeXN0ZW0uY2xpcGJvYXJkXCIsIGFzeW5jICgpID0+IHtcclxuICAgICAgICBjb25zdCBjbGlwYm9hcmRfY29udGVudCA9IFwiVGhpcyBzb21lIHRlc3RcXG5cXG5jb250ZW50XFxuXFxuXCI7XHJcbiAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoY2xpcGJvYXJkX2NvbnRlbnQpO1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBgQ2xpcGJvYXJkIGNvbnRlbnQ6IDwlIHRwLnN5c3RlbS5jbGlwYm9hcmQoKSAlPmBcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkudG8uZXZlbnR1YWxseS5lcXVhbChgQ2xpcGJvYXJkIGNvbnRlbnQ6ICR7Y2xpcGJvYXJkX2NvbnRlbnR9YCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0LnRlc3QoXCJ0cC5zeXN0ZW0ucHJvbXB0XCIsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAvLyBUT0RPXHJcbiAgICB9KTtcclxuXHJcbiAgICB0LnRlc3QoXCJ0cC5zeXN0ZW0uc3VnZ2VzdGVyXCIsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAvLyBUT0RPXHJcbiAgICB9KTtcclxufVxyXG4iLCJpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiY2hhaVwiO1xyXG5pbXBvcnQgVGVzdFRlbXBsYXRlclBsdWdpbiBmcm9tIFwiLi4vLi4vbWFpbi50ZXN0XCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gSW50ZXJuYWxNb2R1bGVDb25maWdUZXN0cyh0OiBUZXN0VGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICB0LnRlc3QoXCJ0cC5jb25maWdcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgICAgICAgICBcIlRlbXBsYXRlIGZpbGU6IDwlIHRwLmNvbmZpZy50ZW1wbGF0ZV9maWxlLnBhdGggJT5cXG5cXG5cIixcclxuICAgICAgICAgICAgICAgIFwiXCJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkudG8uZXZlbnR1YWxseS5lcXVhbChgVGVtcGxhdGUgZmlsZTogJHt0LnRlbXBsYXRlX2ZpbGUucGF0aH1cXG5cXG5gKTtcclxuICAgICAgICBhd2FpdCBleHBlY3QoXHJcbiAgICAgICAgICAgIHQucnVuX2FuZF9nZXRfb3V0cHV0KFxyXG4gICAgICAgICAgICAgICAgXCJUYXJnZXQgZmlsZTogPCUgdHAuY29uZmlnLnRhcmdldF9maWxlLnBhdGggJT5cXG5cXG5cIixcclxuICAgICAgICAgICAgICAgIFwiXCJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICkudG8uZXZlbnR1YWxseS5lcXVhbChgVGFyZ2V0IGZpbGU6ICR7dC50YXJnZXRfZmlsZS5wYXRofVxcblxcbmApO1xyXG4gICAgICAgIGF3YWl0IGV4cGVjdChcclxuICAgICAgICAgICAgdC5ydW5fYW5kX2dldF9vdXRwdXQoXCJSdW4gbW9kZTogPCUgdHAuY29uZmlnLnJ1bl9tb2RlICU+XFxuXFxuXCIsIFwiXCIpXHJcbiAgICAgICAgKS50by5ldmVudHVhbGx5LmVxdWFsKFwiUnVuIG1vZGU6IDJcXG5cXG5cIik7XHJcbiAgICB9KTtcclxufVxyXG4iLCJpbXBvcnQgeyBQbHVnaW4sIFRBYnN0cmFjdEZpbGUsIFRGaWxlLCBURm9sZGVyIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCBjaGFpIGZyb20gXCJjaGFpXCI7XHJcbmltcG9ydCBjaGFpQXNQcm9taXNlZCBmcm9tIFwiY2hhaS1hcy1wcm9taXNlZFwiO1xyXG5cclxuaW1wb3J0IHsgUnVuTW9kZSwgUnVubmluZ0NvbmZpZyB9IGZyb20gXCJjb3JlL1RlbXBsYXRlclwiO1xyXG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7XHJcbiAgICBjYWNoZV91cGRhdGUsXHJcbiAgICBkZWxheSxcclxuICAgIFBMVUdJTl9OQU1FLFxyXG4gICAgVEFSR0VUX0ZJTEVfTkFNRSxcclxuICAgIFRFTVBMQVRFX0ZJTEVfTkFNRSxcclxufSBmcm9tIFwiLi91dGlscy50ZXN0XCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlRmlsZVRlc3RzIH0gZnJvbSBcIi4vSW50ZXJuYWxUZW1wbGF0ZXMvSW50ZXJuYWxNb2R1bGVGaWxlLnRlc3RcIjtcclxuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGVEYXRlVGVzdHMgfSBmcm9tIFwiLi9JbnRlcm5hbFRlbXBsYXRlcy9JbnRlcm5hbE1vZHVsZURhdGUudGVzdFwiO1xyXG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZUZyb250bWF0dGVyVGVzdHMgfSBmcm9tIFwiLi9JbnRlcm5hbFRlbXBsYXRlcy9JbnRlcm5hbE1vZHVsZUZyb250bWF0dGVyLnRlc3RcIjtcclxuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGVIb29rc1Rlc3RzIH0gZnJvbSBcIi4vSW50ZXJuYWxUZW1wbGF0ZXMvSW50ZXJuYWxNb2R1bGVIb29rcy50ZXN0XCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlU3lzdGVtVGVzdHMgfSBmcm9tIFwiLi9JbnRlcm5hbFRlbXBsYXRlcy9JbnRlcm5hbE1vZHVsZVN5c3RlbS50ZXN0XCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlQ29uZmlnVGVzdHMgfSBmcm9tIFwiLi9JbnRlcm5hbFRlbXBsYXRlcy9JbnRlcm5hbE1vZHVsZUNvbmZpZy50ZXN0XCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlclRlc3RzIH0gZnJvbSBcIi4vVGVtcGxhdGVyLnRlc3RcIjtcclxuXHJcbmNoYWkudXNlKGNoYWlBc1Byb21pc2VkKTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVGVzdFJ1bkNvbmZpZyB7XHJcbiAgICB0ZW1wbGF0ZV9jb250ZW50OiBzdHJpbmc7XHJcbiAgICB0YXJnZXRfY29udGVudDogc3RyaW5nO1xyXG4gICAgd2FpdF9jYWNoZTogYm9vbGVhbjtcclxuICAgIHNraXBfdGVtcGxhdGVfbW9kaWZ5OiBib29sZWFuO1xyXG4gICAgc2tpcF90YXJnZXRfbW9kaWZ5OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXN0VGVtcGxhdGVyUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcclxuICAgIHRlc3RzOiBBcnJheTx7IG5hbWU6IHN0cmluZzsgZm46ICgpID0+IFByb21pc2U8dm9pZD4gfT47XHJcbiAgICBwbHVnaW46IFRlbXBsYXRlclBsdWdpbjtcclxuICAgIHRlbXBsYXRlX2ZpbGU6IFRGaWxlO1xyXG4gICAgdGFyZ2V0X2ZpbGU6IFRGaWxlO1xyXG4gICAgYWN0aXZlX2ZpbGVzOiBBcnJheTxUQWJzdHJhY3RGaWxlPiA9IG5ldyBBcnJheSgpO1xyXG5cclxuICAgIGFzeW5jIG9ubG9hZCgpIHtcclxuICAgICAgICB0aGlzLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICBpZDogXCJydW4tdGVtcGxhdGVyLXRlc3RzXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiUnVuIFRlbXBsYXRlciBUZXN0c1wiLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXR1cCgpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkX3Rlc3RzKCk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJ1bl90ZXN0cygpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy50ZWFyZG93bigpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHNldHVwKCkge1xyXG4gICAgICAgIGF3YWl0IGRlbGF5KDMwMCk7XHJcbiAgICAgICAgdGhpcy50ZXN0cyA9IG5ldyBBcnJheSgpO1xyXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICB0aGlzLnBsdWdpbiA9IHRoaXMuYXBwLnBsdWdpbnMuZ2V0UGx1Z2luKFBMVUdJTl9OQU1FKTtcclxuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb24gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnBsdWdpbi5ldmVudF9oYW5kbGVyLnVwZGF0ZV90cmlnZ2VyX2ZpbGVfb25fY3JlYXRpb24oKTtcclxuICAgICAgICB0aGlzLnRhcmdldF9maWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKFxyXG4gICAgICAgICAgICBgJHtUQVJHRVRfRklMRV9OQU1FfS5tZGAsXHJcbiAgICAgICAgICAgIFwiXCJcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGVfZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShcclxuICAgICAgICAgICAgYCR7VEVNUExBVEVfRklMRV9OQU1FfS5tZGAsXHJcbiAgICAgICAgICAgIFwiXCJcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvL2F3YWl0IHRoaXMuZGlzYWJsZV9leHRlcm5hbF9wbHVnaW5zKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgdGVhcmRvd24oKSB7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnBsdWdpbi5ldmVudF9oYW5kbGVyLnVwZGF0ZV90cmlnZ2VyX2ZpbGVfb25fY3JlYXRpb24oKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmNsZWFudXBGaWxlcygpO1xyXG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmRlbGV0ZSh0aGlzLnRhcmdldF9maWxlLCB0cnVlKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5kZWxldGUodGhpcy50ZW1wbGF0ZV9maWxlLCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy9hd2FpdCB0aGlzLmVuYWJsZV9leHRlcm5hbF9wbHVnaW5zKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZGlzYWJsZV9leHRlcm5hbF9wbHVnaW5zKCkge1xyXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICBmb3IgKGNvbnN0IHBsdWdpbl9uYW1lIG9mIE9iamVjdC5rZXlzKHRoaXMuYXBwLnBsdWdpbnMucGx1Z2lucykpIHtcclxuICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgcGx1Z2luX25hbWUgIT09IFBMVUdJTl9OQU1FICYmXHJcbiAgICAgICAgICAgICAgICBwbHVnaW5fbmFtZSAhPT0gdGhpcy5tYW5pZmVzdC5pZFxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnBsdWdpbnMucGx1Z2luc1twbHVnaW5fbmFtZV0udW5sb2FkKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZW5hYmxlX2V4dGVybmFsX3BsdWdpbnMoKSB7XHJcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgIGZvciAoY29uc3QgcGx1Z2luX25hbWUgb2YgT2JqZWN0LmtleXModGhpcy5hcHAucGx1Z2lucy5wbHVnaW5zKSkge1xyXG4gICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICBwbHVnaW5fbmFtZSAhPT0gUExVR0lOX05BTUUgJiZcclxuICAgICAgICAgICAgICAgIHBsdWdpbl9uYW1lICE9PSB0aGlzLm1hbmlmZXN0LmlkXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAucGx1Z2lucy5wbHVnaW5zW3BsdWdpbl9uYW1lXS5sb2FkKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZF90ZXN0cygpIHtcclxuICAgICAgICBJbnRlcm5hbE1vZHVsZUZpbGVUZXN0cyh0aGlzKTtcclxuICAgICAgICBJbnRlcm5hbE1vZHVsZURhdGVUZXN0cyh0aGlzKTtcclxuICAgICAgICBJbnRlcm5hbE1vZHVsZUZyb250bWF0dGVyVGVzdHModGhpcyk7XHJcbiAgICAgICAgSW50ZXJuYWxNb2R1bGVIb29rc1Rlc3RzKHRoaXMpO1xyXG4gICAgICAgIEludGVybmFsTW9kdWxlU3lzdGVtVGVzdHModGhpcyk7XHJcbiAgICAgICAgSW50ZXJuYWxNb2R1bGVDb25maWdUZXN0cyh0aGlzKTtcclxuICAgICAgICBUZW1wbGF0ZXJUZXN0cyh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICB0ZXN0KG5hbWU6IHN0cmluZywgZm46ICgpID0+IFByb21pc2U8dm9pZD4pIHtcclxuICAgICAgICB0aGlzLnRlc3RzLnB1c2goeyBuYW1lLCBmbiB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBydW5fdGVzdHMoKSB7XHJcbiAgICAgICAgZm9yIChsZXQgdCBvZiB0aGlzLnRlc3RzKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0LmZuKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuKchVwiLCB0Lm5hbWUpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIuKdjFwiLCB0Lm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBjbGVhbnVwRmlsZXMoKSB7XHJcbiAgICAgICAgbGV0IGZpbGU7XHJcbiAgICAgICAgd2hpbGUgKChmaWxlID0gdGhpcy5hY3RpdmVfZmlsZXMucG9wKCkpICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmRlbGV0ZShmaWxlLCB0cnVlKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0cmlldmVBY3RpdmVGaWxlKGZpbGVfbmFtZTogc3RyaW5nKTogVEFic3RyYWN0RmlsZSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBmaWxlIG9mIHRoaXMuYWN0aXZlX2ZpbGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChmaWxlLm5hbWUgPT09IGZpbGVfbmFtZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgY3JlYXRlRm9sZGVyKGZvbGRlcl9uYW1lOiBzdHJpbmcpOiBQcm9taXNlPFRGb2xkZXI+IHtcclxuICAgICAgICBsZXQgZm9sZGVyID0gdGhpcy5yZXRyaWV2ZUFjdGl2ZUZpbGUoZm9sZGVyX25hbWUpO1xyXG4gICAgICAgIGlmIChmb2xkZXIgJiYgZm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gZm9sZGVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIoZm9sZGVyX25hbWUpO1xyXG4gICAgICAgIGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXJfbmFtZSk7XHJcbiAgICAgICAgaWYgKCEoZm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWN0aXZlX2ZpbGVzLnB1c2goZm9sZGVyKTtcclxuICAgICAgICByZXR1cm4gZm9sZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZUZpbGUoXHJcbiAgICAgICAgZmlsZV9uYW1lOiBzdHJpbmcsXHJcbiAgICAgICAgZmlsZV9jb250ZW50OiBzdHJpbmcgPSBcIlwiXHJcbiAgICApOiBQcm9taXNlPFRGaWxlPiB7XHJcbiAgICAgICAgY29uc3QgZiA9IHRoaXMucmV0cmlldmVBY3RpdmVGaWxlKGZpbGVfbmFtZSk7XHJcbiAgICAgICAgaWYgKGYgJiYgZiBpbnN0YW5jZW9mIFRGaWxlKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmLCBmaWxlX2NvbnRlbnQpO1xyXG4gICAgICAgICAgICByZXR1cm4gZjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZmlsZSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShmaWxlX25hbWUsIGZpbGVfY29udGVudCk7XHJcbiAgICAgICAgdGhpcy5hY3RpdmVfZmlsZXMucHVzaChmaWxlKTtcclxuICAgICAgICByZXR1cm4gZmlsZTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBydW5fYW5kX2dldF9vdXRwdXQoXHJcbiAgICAgICAgdGVtcGxhdGVfY29udGVudDogc3RyaW5nLFxyXG4gICAgICAgIHRhcmdldF9jb250ZW50OiBzdHJpbmcgPSBcIlwiLFxyXG4gICAgICAgIHdhaXRDYWNoZTogYm9vbGVhbiA9IGZhbHNlLFxyXG4gICAgICAgIHNraXBfbW9kaWZ5OiBib29sZWFuID0gZmFsc2VcclxuICAgICk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHRoaXMudGVtcGxhdGVfZmlsZSwgdGVtcGxhdGVfY29udGVudCk7XHJcbiAgICAgICAgaWYgKCFza2lwX21vZGlmeSkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodGhpcy50YXJnZXRfZmlsZSwgdGFyZ2V0X2NvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAod2FpdENhY2hlKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGNhY2hlX3VwZGF0ZSh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJ1bm5pbmdfY29uZmlnOiBSdW5uaW5nQ29uZmlnID0ge1xyXG4gICAgICAgICAgICB0ZW1wbGF0ZV9maWxlOiB0aGlzLnRlbXBsYXRlX2ZpbGUsXHJcbiAgICAgICAgICAgIHRhcmdldF9maWxlOiB0aGlzLnRhcmdldF9maWxlLFxyXG4gICAgICAgICAgICBydW5fbW9kZTogUnVuTW9kZS5PdmVyd3JpdGVGaWxlLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMucGx1Z2luLnRlbXBsYXRlci5yZWFkX2FuZF9wYXJzZV90ZW1wbGF0ZShcclxuICAgICAgICAgICAgcnVubmluZ19jb25maWdcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlX2FuZF9nZXRfb3V0cHV0KFxyXG4gICAgICAgIHRlbXBsYXRlX2NvbnRlbnQ6IHN0cmluZyxcclxuICAgICAgICBkZWxheV9tcyA9IDMwMFxyXG4gICAgKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcclxuICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5wbHVnaW4udGVtcGxhdGVyLmNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKFxyXG4gICAgICAgICAgICB0ZW1wbGF0ZV9jb250ZW50XHJcbiAgICAgICAgKTtcclxuICAgICAgICBpZiAoZmlsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZV9maWxlcy5wdXNoKGZpbGUpO1xyXG4gICAgICAgICAgICBhd2FpdCBkZWxheShkZWxheV9tcyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xyXG4gICAgICAgICAgICByZXR1cm4gY29udGVudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcnVuX2luX25ld19sZWFmKFxyXG4gICAgICAgIHRlbXBsYXRlX2NvbnRlbnQ6IHN0cmluZyxcclxuICAgICAgICB0YXJnZXRfY29udGVudCA9IFwiXCIsXHJcbiAgICAgICAgd2FpdENhY2hlID0gZmFsc2UsXHJcbiAgICAgICAgc2tpcF9tb2RpZnkgPSBmYWxzZVxyXG4gICAgKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KHRoaXMudGVtcGxhdGVfZmlsZSwgdGVtcGxhdGVfY29udGVudCk7XHJcbiAgICAgICAgaWYgKCFza2lwX21vZGlmeSkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkodGhpcy50YXJnZXRfZmlsZSwgdGFyZ2V0X2NvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAod2FpdENhY2hlKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IGNhY2hlX3VwZGF0ZSh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpLm9wZW5GaWxlKHRoaXMudGFyZ2V0X2ZpbGUpO1xyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi50ZW1wbGF0ZXIuYXBwZW5kX3RlbXBsYXRlX3RvX2FjdGl2ZV9maWxlKFxyXG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlX2ZpbGVcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBhd2FpdCBkZWxheSgzMDApO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCBUZXN0VGVtcGxhdGVyUGx1Z2luIGZyb20gXCIuL21haW4udGVzdFwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IFBMVUdJTl9OQU1FID0gXCJ0ZW1wbGF0ZXItb2JzaWRpYW5cIjtcclxuZXhwb3J0IGNvbnN0IFRFTVBMQVRFX0ZJTEVfTkFNRSA9IFwiVGVtcGxhdGVGaWxlXCI7XHJcbmV4cG9ydCBjb25zdCBUQVJHRVRfRklMRV9OQU1FID0gXCJUYXJnZXRGaWxlXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVsYXkobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjYWNoZV91cGRhdGUodDogVGVzdFRlbXBsYXRlclBsdWdpbik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QoXCJDYWNoZSB1cGRhdGUgdGltZW91dFwiKSwgNTAwKTtcclxuICAgICAgICBjb25zdCByZXNvbHZlX3Byb21pc2UgPSAoZmlsZTogVEZpbGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKGZpbGUgPT09IHQudGFyZ2V0X2ZpbGUpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgICAgICAgICAgIHQuYXBwLm1ldGFkYXRhQ2FjaGUub2ZmKFwiY2hhbmdlZFwiLCByZXNvbHZlX3Byb21pc2UpO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICB0LmFwcC5tZXRhZGF0YUNhY2hlLm9uKFwiY2hhbmdlZFwiLCByZXNvbHZlX3Byb21pc2UpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwcm9wZXJ0aWVzX2FyZV92aXNpYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICEhZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcclxuICAgICAgICBcIi53b3Jrc3BhY2UtbGVhZi5tb2QtYWN0aXZlIC5tZXRhZGF0YS1wcm9wZXJ0aWVzIC5tZXRhZGF0YS1wcm9wZXJ0eVwiXHJcbiAgICApO1xyXG59XHJcbiIsImltcG9ydCB7IGV4cGVjdCB9IGZyb20gXCJjaGFpXCI7XHJcbmltcG9ydCBUZXN0VGVtcGxhdGVyUGx1Z2luIGZyb20gXCIuLi9tYWluLnRlc3RcIjtcclxuaW1wb3J0IHsgcHJvcGVydGllc19hcmVfdmlzaWJsZSB9IGZyb20gXCIuL3V0aWxzLnRlc3RcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBUZW1wbGF0ZXJUZXN0cyh0OiBUZXN0VGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICB0LnRlc3QoXHJcbiAgICAgICAgXCJhcHBlbmRfdGVtcGxhdGVfdG9fYWN0aXZlX2ZpbGUgc2hvd3MgcHJvcGVydGllcyBpbiBsaXZlIHByZXZpZXdcIixcclxuICAgICAgICBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGF3YWl0IHQucnVuX2luX25ld19sZWFmKFwiLS0tXFxua2V5OiB2YWx1ZVxcbi0tLVxcblRleHRcIik7XHJcbiAgICAgICAgICAgIGV4cGVjdChwcm9wZXJ0aWVzX2FyZV92aXNpYmxlKCkpLnRvLmJlLnRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxufVxyXG4iXX0=