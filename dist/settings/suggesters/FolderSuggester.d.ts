import { App, TFolder } from "obsidian";
import { TextInputSuggest } from "./suggest";
export declare class FolderSuggest extends TextInputSuggest<TFolder> {
    constructor(app: App, inputEl: HTMLInputElement | HTMLTextAreaElement);
    getSuggestions(inputStr: string): TFolder[];
    renderSuggestion(file: TFolder, el: HTMLElement): void;
    selectSuggestion(file: TFolder): void;
}
//# sourceMappingURL=FolderSuggester.d.ts.map