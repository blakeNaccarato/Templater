import { EditorSuggest, } from "obsidian";
import { Documentation, is_function_documentation, is_module_name, } from "./TpDocumentation";
import { shouldRenderDescription, shouldRenderParameters, shouldRenderReturns } from "../settings/RenderSettings/IntellisenseRenderOption";
import { append_bolded_label_with_value_to_parent } from "utils/Utils";
export class Autocomplete extends EditorSuggest {
    constructor(plugin) {
        super(plugin.app);
        //private in_command = false;
        // https://regex101.com/r/ocmHzR/1
        this.tp_keyword_regex = /tp\.(?<module>[a-z]*)?(?<fn_trigger>\.(?<fn>[a-zA-Z_.]*)?)?$/;
        this.documentation = new Documentation(plugin);
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
            if (module_name == "" || !is_module_name(module_name)) {
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
    async getSuggestions(context) {
        let suggestions;
        if (this.module_name && this.function_trigger) {
            suggestions = await this.documentation.get_all_functions_documentation(this.module_name, this.function_name);
        }
        else {
            suggestions = this.documentation.get_all_modules_documentation();
        }
        if (!suggestions) {
            return [];
        }
        return suggestions.filter((s) => s.queryKey.toLowerCase().startsWith(context.query.toLowerCase()));
    }
    renderSuggestion(value, el) {
        el.createEl("b", { text: value.name });
        if (is_function_documentation(value)) {
            if (value.args &&
                this.getNumberOfArguments(value.args) > 0 &&
                shouldRenderParameters(this.intellisense_render_setting)) {
                el.createEl('p', { text: "Parameter list:" });
                const list = el.createEl("ol");
                for (const [key, val] of Object.entries(value.args)) {
                    append_bolded_label_with_value_to_parent(list, key, val.description);
                }
            }
            if (value.returns &&
                shouldRenderReturns(this.intellisense_render_setting)) {
                append_bolded_label_with_value_to_parent(el, 'Returns', value.returns);
            }
        }
        if (this.function_trigger && is_function_documentation(value)) {
            el.createEl("code", { text: value.definition });
        }
        if (value.description
            && shouldRenderDescription(this.intellisense_render_setting)) {
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
}
