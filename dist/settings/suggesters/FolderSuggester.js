// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes
import { TFolder } from "obsidian";
import { TextInputSuggest } from "./suggest";
export class FolderSuggest extends TextInputSuggest {
    constructor(app, inputEl) {
        super(app, inputEl);
    }
    getSuggestions(inputStr) {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders = [];
        const lowerCaseInputStr = inputStr.toLowerCase();
        abstractFiles.forEach((folder) => {
            if (folder instanceof TFolder &&
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
}
