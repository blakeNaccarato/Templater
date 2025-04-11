import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from "obsidian";
import { TpSuggestDocumentation } from "./TpDocumentation";
import { IntellisenseRenderOption } from "../settings/RenderSettings/IntellisenseRenderOption";
import TemplaterPlugin from "main";
export declare class Autocomplete extends EditorSuggest<TpSuggestDocumentation> {
    private tp_keyword_regex;
    private documentation;
    private latest_trigger_info;
    private module_name;
    private function_trigger;
    private function_name;
    private intellisense_render_setting;
    constructor(plugin: TemplaterPlugin);
    onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile): EditorSuggestTriggerInfo | null;
    getSuggestions(context: EditorSuggestContext): Promise<TpSuggestDocumentation[]>;
    renderSuggestion(value: TpSuggestDocumentation, el: HTMLElement): void;
    selectSuggestion(value: TpSuggestDocumentation, _evt: MouseEvent | KeyboardEvent): void;
    getNumberOfArguments(args: object): number;
    updateAutocompleteIntellisenseSetting(value: IntellisenseRenderOption): void;
}
