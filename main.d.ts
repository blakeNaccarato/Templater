declare module "src/utils/Log" {
    import { TemplaterError } from "src/utils/Error";
    export function log_update(msg: string): void;
    export function log_error(e: Error | TemplaterError): void;
}
declare module "src/utils/Error" {
    export class TemplaterError extends Error {
        console_msg?: string | undefined;
        constructor(msg: string, console_msg?: string | undefined);
    }
    export function errorWrapper<T>(fn: () => Promise<T>, msg: string): Promise<T>;
    export function errorWrapperSync<T>(fn: () => T, msg: string): T;
}
declare module "src/utils/TJDocFile" {
    import { TFile } from 'obsidian';
    export class TJDocFile extends TFile {
        description: string;
        returns: string;
        arguments: TJDocFileArgument[];
        constructor(file: TFile);
    }
    export class TJDocFileArgument {
        name: string;
        description: string;
        constructor(name: string, desc: string);
    }
}
declare module "src/utils/Utils" {
    import { TJDocFile } from "src/utils/TJDocFile";
    import { App, TFile, TFolder } from "obsidian";
    export function delay(ms: number): Promise<void>;
    export function escape_RegExp(str: string): string;
    export function generate_command_regex(): RegExp;
    export function generate_dynamic_command_regex(): RegExp;
    export function resolve_tfolder(app: App, folder_str: string): TFolder;
    export function resolve_tfile(app: App, file_str: string): TFile;
    export function get_tfiles_from_folder(app: App, folder_str: string): Array<TFile>;
    export function populate_docs_from_user_scripts(app: App, files: Array<TFile>): Promise<TJDocFile[]>;
    export function arraymove<T>(arr: T[], fromIndex: number, toIndex: number): void;
    export function get_active_file(app: App): TFile | null;
    /**
     * @param path Normalized file path
     * @returns Folder path
     * @example
     * get_folder_path_from_path(normalizePath("path/to/folder/file", "md")) // path/to/folder
     */
    export function get_folder_path_from_file_path(path: string): string;
    export function is_object(obj: unknown): obj is Record<string, unknown>;
    export function get_fn_params(func: (...args: unknown[]) => unknown): string[];
    /**
     * Use a parent HtmlElement to create a label with a value
     * @param parent The parent HtmlElement; Use HtmlOListElement to return a `li` element
     * @param title The title for the label which will be bolded
     * @param value The value of the label
     * @returns A label HtmlElement (p | li)
     */
    export function append_bolded_label_with_value_to_parent(parent: HTMLElement, title: string, value: string): HTMLElement;
}
declare module "src/settings/suggesters/suggest" {
    import { App, ISuggestOwner } from "obsidian";
    export abstract class TextInputSuggest<T> implements ISuggestOwner<T> {
        protected app: App;
        protected inputEl: HTMLInputElement | HTMLTextAreaElement;
        private popper;
        private scope;
        private suggestEl;
        private suggest;
        constructor(app: App, inputEl: HTMLInputElement | HTMLTextAreaElement);
        onInputChanged(): void;
        open(container: HTMLElement, inputEl: HTMLElement): void;
        close(): void;
        abstract getSuggestions(inputStr: string): T[];
        abstract renderSuggestion(item: T, el: HTMLElement): void;
        abstract selectSuggestion(item: T): void;
    }
}
declare module "src/settings/suggesters/FileSuggester" {
    import { TFile } from "obsidian";
    import { TextInputSuggest } from "src/settings/suggesters/suggest";
    import TemplaterPlugin from "src/main";
    export enum FileSuggestMode {
        TemplateFiles = 0,
        ScriptFiles = 1
    }
    export class FileSuggest extends TextInputSuggest<TFile> {
        inputEl: HTMLInputElement;
        private plugin;
        private mode;
        constructor(inputEl: HTMLInputElement, plugin: TemplaterPlugin, mode: FileSuggestMode);
        get_folder(mode: FileSuggestMode): string;
        get_error_msg(mode: FileSuggestMode): string;
        getSuggestions(input_str: string): TFile[];
        renderSuggestion(file: TFile, el: HTMLElement): void;
        selectSuggestion(file: TFile): void;
    }
}
declare module "src/settings/suggesters/FolderSuggester" {
    import { App, TFolder } from "obsidian";
    import { TextInputSuggest } from "src/settings/suggesters/suggest";
    export class FolderSuggest extends TextInputSuggest<TFolder> {
        constructor(app: App, inputEl: HTMLInputElement | HTMLTextAreaElement);
        getSuggestions(inputStr: string): TFolder[];
        renderSuggestion(file: TFolder, el: HTMLElement): void;
        selectSuggestion(file: TFolder): void;
    }
}
declare module "src/settings/RenderSettings/IntellisenseRenderOption" {
    /**
     * The recongized render setting options
     */
    export enum IntellisenseRenderOption {
        Off = 0,
        RenderDescriptionParameterReturn = 1,
        RenderDescriptionParameterList = 2,
        RenderDescriptionReturn = 3,
        RenderDescriptionOnly = 4
    }
    /**
     *
     * @param value The intellisense render setting
     * @returns True if the Return Intellisense should render, otherwise false
     */
    export function shouldRenderReturns(render_setting: IntellisenseRenderOption | boolean): boolean;
    /**
     *
     * @param value The intellisense render setting
     * @returns True if the Parameters Intellisense should render, otherwise false
     */
    export function shouldRenderParameters(render_setting: IntellisenseRenderOption): boolean;
    /**
     *
     * @param value The intellisense render setting
     * @returns True if the Description Intellisense should render, otherwise false
     */
    export function shouldRenderDescription(render_setting: IntellisenseRenderOption): boolean;
}
declare module "src/settings/Settings" {
    import TemplaterPlugin from "src/main";
    import { PluginSettingTab } from "obsidian";
    export interface FolderTemplate {
        folder: string;
        template: string;
    }
    export interface FileTemplate {
        regex: string;
        template: string;
    }
    export const DEFAULT_SETTINGS: Settings;
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
    export class TemplaterSettingTab extends PluginSettingTab {
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
}
declare module "src/handlers/FuzzySuggester" {
    import { FuzzySuggestModal, TFile, TFolder } from "obsidian";
    import TemplaterPlugin from "src/main";
    export enum OpenMode {
        InsertTemplate = 0,
        CreateNoteTemplate = 1
    }
    export class FuzzySuggester extends FuzzySuggestModal<TFile> {
        private plugin;
        private open_mode;
        private creation_folder;
        constructor(plugin: TemplaterPlugin);
        getItems(): TFile[];
        getItemText(item: TFile): string;
        onChooseItem(item: TFile): void;
        start(): void;
        insert_template(): void;
        create_new_note_from_template(folder?: TFolder): void;
    }
}
declare module "src/utils/Constants" {
    export const UNSUPPORTED_MOBILE_TEMPLATE = "Error_MobileUnsupportedTemplate";
    export const ICON_DATA = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 51.1328 28.7\"><path d=\"M0 15.14 0 10.15 18.67 1.51 18.67 6.03 4.72 12.33 4.72 12.76 18.67 19.22 18.67 23.74 0 15.14ZM33.6928 1.84C33.6928 1.84 33.9761 2.1467 34.5428 2.76C35.1094 3.38 35.3928 4.56 35.3928 6.3C35.3928 8.0466 34.8195 9.54 33.6728 10.78C32.5261 12.02 31.0995 12.64 29.3928 12.64C27.6862 12.64 26.2661 12.0267 25.1328 10.8C23.9928 9.5733 23.4228 8.0867 23.4228 6.34C23.4228 4.6 23.9995 3.1066 25.1528 1.86C26.2994.62 27.7261 0 29.4328 0C31.1395 0 32.5594.6133 33.6928 1.84M49.8228.67 29.5328 28.38 24.4128 28.38 44.7128.67 49.8228.67M31.0328 8.38C31.0328 8.38 31.1395 8.2467 31.3528 7.98C31.5662 7.7067 31.6728 7.1733 31.6728 6.38C31.6728 5.5867 31.4461 4.92 30.9928 4.38C30.5461 3.84 29.9995 3.57 29.3528 3.57C28.7061 3.57 28.1695 3.84 27.7428 4.38C27.3228 4.92 27.1128 5.5867 27.1128 6.38C27.1128 7.1733 27.3361 7.84 27.7828 8.38C28.2361 8.9267 28.7861 9.2 29.4328 9.2C30.0795 9.2 30.6128 8.9267 31.0328 8.38M49.4328 17.9C49.4328 17.9 49.7161 18.2067 50.2828 18.82C50.8495 19.4333 51.1328 20.6133 51.1328 22.36C51.1328 24.1 50.5594 25.59 49.4128 26.83C48.2595 28.0766 46.8295 28.7 45.1228 28.7C43.4228 28.7 42.0028 28.0833 40.8628 26.85C39.7295 25.6233 39.1628 24.1366 39.1628 22.39C39.1628 20.65 39.7361 19.16 40.8828 17.92C42.0361 16.6733 43.4628 16.05 45.1628 16.05C46.8694 16.05 48.2928 16.6667 49.4328 17.9M46.8528 24.52C46.8528 24.52 46.9595 24.3833 47.1728 24.11C47.3795 23.8367 47.4828 23.3033 47.4828 22.51C47.4828 21.7167 47.2595 21.05 46.8128 20.51C46.3661 19.97 45.8162 19.7 45.1628 19.7C44.5161 19.7 43.9828 19.97 43.5628 20.51C43.1428 21.05 42.9328 21.7167 42.9328 22.51C42.9328 23.3033 43.1561 23.9733 43.6028 24.52C44.0494 25.06 44.5961 25.33 45.2428 25.33C45.8895 25.33 46.4261 25.06 46.8528 24.52Z\" fill=\"currentColor\"/></svg>";
}
declare module "src/core/functions/IGenerateObject" {
    import { RunningConfig } from "src/core/Templater";
    export interface IGenerateObject {
        generate_object(config: RunningConfig): Promise<Record<string, unknown>>;
    }
}
declare module "src/editor/TpDocumentation" {
    import TemplaterPlugin from "src/main";
    const module_names: readonly ["app", "config", "date", "file", "frontmatter", "hooks", "obsidian", "system", "user", "web"];
    export type ModuleName = (typeof module_names)[number];
    export function is_module_name(x: unknown): x is ModuleName;
    export type TpDocumentation = {
        tp: {
            [key in ModuleName]: TpModuleDocumentation;
        };
    };
    export type TpModuleDocumentation = {
        name: string;
        queryKey: string;
        description: string;
        functions: {
            [key: string]: TpFunctionDocumentation;
        };
    };
    export type TpFunctionDocumentation = {
        name: string;
        queryKey: string;
        definition: string;
        description: string;
        returns: string;
        example: string;
        args?: {
            [key: string]: TpArgumentDocumentation;
        };
    };
    export type TpArgumentDocumentation = {
        name: string;
        description: string;
    };
    export type TpSuggestDocumentation = TpModuleDocumentation | TpFunctionDocumentation | TpArgumentDocumentation;
    export function is_function_documentation(x: TpSuggestDocumentation): x is TpFunctionDocumentation;
    export class Documentation {
        private plugin;
        documentation: TpDocumentation;
        constructor(plugin: TemplaterPlugin);
        get_all_modules_documentation(): TpModuleDocumentation[];
        get_all_functions_documentation(module_name: ModuleName, function_name: string): Promise<TpFunctionDocumentation[] | undefined>;
        private get_app_functions_documentation;
        get_module_documentation(module_name: ModuleName): TpModuleDocumentation;
        get_function_documentation(module_name: ModuleName, function_name: string): TpFunctionDocumentation | null;
        get_argument_documentation(module_name: ModuleName, function_name: string, argument_name: string): TpArgumentDocumentation | null;
    }
}
declare module "src/core/functions/internal_functions/InternalModule" {
    import TemplaterPlugin from "src/main";
    import { RunningConfig } from "src/core/Templater";
    import { IGenerateObject } from "src/core/functions/IGenerateObject";
    import { ModuleName } from "src/editor/TpDocumentation";
    export abstract class InternalModule implements IGenerateObject {
        protected plugin: TemplaterPlugin;
        abstract name: ModuleName;
        protected static_functions: Map<string, unknown>;
        protected dynamic_functions: Map<string, unknown>;
        protected config: RunningConfig;
        protected static_object: {
            [x: string]: unknown;
        };
        constructor(plugin: TemplaterPlugin);
        getName(): ModuleName;
        abstract create_static_templates(): Promise<void>;
        abstract create_dynamic_templates(): Promise<void>;
        abstract teardown(): Promise<void>;
        init(): Promise<void>;
        generate_object(new_config: RunningConfig): Promise<Record<string, unknown>>;
    }
}
declare module "src/core/functions/internal_functions/date/InternalModuleDate" {
    import { InternalModule } from "src/core/functions/internal_functions/InternalModule";
    import { ModuleName } from "src/editor/TpDocumentation";
    export class InternalModuleDate extends InternalModule {
        name: ModuleName;
        create_static_templates(): Promise<void>;
        create_dynamic_templates(): Promise<void>;
        teardown(): Promise<void>;
        generate_now(): (format?: string, offset?: number | string, reference?: string, reference_format?: string) => string;
        generate_tomorrow(): (format?: string) => string;
        generate_weekday(): (format: string, weekday: number, reference?: string, reference_format?: string) => string;
        generate_yesterday(): (format?: string) => string;
    }
}
declare module "src/core/functions/internal_functions/file/InternalModuleFile" {
    import { InternalModule } from "src/core/functions/internal_functions/InternalModule";
    import { TFile, TFolder } from "obsidian";
    import { ModuleName } from "src/editor/TpDocumentation";
    export const DEPTH_LIMIT = 10;
    export class InternalModuleFile extends InternalModule {
        name: ModuleName;
        private include_depth;
        private create_new_depth;
        private linkpath_regex;
        create_static_templates(): Promise<void>;
        create_dynamic_templates(): Promise<void>;
        teardown(): Promise<void>;
        generate_content(): Promise<string>;
        generate_create_new(): (template: TFile | string, filename: string, open_new: boolean, folder?: TFolder | string) => Promise<TFile | undefined>;
        generate_creation_date(): (format?: string) => string;
        generate_cursor(): (order?: number) => string;
        generate_cursor_append(): (content: string) => void;
        generate_exists(): (filepath: string) => Promise<boolean>;
        generate_find_tfile(): (filename: string) => TFile | null;
        generate_folder(): (absolute?: boolean) => string;
        generate_include(): (include_link: string | TFile) => Promise<string>;
        generate_last_modified_date(): (format?: string) => string;
        generate_move(): (path: string, file_to_move?: TFile) => Promise<string>;
        generate_path(): (relative: boolean) => string;
        generate_rename(): (new_title: string) => Promise<string>;
        generate_selection(): () => string;
        generate_tags(): string[] | null;
        generate_title(): string;
    }
}
declare module "src/core/functions/internal_functions/web/InternalModuleWeb" {
    import { RequestUrlResponse } from "obsidian";
    import { InternalModule } from "src/core/functions/internal_functions/InternalModule";
    import { ModuleName } from "src/editor/TpDocumentation";
    export class InternalModuleWeb extends InternalModule {
        name: ModuleName;
        create_static_templates(): Promise<void>;
        create_dynamic_templates(): Promise<void>;
        teardown(): Promise<void>;
        getRequest(url: string): Promise<RequestUrlResponse>;
        generate_daily_quote(): () => Promise<string>;
        generate_random_picture(): (size: string, query?: string, include_size?: boolean) => Promise<string>;
        generate_request(): (url: string, path?: string) => Promise<string>;
    }
}
declare module "src/core/functions/internal_functions/hooks/InternalModuleHooks" {
    import { ModuleName } from "src/editor/TpDocumentation";
    import { InternalModule } from "src/core/functions/internal_functions/InternalModule";
    export class InternalModuleHooks extends InternalModule {
        name: ModuleName;
        private event_refs;
        create_static_templates(): Promise<void>;
        create_dynamic_templates(): Promise<void>;
        teardown(): Promise<void>;
        generate_on_all_templates_executed(): (callback_function: () => unknown) => void;
    }
}
declare module "src/core/functions/internal_functions/frontmatter/InternalModuleFrontmatter" {
    import { InternalModule } from "src/core/functions/internal_functions/InternalModule";
    import { ModuleName } from "src/editor/TpDocumentation";
    export class InternalModuleFrontmatter extends InternalModule {
        name: ModuleName;
        create_static_templates(): Promise<void>;
        create_dynamic_templates(): Promise<void>;
        teardown(): Promise<void>;
    }
}
declare module "src/core/functions/internal_functions/system/PromptModal" {
    import { App, Modal } from "obsidian";
    import { TemplaterError } from "src/utils/Error";
    export class PromptModal extends Modal {
        private prompt_text;
        private default_value;
        private multi_line;
        private resolve;
        private reject;
        private submitted;
        private value;
        constructor(app: App, prompt_text: string, default_value: string, multi_line: boolean);
        onOpen(): void;
        onClose(): void;
        createForm(): void;
        private enterCallback;
        private resolveAndClose;
        openAndGetValue(resolve: (value: string) => void, reject: (reason?: TemplaterError) => void): Promise<void>;
    }
}
declare module "src/core/functions/internal_functions/system/SuggesterModal" {
    import { TemplaterError } from "src/utils/Error";
    import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";
    export class SuggesterModal<T> extends FuzzySuggestModal<T> {
        private text_items;
        private items;
        private resolve;
        private reject;
        private submitted;
        constructor(app: App, text_items: string[] | ((item: T) => string), items: T[], placeholder: string, limit?: number);
        getItems(): T[];
        onClose(): void;
        selectSuggestion(value: FuzzyMatch<T>, evt: MouseEvent | KeyboardEvent): void;
        getItemText(item: T): string;
        onChooseItem(item: T): void;
        openAndGetValue(resolve: (value: T) => void, reject: (reason?: TemplaterError) => void): Promise<void>;
    }
}
declare module "src/core/functions/internal_functions/system/InternalModuleSystem" {
    import { InternalModule } from "src/core/functions/internal_functions/InternalModule";
    import { ModuleName } from "src/editor/TpDocumentation";
    export class InternalModuleSystem extends InternalModule {
        name: ModuleName;
        create_static_templates(): Promise<void>;
        create_dynamic_templates(): Promise<void>;
        teardown(): Promise<void>;
        generate_clipboard(): () => Promise<string | null>;
        generate_prompt(): (prompt_text: string, default_value: string, throw_on_cancel: boolean, multi_line: boolean) => Promise<string | null>;
        generate_suggester(): <T>(text_items: string[] | ((item: T) => string), items: T[], throw_on_cancel: boolean, placeholder: string, limit?: number) => Promise<T>;
    }
}
declare module "src/core/functions/internal_functions/config/InternalModuleConfig" {
    import { InternalModule } from "src/core/functions/internal_functions/InternalModule";
    import { RunningConfig } from "src/core/Templater";
    import { ModuleName } from "src/editor/TpDocumentation";
    export class InternalModuleConfig extends InternalModule {
        name: ModuleName;
        create_static_templates(): Promise<void>;
        create_dynamic_templates(): Promise<void>;
        teardown(): Promise<void>;
        generate_object(config: RunningConfig): Promise<Record<string, unknown>>;
    }
}
declare module "src/core/functions/internal_functions/InternalFunctions" {
    import TemplaterPlugin from "src/main";
    import { IGenerateObject } from "src/core/functions/IGenerateObject";
    import { RunningConfig } from "src/core/Templater";
    export class InternalFunctions implements IGenerateObject {
        protected plugin: TemplaterPlugin;
        private modules_array;
        constructor(plugin: TemplaterPlugin);
        init(): Promise<void>;
        teardown(): Promise<void>;
        generate_object(config: RunningConfig): Promise<Record<string, unknown>>;
    }
}
declare module "src/core/functions/user_functions/UserSystemFunctions" {
    import TemplaterPlugin from "src/main";
    import { IGenerateObject } from "src/core/functions/IGenerateObject";
    import { RunningConfig } from "src/core/Templater";
    export class UserSystemFunctions implements IGenerateObject {
        private plugin;
        private cwd;
        private exec_promise;
        constructor(plugin: TemplaterPlugin);
        generate_system_functions(config: RunningConfig): Promise<Map<string, (user_args?: Record<string, unknown>) => Promise<string>>>;
        generate_object(config: RunningConfig): Promise<Record<string, unknown>>;
    }
}
declare module "src/core/functions/user_functions/UserScriptFunctions" {
    import { TFile } from "obsidian";
    import TemplaterPlugin from "src/main";
    import { IGenerateObject } from "src/core/functions/IGenerateObject";
    export class UserScriptFunctions implements IGenerateObject {
        private plugin;
        constructor(plugin: TemplaterPlugin);
        generate_user_script_functions(): Promise<Map<string, () => unknown>>;
        load_user_script_function(file: TFile, user_script_functions: Map<string, () => unknown>): Promise<void>;
        generate_object(): Promise<Record<string, unknown>>;
    }
}
declare module "src/core/functions/user_functions/UserFunctions" {
    import TemplaterPlugin from "src/main";
    import { RunningConfig } from "src/core/Templater";
    import { IGenerateObject } from "src/core/functions/IGenerateObject";
    export class UserFunctions implements IGenerateObject {
        private plugin;
        private user_system_functions;
        private user_script_functions;
        constructor(plugin: TemplaterPlugin);
        generate_object(config: RunningConfig): Promise<Record<string, unknown>>;
    }
}
declare module "src/core/functions/FunctionsGenerator" {
    import { InternalFunctions } from "src/core/functions/internal_functions/InternalFunctions";
    import { UserFunctions } from "src/core/functions/user_functions/UserFunctions";
    import TemplaterPlugin from "src/main";
    import { IGenerateObject } from "src/core/functions/IGenerateObject";
    import { RunningConfig } from "src/core/Templater";
    export enum FunctionsMode {
        INTERNAL = 0,
        USER_INTERNAL = 1
    }
    export class FunctionsGenerator implements IGenerateObject {
        private plugin;
        internal_functions: InternalFunctions;
        user_functions: UserFunctions;
        constructor(plugin: TemplaterPlugin);
        init(): Promise<void>;
        teardown(): Promise<void>;
        additional_functions(): Record<string, unknown>;
        generate_object(config: RunningConfig, functions_mode?: FunctionsMode): Promise<Record<string, unknown>>;
    }
}
declare module "src/core/parser/Parser" {
    export class Parser {
        private renderer;
        init(): Promise<void>;
        parse_commands(content: string, context: Record<string, unknown>): Promise<string>;
    }
}
declare module "src/core/Templater" {
    import { App, MarkdownPostProcessorContext, TAbstractFile, TFile, TFolder } from "obsidian";
    import TemplaterPlugin from "src/main";
    import { FunctionsGenerator } from "src/core/functions/FunctionsGenerator";
    import { Parser } from "src/core/parser/Parser";
    export enum RunMode {
        CreateNewFromTemplate = 0,
        AppendActiveFile = 1,
        OverwriteFile = 2,
        OverwriteActiveFile = 3,
        DynamicProcessor = 4,
        StartupTemplate = 5
    }
    export type RunningConfig = {
        template_file: TFile | undefined;
        target_file: TFile;
        run_mode: RunMode;
        active_file?: TFile | null;
    };
    export class Templater {
        private plugin;
        parser: Parser;
        functions_generator: FunctionsGenerator;
        current_functions_object: Record<string, unknown>;
        files_with_pending_templates: Set<string>;
        constructor(plugin: TemplaterPlugin);
        setup(): Promise<void>;
        create_running_config(template_file: TFile | undefined, target_file: TFile, run_mode: RunMode): RunningConfig;
        read_and_parse_template(config: RunningConfig): Promise<string>;
        parse_template(config: RunningConfig, template_content: string): Promise<string>;
        private start_templater_task;
        private end_templater_task;
        create_new_note_from_template(template: TFile | string, folder?: TFolder | string, filename?: string, open_new_note?: boolean): Promise<TFile | undefined>;
        append_template_to_active_file(template_file: TFile): Promise<void>;
        write_template_to_file(template_file: TFile, file: TFile): Promise<void>;
        overwrite_active_file_commands(): void;
        overwrite_file_commands(file: TFile, active_file?: boolean): Promise<void>;
        process_dynamic_templates(el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void>;
        get_new_file_template_for_folder(folder: TFolder): string | undefined;
        get_new_file_template_for_file(file: TFile): string | undefined;
        static on_file_creation(templater: Templater, app: App, file: TAbstractFile): Promise<void>;
        execute_startup_scripts(): Promise<void>;
    }
}
declare module "src/handlers/EventHandler" {
    import TemplaterPlugin from "src/main";
    import { Templater } from "src/core/Templater";
    import { Settings } from "src/settings/Settings";
    export default class EventHandler {
        private plugin;
        private templater;
        private settings;
        private trigger_on_file_creation_event;
        constructor(plugin: TemplaterPlugin, templater: Templater, settings: Settings);
        setup(): void;
        update_syntax_highlighting(): void;
        update_trigger_file_on_creation(): void;
        update_file_menu(): void;
    }
}
declare module "src/handlers/CommandHandler" {
    import TemplaterPlugin from "src/main";
    export class CommandHandler {
        private plugin;
        constructor(plugin: TemplaterPlugin);
        setup(): void;
        register_templates_hotkeys(): void;
        add_template_hotkey(old_template: string | null, new_template: string): void;
        remove_template_hotkey(template: string | null): void;
    }
}
declare module "src/editor/CursorJumper" {
    import { App, EditorPosition } from "obsidian";
    export class CursorJumper {
        private app;
        constructor(app: App);
        jump_to_next_cursor_location(): Promise<void>;
        get_editor_position_from_index(content: string, index: number): EditorPosition;
        replace_and_get_cursor_positions(content: string): {
            new_content?: string;
            positions?: EditorPosition[];
        };
        set_cursor_location(positions: EditorPosition[]): void;
    }
}
declare module "src/editor/Autocomplete" {
    import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from "obsidian";
    import { TpSuggestDocumentation } from "src/editor/TpDocumentation";
    import { IntellisenseRenderOption } from "src/settings/RenderSettings/IntellisenseRenderOption";
    import TemplaterPlugin from "src/main";
    export class Autocomplete extends EditorSuggest<TpSuggestDocumentation> {
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
}
declare module "src/editor/Editor" {
    import { TFile } from "obsidian";
    import TemplaterPlugin from "src/main";
    import "editor/mode/javascript";
    import "editor/mode/custom_overlay";
    export class Editor {
        private plugin;
        private cursor_jumper;
        private activeEditorExtensions;
        private templaterLanguage;
        private autocomplete;
        constructor(plugin: TemplaterPlugin);
        desktopShouldHighlight(): boolean;
        mobileShouldHighlight(): boolean;
        setup(): Promise<void>;
        enable_highlighter(): Promise<void>;
        disable_highlighter(): Promise<void>;
        jump_to_next_cursor_location(file?: TFile | null, auto_jump?: boolean): Promise<void>;
        registerCodeMirrorMode(): Promise<void>;
        updateEditorIntellisenseSetting(value: any): void;
    }
}
declare module "src/main" {
    import { Plugin } from "obsidian";
    import { Settings } from "src/settings/Settings";
    import { FuzzySuggester } from "src/handlers/FuzzySuggester";
    import { Templater } from "src/core/Templater";
    import EventHandler from "src/handlers/EventHandler";
    import { CommandHandler } from "src/handlers/CommandHandler";
    import { Editor } from "src/editor/Editor";
    export default class TemplaterPlugin extends Plugin {
        settings: Settings;
        templater: Templater;
        event_handler: EventHandler;
        command_handler: CommandHandler;
        fuzzy_suggester: FuzzySuggester;
        editor_handler: Editor;
        onload(): Promise<void>;
        onunload(): void;
        save_settings(): Promise<void>;
        load_settings(): Promise<void>;
    }
}
declare module "src/types" {
    module "obsidian" {
        interface App {
            dom: {
                appContainerEl: HTMLElement;
            };
        }
        interface Vault {
            getConfig: (key: string) => string;
            exists: (path: string) => Promise<boolean>;
            getAvailablePath: (path: string, extension: string) => string;
            getAbstractFileByPathInsensitive: (path: string) => string;
        }
        interface DataAdapter {
            basePath: string;
            fs: {
                uri: string;
            };
        }
        interface Workspace {
            on(name: "templater:all-templates-executed", callback: () => unknown): EventRef;
            onLayoutReadyCallbacks?: {
                pluginId: string;
                callback: () => void;
            }[];
        }
        interface EventRef {
            e: Events;
        }
        interface MarkdownSubView {
            applyFoldInfo(foldInfo: FoldInfo): void;
            getFoldInfo(): FoldInfo | null;
        }
        interface FoldInfo {
            folds: FoldRange[];
            lines: number;
        }
        interface FoldRange {
            from: number;
            to: number;
        }
    }
    export {};
}
declare module "tests/InternalTemplates/InternalModuleFile.test" {
    import TestTemplaterPlugin from "tests/main.test";
    export function InternalModuleFileTests(t: TestTemplaterPlugin): void;
}
declare module "tests/InternalTemplates/InternalModuleDate.test" {
    import TestTemplaterPlugin from "../../main.test";
    export function InternalModuleDateTests(t: TestTemplaterPlugin): void;
}
declare module "tests/InternalTemplates/InternalModuleFrontmatter.test" {
    import TestTemplaterPlugin from "../../main.test";
    export function InternalModuleFrontmatterTests(t: TestTemplaterPlugin): void;
}
declare module "tests/InternalTemplates/InternalModuleHooks.test" {
    import TestTemplaterPlugin from "../../main.test";
    export function InternalModuleHooksTests(t: TestTemplaterPlugin): void;
}
declare module "tests/InternalTemplates/InternalModuleSystem.test" {
    import TestTemplaterPlugin from "../../main.test";
    export function InternalModuleSystemTests(t: TestTemplaterPlugin): void;
}
declare module "tests/InternalTemplates/InternalModuleConfig.test" {
    import TestTemplaterPlugin from "../../main.test";
    export function InternalModuleConfigTests(t: TestTemplaterPlugin): void;
}
declare module "tests/main.test" {
    import { Plugin, TAbstractFile, TFile, TFolder } from "obsidian";
    import TemplaterPlugin from "src/main";
    export interface TestRunConfig {
        template_content: string;
        target_content: string;
        wait_cache: boolean;
        skip_template_modify: boolean;
        skip_target_modify: boolean;
    }
    export default class TestTemplaterPlugin extends Plugin {
        tests: Array<{
            name: string;
            fn: () => Promise<void>;
        }>;
        plugin: TemplaterPlugin;
        template_file: TFile;
        target_file: TFile;
        active_files: Array<TAbstractFile>;
        onload(): Promise<void>;
        setup(): Promise<void>;
        teardown(): Promise<void>;
        disable_external_plugins(): Promise<void>;
        enable_external_plugins(): Promise<void>;
        load_tests(): Promise<void>;
        test(name: string, fn: () => Promise<void>): void;
        run_tests(): Promise<void>;
        cleanupFiles(): Promise<void>;
        retrieveActiveFile(file_name: string): TAbstractFile;
        createFolder(folder_name: string): Promise<TFolder>;
        createFile(file_name: string, file_content?: string): Promise<TFile>;
        run_and_get_output(template_content: string, target_content?: string, waitCache?: boolean, skip_modify?: boolean): Promise<string>;
        create_new_note_from_template_and_get_output(template_content: string, delay_ms?: number): Promise<string | undefined>;
        run_in_new_leaf(template_content: string, target_content?: string, waitCache?: boolean, skip_modify?: boolean): Promise<void>;
    }
}
declare module "tests/utils.test" {
    import TestTemplaterPlugin from "tests/main.test";
    export const PLUGIN_NAME = "templater-obsidian";
    export const TEMPLATE_FILE_NAME = "TemplateFile";
    export const TARGET_FILE_NAME = "TargetFile";
    export function delay(ms: number): Promise<void>;
    export function cache_update(t: TestTemplaterPlugin): Promise<void>;
    export function properties_are_visible(): boolean;
}
declare module "tests/Templater.test" {
    import TestTemplaterPlugin from "../main.test";
    export function TemplaterTests(t: TestTemplaterPlugin): void;
}
