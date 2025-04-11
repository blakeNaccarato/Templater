import { __awaiter } from "tslib";
import { MarkdownView, normalizePath, TFile, TFolder, } from "obsidian";
import { delay, generate_dynamic_command_regex, get_active_file, get_folder_path_from_file_path, resolve_tfile, } from "utils/Utils";
import { FunctionsGenerator, FunctionsMode, } from "./functions/FunctionsGenerator";
import { errorWrapper, errorWrapperSync, TemplaterError } from "utils/Error";
import { Parser } from "./parser/Parser";
import { log_error } from "utils/Log";
export var RunMode;
(function (RunMode) {
    RunMode[RunMode["CreateNewFromTemplate"] = 0] = "CreateNewFromTemplate";
    RunMode[RunMode["AppendActiveFile"] = 1] = "AppendActiveFile";
    RunMode[RunMode["OverwriteFile"] = 2] = "OverwriteFile";
    RunMode[RunMode["OverwriteActiveFile"] = 3] = "OverwriteActiveFile";
    RunMode[RunMode["DynamicProcessor"] = 4] = "DynamicProcessor";
    RunMode[RunMode["StartupTemplate"] = 5] = "StartupTemplate";
})(RunMode || (RunMode = {}));
export class Templater {
    constructor(plugin) {
        this.plugin = plugin;
        this.functions_generator = new FunctionsGenerator(this.plugin);
        this.parser = new Parser();
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.files_with_pending_templates = new Set();
            yield this.parser.init();
            yield this.functions_generator.init();
            this.plugin.registerMarkdownPostProcessor((el, ctx) => this.process_dynamic_templates(el, ctx));
        });
    }
    create_running_config(template_file, target_file, run_mode) {
        const active_file = get_active_file(this.plugin.app);
        return {
            template_file: template_file,
            target_file: target_file,
            run_mode: run_mode,
            active_file: active_file,
        };
    }
    read_and_parse_template(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const template_content = yield this.plugin.app.vault.read(config.template_file);
            return this.parse_template(config, template_content);
        });
    }
    parse_template(config, template_content) {
        return __awaiter(this, void 0, void 0, function* () {
            const functions_object = yield this.functions_generator.generate_object(config, FunctionsMode.USER_INTERNAL);
            this.current_functions_object = functions_object;
            const content = yield this.parser.parse_commands(template_content, functions_object);
            return content;
        });
    }
    start_templater_task(path) {
        this.files_with_pending_templates.add(path);
    }
    end_templater_task(path) {
        return __awaiter(this, void 0, void 0, function* () {
            this.files_with_pending_templates.delete(path);
            if (this.files_with_pending_templates.size === 0) {
                this.plugin.app.workspace.trigger("templater:all-templates-executed");
                yield this.functions_generator.teardown();
            }
        });
    }
    create_new_note_from_template(template, folder, filename, open_new_note = true) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Maybe there is an obsidian API function for that
            if (!folder) {
                const new_file_location = this.plugin.app.vault.getConfig("newFileLocation");
                switch (new_file_location) {
                    case "current": {
                        const active_file = get_active_file(this.plugin.app);
                        if (active_file) {
                            folder = active_file.parent;
                        }
                        break;
                    }
                    case "folder":
                        folder = this.plugin.app.fileManager.getNewFileParent("");
                        break;
                    case "root":
                        folder = this.plugin.app.vault.getRoot();
                        break;
                    default:
                        break;
                }
            }
            const extension = template instanceof TFile ? template.extension || "md" : "md";
            const created_note = yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () {
                const folderPath = folder instanceof TFolder ? folder.path : folder;
                const path = this.plugin.app.vault.getAvailablePath(normalizePath(`${folderPath !== null && folderPath !== void 0 ? folderPath : ""}/${filename || "Untitled"}`), extension);
                const folder_path = get_folder_path_from_file_path(path);
                if (folder_path &&
                    !this.plugin.app.vault.getAbstractFileByPathInsensitive(folder_path)) {
                    yield this.plugin.app.vault.createFolder(folder_path);
                }
                return this.plugin.app.vault.create(path, "");
            }), `Couldn't create ${extension} file.`);
            if (created_note == null) {
                return;
            }
            const { path } = created_note;
            this.start_templater_task(path);
            let running_config;
            let output_content;
            if (template instanceof TFile) {
                running_config = this.create_running_config(template, created_note, RunMode.CreateNewFromTemplate);
                output_content = yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), "Template parsing error, aborting.");
            }
            else {
                running_config = this.create_running_config(undefined, created_note, RunMode.CreateNewFromTemplate);
                output_content = yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.parse_template(running_config, template); }), "Template parsing error, aborting.");
            }
            if (output_content == null) {
                yield this.plugin.app.vault.delete(created_note);
                yield this.end_templater_task(path);
                return;
            }
            yield this.plugin.app.vault.modify(created_note, output_content);
            this.plugin.app.workspace.trigger("templater:new-note-from-template", {
                file: created_note,
                content: output_content,
            });
            if (open_new_note) {
                const active_leaf = this.plugin.app.workspace.getLeaf(false);
                if (!active_leaf) {
                    log_error(new TemplaterError("No active leaf"));
                    return;
                }
                yield active_leaf.openFile(created_note, {
                    state: { mode: "source" },
                });
                yield this.plugin.editor_handler.jump_to_next_cursor_location(created_note, true);
                active_leaf.setEphemeralState({
                    rename: "all",
                });
            }
            yield this.end_templater_task(path);
            return created_note;
        });
    }
    append_template_to_active_file(template_file) {
        return __awaiter(this, void 0, void 0, function* () {
            const active_view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
            const active_editor = this.plugin.app.workspace.activeEditor;
            if (!active_editor || !active_editor.file || !active_editor.editor) {
                log_error(new TemplaterError("No active editor, can't append templates."));
                return;
            }
            const { path } = active_editor.file;
            this.start_templater_task(path);
            const running_config = this.create_running_config(template_file, active_editor.file, RunMode.AppendActiveFile);
            const output_content = yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), "Template parsing error, aborting.");
            // errorWrapper failed
            if (output_content == null) {
                yield this.end_templater_task(path);
                return;
            }
            const editor = active_editor.editor;
            const doc = editor.getDoc();
            const oldSelections = doc.listSelections();
            doc.replaceSelection(output_content);
            // Refresh editor to ensure properties widget shows after inserting template in blank file
            if (active_editor.file) {
                yield this.plugin.app.vault.append(active_editor.file, "");
            }
            this.plugin.app.workspace.trigger("templater:template-appended", {
                view: active_view,
                editor: active_editor,
                content: output_content,
                oldSelections,
                newSelections: doc.listSelections(),
            });
            yield this.plugin.editor_handler.jump_to_next_cursor_location(active_editor.file, true);
            yield this.end_templater_task(path);
        });
    }
    write_template_to_file(template_file, file) {
        return __awaiter(this, void 0, void 0, function* () {
            const { path } = file;
            this.start_templater_task(path);
            const active_editor = this.plugin.app.workspace.activeEditor;
            const active_file = get_active_file(this.plugin.app);
            const running_config = this.create_running_config(template_file, file, RunMode.OverwriteFile);
            const output_content = yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), "Template parsing error, aborting.");
            // errorWrapper failed
            if (output_content == null) {
                yield this.end_templater_task(path);
                return;
            }
            yield this.plugin.app.vault.modify(file, output_content);
            // Set cursor to first line of editor (below properties)
            // https://github.com/SilentVoid13/Templater/issues/1231
            if ((active_file === null || active_file === void 0 ? void 0 : active_file.path) === file.path &&
                active_editor &&
                active_editor.editor) {
                const editor = active_editor.editor;
                editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 0 });
            }
            this.plugin.app.workspace.trigger("templater:new-note-from-template", {
                file,
                content: output_content,
            });
            yield this.plugin.editor_handler.jump_to_next_cursor_location(file, true);
            yield this.end_templater_task(path);
        });
    }
    overwrite_active_file_commands() {
        const active_editor = this.plugin.app.workspace.activeEditor;
        if (!active_editor || !active_editor.file) {
            log_error(new TemplaterError("Active editor is null, can't overwrite content"));
            return;
        }
        this.overwrite_file_commands(active_editor.file, true);
    }
    overwrite_file_commands(file, active_file = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const { path } = file;
            this.start_templater_task(path);
            const running_config = this.create_running_config(file, file, active_file ? RunMode.OverwriteActiveFile : RunMode.OverwriteFile);
            const output_content = yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), "Template parsing error, aborting.");
            // errorWrapper failed
            if (output_content == null) {
                yield this.end_templater_task(path);
                return;
            }
            yield this.plugin.app.vault.modify(file, output_content);
            this.plugin.app.workspace.trigger("templater:overwrite-file", {
                file,
                content: output_content,
            });
            yield this.plugin.editor_handler.jump_to_next_cursor_location(file, true);
            yield this.end_templater_task(path);
        });
    }
    process_dynamic_templates(el, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            const dynamic_command_regex = generate_dynamic_command_regex();
            const walker = document.createNodeIterator(el, NodeFilter.SHOW_TEXT);
            let node;
            let pass = false;
            let functions_object;
            while ((node = walker.nextNode())) {
                let content = node.nodeValue;
                if (content !== null) {
                    let match = dynamic_command_regex.exec(content);
                    if (match !== null) {
                        const file = this.plugin.app.metadataCache.getFirstLinkpathDest("", ctx.sourcePath);
                        if (!file || !(file instanceof TFile)) {
                            return;
                        }
                        if (!pass) {
                            pass = true;
                            const config = this.create_running_config(file, file, RunMode.DynamicProcessor);
                            functions_object =
                                yield this.functions_generator.generate_object(config, FunctionsMode.USER_INTERNAL);
                            this.current_functions_object = functions_object;
                        }
                    }
                    while (match != null) {
                        // Not the most efficient way to exclude the '+' from the command but I couldn't find something better
                        const complete_command = match[1] + match[2];
                        const command_output = yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () {
                            return yield this.parser.parse_commands(complete_command, functions_object);
                        }), `Command Parsing error in dynamic command '${complete_command}'`);
                        if (command_output == null) {
                            return;
                        }
                        const start = dynamic_command_regex.lastIndex - match[0].length;
                        const end = dynamic_command_regex.lastIndex;
                        content =
                            content.substring(0, start) +
                                command_output +
                                content.substring(end);
                        dynamic_command_regex.lastIndex +=
                            command_output.length - match[0].length;
                        match = dynamic_command_regex.exec(content);
                    }
                    node.nodeValue = content;
                }
            }
        });
    }
    get_new_file_template_for_folder(folder) {
        do {
            const match = this.plugin.settings.folder_templates.find((e) => e.folder == folder.path);
            if (match && match.template) {
                return match.template;
            }
            folder = folder.parent;
        } while (folder);
    }
    get_new_file_template_for_file(file) {
        const match = this.plugin.settings.file_templates.find((e) => {
            const eRegex = new RegExp(e.regex);
            return eRegex.test(file.path);
        });
        if (match && match.template) {
            return match.template;
        }
    }
    static on_file_creation(templater, app, file) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(file instanceof TFile) || file.extension !== "md") {
                return;
            }
            // Avoids template replacement when syncing template files
            const template_folder = normalizePath(templater.plugin.settings.templates_folder);
            if (file.path.includes(template_folder) && template_folder !== "/") {
                return;
            }
            // TODO: find a better way to do this
            // Currently, I have to wait for the note extractor plugin to add the file content before replacing
            yield delay(300);
            // Avoids template replacement when creating file from template without content before delay
            if (templater.files_with_pending_templates.has(file.path)) {
                return;
            }
            if (file.stat.size == 0 &&
                templater.plugin.settings.enable_folder_templates) {
                const folder_template_match = templater.get_new_file_template_for_folder(file.parent);
                if (!folder_template_match) {
                    return;
                }
                const template_file = yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () {
                    return resolve_tfile(app, folder_template_match);
                }), `Couldn't find template ${folder_template_match}`);
                // errorWrapper failed
                if (template_file == null) {
                    return;
                }
                yield templater.write_template_to_file(template_file, file);
            }
            else if (file.stat.size == 0 &&
                templater.plugin.settings.enable_file_templates) {
                const file_template_match = templater.get_new_file_template_for_file(file);
                if (!file_template_match) {
                    return;
                }
                const template_file = yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () {
                    return resolve_tfile(app, file_template_match);
                }), `Couldn't find template ${file_template_match}`);
                // errorWrapper failed
                if (template_file == null) {
                    return;
                }
                yield templater.write_template_to_file(template_file, file);
            }
            else {
                if (file.stat.size <= 100000) {
                    //https://github.com/SilentVoid13/Templater/issues/873
                    yield templater.overwrite_file_commands(file);
                }
                else {
                    console.log(`Templater skipped parsing ${file.path} because file size exceeds 10000`);
                }
            }
        });
    }
    execute_startup_scripts() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const template of this.plugin.settings.startup_templates) {
                if (!template) {
                    continue;
                }
                const file = errorWrapperSync(() => resolve_tfile(this.plugin.app, template), `Couldn't find startup template "${template}"`);
                if (!file) {
                    continue;
                }
                const { path } = file;
                this.start_templater_task(path);
                const running_config = this.create_running_config(file, file, RunMode.StartupTemplate);
                yield errorWrapper(() => __awaiter(this, void 0, void 0, function* () { return this.read_and_parse_template(running_config); }), `Startup Template parsing error, aborting.`);
                yield this.end_templater_task(path);
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVtcGxhdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvcmUvVGVtcGxhdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBR0gsWUFBWSxFQUNaLGFBQWEsRUFFYixLQUFLLEVBQ0wsT0FBTyxHQUNWLE1BQU0sVUFBVSxDQUFDO0FBQ2xCLE9BQU8sRUFDSCxLQUFLLEVBQ0wsOEJBQThCLEVBQzlCLGVBQWUsRUFDZiw4QkFBOEIsRUFDOUIsYUFBYSxHQUNoQixNQUFNLGFBQWEsQ0FBQztBQUVyQixPQUFPLEVBQ0gsa0JBQWtCLEVBQ2xCLGFBQWEsR0FDaEIsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4QyxPQUFPLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUM3RSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUV0QyxNQUFNLENBQU4sSUFBWSxPQU9YO0FBUEQsV0FBWSxPQUFPO0lBQ2YsdUVBQXFCLENBQUE7SUFDckIsNkRBQWdCLENBQUE7SUFDaEIsdURBQWEsQ0FBQTtJQUNiLG1FQUFtQixDQUFBO0lBQ25CLDZEQUFnQixDQUFBO0lBQ2hCLDJEQUFlLENBQUE7QUFDbkIsQ0FBQyxFQVBXLE9BQU8sS0FBUCxPQUFPLFFBT2xCO0FBU0QsTUFBTSxPQUFPLFNBQVM7SUFNbEIsWUFBb0IsTUFBdUI7UUFBdkIsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7UUFDdkMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUssS0FBSzs7WUFDUCxJQUFJLENBQUMsNEJBQTRCLEdBQUcsSUFBSSxHQUFH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RUFDSixJQUFJLEVBQ0osT0FBTyxDQUFDLGVBQWUsQ0FDMUIsQ0FBQztnQkFDRixNQUFNLFlBQVksQ0FDZCxHQUFTLEVBQUUsZ0RBQUMsT0FBQSxJQUFJLENBQUMsdUJBQXVCLENBQUMsY0FBYyxDQUFDLENBQUEsR0FBQSxFQUN4RCwyQ0FBMkMsQ0FDOUMsQ0FBQztnQkFDRixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN2QztRQUNMLENBQUM7S0FBQTtDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcclxuICAgIEFwcCxcclxuICAgIE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQsXHJcbiAgICBNYXJrZG93blZpZXcsXHJcbiAgICBub3JtYWxpemVQYXRoLFxyXG4gICAgVEFic3RyYWN0RmlsZSxcclxuICAgIFRGaWxlLFxyXG4gICAgVEZvbGRlcixcclxufSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHtcclxuICAgIGRlbGF5LFxyXG4gICAgZ2VuZXJhdGVfZHluYW1pY19jb21tYW5kX3JlZ2V4LFxyXG4gICAgZ2V0X2FjdGl2ZV9maWxlLFxyXG4gICAgZ2V0X2ZvbGRlcl9wYXRoX2Zyb21fZmlsZV9wYXRoLFxyXG4gICAgcmVzb2x2ZV90ZmlsZSxcclxufSBmcm9tIFwidXRpbHMvVXRpbHNcIjtcclxuaW1wb3J0IFRlbXBsYXRlclBsdWdpbiBmcm9tIFwibWFpblwiO1xyXG5pbXBvcnQge1xyXG4gICAgRnVuY3Rpb25zR2VuZXJhdG9yLFxyXG4gICAgRnVuY3Rpb25zTW9kZSxcclxufSBmcm9tIFwiLi9mdW5jdGlvbnMvRnVuY3Rpb25zR2VuZXJhdG9yXCI7XHJcbmltcG9ydCB7IGVycm9yV3JhcHBlciwgZXJyb3JXcmFwcGVyU3luYywgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwidXRpbHMvRXJyb3JcIjtcclxuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSBcIi4vcGFyc2VyL1BhcnNlclwiO1xyXG5pbXBvcnQgeyBsb2dfZXJyb3IgfSBmcm9tIFwidXRpbHMvTG9nXCI7XHJcblxyXG5leHBvcnQgZW51bSBSdW5Nb2RlIHtcclxuICAgIENyZWF0ZU5ld0Zyb21UZW1wbGF0ZSxcclxuICAgIEFwcGVuZEFjdGl2ZUZpbGUsXHJcbiAgICBPdmVyd3JpdGVGaWxlLFxyXG4gICAgT3ZlcndyaXRlQWN0aXZlRmlsZSxcclxuICAgIER5bmFtaWNQcm9jZXNzb3IsXHJcbiAgICBTdGFydHVwVGVtcGxhdGUsXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFJ1bm5pbmdDb25maWcgPSB7XHJcbiAgICB0ZW1wbGF0ZV9maWxlOiBURmlsZSB8IHVuZGVmaW5lZDtcclxuICAgIHRhcmdldF9maWxlOiBURmlsZTtcclxuICAgIHJ1bl9tb2RlOiBSdW5Nb2RlO1xyXG4gICAgYWN0aXZlX2ZpbGU/OiBURmlsZSB8IG51bGw7XHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVyIHtcclxuICAgIHB1YmxpYyBwYXJzZXI6IFBhcnNlcjtcclxuICAgIHB1YmxpYyBmdW5jdGlvbnNfZ2VuZXJhdG9yOiBGdW5jdGlvbnNHZW5lcmF0b3I7XHJcbiAgICBwdWJsaWMgY3VycmVudF9mdW5jdGlvbnNfb2JqZWN0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcclxuICAgIHB1YmxpYyBmaWxlc193aXRoX3BlbmRpbmdfdGVtcGxhdGVzOiBTZXQ8c3RyaW5nPjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luKSB7XHJcbiAgICAgICAgdGhpcy5mdW5jdGlvbnNfZ2VuZXJhdG9yID0gbmV3IEZ1bmN0aW9uc0dlbmVyYXRvcih0aGlzLnBsdWdpbik7XHJcbiAgICAgICAgdGhpcy5wYXJzZXIgPSBuZXcgUGFyc2VyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc2V0dXAoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5maWxlc193aXRoX3BlbmRpbmdfdGVtcGxhdGVzID0gbmV3IFNldCgpO1xyXG4gICAgICAgIGF3YWl0IHRoaXMucGFyc2VyLmluaXQoKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmZ1bmN0aW9uc19nZW5lcmF0b3IuaW5pdCgpO1xyXG4gICAgICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyTWFya2Rvd25Qb3N0UHJvY2Vzc29yKChlbCwgY3R4KSA9PlxyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NfZHluYW1pY190ZW1wbGF0ZXMoZWwsIGN0eClcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNyZWF0ZV9ydW5uaW5nX2NvbmZpZyhcclxuICAgICAgICB0ZW1wbGF0ZV9maWxlOiBURmlsZSB8IHVuZGVmaW5lZCxcclxuICAgICAgICB0YXJnZXRfZmlsZTogVEZpbGUsXHJcbiAgICAgICAgcnVuX21vZGU6IFJ1bk1vZGVcclxuICAgICk6IFJ1bm5pbmdDb25maWcge1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZV9maWxlID0gZ2V0X2FjdGl2ZV9maWxlKHRoaXMucGx1Z2luLmFwcCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRlbXBsYXRlX2ZpbGU6IHRlbXBsYXRlX2ZpbGUsXHJcbiAgICAgICAgICAgIHRhcmdldF9maWxlOiB0YXJnZXRfZmlsZSxcclxuICAgICAgICAgICAgcnVuX21vZGU6IHJ1bl9tb2RlLFxyXG4gICAgICAgICAgICBhY3RpdmVfZmlsZTogYWN0aXZlX2ZpbGUsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWFkX2FuZF9wYXJzZV90ZW1wbGF0ZShjb25maWc6IFJ1bm5pbmdDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlX2NvbnRlbnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5hcHAudmF1bHQucmVhZChcclxuICAgICAgICAgICAgY29uZmlnLnRlbXBsYXRlX2ZpbGUgYXMgVEZpbGVcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlX3RlbXBsYXRlKGNvbmZpZywgdGVtcGxhdGVfY29udGVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcGFyc2VfdGVtcGxhdGUoXHJcbiAgICAgICAgY29uZmlnOiBSdW5uaW5nQ29uZmlnLFxyXG4gICAgICAgIHRlbXBsYXRlX2NvbnRlbnQ6IHN0cmluZ1xyXG4gICAgKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgICAgICBjb25zdCBmdW5jdGlvbnNfb2JqZWN0ID0gYXdhaXQgdGhpcy5mdW5jdGlvbnNfZ2VuZXJhdG9yLmdlbmVyYXRlX29iamVjdChcclxuICAgICAgICAgICAgY29uZmlnLFxyXG4gICAgICAgICAgICBGdW5jdGlvbnNNb2RlLlVTRVJfSU5URVJOQUxcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuY3VycmVudF9mdW5jdGlvbnNfb2JqZWN0ID0gZnVuY3Rpb25zX29iamVjdDtcclxuICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5wYXJzZXIucGFyc2VfY29tbWFuZHMoXHJcbiAgICAgICAgICAgIHRlbXBsYXRlX2NvbnRlbnQsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uc19vYmplY3RcclxuICAgICAgICApO1xyXG4gICAgICAgIHJldHVybiBjb250ZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhcnRfdGVtcGxhdGVyX3Rhc2socGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5maWxlc193aXRoX3BlbmRpbmdfdGVtcGxhdGVzLmFkZChwYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoOiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLmZpbGVzX3dpdGhfcGVuZGluZ190ZW1wbGF0ZXMuZGVsZXRlKHBhdGgpO1xyXG4gICAgICAgIGlmICh0aGlzLmZpbGVzX3dpdGhfcGVuZGluZ190ZW1wbGF0ZXMuc2l6ZSA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnRyaWdnZXIoXHJcbiAgICAgICAgICAgICAgICBcInRlbXBsYXRlcjphbGwtdGVtcGxhdGVzLWV4ZWN1dGVkXCJcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5mdW5jdGlvbnNfZ2VuZXJhdG9yLnRlYXJkb3duKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKFxyXG4gICAgICAgIHRlbXBsYXRlOiBURmlsZSB8IHN0cmluZyxcclxuICAgICAgICBmb2xkZXI/OiBURm9sZGVyIHwgc3RyaW5nLFxyXG4gICAgICAgIGZpbGVuYW1lPzogc3RyaW5nLFxyXG4gICAgICAgIG9wZW5fbmV3X25vdGUgPSB0cnVlXHJcbiAgICApOiBQcm9taXNlPFRGaWxlIHwgdW5kZWZpbmVkPiB7XHJcbiAgICAgICAgLy8gVE9ETzogTWF5YmUgdGhlcmUgaXMgYW4gb2JzaWRpYW4gQVBJIGZ1bmN0aW9uIGZvciB0aGF0XHJcbiAgICAgICAgaWYgKCFmb2xkZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgbmV3X2ZpbGVfbG9jYXRpb24gPVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldENvbmZpZyhcIm5ld0ZpbGVMb2NhdGlvblwiKTtcclxuICAgICAgICAgICAgc3dpdGNoIChuZXdfZmlsZV9sb2NhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImN1cnJlbnRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZV9maWxlID0gZ2V0X2FjdGl2ZV9maWxlKHRoaXMucGx1Z2luLmFwcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZV9maWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbGRlciA9IGFjdGl2ZV9maWxlLnBhcmVudDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZm9sZGVyXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgZm9sZGVyID0gdGhpcy5wbHVnaW4uYXBwLmZpbGVNYW5hZ2VyLmdldE5ld0ZpbGVQYXJlbnQoXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwicm9vdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlciA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRSb290KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBleHRlbnNpb24gPVxyXG4gICAgICAgICAgICB0ZW1wbGF0ZSBpbnN0YW5jZW9mIFRGaWxlID8gdGVtcGxhdGUuZXh0ZW5zaW9uIHx8IFwibWRcIiA6IFwibWRcIjtcclxuICAgICAgICBjb25zdCBjcmVhdGVkX25vdGUgPSBhd2FpdCBlcnJvcldyYXBwZXIoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmb2xkZXJQYXRoID0gZm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlciA/IGZvbGRlci5wYXRoIDogZm9sZGVyO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoID0gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEF2YWlsYWJsZVBhdGgoXHJcbiAgICAgICAgICAgICAgICBub3JtYWxpemVQYXRoKGAke2ZvbGRlclBhdGggPz8gXCJcIn0vJHtmaWxlbmFtZSB8fCBcIlVudGl0bGVkXCJ9YCksXHJcbiAgICAgICAgICAgICAgICBleHRlbnNpb25cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY29uc3QgZm9sZGVyX3BhdGggPSBnZXRfZm9sZGVyX3BhdGhfZnJvbV9maWxlX3BhdGgocGF0aCk7XHJcbiAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgIGZvbGRlcl9wYXRoICYmXHJcbiAgICAgICAgICAgICAgICAhdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aEluc2Vuc2l0aXZlKFxyXG4gICAgICAgICAgICAgICAgICAgIGZvbGRlcl9wYXRoXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJfcGF0aCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgXCJcIik7XHJcbiAgICAgICAgfSwgYENvdWxkbid0IGNyZWF0ZSAke2V4dGVuc2lvbn0gZmlsZS5gKTtcclxuXHJcbiAgICAgICAgaWYgKGNyZWF0ZWRfbm90ZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHsgcGF0aCB9ID0gY3JlYXRlZF9ub3RlO1xyXG4gICAgICAgIHRoaXMuc3RhcnRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgbGV0IHJ1bm5pbmdfY29uZmlnOiBSdW5uaW5nQ29uZmlnO1xyXG4gICAgICAgIGxldCBvdXRwdXRfY29udGVudDogc3RyaW5nO1xyXG4gICAgICAgIGlmICh0ZW1wbGF0ZSBpbnN0YW5jZW9mIFRGaWxlKSB7XHJcbiAgICAgICAgICAgIHJ1bm5pbmdfY29uZmlnID0gdGhpcy5jcmVhdGVfcnVubmluZ19jb25maWcoXHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZSxcclxuICAgICAgICAgICAgICAgIGNyZWF0ZWRfbm90ZSxcclxuICAgICAgICAgICAgICAgIFJ1bk1vZGUuQ3JlYXRlTmV3RnJvbVRlbXBsYXRlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIG91dHB1dF9jb250ZW50ID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICAgICAgYXN5bmMgKCkgPT4gdGhpcy5yZWFkX2FuZF9wYXJzZV90ZW1wbGF0ZShydW5uaW5nX2NvbmZpZyksXHJcbiAgICAgICAgICAgICAgICBcIlRlbXBsYXRlIHBhcnNpbmcgZXJyb3IsIGFib3J0aW5nLlwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcnVubmluZ19jb25maWcgPSB0aGlzLmNyZWF0ZV9ydW5uaW5nX2NvbmZpZyhcclxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGNyZWF0ZWRfbm90ZSxcclxuICAgICAgICAgICAgICAgIFJ1bk1vZGUuQ3JlYXRlTmV3RnJvbVRlbXBsYXRlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIG91dHB1dF9jb250ZW50ID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICAgICAgYXN5bmMgKCkgPT4gdGhpcy5wYXJzZV90ZW1wbGF0ZShydW5uaW5nX2NvbmZpZywgdGVtcGxhdGUpLFxyXG4gICAgICAgICAgICAgICAgXCJUZW1wbGF0ZSBwYXJzaW5nIGVycm9yLCBhYm9ydGluZy5cIlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG91dHB1dF9jb250ZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmRlbGV0ZShjcmVhdGVkX25vdGUpO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0Lm1vZGlmeShjcmVhdGVkX25vdGUsIG91dHB1dF9jb250ZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwidGVtcGxhdGVyOm5ldy1ub3RlLWZyb20tdGVtcGxhdGVcIiwge1xyXG4gICAgICAgICAgICBmaWxlOiBjcmVhdGVkX25vdGUsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6IG91dHB1dF9jb250ZW50LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAob3Blbl9uZXdfbm90ZSkge1xyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVfbGVhZiA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZihmYWxzZSk7XHJcbiAgICAgICAgICAgIGlmICghYWN0aXZlX2xlYWYpIHtcclxuICAgICAgICAgICAgICAgIGxvZ19lcnJvcihuZXcgVGVtcGxhdGVyRXJyb3IoXCJObyBhY3RpdmUgbGVhZlwiKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXdhaXQgYWN0aXZlX2xlYWYub3BlbkZpbGUoY3JlYXRlZF9ub3RlLCB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZTogeyBtb2RlOiBcInNvdXJjZVwiIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uZWRpdG9yX2hhbmRsZXIuanVtcF90b19uZXh0X2N1cnNvcl9sb2NhdGlvbihcclxuICAgICAgICAgICAgICAgIGNyZWF0ZWRfbm90ZSxcclxuICAgICAgICAgICAgICAgIHRydWVcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIGFjdGl2ZV9sZWFmLnNldEVwaGVtZXJhbFN0YXRlKHtcclxuICAgICAgICAgICAgICAgIHJlbmFtZTogXCJhbGxcIixcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLmVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgICAgICByZXR1cm4gY3JlYXRlZF9ub3RlO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGFwcGVuZF90ZW1wbGF0ZV90b19hY3RpdmVfZmlsZSh0ZW1wbGF0ZV9maWxlOiBURmlsZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZV92aWV3ID1cclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlX2VkaXRvciA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuYWN0aXZlRWRpdG9yO1xyXG4gICAgICAgIGlmICghYWN0aXZlX2VkaXRvciB8fCAhYWN0aXZlX2VkaXRvci5maWxlIHx8ICFhY3RpdmVfZWRpdG9yLmVkaXRvcikge1xyXG4gICAgICAgICAgICBsb2dfZXJyb3IoXHJcbiAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGVyRXJyb3IoXCJObyBhY3RpdmUgZWRpdG9yLCBjYW4ndCBhcHBlbmQgdGVtcGxhdGVzLlwiKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHsgcGF0aCB9ID0gYWN0aXZlX2VkaXRvci5maWxlO1xyXG4gICAgICAgIHRoaXMuc3RhcnRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgY29uc3QgcnVubmluZ19jb25maWcgPSB0aGlzLmNyZWF0ZV9ydW5uaW5nX2NvbmZpZyhcclxuICAgICAgICAgICAgdGVtcGxhdGVfZmlsZSxcclxuICAgICAgICAgICAgYWN0aXZlX2VkaXRvci5maWxlLFxyXG4gICAgICAgICAgICBSdW5Nb2RlLkFwcGVuZEFjdGl2ZUZpbGVcclxuICAgICAgICApO1xyXG4gICAgICAgIGNvbnN0IG91dHB1dF9jb250ZW50ID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICBhc3luYyAoKSA9PiB0aGlzLnJlYWRfYW5kX3BhcnNlX3RlbXBsYXRlKHJ1bm5pbmdfY29uZmlnKSxcclxuICAgICAgICAgICAgXCJUZW1wbGF0ZSBwYXJzaW5nIGVycm9yLCBhYm9ydGluZy5cIlxyXG4gICAgICAgICk7XHJcbiAgICAgICAgLy8gZXJyb3JXcmFwcGVyIGZhaWxlZFxyXG4gICAgICAgIGlmIChvdXRwdXRfY29udGVudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5kX3RlbXBsYXRlcl90YXNrKHBhdGgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBlZGl0b3IgPSBhY3RpdmVfZWRpdG9yLmVkaXRvcjtcclxuICAgICAgICBjb25zdCBkb2MgPSBlZGl0b3IuZ2V0RG9jKCk7XHJcbiAgICAgICAgY29uc3Qgb2xkU2VsZWN0aW9ucyA9IGRvYy5saXN0U2VsZWN0aW9ucygpO1xyXG4gICAgICAgIGRvYy5yZXBsYWNlU2VsZWN0aW9uKG91dHB1dF9jb250ZW50KTtcclxuICAgICAgICAvLyBSZWZyZXNoIGVkaXRvciB0byBlbnN1cmUgcHJvcGVydGllcyB3aWRnZXQgc2hvd3MgYWZ0ZXIgaW5zZXJ0aW5nIHRlbXBsYXRlIGluIGJsYW5rIGZpbGVcclxuICAgICAgICBpZiAoYWN0aXZlX2VkaXRvci5maWxlKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5hcHBlbmQoYWN0aXZlX2VkaXRvci5maWxlLCBcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwidGVtcGxhdGVyOnRlbXBsYXRlLWFwcGVuZGVkXCIsIHtcclxuICAgICAgICAgICAgdmlldzogYWN0aXZlX3ZpZXcsXHJcbiAgICAgICAgICAgIGVkaXRvcjogYWN0aXZlX2VkaXRvcixcclxuICAgICAgICAgICAgY29udGVudDogb3V0cHV0X2NvbnRlbnQsXHJcbiAgICAgICAgICAgIG9sZFNlbGVjdGlvbnMsXHJcbiAgICAgICAgICAgIG5ld1NlbGVjdGlvbnM6IGRvYy5saXN0U2VsZWN0aW9ucygpLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5lZGl0b3JfaGFuZGxlci5qdW1wX3RvX25leHRfY3Vyc29yX2xvY2F0aW9uKFxyXG4gICAgICAgICAgICBhY3RpdmVfZWRpdG9yLmZpbGUsXHJcbiAgICAgICAgICAgIHRydWVcclxuICAgICAgICApO1xyXG4gICAgICAgIGF3YWl0IHRoaXMuZW5kX3RlbXBsYXRlcl90YXNrKHBhdGgpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHdyaXRlX3RlbXBsYXRlX3RvX2ZpbGUoXHJcbiAgICAgICAgdGVtcGxhdGVfZmlsZTogVEZpbGUsXHJcbiAgICAgICAgZmlsZTogVEZpbGVcclxuICAgICk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IHsgcGF0aCB9ID0gZmlsZTtcclxuICAgICAgICB0aGlzLnN0YXJ0X3RlbXBsYXRlcl90YXNrKHBhdGgpO1xyXG4gICAgICAgIGNvbnN0IGFjdGl2ZV9lZGl0b3IgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLmFjdGl2ZUVkaXRvcjtcclxuICAgICAgICBjb25zdCBhY3RpdmVfZmlsZSA9IGdldF9hY3RpdmVfZmlsZSh0aGlzLnBsdWdpbi5hcHApO1xyXG4gICAgICAgIGNvbnN0IHJ1bm5pbmdfY29uZmlnID0gdGhpcy5jcmVhdGVfcnVubmluZ19jb25maWcoXHJcbiAgICAgICAgICAgIHRlbXBsYXRlX2ZpbGUsXHJcbiAgICAgICAgICAgIGZpbGUsXHJcbiAgICAgICAgICAgIFJ1bk1vZGUuT3ZlcndyaXRlRmlsZVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0X2NvbnRlbnQgPSBhd2FpdCBlcnJvcldyYXBwZXIoXHJcbiAgICAgICAgICAgIGFzeW5jICgpID0+IHRoaXMucmVhZF9hbmRfcGFyc2VfdGVtcGxhdGUocnVubmluZ19jb25maWcpLFxyXG4gICAgICAgICAgICBcIlRlbXBsYXRlIHBhcnNpbmcgZXJyb3IsIGFib3J0aW5nLlwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICAvLyBlcnJvcldyYXBwZXIgZmFpbGVkXHJcbiAgICAgICAgaWYgKG91dHB1dF9jb250ZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbmRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBvdXRwdXRfY29udGVudCk7XHJcbiAgICAgICAgLy8gU2V0IGN1cnNvciB0byBmaXJzdCBsaW5lIG9mIGVkaXRvciAoYmVsb3cgcHJvcGVydGllcylcclxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vU2lsZW50Vm9pZDEzL1RlbXBsYXRlci9pc3N1ZXMvMTIzMVxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgYWN0aXZlX2ZpbGU/LnBhdGggPT09IGZpbGUucGF0aCAmJlxyXG4gICAgICAgICAgICBhY3RpdmVfZWRpdG9yICYmXHJcbiAgICAgICAgICAgIGFjdGl2ZV9lZGl0b3IuZWRpdG9yXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGFjdGl2ZV9lZGl0b3IuZWRpdG9yO1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2V0U2VsZWN0aW9uKHsgbGluZTogMCwgY2g6IDAgfSwgeyBsaW5lOiAwLCBjaDogMCB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwidGVtcGxhdGVyOm5ldy1ub3RlLWZyb20tdGVtcGxhdGVcIiwge1xyXG4gICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICBjb250ZW50OiBvdXRwdXRfY29udGVudCxcclxuICAgICAgICB9KTtcclxuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5lZGl0b3JfaGFuZGxlci5qdW1wX3RvX25leHRfY3Vyc29yX2xvY2F0aW9uKFxyXG4gICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgIH1cclxuXHJcbiAgICBvdmVyd3JpdGVfYWN0aXZlX2ZpbGVfY29tbWFuZHMoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlX2VkaXRvciA9IHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UuYWN0aXZlRWRpdG9yO1xyXG4gICAgICAgIGlmICghYWN0aXZlX2VkaXRvciB8fCAhYWN0aXZlX2VkaXRvci5maWxlKSB7XHJcbiAgICAgICAgICAgIGxvZ19lcnJvcihcclxuICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBcIkFjdGl2ZSBlZGl0b3IgaXMgbnVsbCwgY2FuJ3Qgb3ZlcndyaXRlIGNvbnRlbnRcIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMub3ZlcndyaXRlX2ZpbGVfY29tbWFuZHMoYWN0aXZlX2VkaXRvci5maWxlLCB0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBvdmVyd3JpdGVfZmlsZV9jb21tYW5kcyhcclxuICAgICAgICBmaWxlOiBURmlsZSxcclxuICAgICAgICBhY3RpdmVfZmlsZSA9IGZhbHNlXHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCB7IHBhdGggfSA9IGZpbGU7XHJcbiAgICAgICAgdGhpcy5zdGFydF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgICAgICBjb25zdCBydW5uaW5nX2NvbmZpZyA9IHRoaXMuY3JlYXRlX3J1bm5pbmdfY29uZmlnKFxyXG4gICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICBhY3RpdmVfZmlsZSA/IFJ1bk1vZGUuT3ZlcndyaXRlQWN0aXZlRmlsZSA6IFJ1bk1vZGUuT3ZlcndyaXRlRmlsZVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3Qgb3V0cHV0X2NvbnRlbnQgPSBhd2FpdCBlcnJvcldyYXBwZXIoXHJcbiAgICAgICAgICAgIGFzeW5jICgpID0+IHRoaXMucmVhZF9hbmRfcGFyc2VfdGVtcGxhdGUocnVubmluZ19jb25maWcpLFxyXG4gICAgICAgICAgICBcIlRlbXBsYXRlIHBhcnNpbmcgZXJyb3IsIGFib3J0aW5nLlwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICAvLyBlcnJvcldyYXBwZXIgZmFpbGVkXHJcbiAgICAgICAgaWYgKG91dHB1dF9jb250ZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5lbmRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBvdXRwdXRfY29udGVudCk7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwidGVtcGxhdGVyOm92ZXJ3cml0ZS1maWxlXCIsIHtcclxuICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgY29udGVudDogb3V0cHV0X2NvbnRlbnQsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uZWRpdG9yX2hhbmRsZXIuanVtcF90b19uZXh0X2N1cnNvcl9sb2NhdGlvbihcclxuICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5lbmRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcHJvY2Vzc19keW5hbWljX3RlbXBsYXRlcyhcclxuICAgICAgICBlbDogSFRNTEVsZW1lbnQsXHJcbiAgICAgICAgY3R4OiBNYXJrZG93blBvc3RQcm9jZXNzb3JDb250ZXh0XHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBkeW5hbWljX2NvbW1hbmRfcmVnZXggPSBnZW5lcmF0ZV9keW5hbWljX2NvbW1hbmRfcmVnZXgoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlTm9kZUl0ZXJhdG9yKGVsLCBOb2RlRmlsdGVyLlNIT1dfVEVYVCk7XHJcbiAgICAgICAgbGV0IG5vZGU7XHJcbiAgICAgICAgbGV0IHBhc3MgPSBmYWxzZTtcclxuICAgICAgICBsZXQgZnVuY3Rpb25zX29iamVjdDogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XHJcbiAgICAgICAgd2hpbGUgKChub2RlID0gd2Fsa2VyLm5leHROb2RlKCkpKSB7XHJcbiAgICAgICAgICAgIGxldCBjb250ZW50ID0gbm9kZS5ub2RlVmFsdWU7XHJcbiAgICAgICAgICAgIGlmIChjb250ZW50ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWF0Y2ggPSBkeW5hbWljX2NvbW1hbmRfcmVnZXguZXhlYyhjb250ZW50KTtcclxuICAgICAgICAgICAgICAgIGlmIChtYXRjaCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguc291cmNlUGF0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsZSB8fCAhKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzcyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY3JlYXRlX3J1bm5pbmdfY29uZmlnKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSdW5Nb2RlLkR5bmFtaWNQcm9jZXNzb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25zX29iamVjdCA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmZ1bmN0aW9uc19nZW5lcmF0b3IuZ2VuZXJhdGVfb2JqZWN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGdW5jdGlvbnNNb2RlLlVTRVJfSU5URVJOQUxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudF9mdW5jdGlvbnNfb2JqZWN0ID0gZnVuY3Rpb25zX29iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKG1hdGNoICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBOb3QgdGhlIG1vc3QgZWZmaWNpZW50IHdheSB0byBleGNsdWRlIHRoZSAnKycgZnJvbSB0aGUgY29tbWFuZCBidXQgSSBjb3VsZG4ndCBmaW5kIHNvbWV0aGluZyBiZXR0ZXJcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wbGV0ZV9jb21tYW5kID0gbWF0Y2hbMV0gKyBtYXRjaFsyXTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYW5kX291dHB1dDogc3RyaW5nID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5wYXJzZXIucGFyc2VfY29tbWFuZHMoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGVfY29tbWFuZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbnNfb2JqZWN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgQ29tbWFuZCBQYXJzaW5nIGVycm9yIGluIGR5bmFtaWMgY29tbWFuZCAnJHtjb21wbGV0ZV9jb21tYW5kfSdgXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tbWFuZF9vdXRwdXQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZHluYW1pY19jb21tYW5kX3JlZ2V4Lmxhc3RJbmRleCAtIG1hdGNoWzBdLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBkeW5hbWljX2NvbW1hbmRfcmVnZXgubGFzdEluZGV4O1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50LnN1YnN0cmluZygwLCBzdGFydCkgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kX291dHB1dCArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQuc3Vic3RyaW5nKGVuZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGR5bmFtaWNfY29tbWFuZF9yZWdleC5sYXN0SW5kZXggKz1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZF9vdXRwdXQubGVuZ3RoIC0gbWF0Y2hbMF0ubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoID0gZHluYW1pY19jb21tYW5kX3JlZ2V4LmV4ZWMoY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBub2RlLm5vZGVWYWx1ZSA9IGNvbnRlbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0X25ld19maWxlX3RlbXBsYXRlX2Zvcl9mb2xkZXIoZm9sZGVyOiBURm9sZGVyKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcclxuICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlcy5maW5kKFxyXG4gICAgICAgICAgICAgICAgKGUpID0+IGUuZm9sZGVyID09IGZvbGRlci5wYXRoXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2gudGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaC50ZW1wbGF0ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9sZGVyID0gZm9sZGVyLnBhcmVudDtcclxuICAgICAgICB9IHdoaWxlIChmb2xkZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldF9uZXdfZmlsZV90ZW1wbGF0ZV9mb3JfZmlsZShmaWxlOiBURmlsZSk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XHJcbiAgICAgICAgY29uc3QgbWF0Y2ggPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlX3RlbXBsYXRlcy5maW5kKChlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVSZWdleCA9IG5ldyBSZWdFeHAoZS5yZWdleCk7XHJcbiAgICAgICAgICAgIHJldHVybiBlUmVnZXgudGVzdChmaWxlLnBhdGgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2gudGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoLnRlbXBsYXRlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYXN5bmMgb25fZmlsZV9jcmVhdGlvbihcclxuICAgICAgICB0ZW1wbGF0ZXI6IFRlbXBsYXRlcixcclxuICAgICAgICBhcHA6IEFwcCxcclxuICAgICAgICBmaWxlOiBUQWJzdHJhY3RGaWxlXHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHx8IGZpbGUuZXh0ZW5zaW9uICE9PSBcIm1kXCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQXZvaWRzIHRlbXBsYXRlIHJlcGxhY2VtZW50IHdoZW4gc3luY2luZyB0ZW1wbGF0ZSBmaWxlc1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlX2ZvbGRlciA9IG5vcm1hbGl6ZVBhdGgoXHJcbiAgICAgICAgICAgIHRlbXBsYXRlci5wbHVnaW4uc2V0dGluZ3MudGVtcGxhdGVzX2ZvbGRlclxyXG4gICAgICAgICk7XHJcbiAgICAgICAgaWYgKGZpbGUucGF0aC5pbmNsdWRlcyh0ZW1wbGF0ZV9mb2xkZXIpICYmIHRlbXBsYXRlX2ZvbGRlciAhPT0gXCIvXCIpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVE9ETzogZmluZCBhIGJldHRlciB3YXkgdG8gZG8gdGhpc1xyXG4gICAgICAgIC8vIEN1cnJlbnRseSwgSSBoYXZlIHRvIHdhaXQgZm9yIHRoZSBub3RlIGV4dHJhY3RvciBwbHVnaW4gdG8gYWRkIHRoZSBmaWxlIGNvbnRlbnQgYmVmb3JlIHJlcGxhY2luZ1xyXG4gICAgICAgIGF3YWl0IGRlbGF5KDMwMCk7XHJcblxyXG4gICAgICAgIC8vIEF2b2lkcyB0ZW1wbGF0ZSByZXBsYWNlbWVudCB3aGVuIGNyZWF0aW5nIGZpbGUgZnJvbSB0ZW1wbGF0ZSB3aXRob3V0IGNvbnRlbnQgYmVmb3JlIGRlbGF5XHJcbiAgICAgICAgaWYgKHRlbXBsYXRlci5maWxlc193aXRoX3BlbmRpbmdfdGVtcGxhdGVzLmhhcyhmaWxlLnBhdGgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgZmlsZS5zdGF0LnNpemUgPT0gMCAmJlxyXG4gICAgICAgICAgICB0ZW1wbGF0ZXIucGx1Z2luLnNldHRpbmdzLmVuYWJsZV9mb2xkZXJfdGVtcGxhdGVzXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvbGRlcl90ZW1wbGF0ZV9tYXRjaCA9XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZXIuZ2V0X25ld19maWxlX3RlbXBsYXRlX2Zvcl9mb2xkZXIoZmlsZS5wYXJlbnQpO1xyXG4gICAgICAgICAgICBpZiAoIWZvbGRlcl90ZW1wbGF0ZV9tYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlX2ZpbGU6IFRGaWxlID0gYXdhaXQgZXJyb3JXcmFwcGVyKFxyXG4gICAgICAgICAgICAgICAgYXN5bmMgKCk6IFByb21pc2U8VEZpbGU+ID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZV90ZmlsZShhcHAsIGZvbGRlcl90ZW1wbGF0ZV9tYXRjaCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYENvdWxkbid0IGZpbmQgdGVtcGxhdGUgJHtmb2xkZXJfdGVtcGxhdGVfbWF0Y2h9YFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAvLyBlcnJvcldyYXBwZXIgZmFpbGVkXHJcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZV9maWxlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhd2FpdCB0ZW1wbGF0ZXIud3JpdGVfdGVtcGxhdGVfdG9fZmlsZSh0ZW1wbGF0ZV9maWxlLCBmaWxlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKFxyXG4gICAgICAgICAgICBmaWxlLnN0YXQuc2l6ZSA9PSAwICYmXHJcbiAgICAgICAgICAgIHRlbXBsYXRlci5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlX2ZpbGVfdGVtcGxhdGVzXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVfdGVtcGxhdGVfbWF0Y2ggPVxyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVyLmdldF9uZXdfZmlsZV90ZW1wbGF0ZV9mb3JfZmlsZShmaWxlKTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlX3RlbXBsYXRlX21hdGNoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVfZmlsZTogVEZpbGUgPSBhd2FpdCBlcnJvcldyYXBwZXIoXHJcbiAgICAgICAgICAgICAgICBhc3luYyAoKTogUHJvbWlzZTxURmlsZT4gPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlX3RmaWxlKGFwcCwgZmlsZV90ZW1wbGF0ZV9tYXRjaCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYENvdWxkbid0IGZpbmQgdGVtcGxhdGUgJHtmaWxlX3RlbXBsYXRlX21hdGNofWBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgLy8gZXJyb3JXcmFwcGVyIGZhaWxlZFxyXG4gICAgICAgICAgICBpZiAodGVtcGxhdGVfZmlsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYXdhaXQgdGVtcGxhdGVyLndyaXRlX3RlbXBsYXRlX3RvX2ZpbGUodGVtcGxhdGVfZmlsZSwgZmlsZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGZpbGUuc3RhdC5zaXplIDw9IDEwMDAwMCkge1xyXG4gICAgICAgICAgICAgICAgLy9odHRwczovL2dpdGh1Yi5jb20vU2lsZW50Vm9pZDEzL1RlbXBsYXRlci9pc3N1ZXMvODczXHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0ZW1wbGF0ZXIub3ZlcndyaXRlX2ZpbGVfY29tbWFuZHMoZmlsZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgICAgICAgICBgVGVtcGxhdGVyIHNraXBwZWQgcGFyc2luZyAke2ZpbGUucGF0aH0gYmVjYXVzZSBmaWxlIHNpemUgZXhjZWVkcyAxMDAwMGBcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZXhlY3V0ZV9zdGFydHVwX3NjcmlwdHMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgZm9yIChjb25zdCB0ZW1wbGF0ZSBvZiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdGFydHVwX3RlbXBsYXRlcykge1xyXG4gICAgICAgICAgICBpZiAoIXRlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gZXJyb3JXcmFwcGVyU3luYyhcclxuICAgICAgICAgICAgICAgICgpID0+IHJlc29sdmVfdGZpbGUodGhpcy5wbHVnaW4uYXBwLCB0ZW1wbGF0ZSksXHJcbiAgICAgICAgICAgICAgICBgQ291bGRuJ3QgZmluZCBzdGFydHVwIHRlbXBsYXRlIFwiJHt0ZW1wbGF0ZX1cImBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCB7IHBhdGggfSA9IGZpbGU7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRfdGVtcGxhdGVyX3Rhc2socGF0aCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJ1bm5pbmdfY29uZmlnID0gdGhpcy5jcmVhdGVfcnVubmluZ19jb25maWcoXHJcbiAgICAgICAgICAgICAgICBmaWxlLFxyXG4gICAgICAgICAgICAgICAgZmlsZSxcclxuICAgICAgICAgICAgICAgIFJ1bk1vZGUuU3RhcnR1cFRlbXBsYXRlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGF3YWl0IGVycm9yV3JhcHBlcihcclxuICAgICAgICAgICAgICAgIGFzeW5jICgpID0+IHRoaXMucmVhZF9hbmRfcGFyc2VfdGVtcGxhdGUocnVubmluZ19jb25maWcpLFxyXG4gICAgICAgICAgICAgICAgYFN0YXJ0dXAgVGVtcGxhdGUgcGFyc2luZyBlcnJvciwgYWJvcnRpbmcuYFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVuZF90ZW1wbGF0ZXJfdGFzayhwYXRoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19