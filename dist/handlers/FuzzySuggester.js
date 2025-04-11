import { FuzzySuggestModal, normalizePath } from "obsidian";
import { get_tfiles_from_folder } from "utils/Utils";
import { errorWrapperSync } from "utils/Error";
import { log_error } from "utils/Log";
export var OpenMode;
(function (OpenMode) {
    OpenMode[OpenMode["InsertTemplate"] = 0] = "InsertTemplate";
    OpenMode[OpenMode["CreateNoteTemplate"] = 1] = "CreateNoteTemplate";
})(OpenMode || (OpenMode = {}));
export class FuzzySuggester extends FuzzySuggestModal {
    constructor(plugin) {
        super(plugin.app);
        this.plugin = plugin;
        this.setPlaceholder("Type name of a template...");
    }
    getItems() {
        if (!this.plugin.settings.templates_folder) {
            return this.app.vault.getMarkdownFiles();
        }
        const files = errorWrapperSync(() => get_tfiles_from_folder(this.plugin.app, this.plugin.settings.templates_folder), `Couldn't retrieve template files from templates folder ${this.plugin.settings.templates_folder}`);
        if (!files) {
            return [];
        }
        return files;
    }
    getItemText(item) {
        let relativePath = item.path;
        if (item.path.startsWith(this.plugin.settings.templates_folder) &&
            normalizePath(this.plugin.settings.templates_folder) != "/") {
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
            log_error(e);
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
}
