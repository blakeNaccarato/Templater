import { __awaiter } from "tslib";
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
    create_static_templates() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    create_dynamic_templates() {
        return __awaiter(this, void 0, void 0, function* () {
            this.dynamic_functions.set("content", yield this.generate_content());
            this.dynamic_functions.set("tags", this.generate_tags());
            this.dynamic_functions.set("title", this.generate_title());
        });
    }
    teardown() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    generate_content() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.plugin.app.vault.read(this.config.target_file);
        });
    }
    generate_create_new() {
        return (template, filename, open_new = false, folder) => __awaiter(this, void 0, void 0, function* () {
            this.create_new_depth += 1;
            if (this.create_new_depth > DEPTH_LIMIT) {
                this.create_new_depth = 0;
                throw new TemplaterError("Reached create_new depth limit (max = 10)");
            }
            const new_file = yield this.plugin.templater.create_new_note_from_template(template, folder, filename, open_new);
            this.create_new_depth -= 1;
            return new_file;
        });
    }
    generate_creation_date() {
        return (format = "YYYY-MM-DD HH:mm") => {
            return moment(this.config.target_file.stat.ctime).format(format);
        };
    }
    generate_cursor() {
        return (order) => {
            // Hack to prevent empty output
            return `<% tp.file.cursor(${order !== null && order !== void 0 ? order : ""}) %>`;
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
        return (filepath) => __awaiter(this, void 0, void 0, function* () {
            const path = normalizePath(filepath);
            return yield this.plugin.app.vault.exists(path);
        });
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
        return (include_link) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            // TODO: Add mutex for this, this may currently lead to a race condition.
            // While not very impactful, that could still be annoying.
            this.include_depth += 1;
            if (this.include_depth > DEPTH_LIMIT) {
                this.include_depth -= 1;
                throw new TemplaterError("Reached inclusion depth limit (max = 10)");
            }
            let inc_file_content;
            if (include_link instanceof TFile) {
                inc_file_content = yield this.plugin.app.vault.read(include_link);
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
                inc_file_content = yield this.plugin.app.vault.read(inc_file);
                if (subpath) {
                    const cache = this.plugin.app.metadataCache.getFileCache(inc_file);
                    if (cache) {
                        const result = resolveSubpath(cache, subpath);
                        if (result) {
                            inc_file_content = inc_file_content.slice(result.start.offset, (_a = result.end) === null || _a === void 0 ? void 0 : _a.offset);
                        }
                    }
                }
            }
            try {
                const parsed_content = yield this.plugin.templater.parser.parse_commands(inc_file_content, this.plugin.templater.current_functions_object);
                this.include_depth -= 1;
                return parsed_content;
            }
            catch (e) {
                this.include_depth -= 1;
                throw e;
            }
        });
    }
    generate_last_modified_date() {
        return (format = "YYYY-MM-DD HH:mm") => {
            return moment(this.config.target_file.stat.mtime).format(format);
        };
    }
    generate_move() {
        return (path, file_to_move) => __awaiter(this, void 0, void 0, function* () {
            const file = file_to_move || this.config.target_file;
            const new_path = normalizePath(`${path}.${file.extension}`);
            const dirs = new_path.replace(/\\/g, "/").split("/");
            dirs.pop(); // remove basename
            if (dirs.length) {
                const dir = dirs.join("/");
                if (!this.plugin.app.vault.getAbstractFileByPath(dir)) {
                    yield this.plugin.app.vault.createFolder(dir);
                }
            }
            yield this.plugin.app.fileManager.renameFile(file, new_path);
            return "";
        });
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
        return (new_title) => __awaiter(this, void 0, void 0, function* () {
            if (new_title.match(/[\\/:]+/g)) {
                throw new TemplaterError("File name cannot contain any of these characters: \\ / :");
            }
            const new_path = normalizePath(`${this.config.target_file.parent.path}/${new_title}.${this.config.target_file.extension}`);
            yield this.plugin.app.fileManager.renameFile(this.config.target_file, new_path);
            return "";
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJuYWxNb2R1bGVGaWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NvcmUvZnVuY3Rpb25zL2ludGVybmFsX2Z1bmN0aW9ucy9maWxlL0ludGVybmFsTW9kdWxlRmlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDdEMsT0FBTyxFQUNILGlCQUFpQixFQUNqQixVQUFVLEVBQ1YsTUFBTSxFQUNOLGFBQWEsRUFDYixhQUFhLEVBQ2IsUUFBUSxFQUNSLGNBQWMsRUFDZCxLQUFLLEdBRVIsTUFBTSxVQUFVLENBQUM7QUFDbEIsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUc3QyxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBRTlCLE1BQU0sT0FBTyxrQkFBbUIsU0FBUSxjQUFjO0lBQXREOztRQUNXLFNBQUksR0FBZSxNQUFNLENBQUM7UUFDekIsa0JBQWEsR0FBRyxDQUFDLENBQUM7UUFDbEIscUJBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLG1CQUFjLEdBQUcsSUFBSSxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztJQStTOUQsQ0FBQztJQTdTUyx1QkFBdUI7O1lBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQ3JCLGVBQWUsRUFDZixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FDaEMsQ0FBQztZQUNGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUM7WUFDcEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFDNUQsSUFB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LEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUNwRCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FDMUIsQ0FBQztRQUVGLElBQUksS0FBSyxFQUFFO1lBQ1AsT0FBTyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDNUI7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQsa0NBQWtDO0lBQ2xDLGNBQWM7UUFDVixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQztJQUM1QyxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbnRlcm5hbE1vZHVsZSB9IGZyb20gXCIuLi9JbnRlcm5hbE1vZHVsZVwiO1xyXG5pbXBvcnQgeyBsb2dfZXJyb3IgfSBmcm9tIFwidXRpbHMvTG9nXCI7XHJcbmltcG9ydCB7XHJcbiAgICBGaWxlU3lzdGVtQWRhcHRlcixcclxuICAgIGdldEFsbFRhZ3MsXHJcbiAgICBtb21lbnQsXHJcbiAgICBub3JtYWxpemVQYXRoLFxyXG4gICAgcGFyc2VMaW5rdGV4dCxcclxuICAgIFBsYXRmb3JtLFxyXG4gICAgcmVzb2x2ZVN1YnBhdGgsXHJcbiAgICBURmlsZSxcclxuICAgIFRGb2xkZXIsXHJcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlckVycm9yIH0gZnJvbSBcInV0aWxzL0Vycm9yXCI7XHJcbmltcG9ydCB7IE1vZHVsZU5hbWUgfSBmcm9tIFwiZWRpdG9yL1RwRG9jdW1lbnRhdGlvblwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IERFUFRIX0xJTUlUID0gMTA7XHJcblxyXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxNb2R1bGVGaWxlIGV4dGVuZHMgSW50ZXJuYWxNb2R1bGUge1xyXG4gICAgcHVibGljIG5hbWU6IE1vZHVsZU5hbWUgPSBcImZpbGVcIjtcclxuICAgIHByaXZhdGUgaW5jbHVkZV9kZXB0aCA9IDA7XHJcbiAgICBwcml2YXRlIGNyZWF0ZV9uZXdfZGVwdGggPSAwO1xyXG4gICAgcHJpdmF0ZSBsaW5rcGF0aF9yZWdleCA9IG5ldyBSZWdFeHAoXCJeXFxcXFtcXFxcWyguKilcXFxcXVxcXFxdJFwiKTtcclxuXHJcbiAgICBhc3luYyBjcmVhdGVfc3RhdGljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFxyXG4gICAgICAgICAgICBcImNyZWF0aW9uX2RhdGVcIixcclxuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZV9jcmVhdGlvbl9kYXRlKClcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJjcmVhdGVfbmV3XCIsIHRoaXMuZ2VuZXJhdGVfY3JlYXRlX25ldygpKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwiY3Vyc29yXCIsIHRoaXMuZ2VuZXJhdGVfY3Vyc29yKCkpO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXHJcbiAgICAgICAgICAgIFwiY3Vyc29yX2FwcGVuZFwiLFxyXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlX2N1cnNvcl9hcHBlbmQoKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcImV4aXN0c1wiLCB0aGlzLmdlbmVyYXRlX2V4aXN0cygpKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwiZmluZF90ZmlsZVwiLCB0aGlzLmdlbmVyYXRlX2ZpbmRfdGZpbGUoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcImZvbGRlclwiLCB0aGlzLmdlbmVyYXRlX2ZvbGRlcigpKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwiaW5jbHVkZVwiLCB0aGlzLmdlbmVyYXRlX2luY2x1ZGUoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcclxuICAgICAgICAgICAgXCJsYXN0X21vZGlmaWVkX2RhdGVcIixcclxuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZV9sYXN0X21vZGlmaWVkX2RhdGUoKVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcIm1vdmVcIiwgdGhpcy5nZW5lcmF0ZV9tb3ZlKCkpO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJwYXRoXCIsIHRoaXMuZ2VuZXJhdGVfcGF0aCgpKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwicmVuYW1lXCIsIHRoaXMuZ2VuZXJhdGVfcmVuYW1lKCkpO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJzZWxlY3Rpb25cIiwgdGhpcy5nZW5lcmF0ZV9zZWxlY3Rpb24oKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgY3JlYXRlX2R5bmFtaWNfdGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMuZHluYW1pY19mdW5jdGlvbnMuc2V0KFwiY29udGVudFwiLCBhd2FpdCB0aGlzLmdlbmVyYXRlX2NvbnRlbnQoKSk7XHJcbiAgICAgICAgdGhpcy5keW5hbWljX2Z1bmN0aW9ucy5zZXQoXCJ0YWdzXCIsIHRoaXMuZ2VuZXJhdGVfdGFncygpKTtcclxuICAgICAgICB0aGlzLmR5bmFtaWNfZnVuY3Rpb25zLnNldChcInRpdGxlXCIsIHRoaXMuZ2VuZXJhdGVfdGl0bGUoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgdGVhcmRvd24oKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICAgIGFzeW5jIGdlbmVyYXRlX2NvbnRlbnQoKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LnJlYWQodGhpcy5jb25maWcudGFyZ2V0X2ZpbGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2NyZWF0ZV9uZXcoKTogKFxyXG4gICAgICAgIHRlbXBsYXRlOiBURmlsZSB8IHN0cmluZyxcclxuICAgICAgICBmaWxlbmFtZTogc3RyaW5nLFxyXG4gICAgICAgIG9wZW5fbmV3OiBib29sZWFuLFxyXG4gICAgICAgIGZvbGRlcj86IFRGb2xkZXIgfCBzdHJpbmdcclxuICAgICkgPT4gUHJvbWlzZTxURmlsZSB8IHVuZGVmaW5lZD4ge1xyXG4gICAgICAgIHJldHVybiBhc3luYyAoXHJcbiAgICAgICAgICAgIHRlbXBsYXRlOiBURmlsZSB8IHN0cmluZyxcclxuICAgICAgICAgICAgZmlsZW5hbWU6IHN0cmluZyxcclxuICAgICAgICAgICAgb3Blbl9uZXcgPSBmYWxzZSxcclxuICAgICAgICAgICAgZm9sZGVyPzogVEZvbGRlciB8IHN0cmluZ1xyXG4gICAgICAgICkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZV9uZXdfZGVwdGggKz0gMTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3JlYXRlX25ld19kZXB0aCA+IERFUFRIX0xJTUlUKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZV9uZXdfZGVwdGggPSAwO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRlbXBsYXRlckVycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiUmVhY2hlZCBjcmVhdGVfbmV3IGRlcHRoIGxpbWl0IChtYXggPSAxMClcIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgbmV3X2ZpbGUgPVxyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udGVtcGxhdGVyLmNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKFxyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlcixcclxuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBvcGVuX25ld1xyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlX25ld19kZXB0aCAtPSAxO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5ld19maWxlO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfY3JlYXRpb25fZGF0ZSgpOiAoZm9ybWF0Pzogc3RyaW5nKSA9PiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiAoZm9ybWF0ID0gXCJZWVlZLU1NLUREIEhIOm1tXCIpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG1vbWVudCh0aGlzLmNvbmZpZy50YXJnZXRfZmlsZS5zdGF0LmN0aW1lKS5mb3JtYXQoZm9ybWF0KTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2N1cnNvcigpOiAob3JkZXI/OiBudW1iZXIpID0+IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIChvcmRlcj86IG51bWJlcikgPT4ge1xyXG4gICAgICAgICAgICAvLyBIYWNrIHRvIHByZXZlbnQgZW1wdHkgb3V0cHV0XHJcbiAgICAgICAgICAgIHJldHVybiBgPCUgdHAuZmlsZS5jdXJzb3IoJHtvcmRlciA/PyBcIlwifSkgJT5gO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfY3Vyc29yX2FwcGVuZCgpOiAoY29udGVudDogc3RyaW5nKSA9PiB2b2lkIHtcclxuICAgICAgICByZXR1cm4gKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZV9lZGl0b3IgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLmFjdGl2ZUVkaXRvcjtcclxuICAgICAgICAgICAgaWYgKCFhY3RpdmVfZWRpdG9yIHx8ICFhY3RpdmVfZWRpdG9yLmVkaXRvcikge1xyXG4gICAgICAgICAgICAgICAgbG9nX2Vycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJObyBhY3RpdmUgZWRpdG9yLCBjYW4ndCBhcHBlbmQgdG8gY3Vyc29yLlwiXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYWN0aXZlX2VkaXRvci5lZGl0b3I7XHJcbiAgICAgICAgICAgIGNvbnN0IGRvYyA9IGVkaXRvci5nZXREb2MoKTtcclxuICAgICAgICAgICAgZG9jLnJlcGxhY2VTZWxlY3Rpb24oY29udGVudCk7XHJcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfZXhpc3RzKCk6IChmaWxlcGF0aDogc3RyaW5nKSA9PiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgICAgICByZXR1cm4gYXN5bmMgKGZpbGVwYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoZmlsZXBhdGgpO1xyXG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmV4aXN0cyhwYXRoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2ZpbmRfdGZpbGUoKTogKGZpbGVuYW1lOiBzdHJpbmcpID0+IFRGaWxlIHwgbnVsbCB7XHJcbiAgICAgICAgcmV0dXJuIChmaWxlbmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBub3JtYWxpemVQYXRoKGZpbGVuYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KHBhdGgsIFwiXCIpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfZm9sZGVyKCk6IChhYnNvbHV0ZT86IGJvb2xlYW4pID0+IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIChhYnNvbHV0ZSA9IGZhbHNlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuY29uZmlnLnRhcmdldF9maWxlLnBhcmVudDtcclxuICAgICAgICAgICAgbGV0IGZvbGRlcjtcclxuXHJcbiAgICAgICAgICAgIGlmIChhYnNvbHV0ZSkge1xyXG4gICAgICAgICAgICAgICAgZm9sZGVyID0gcGFyZW50LnBhdGg7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmb2xkZXIgPSBwYXJlbnQubmFtZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZvbGRlcjtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2luY2x1ZGUoKTogKGluY2x1ZGVfbGluazogc3RyaW5nIHwgVEZpbGUpID0+IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jIChpbmNsdWRlX2xpbms6IHN0cmluZyB8IFRGaWxlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtdXRleCBmb3IgdGhpcywgdGhpcyBtYXkgY3VycmVudGx5IGxlYWQgdG8gYSByYWNlIGNvbmRpdGlvbi5cclxuICAgICAgICAgICAgLy8gV2hpbGUgbm90IHZlcnkgaW1wYWN0ZnVsLCB0aGF0IGNvdWxkIHN0aWxsIGJlIGFubm95aW5nLlxyXG4gICAgICAgICAgICB0aGlzLmluY2x1ZGVfZGVwdGggKz0gMTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaW5jbHVkZV9kZXB0aCA+IERFUFRIX0xJTUlUKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluY2x1ZGVfZGVwdGggLT0gMTtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBcIlJlYWNoZWQgaW5jbHVzaW9uIGRlcHRoIGxpbWl0IChtYXggPSAxMClcIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGluY19maWxlX2NvbnRlbnQ6IHN0cmluZztcclxuXHJcbiAgICAgICAgICAgIGlmIChpbmNsdWRlX2xpbmsgaW5zdGFuY2VvZiBURmlsZSkge1xyXG4gICAgICAgICAgICAgICAgaW5jX2ZpbGVfY29udGVudCA9IGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5yZWFkKFxyXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVfbGlua1xyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCBtYXRjaDtcclxuICAgICAgICAgICAgICAgIGlmICgobWF0Y2ggPSB0aGlzLmxpbmtwYXRoX3JlZ2V4LmV4ZWMoaW5jbHVkZV9saW5rKSkgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluY2x1ZGVfZGVwdGggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiSW52YWxpZCBmaWxlIGZvcm1hdCwgcHJvdmlkZSBhbiBvYnNpZGlhbiBsaW5rIGJldHdlZW4gcXVvdGVzLlwiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IHsgcGF0aCwgc3VicGF0aCB9ID0gcGFyc2VMaW5rdGV4dChtYXRjaFsxXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5jX2ZpbGUgPVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGlmICghaW5jX2ZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluY2x1ZGVfZGVwdGggLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGBGaWxlICR7aW5jbHVkZV9saW5rfSBkb2Vzbid0IGV4aXN0YFxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpbmNfZmlsZV9jb250ZW50ID0gYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LnJlYWQoaW5jX2ZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzdWJwYXRoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2FjaGUgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoaW5jX2ZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSByZXNvbHZlU3VicGF0aChjYWNoZSwgc3VicGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluY19maWxlX2NvbnRlbnQgPSBpbmNfZmlsZV9jb250ZW50LnNsaWNlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5zdGFydC5vZmZzZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmVuZD8ub2Zmc2V0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFyc2VkX2NvbnRlbnQgPVxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnRlbXBsYXRlci5wYXJzZXIucGFyc2VfY29tbWFuZHMoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluY19maWxlX2NvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnRlbXBsYXRlci5jdXJyZW50X2Z1bmN0aW9uc19vYmplY3RcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbmNsdWRlX2RlcHRoIC09IDE7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VkX2NvbnRlbnQ7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5jbHVkZV9kZXB0aCAtPSAxO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfbGFzdF9tb2RpZmllZF9kYXRlKCk6IChmb3JtYXQ/OiBzdHJpbmcpID0+IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIChmb3JtYXQgPSBcIllZWVktTU0tREQgSEg6bW1cIik6IHN0cmluZyA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiBtb21lbnQodGhpcy5jb25maWcudGFyZ2V0X2ZpbGUuc3RhdC5tdGltZSkuZm9ybWF0KGZvcm1hdCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9tb3ZlKCk6IChwYXRoOiBzdHJpbmcsIGZpbGVfdG9fbW92ZT86IFRGaWxlKSA9PiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIHJldHVybiBhc3luYyAocGF0aDogc3RyaW5nLCBmaWxlX3RvX21vdmU/OiBURmlsZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gZmlsZV90b19tb3ZlIHx8IHRoaXMuY29uZmlnLnRhcmdldF9maWxlO1xyXG4gICAgICAgICAgICBjb25zdCBuZXdfcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7cGF0aH0uJHtmaWxlLmV4dGVuc2lvbn1gKTtcclxuICAgICAgICAgICAgY29uc3QgZGlycyA9IG5ld19wYXRoLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpLnNwbGl0KFwiL1wiKTtcclxuICAgICAgICAgICAgZGlycy5wb3AoKTsgLy8gcmVtb3ZlIGJhc2VuYW1lXHJcbiAgICAgICAgICAgIGlmIChkaXJzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlyID0gZGlycy5qb2luKFwiL1wiKTtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChkaXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihkaXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIG5ld19wYXRoKTtcclxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9wYXRoKCk6IChyZWxhdGl2ZTogYm9vbGVhbikgPT4gc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gKHJlbGF0aXZlID0gZmFsc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IHZhdWx0X3BhdGggPSBcIlwiO1xyXG4gICAgICAgICAgICBpZiAoUGxhdGZvcm0uaXNNb2JpbGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZhdWx0X2FkYXB0ZXIgPSB0aGlzLnBsdWdpbi5hcHAudmF1bHQuYWRhcHRlci5mcy51cmk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YXVsdF9iYXNlID0gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmFkYXB0ZXIuYmFzZVBhdGg7XHJcbiAgICAgICAgICAgICAgICB2YXVsdF9wYXRoID0gYCR7dmF1bHRfYWRhcHRlcn0vJHt2YXVsdF9iYXNlfWA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmFkYXB0ZXIgaW5zdGFuY2VvZiBGaWxlU3lzdGVtQWRhcHRlclxyXG4gICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmF1bHRfcGF0aCA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5hZGFwdGVyLmdldEJhc2VQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhcHAudmF1bHQgaXMgbm90IGEgRmlsZVN5c3RlbUFkYXB0ZXIgaW5zdGFuY2VcIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZWxhdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlnLnRhcmdldF9maWxlLnBhdGg7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7dmF1bHRfcGF0aH0vJHt0aGlzLmNvbmZpZy50YXJnZXRfZmlsZS5wYXRofWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX3JlbmFtZSgpOiAobmV3X3RpdGxlOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jIChuZXdfdGl0bGU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBpZiAobmV3X3RpdGxlLm1hdGNoKC9bXFxcXC86XSsvZykpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBcIkZpbGUgbmFtZSBjYW5ub3QgY29udGFpbiBhbnkgb2YgdGhlc2UgY2hhcmFjdGVyczogXFxcXCAvIDpcIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBuZXdfcGF0aCA9IG5vcm1hbGl6ZVBhdGgoXHJcbiAgICAgICAgICAgICAgICBgJHt0aGlzLmNvbmZpZy50YXJnZXRfZmlsZS5wYXJlbnQucGF0aH0vJHtuZXdfdGl0bGV9LiR7dGhpcy5jb25maWcudGFyZ2V0X2ZpbGUuZXh0ZW5zaW9ufWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLmZpbGVNYW5hZ2VyLnJlbmFtZUZpbGUoXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy50YXJnZXRfZmlsZSxcclxuICAgICAgICAgICAgICAgIG5ld19wYXRoXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfc2VsZWN0aW9uKCk6ICgpID0+IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgYWN0aXZlX2VkaXRvciA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuYWN0aXZlRWRpdG9yO1xyXG4gICAgICAgICAgICBpZiAoIWFjdGl2ZV9lZGl0b3IgfHwgIWFjdGl2ZV9lZGl0b3IuZWRpdG9yKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJBY3RpdmUgZWRpdG9yIGlzIG51bGwsIGNhbid0IHJlYWQgc2VsZWN0aW9uLlwiXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhY3RpdmVfZWRpdG9yLmVkaXRvcjtcclxuICAgICAgICAgICAgcmV0dXJuIGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IFR1cm4gdGhpcyBpbnRvIGEgZnVuY3Rpb25cclxuICAgIGdlbmVyYXRlX3RhZ3MoKTogc3RyaW5nW10gfCBudWxsIHtcclxuICAgICAgICBjb25zdCBjYWNoZSA9IHRoaXMucGx1Z2luLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShcclxuICAgICAgICAgICAgdGhpcy5jb25maWcudGFyZ2V0X2ZpbGVcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBpZiAoY2FjaGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGdldEFsbFRhZ3MoY2FjaGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPOiBUdXJuIHRoaXMgaW50byBhIGZ1bmN0aW9uXHJcbiAgICBnZW5lcmF0ZV90aXRsZSgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbmZpZy50YXJnZXRfZmlsZS5iYXNlbmFtZTtcclxuICAgIH1cclxufVxyXG4iXX0=