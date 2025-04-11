import { InternalModule } from "../InternalModule";
import { log_error } from "utils/Log";
import { FileSystemAdapter, getAllTags, moment, normalizePath, parseLinktext, Platform, resolveSubpath, TFile, } from "obsidian";
import { TemplaterError } from "utils/Error";
export const DEPTH_LIMIT = 10;
export class InternalModuleFile extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "file";
        this.include_depth = 0;
        this.create_new_depth = 0;
        this.linkpath_regex = new RegExp("^\\[\\[(.*)\\]\\]$");
    }
    async create_static_templates() {
        this.static_functions.set("creation_date", this.generate_creation_date());
        this.static_functions.set("create_new", this.generate_create_new());
        this.static_functions.set("cursor", this.generate_cursor());
        this.static_functions.set("cursor_append", this.generate_cursor_append());
        this.static_functions.set("exists", this.generate_exists());
        this.static_functions.set("find_tfile", this.generate_find_tfile());
        this.static_functions.set("folder", this.generate_folder());
        this.static_functions.set("include", this.generate_include());
        this.static_functions.set("last_modified_date", this.generate_last_modified_date());
        this.static_functions.set("move", this.generate_move());
        this.static_functions.set("path", this.generate_path());
        this.static_functions.set("rename", this.generate_rename());
        this.static_functions.set("selection", this.generate_selection());
    }
    async create_dynamic_templates() {
        this.dynamic_functions.set("content", await this.generate_content());
        this.dynamic_functions.set("tags", this.generate_tags());
        this.dynamic_functions.set("title", this.generate_title());
    }
    async teardown() { }
    async generate_content() {
        return await this.plugin.app.vault.read(this.config.target_file);
    }
    generate_create_new() {
        return async (template, filename, open_new = false, folder) => {
            this.create_new_depth += 1;
            if (this.create_new_depth > DEPTH_LIMIT) {
                this.create_new_depth = 0;
                throw new TemplaterError("Reached create_new depth limit (max = 10)");
            }
            const new_file = await this.plugin.templater.create_new_note_from_template(template, folder, filename, open_new);
            this.create_new_depth -= 1;
            return new_file;
        };
    }
    generate_creation_date() {
        return (format = "YYYY-MM-DD HH:mm") => {
            return moment(this.config.target_file.stat.ctime).format(format);
        };
    }
    generate_cursor() {
        return (order) => {
            // Hack to prevent empty output
            return `<% tp.file.cursor(${order ?? ""}) %>`;
        };
    }
    generate_cursor_append() {
        return (content) => {
            const active_editor = this.plugin.app.workspace.activeEditor;
            if (!active_editor || !active_editor.editor) {
                log_error(new TemplaterError("No active editor, can't append to cursor."));
                return;
            }
            const editor = active_editor.editor;
            const doc = editor.getDoc();
            doc.replaceSelection(content);
            return "";
        };
    }
    generate_exists() {
        return async (filepath) => {
            const path = normalizePath(filepath);
            return await this.plugin.app.vault.exists(path);
        };
    }
    generate_find_tfile() {
        return (filename) => {
            const path = normalizePath(filename);
            return this.plugin.app.metadataCache.getFirstLinkpathDest(path, "");
        };
    }
    generate_folder() {
        return (absolute = false) => {
            const parent = this.config.target_file.parent;
            let folder;
            if (absolute) {
                folder = parent.path;
            }
            else {
                folder = parent.name;
            }
            return folder;
        };
    }
    generate_include() {
        return async (include_link) => {
            // TODO: Add mutex for this, this may currently lead to a race condition.
            // While not very impactful, that could still be annoying.
            this.include_depth += 1;
            if (this.include_depth > DEPTH_LIMIT) {
                this.include_depth -= 1;
                throw new TemplaterError("Reached inclusion depth limit (max = 10)");
            }
            let inc_file_content;
            if (include_link instanceof TFile) {
                inc_file_content = await this.plugin.app.vault.read(include_link);
            }
            else {
                let match;
                if ((match = this.linkpath_regex.exec(include_link)) === null) {
                    this.include_depth -= 1;
                    throw new TemplaterError("Invalid file format, provide an obsidian link between quotes.");
                }
                const { path, subpath } = parseLinktext(match[1]);
                const inc_file = this.plugin.app.metadataCache.getFirstLinkpathDest(path, "");
                if (!inc_file) {
                    this.include_depth -= 1;
                    throw new TemplaterError(`File ${include_link} doesn't exist`);
                }
                inc_file_content = await this.plugin.app.vault.read(inc_file);
                if (subpath) {
                    const cache = this.plugin.app.metadataCache.getFileCache(inc_file);
                    if (cache) {
                        const result = resolveSubpath(cache, subpath);
                        if (result) {
                            inc_file_content = inc_file_content.slice(result.start.offset, result.end?.offset);
                        }
                    }
                }
            }
            try {
                const parsed_content = await this.plugin.templater.parser.parse_commands(inc_file_content, this.plugin.templater.current_functions_object);
                this.include_depth -= 1;
                return parsed_content;
            }
            catch (e) {
                this.include_depth -= 1;
                throw e;
            }
        };
    }
    generate_last_modified_date() {
        return (format = "YYYY-MM-DD HH:mm") => {
            return moment(this.config.target_file.stat.mtime).format(format);
        };
    }
    generate_move() {
        return async (path, file_to_move) => {
            const file = file_to_move || this.config.target_file;
            const new_path = normalizePath(`${path}.${file.extension}`);
            const dirs = new_path.replace(/\\/g, "/").split("/");
            dirs.pop(); // remove basename
            if (dirs.length) {
                const dir = dirs.join("/");
                if (!this.plugin.app.vault.getAbstractFileByPath(dir)) {
                    await this.plugin.app.vault.createFolder(dir);
                }
            }
            await this.plugin.app.fileManager.renameFile(file, new_path);
            return "";
        };
    }
    generate_path() {
        return (relative = false) => {
            let vault_path = "";
            if (Platform.isMobile) {
                const vault_adapter = this.plugin.app.vault.adapter.fs.uri;
                const vault_base = this.plugin.app.vault.adapter.basePath;
                vault_path = `${vault_adapter}/${vault_base}`;
            }
            else {
                if (this.plugin.app.vault.adapter instanceof FileSystemAdapter) {
                    vault_path = this.plugin.app.vault.adapter.getBasePath();
                }
                else {
                    throw new TemplaterError("app.vault is not a FileSystemAdapter instance");
                }
            }
            if (relative) {
                return this.config.target_file.path;
            }
            else {
                return `${vault_path}/${this.config.target_file.path}`;
            }
        };
    }
    generate_rename() {
        return async (new_title) => {
            if (new_title.match(/[\\/:]+/g)) {
                throw new TemplaterError("File name cannot contain any of these characters: \\ / :");
            }
            const new_path = normalizePath(`${this.config.target_file.parent.path}/${new_title}.${this.config.target_file.extension}`);
            await this.plugin.app.fileManager.renameFile(this.config.target_file, new_path);
            return "";
        };
    }
    generate_selection() {
        return () => {
            const active_editor = this.plugin.app.workspace.activeEditor;
            if (!active_editor || !active_editor.editor) {
                throw new TemplaterError("Active editor is null, can't read selection.");
            }
            const editor = active_editor.editor;
            return editor.getSelection();
        };
    }
    // TODO: Turn this into a function
    generate_tags() {
        const cache = this.plugin.app.metadataCache.getFileCache(this.config.target_file);
        if (cache) {
            return getAllTags(cache);
        }
        return null;
    }
    // TODO: Turn this into a function
    generate_title() {
        return this.config.target_file.basename;
    }
}
