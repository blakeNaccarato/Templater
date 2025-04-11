import { TJDocFile } from "./TJDocFile";
import { App, TFile, TFolder } from "obsidian";
export declare function delay(ms: number): Promise<void>;
export declare function escape_RegExp(str: string): string;
export declare function generate_command_regex(): RegExp;
export declare function generate_dynamic_command_regex(): RegExp;
export declare function resolve_tfolder(app: App, folder_str: string): TFolder;
export declare function resolve_tfile(app: App, file_str: string): TFile;
export declare function get_tfiles_from_folder(app: App, folder_str: string): Array<TFile>;
export declare function populate_docs_from_user_scripts(app: App, files: Array<TFile>): Promise<TJDocFile[]>;
export declare function arraymove<T>(arr: T[], fromIndex: number, toIndex: number): void;
export declare function get_active_file(app: App): TFile | null;
/**
 * @param path Normalized file path
 * @returns Folder path
 * @example
 * get_folder_path_from_path(normalizePath("path/to/folder/file", "md")) // path/to/folder
 */
export declare function get_folder_path_from_file_path(path: string): string;
export declare function is_object(obj: unknown): obj is Record<string, unknown>;
export declare function get_fn_params(func: (...args: unknown[]) => unknown): string[];
/**
 * Use a parent HtmlElement to create a label with a value
 * @param parent The parent HtmlElement; Use HtmlOListElement to return a `li` element
 * @param title The title for the label which will be bolded
 * @param value The value of the label
 * @returns A label HtmlElement (p | li)
 */
export declare function append_bolded_label_with_value_to_parent(parent: HTMLElement, title: string, value: string): HTMLElement;
//# sourceMappingURL=Utils.d.ts.map