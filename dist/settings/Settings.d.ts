import TemplaterPlugin from "main";
import { PluginSettingTab } from "obsidian";
export interface FolderTemplate {
    folder: string;
    template: string;
}
export interface FileTemplate {
    regex: string;
    template: string;
}
export declare const DEFAULT_SETTINGS: Settings;
export interface Settings {
    command_timeout: number;
    templates_folder: string;
    templates_pairs: Array<[string, string]>;
    trigger_on_file_creation: boolean;
    auto_jump_to_cursor: boolean;
    enable_system_commands: boolean;
    shell_path: string;
    user_scripts_folder: string;
    enable_folder_templates: boolean;
    folder_templates: Array<FolderTemplate>;
    enable_file_templates: boolean;
    file_templates: Array<FileTemplate>;
    syntax_highlighting: boolean;
    syntax_highlighting_mobile: boolean;
    enabled_templates_hotkeys: Array<string>;
    startup_templates: Array<string>;
    intellisense_render: number;
}
export declare class TemplaterSettingTab extends PluginSettingTab {
    private plugin;
    constructor(plugin: TemplaterPlugin);
    display(): void;
    add_template_folder_setting(): void;
    add_internal_functions_setting(): void;
    add_syntax_highlighting_settings(): void;
    add_auto_jump_to_cursor(): void;
    add_trigger_on_new_file_creation_setting(): void;
    add_templates_hotkeys_setting(): void;
    add_folder_templates_setting(): void;
    add_file_templates_setting(): void;
    add_startup_templates_setting(): void;
    add_user_script_functions_setting(): void;
    add_user_system_command_functions_setting(): void;
    add_donating_setting(): void;
}
