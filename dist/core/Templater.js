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
    async setup() {
        this.files_with_pending_templates = new Set();
        await this.parser.init();
        await this.functions_generator.init();
        this.plugin.registerMarkdownPostProcessor((el, ctx) => this.process_dynamic_templates(el, ctx));
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
    async read_and_parse_template(config) {
        const template_content = await this.plugin.app.vault.read(config.template_file);
        return this.parse_template(config, template_content);
    }
    async parse_template(config, template_content) {
        const functions_object = await this.functions_generator.generate_object(config, FunctionsMode.USER_INTERNAL);
        this.current_functions_object = functions_object;
        const content = await this.parser.parse_commands(template_content, functions_object);
        return content;
    }
    start_templater_task(path) {
        this.files_with_pending_templates.add(path);
    }
    async end_templater_task(path) {
        this.files_with_pending_templates.delete(path);
        if (this.files_with_pending_templates.size === 0) {
            this.plugin.app.workspace.trigger("templater:all-templates-executed");
            await this.functions_generator.teardown();
        }
    }
    async create_new_note_from_template(template, folder, filename, open_new_note = true) {
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
        const created_note = await errorWrapper(async () => {
            const folderPath = folder instanceof TFolder ? folder.path : folder;
            const path = this.plugin.app.vault.getAvailablePath(normalizePath(`${folderPath ?? ""}/${filename || "Untitled"}`), extension);
            const folder_path = get_folder_path_from_file_path(path);
            if (folder_path &&
                !this.plugin.app.vault.getAbstractFileByPathInsensitive(folder_path)) {
                await this.plugin.app.vault.createFolder(folder_path);
            }
            return this.plugin.app.vault.create(path, "");
        }, `Couldn't create ${extension} file.`);
        if (created_note == null) {
            return;
        }
        const { path } = created_note;
        this.start_templater_task(path);
        let running_config;
        let output_content;
        if (template instanceof TFile) {
            running_config = this.create_running_config(template, created_note, RunMode.CreateNewFromTemplate);
            output_content = await errorWrapper(async () => this.read_and_parse_template(running_config), "Template parsing error, aborting.");
        }
        else {
            running_config = this.create_running_config(undefined, created_note, RunMode.CreateNewFromTemplate);
            output_content = await errorWrapper(async () => this.parse_template(running_config, template), "Template parsing error, aborting.");
        }
        if (output_content == null) {
            await this.plugin.app.vault.delete(created_note);
            await this.end_templater_task(path);
            return;
        }
        await this.plugin.app.vault.modify(created_note, output_content);
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
            await active_leaf.openFile(created_note, {
                state: { mode: "source" },
            });
            await this.plugin.editor_handler.jump_to_next_cursor_location(created_note, true);
            active_leaf.setEphemeralState({
                rename: "all",
            });
        }
        await this.end_templater_task(path);
        return created_note;
    }
    async append_template_to_active_file(template_file) {
        const active_view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        const active_editor = this.plugin.app.workspace.activeEditor;
        if (!active_editor || !active_editor.file || !active_editor.editor) {
            log_error(new TemplaterError("No active editor, can't append templates."));
            return;
        }
        const { path } = active_editor.file;
        this.start_templater_task(path);
        const running_config = this.create_running_config(template_file, active_editor.file, RunMode.AppendActiveFile);
        const output_content = await errorWrapper(async () => this.read_and_parse_template(running_config), "Template parsing error, aborting.");
        // errorWrapper failed
        if (output_content == null) {
            await this.end_templater_task(path);
            return;
        }
        const editor = active_editor.editor;
        const doc = editor.getDoc();
        const oldSelections = doc.listSelections();
        doc.replaceSelection(output_content);
        // Refresh editor to ensure properties widget shows after inserting template in blank file
        if (active_editor.file) {
            await this.plugin.app.vault.append(active_editor.file, "");
        }
        this.plugin.app.workspace.trigger("templater:template-appended", {
            view: active_view,
            editor: active_editor,
            content: output_content,
            oldSelections,
            newSelections: doc.listSelections(),
        });
        await this.plugin.editor_handler.jump_to_next_cursor_location(active_editor.file, true);
        await this.end_templater_task(path);
    }
    async write_template_to_file(template_file, file) {
        const { path } = file;
        this.start_templater_task(path);
        const active_editor = this.plugin.app.workspace.activeEditor;
        const active_file = get_active_file(this.plugin.app);
        const running_config = this.create_running_config(template_file, file, RunMode.OverwriteFile);
        const output_content = await errorWrapper(async () => this.read_and_parse_template(running_config), "Template parsing error, aborting.");
        // errorWrapper failed
        if (output_content == null) {
            await this.end_templater_task(path);
            return;
        }
        await this.plugin.app.vault.modify(file, output_content);
        // Set cursor to first line of editor (below properties)
        // https://github.com/SilentVoid13/Templater/issues/1231
        if (active_file?.path === file.path &&
            active_editor &&
            active_editor.editor) {
            const editor = active_editor.editor;
            editor.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 0 });
        }
        this.plugin.app.workspace.trigger("templater:new-note-from-template", {
            file,
            content: output_content,
        });
        await this.plugin.editor_handler.jump_to_next_cursor_location(file, true);
        await this.end_templater_task(path);
    }
    overwrite_active_file_commands() {
        const active_editor = this.plugin.app.workspace.activeEditor;
        if (!active_editor || !active_editor.file) {
            log_error(new TemplaterError("Active editor is null, can't overwrite content"));
            return;
        }
        this.overwrite_file_commands(active_editor.file, true);
    }
    async overwrite_file_commands(file, active_file = false) {
        const { path } = file;
        this.start_templater_task(path);
        const running_config = this.create_running_config(file, file, active_file ? RunMode.OverwriteActiveFile : RunMode.OverwriteFile);
        const output_content = await errorWrapper(async () => this.read_and_parse_template(running_config), "Template parsing error, aborting.");
        // errorWrapper failed
        if (output_content == null) {
            await this.end_templater_task(path);
            return;
        }
        await this.plugin.app.vault.modify(file, output_content);
        this.plugin.app.workspace.trigger("templater:overwrite-file", {
            file,
            content: output_content,
        });
        await this.plugin.editor_handler.jump_to_next_cursor_location(file, true);
        await this.end_templater_task(path);
    }
    async process_dynamic_templates(el, ctx) {
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
                            await this.functions_generator.generate_object(config, FunctionsMode.USER_INTERNAL);
                        this.current_functions_object = functions_object;
                    }
                }
                while (match != null) {
                    // Not the most efficient way to exclude the '+' from the command but I couldn't find something better
                    const complete_command = match[1] + match[2];
                    const command_output = await errorWrapper(async () => {
                        return await this.parser.parse_commands(complete_command, functions_object);
                    }, `Command Parsing error in dynamic command '${complete_command}'`);
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
    static async on_file_creation(templater, app, file) {
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
        await delay(300);
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
            const template_file = await errorWrapper(async () => {
                return resolve_tfile(app, folder_template_match);
            }, `Couldn't find template ${folder_template_match}`);
            // errorWrapper failed
            if (template_file == null) {
                return;
            }
            await templater.write_template_to_file(template_file, file);
        }
        else if (file.stat.size == 0 &&
            templater.plugin.settings.enable_file_templates) {
            const file_template_match = templater.get_new_file_template_for_file(file);
            if (!file_template_match) {
                return;
            }
            const template_file = await errorWrapper(async () => {
                return resolve_tfile(app, file_template_match);
            }, `Couldn't find template ${file_template_match}`);
            // errorWrapper failed
            if (template_file == null) {
                return;
            }
            await templater.write_template_to_file(template_file, file);
        }
        else {
            if (file.stat.size <= 100000) {
                //https://github.com/SilentVoid13/Templater/issues/873
                await templater.overwrite_file_commands(file);
            }
            else {
                console.log(`Templater skipped parsing ${file.path} because file size exceeds 10000`);
            }
        }
    }
    async execute_startup_scripts() {
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
            await errorWrapper(async () => this.read_and_parse_template(running_config), `Startup Template parsing error, aborting.`);
            await this.end_templater_task(path);
        }
    }
}
