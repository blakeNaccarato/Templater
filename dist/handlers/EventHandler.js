import { Templater } from "core/Templater";
import { TFolder, } from "obsidian";
export default class EventHandler {
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
            this.trigger_on_file_creation_event = this.plugin.app.vault.on("create", (file) => Templater.on_file_creation(this.templater, this.plugin.app, file));
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
            if (file instanceof TFolder) {
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
}
