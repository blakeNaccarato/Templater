import { addIcon, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, TemplaterSettingTab, } from "settings/Settings";
import { FuzzySuggester } from "handlers/FuzzySuggester";
import { ICON_DATA } from "utils/Constants";
import { Templater } from "core/Templater";
import EventHandler from "handlers/EventHandler";
import { CommandHandler } from "handlers/CommandHandler";
import { Editor } from "editor/Editor";
export default class TemplaterPlugin extends Plugin {
    async onload() {
        await this.load_settings();
        this.templater = new Templater(this);
        await this.templater.setup();
        this.editor_handler = new Editor(this);
        await this.editor_handler.setup();
        this.fuzzy_suggester = new FuzzySuggester(this);
        this.event_handler = new EventHandler(this, this.templater, this.settings);
        this.event_handler.setup();
        this.command_handler = new CommandHandler(this);
        this.command_handler.setup();
        addIcon("templater-icon", ICON_DATA);
        this.addRibbonIcon("templater-icon", "Templater", async () => {
            this.fuzzy_suggester.insert_template();
        }).setAttribute("id", "rb-templater-icon");
        this.addSettingTab(new TemplaterSettingTab(this));
        // Files might not be created yet
        this.app.workspace.onLayoutReady(() => {
            this.templater.execute_startup_scripts();
        });
    }
    onunload() {
        // Failsafe in case teardown doesn't happen immediately after template execution
        this.templater.functions_generator.teardown();
    }
    async save_settings() {
        await this.saveData(this.settings);
        this.editor_handler.updateEditorIntellisenseSetting(this.settings.intellisense_render);
    }
    async load_settings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
}
