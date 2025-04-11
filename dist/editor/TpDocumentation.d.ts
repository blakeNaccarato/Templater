import TemplaterPlugin from "main";
declare const module_names: readonly ["app", "config", "date", "file", "frontmatter", "hooks", "obsidian", "system", "user", "web"];
export type ModuleName = (typeof module_names)[number];
export declare function is_module_name(x: unknown): x is ModuleName;
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
export declare function is_function_documentation(x: TpSuggestDocumentation): x is TpFunctionDocumentation;
export declare class Documentation {
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
export {};
