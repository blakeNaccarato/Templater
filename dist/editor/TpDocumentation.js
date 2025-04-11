import { errorWrapper } from "utils/Error";
import { get_fn_params, get_tfiles_from_folder, is_object, populate_docs_from_user_scripts } from "utils/Utils";
import documentation from "../../docs/documentation.toml";
const module_names = [
    "app",
    "config",
    "date",
    "file",
    "frontmatter",
    "hooks",
    "obsidian",
    "system",
    "user",
    "web",
];
const module_names_checker = new Set(module_names);
export function is_module_name(x) {
    return typeof x === "string" && module_names_checker.has(x);
}
export function is_function_documentation(x) {
    if (x.definition ||
        x.returns ||
        x.args) {
        return true;
    }
    return false;
}
export class Documentation {
    constructor(plugin) {
        this.plugin = plugin;
        this.documentation = documentation;
    }
    get_all_modules_documentation() {
        let tp = this.documentation.tp;
        // Remove 'user' if no user scripts found
        if (!this.plugin.settings ||
            !this.plugin.settings.user_scripts_folder) {
            tp = Object.values(tp).filter((x) => x.name !== 'user');
        }
        return Object.values(tp).map((mod) => {
            mod.queryKey = mod.name;
            return mod;
        });
    }
    async get_all_functions_documentation(module_name, function_name) {
        if (module_name === "app") {
            return this.get_app_functions_documentation(this.plugin.app, function_name);
        }
        if (module_name === "user") {
            if (!this.plugin.settings ||
                !this.plugin.settings.user_scripts_folder)
                return;
            const files = await errorWrapper(async () => {
                const files = get_tfiles_from_folder(this.plugin.app, this.plugin.settings.user_scripts_folder).filter(x => x.extension == "js");
                const docFiles = await populate_docs_from_user_scripts(this.plugin.app, files);
                return docFiles;
            }, `User Scripts folder doesn't exist`);
            if (!files || files.length === 0)
                return;
            return files.reduce((processedFiles, file) => {
                if (file.extension !== "js")
                    return processedFiles;
                const values = [
                    ...processedFiles,
                    {
                        name: file.basename,
                        queryKey: file.basename,
                        definition: "",
                        description: file.description,
                        returns: file.returns,
                        args: file.arguments.reduce((acc, arg) => {
                            acc[arg.name] = {
                                name: arg.name,
                                description: arg.description
                            };
                            return acc;
                        }, {}),
                        example: "",
                    },
                ];
                return values;
            }, []);
        }
        if (!this.documentation.tp[module_name].functions) {
            return;
        }
        return Object.values(this.documentation.tp[module_name].functions).map((mod) => {
            mod.queryKey = mod.name;
            return mod;
        });
    }
    get_app_functions_documentation(obj, path) {
        if (!is_object(obj)) {
            return [];
        }
        const parts = path.split(".");
        if (parts.length === 0) {
            return [];
        }
        let currentObj = obj;
        for (let index = 0; index < parts.length - 1; index++) {
            const part = parts[index];
            if (part in currentObj) {
                if (!is_object(currentObj[part])) {
                    return [];
                }
                currentObj = currentObj[part];
            }
        }
        const definitionPrefix = [
            "tp",
            "app",
            ...parts.slice(0, parts.length - 1),
        ].join(".");
        const queryKeyPrefix = parts.slice(0, parts.length - 1).join(".");
        const docs = [];
        for (const key in currentObj) {
            const definition = `${definitionPrefix}.${key}`;
            const queryKey = queryKeyPrefix ? `${queryKeyPrefix}.${key}` : key;
            docs.push({
                name: key,
                queryKey,
                definition: typeof currentObj[key] === "function"
                    ? `${definition}(${get_fn_params(currentObj[key])})`
                    : definition,
                description: "",
                returns: "",
                example: "",
            });
        }
        return docs;
    }
    get_module_documentation(module_name) {
        return this.documentation.tp[module_name];
    }
    get_function_documentation(module_name, function_name) {
        return this.documentation.tp[module_name].functions[function_name];
    }
    get_argument_documentation(module_name, function_name, argument_name) {
        const function_doc = this.get_function_documentation(module_name, function_name);
        if (!function_doc || !function_doc.args) {
            return null;
        }
        return function_doc.args[argument_name];
    }
}
