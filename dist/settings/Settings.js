import { PluginSettingTab, Setting } from "obsidian";
import { errorWrapperSync, TemplaterError } from "utils/Error";
import { log_error } from "utils/Log";
import { arraymove, get_tfiles_from_folder } from "utils/Utils";
import { FileSuggest, FileSuggestMode } from "./suggesters/FileSuggester";
import { FolderSuggest } from "./suggesters/FolderSuggester";
import { IntellisenseRenderOption } from "./RenderSettings/IntellisenseRenderOption";
export const DEFAULT_SETTINGS = {
    command_timeout: 5,
    templates_folder: "",
    templates_pairs: [["", ""]],
    trigger_on_file_creation: false,
    auto_jump_to_cursor: false,
    enable_system_commands: false,
    shell_path: "",
    user_scripts_folder: "",
    enable_folder_templates: true,
    folder_templates: [{ folder: "", template: "" }],
    enable_file_templates: false,
    file_templates: [{ regex: ".*", template: "" }],
    syntax_highlighting: true,
    syntax_highlighting_mobile: false,
    enabled_templates_hotkeys: [""],
    startup_templates: [""],
    intellisense_render: IntellisenseRenderOption.RenderDescriptionParameterReturn
};
export class TemplaterSettingTab extends PluginSettingTab {
    constructor(plugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }
    display() {
        this.containerEl.empty();
        this.add_template_folder_setting();
        this.add_internal_functions_setting();
        this.add_syntax_highlighting_settings();
        this.add_auto_jump_to_cursor();
        this.add_trigger_on_new_file_creation_setting();
        if (this.plugin.settings.trigger_on_file_creation) {
            this.add_folder_templates_setting();
            this.add_file_templates_setting();
        }
        this.add_templates_hotkeys_setting();
        this.add_startup_templates_setting();
        this.add_user_script_functions_setting();
        this.add_user_system_command_functions_setting();
        this.add_donating_setting();
    }
    add_template_folder_setting() {
        new Setting(this.containerEl)
            .setName("Template folder location")
            .setDesc("Files in this folder will be available as templates.")
            .addSearch((cb) => {
            new FolderSuggest(this.app, cb.inputEl);
            cb.setPlaceholder("Example: folder1/folder2")
                .setValue(this.plugin.settings.templates_folder)
                .onChange((new_folder) => {
                // Trim folder and Strip ending slash if there
                new_folder = new_folder.trim();
                new_folder = new_folder.replace(/\/$/, "");
                this.plugin.settings.templates_folder = new_folder;
                this.plugin.save_settings();
            });
            // @ts-ignore
            cb.containerEl.addClass("templater_search");
        });
    }
    add_internal_functions_setting() {
        const desc = document.createDocumentFragment();
        desc.append("Templater provides multiples predefined variables / functions that you can use.", desc.createEl("br"), "Check the ", desc.createEl("a", {
            href: "https://silentvoid13.github.io/Templater/",
            text: "documentation",
        }), " to get a list of all the available internal variables / functions.");
        new Setting(this.containerEl)
            .setName("Internal variables and functions")
            .setDesc(desc);
    }
    add_syntax_highlighting_settings() {
        const desktopDesc = document.createDocumentFragment();
        desktopDesc.append("Adds syntax highlighting for Templater commands in edit mode.");
        const mobileDesc = document.createDocumentFragment();
        mobileDesc.append("Adds syntax highlighting for Templater commands in edit mode on " +
            "mobile. Use with caution: this may break live preview on mobile " +
            "platforms.");
        new Setting(this.containerEl)
            .setName("Syntax highlighting on desktop")
            .setDesc(desktopDesc)
            .addToggle((toggle) => {
            toggle
                .setValue(this.plugin.settings.syntax_highlighting)
                .onChange((syntax_highlighting) => {
                this.plugin.settings.syntax_highlighting =
                    syntax_highlighting;
                this.plugin.save_settings();
                this.plugin.event_handler.update_syntax_highlighting();
            });
        });
        new Setting(this.containerEl)
            .setName("Syntax highlighting on mobile")
            .setDesc(mobileDesc)
            .addToggle((toggle) => {
            toggle
                .setValue(this.plugin.settings.syntax_highlighting_mobile)
                .onChange((syntax_highlighting_mobile) => {
                this.plugin.settings.syntax_highlighting_mobile =
                    syntax_highlighting_mobile;
                this.plugin.save_settings();
                this.plugin.event_handler.update_syntax_highlighting();
            });
        });
    }
    add_auto_jump_to_cursor() {
        const desc = document.createDocumentFragment();
        desc.append("Automatically triggers ", desc.createEl("code", { text: "tp.file.cursor" }), " after inserting a template.", desc.createEl("br"), "You can also set a hotkey to manually trigger ", desc.createEl("code", { text: "tp.file.cursor" }), ".");
        new Setting(this.containerEl)
            .setName("Automatic jump to cursor")
            .setDesc(desc)
            .addToggle((toggle) => {
            toggle
                .setValue(this.plugin.settings.auto_jump_to_cursor)
                .onChange((auto_jump_to_cursor) => {
                this.plugin.settings.auto_jump_to_cursor =
                    auto_jump_to_cursor;
                this.plugin.save_settings();
            });
        });
    }
    add_trigger_on_new_file_creation_setting() {
        const desc = document.createDocumentFragment();
        desc.append("Templater will listen for the new file creation event, and, if it matches a rule you've set, replace every command it finds in the new file's content. ", "This makes Templater compatible with other plugins like the Daily note core plugin, Calendar plugin, Review plugin, Note refactor plugin, etc. ", desc.createEl("br"), desc.createEl("br"), "Make sure to set up rules under either folder templates or file regex template below.", desc.createEl("br"), desc.createEl("br"), desc.createEl("b", {
            text: "Warning: ",
        }), "This can be dangerous if you create new files with unknown / unsafe content on creation. Make sure that every new file's content is safe on creation.");
        new Setting(this.containerEl)
            .setName("Trigger Templater on new file creation")
            .setDesc(desc)
            .addToggle((toggle) => {
            toggle
                .setValue(this.plugin.settings.trigger_on_file_creation)
                .onChange((trigger_on_file_creation) => {
                this.plugin.settings.trigger_on_file_creation =
                    trigger_on_file_creation;
                this.plugin.save_settings();
                this.plugin.event_handler.update_trigger_file_on_creation();
                // Force refresh
                this.display();
            });
        });
    }
    add_templates_hotkeys_setting() {
        new Setting(this.containerEl).setName("Template hotkeys").setHeading();
        const desc = document.createDocumentFragment();
        desc.append("Template hotkeys allows you to bind a template to a hotkey.");
        new Setting(this.containerEl).setDesc(desc);
        this.plugin.settings.enabled_templates_hotkeys.forEach((template, index) => {
            const s = new Setting(this.containerEl)
                .addSearch((cb) => {
                new FileSuggest(cb.inputEl, this.plugin, FileSuggestMode.TemplateFiles);
                cb.setPlaceholder("Example: folder1/template_file")
                    .setValue(template)
                    .onChange((new_template) => {
                    if (new_template &&
                        this.plugin.settings.enabled_templates_hotkeys.contains(new_template)) {
                        log_error(new TemplaterError("This template is already bound to a hotkey"));
                        return;
                    }
                    this.plugin.command_handler.add_template_hotkey(this.plugin.settings
                        .enabled_templates_hotkeys[index], new_template);
                    this.plugin.settings.enabled_templates_hotkeys[index] = new_template;
                    this.plugin.save_settings();
                });
                // @ts-ignore
                cb.containerEl.addClass("templater_search");
            })
                .addExtraButton((cb) => {
                cb.setIcon("any-key")
                    .setTooltip("Configure Hotkey")
                    .onClick(() => {
                    // TODO: Replace with future "official" way to do this
                    // @ts-ignore
                    this.app.setting.openTabById("hotkeys");
                    // @ts-ignore
                    const tab = this.app.setting.activeTab;
                    tab.searchComponent.inputEl.value = template;
                    tab.updateHotkeyVisibility();
                });
            })
                .addExtraButton((cb) => {
                cb.setIcon("up-chevron-glyph")
                    .setTooltip("Move up")
                    .onClick(() => {
                    arraymove(this.plugin.settings
                        .enabled_templates_hotkeys, index, index - 1);
                    this.plugin.save_settings();
                    this.display();
                });
            })
                .addExtraButton((cb) => {
                cb.setIcon("down-chevron-glyph")
                    .setTooltip("Move down")
                    .onClick(() => {
                    arraymove(this.plugin.settings
                        .enabled_templates_hotkeys, index, index + 1);
                    this.plugin.save_settings();
                    this.display();
                });
            })
                .addExtraButton((cb) => {
                cb.setIcon("cross")
                    .setTooltip("Delete")
                    .onClick(() => {
                    this.plugin.command_handler.remove_template_hotkey(this.plugin.settings
                        .enabled_templates_hotkeys[index]);
                    this.plugin.settings.enabled_templates_hotkeys.splice(index, 1);
                    this.plugin.save_settings();
                    // Force refresh
                    this.display();
                });
            });
            s.infoEl.remove();
        });
        new Setting(this.containerEl).addButton((cb) => {
            cb.setButtonText("Add new hotkey for template")
                .setCta()
                .onClick(() => {
                this.plugin.settings.enabled_templates_hotkeys.push("");
                this.plugin.save_settings();
                // Force refresh
                this.display();
            });
        });
    }
    add_folder_templates_setting() {
        new Setting(this.containerEl).setName("Folder templates").setHeading();
        const descHeading = document.createDocumentFragment();
        descHeading.append("Folder templates are triggered when a new ", descHeading.createEl("strong", { text: "empty " }), "file is created in a given folder.", descHeading.createEl("br"), "Templater will fill the empty file with the specified template.", descHeading.createEl("br"), "The deepest match is used. A global default template would be defined on the root ", descHeading.createEl("code", { text: "/" }), ".");
        new Setting(this.containerEl).setDesc(descHeading);
        const descUseNewFileTemplate = document.createDocumentFragment();
        descUseNewFileTemplate.append("When enabled, Templater will make use of the folder templates defined below. This option is mutually exclusive with file regex templates below, so enabling one will disable the other.");
        new Setting(this.containerEl)
            .setName("Enable folder templates")
            .setDesc(descUseNewFileTemplate)
            .addToggle((toggle) => {
            toggle
                .setValue(this.plugin.settings.enable_folder_templates)
                .onChange((use_new_folder_templates) => {
                this.plugin.settings.enable_folder_templates =
                    use_new_folder_templates;
                if (use_new_folder_templates) {
                    this.plugin.settings.enable_file_templates = false;
                }
                this.plugin.save_settings();
                // Force refresh
                this.display();
            });
        });
        if (!this.plugin.settings.enable_folder_templates) {
            return;
        }
        this.plugin.settings.folder_templates.forEach((folder_template, index) => {
            const s = new Setting(this.containerEl)
                .addSearch((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder("Folder")
                    .setValue(folder_template.folder)
                    .onChange((new_folder) => {
                    if (new_folder &&
                        this.plugin.settings.folder_templates.some((e) => e.folder == new_folder)) {
                        log_error(new TemplaterError("This folder already has a template associated with it"));
                        return;
                    }
                    this.plugin.settings.folder_templates[index].folder = new_folder;
                    this.plugin.save_settings();
                });
                // @ts-ignore
                cb.containerEl.addClass("templater_search");
            })
                .addSearch((cb) => {
                new FileSuggest(cb.inputEl, this.plugin, FileSuggestMode.TemplateFiles);
                cb.setPlaceholder("Template")
                    .setValue(folder_template.template)
                    .onChange((new_template) => {
                    this.plugin.settings.folder_templates[index].template = new_template;
                    this.plugin.save_settings();
                });
                // @ts-ignore
                cb.containerEl.addClass("templater_search");
            })
                .addExtraButton((cb) => {
                cb.setIcon("up-chevron-glyph")
                    .setTooltip("Move up")
                    .onClick(() => {
                    arraymove(this.plugin.settings.folder_templates, index, index - 1);
                    this.plugin.save_settings();
                    this.display();
                });
            })
                .addExtraButton((cb) => {
                cb.setIcon("down-chevron-glyph")
                    .setTooltip("Move down")
                    .onClick(() => {
                    arraymove(this.plugin.settings.folder_templates, index, index + 1);
                    this.plugin.save_settings();
                    this.display();
                });
            })
                .addExtraButton((cb) => {
                cb.setIcon("cross")
                    .setTooltip("Delete")
                    .onClick(() => {
                    this.plugin.settings.folder_templates.splice(index, 1);
                    this.plugin.save_settings();
                    this.display();
                });
            });
            s.infoEl.remove();
        });
        new Setting(this.containerEl).addButton((button) => {
            button
                .setButtonText("Add new folder template")
                .setTooltip("Add additional folder template")
                .setCta()
                .onClick(() => {
                this.plugin.settings.folder_templates.push({
                    folder: "",
                    template: "",
                });
                this.plugin.save_settings();
                this.display();
            });
        });
    }
    add_file_templates_setting() {
        new Setting(this.containerEl)
            .setName("File regex templates")
            .setHeading();
        const descHeading = document.createDocumentFragment();
        descHeading.append("File regex templates are triggered when a new ", descHeading.createEl("strong", { text: "empty" }), " file is created that matches one of them. Templater will fill the empty file with the specified template.", descHeading.createEl("br"), "The first match from the top is used, so the order of the rules is important.", descHeading.createEl("br"), "Use ", descHeading.createEl("code", { text: ".*" }), " as a final catch-all, if you need it.");
        new Setting(this.containerEl).setDesc(descHeading);
        const descUseNewFileTemplate = document.createDocumentFragment();
        descUseNewFileTemplate.append("When enabled, Templater will make use of the file regex templates defined below. This option is mutually exclusive with folder templates above, so enabling one will disable the other.");
        new Setting(this.containerEl)
            .setName("Enable file regex templates")
            .setDesc(descUseNewFileTemplate)
            .addToggle((toggle) => {
            toggle
                .setValue(this.plugin.settings.enable_file_templates)
                .onChange((use_new_file_templates) => {
                this.plugin.settings.enable_file_templates =
                    use_new_file_templates;
                if (use_new_file_templates) {
                    this.plugin.settings.enable_folder_templates =
                        false;
                }
                this.plugin.save_settings();
                // Force refresh
                this.display();
            });
        });
        if (!this.plugin.settings.enable_file_templates) {
            return;
        }
        this.plugin.settings.file_templates.forEach((file_template, index) => {
            const s = new Setting(this.containerEl)
                .addText((cb) => {
                cb.setPlaceholder("File regex")
                    .setValue(file_template.regex)
                    .onChange((new_regex) => {
                    this.plugin.settings.file_templates[index].regex =
                        new_regex;
                    this.plugin.save_settings();
                });
                // @ts-ignore
                cb.inputEl.addClass("templater_search");
            })
                .addSearch((cb) => {
                new FileSuggest(cb.inputEl, this.plugin, FileSuggestMode.TemplateFiles);
                cb.setPlaceholder("Template")
                    .setValue(file_template.template)
                    .onChange((new_template) => {
                    this.plugin.settings.file_templates[index].template = new_template;
                    this.plugin.save_settings();
                });
                // @ts-ignore
                cb.containerEl.addClass("templater_search");
            })
                .addExtraButton((cb) => {
                cb.setIcon("up-chevron-glyph")
                    .setTooltip("Move up")
                    .onClick(() => {
                    arraymove(this.plugin.settings.file_templates, index, index - 1);
                    this.plugin.save_settings();
                    this.display();
                });
            })
                .addExtraButton((cb) => {
                cb.setIcon("down-chevron-glyph")
                    .setTooltip("Move down")
                    .onClick(() => {
                    arraymove(this.plugin.settings.file_templates, index, index + 1);
                    this.plugin.save_settings();
                    this.display();
                });
            })
                .addExtraButton((cb) => {
                cb.setIcon("cross")
                    .setTooltip("Delete")
                    .onClick(() => {
                    this.plugin.settings.file_templates.splice(index, 1);
                    this.plugin.save_settings();
                    this.display();
                });
            });
            s.infoEl.remove();
        });
        new Setting(this.containerEl).addButton((button) => {
            button
                .setButtonText("Add new file regex")
                .setTooltip("Add additional file regex")
                .setCta()
                .onClick(() => {
                this.plugin.settings.file_templates.push({
                    regex: "",
                    template: "",
                });
                this.plugin.save_settings();
                this.display();
            });
        });
    }
    add_startup_templates_setting() {
        new Setting(this.containerEl).setName("Startup templates").setHeading();
        const desc = document.createDocumentFragment();
        desc.append("Startup templates are templates that will get executed once when Templater starts.", desc.createEl("br"), "These templates won't output anything.", desc.createEl("br"), "This can be useful to set up templates adding hooks to Obsidian events for example.");
        new Setting(this.containerEl).setDesc(desc);
        this.plugin.settings.startup_templates.forEach((template, index) => {
            const s = new Setting(this.containerEl)
                .addSearch((cb) => {
                new FileSuggest(cb.inputEl, this.plugin, FileSuggestMode.TemplateFiles);
                cb.setPlaceholder("Example: folder1/template_file")
                    .setValue(template)
                    .onChange((new_template) => {
                    if (new_template &&
                        this.plugin.settings.startup_templates.contains(new_template)) {
                        log_error(new TemplaterError("This startup template already exist"));
                        return;
                    }
                    this.plugin.settings.startup_templates[index] =
                        new_template;
                    this.plugin.save_settings();
                });
                // @ts-ignore
                cb.containerEl.addClass("templater_search");
            })
                .addExtraButton((cb) => {
                cb.setIcon("cross")
                    .setTooltip("Delete")
                    .onClick(() => {
                    this.plugin.settings.startup_templates.splice(index, 1);
                    this.plugin.save_settings();
                    // Force refresh
                    this.display();
                });
            });
            s.infoEl.remove();
        });
        new Setting(this.containerEl).addButton((cb) => {
            cb.setButtonText("Add new startup template")
                .setCta()
                .onClick(() => {
                this.plugin.settings.startup_templates.push("");
                this.plugin.save_settings();
                // Force refresh
                this.display();
            });
        });
    }
    add_user_script_functions_setting() {
        new Setting(this.containerEl)
            .setName("User script functions")
            .setHeading();
        let desc = document.createDocumentFragment();
        desc.append("All JavaScript files in this folder will be loaded as CommonJS modules, to import custom user functions.", desc.createEl("br"), "The folder needs to be accessible from the vault.", desc.createEl("br"), "Check the ", desc.createEl("a", {
            href: "https://silentvoid13.github.io/Templater/",
            text: "documentation",
        }), " for more information.");
        new Setting(this.containerEl)
            .setName("Script files folder location")
            .setDesc(desc)
            .addSearch((cb) => {
            new FolderSuggest(this.app, cb.inputEl);
            cb.setPlaceholder("Example: folder1/folder2")
                .setValue(this.plugin.settings.user_scripts_folder)
                .onChange((new_folder) => {
                this.plugin.settings.user_scripts_folder = new_folder;
                this.plugin.save_settings();
            });
            // @ts-ignore
            cb.containerEl.addClass("templater_search");
        });
        new Setting(this.containerEl)
            .setName('User script intellisense')
            .setDesc('Determine how you\'d like to have user script intellisense render. Note values will not render if not in the script.')
            .addDropdown(cb => {
            cb
                .addOption("0", "Turn off intellisense")
                .addOption("1", "Render method description, parameters list, and return")
                .addOption("2", "Render method description and parameters list")
                .addOption("3", "Render method description and return")
                .addOption("4", "Render method description")
                .setValue(this.plugin.settings.intellisense_render.toString())
                .onChange((value) => {
                this.plugin.settings.intellisense_render = parseInt(value);
                this.plugin.save_settings();
            });
        });
        desc = document.createDocumentFragment();
        let name;
        if (!this.plugin.settings.user_scripts_folder) {
            name = "No user scripts folder set";
        }
        else {
            const files = errorWrapperSync(() => get_tfiles_from_folder(this.app, this.plugin.settings.user_scripts_folder), `User scripts folder doesn't exist`);
            if (!files || files.length === 0) {
                name = "No user scripts detected";
            }
            else {
                let count = 0;
                for (const file of files) {
                    if (file.extension === "js") {
                        count++;
                        desc.append(desc.createEl("li", {
                            text: `tp.user.${file.basename}`,
                        }));
                    }
                }
                name = `Detected ${count} User Script(s)`;
            }
        }
        new Setting(this.containerEl)
            .setName(name)
            .setDesc(desc)
            .addExtraButton((extra) => {
            extra
                .setIcon("sync")
                .setTooltip("Refresh")
                .onClick(() => {
                // Force refresh
                this.display();
            });
        });
    }
    add_user_system_command_functions_setting() {
        let desc = document.createDocumentFragment();
        desc.append("Allows you to create user functions linked to system commands.", desc.createEl("br"), desc.createEl("b", {
            text: "Warning: ",
        }), "It can be dangerous to execute arbitrary system commands from untrusted sources. Only run system commands that you understand, from trusted sources.");
        new Setting(this.containerEl)
            .setName("User system command functions")
            .setHeading();
        new Setting(this.containerEl)
            .setName("Enable user system command functions")
            .setDesc(desc)
            .addToggle((toggle) => {
            toggle
                .setValue(this.plugin.settings.enable_system_commands)
                .onChange((enable_system_commands) => {
                this.plugin.settings.enable_system_commands =
                    enable_system_commands;
                this.plugin.save_settings();
                // Force refresh
                this.display();
            });
        });
        if (this.plugin.settings.enable_system_commands) {
            new Setting(this.containerEl)
                .setName("Timeout")
                .setDesc("Maximum timeout in seconds for a system command.")
                .addText((text) => {
                text.setPlaceholder("Timeout")
                    .setValue(this.plugin.settings.command_timeout.toString())
                    .onChange((new_value) => {
                    const new_timeout = Number(new_value);
                    if (isNaN(new_timeout)) {
                        log_error(new TemplaterError("Timeout must be a number"));
                        return;
                    }
                    this.plugin.settings.command_timeout = new_timeout;
                    this.plugin.save_settings();
                });
            });
            desc = document.createDocumentFragment();
            desc.append("Full path to the shell binary to execute the command with.", desc.createEl("br"), "This setting is optional and will default to the system's default shell if not specified.", desc.createEl("br"), "You can use forward slashes ('/') as path separators on all platforms if in doubt.");
            new Setting(this.containerEl)
                .setName("Shell binary location")
                .setDesc(desc)
                .addText((text) => {
                text.setPlaceholder("Example: /bin/bash, ...")
                    .setValue(this.plugin.settings.shell_path)
                    .onChange((shell_path) => {
                    this.plugin.settings.shell_path = shell_path;
                    this.plugin.save_settings();
                });
            });
            let i = 1;
            this.plugin.settings.templates_pairs.forEach((template_pair) => {
                const div = this.containerEl.createEl("div");
                div.addClass("templater_div");
                const title = this.containerEl.createEl("h4", {
                    text: "User function n°" + i,
                });
                title.addClass("templater_title");
                const setting = new Setting(this.containerEl)
                    .addExtraButton((extra) => {
                    extra
                        .setIcon("cross")
                        .setTooltip("Delete")
                        .onClick(() => {
                        const index = this.plugin.settings.templates_pairs.indexOf(template_pair);
                        if (index > -1) {
                            this.plugin.settings.templates_pairs.splice(index, 1);
                            this.plugin.save_settings();
                            // Force refresh
                            this.display();
                        }
                    });
                })
                    .addText((text) => {
                    const t = text
                        .setPlaceholder("Function name")
                        .setValue(template_pair[0])
                        .onChange((new_value) => {
                        const index = this.plugin.settings.templates_pairs.indexOf(template_pair);
                        if (index > -1) {
                            this.plugin.settings.templates_pairs[index][0] = new_value;
                            this.plugin.save_settings();
                        }
                    });
                    t.inputEl.addClass("templater_template");
                    return t;
                })
                    .addTextArea((text) => {
                    const t = text
                        .setPlaceholder("System command")
                        .setValue(template_pair[1])
                        .onChange((new_cmd) => {
                        const index = this.plugin.settings.templates_pairs.indexOf(template_pair);
                        if (index > -1) {
                            this.plugin.settings.templates_pairs[index][1] = new_cmd;
                            this.plugin.save_settings();
                        }
                    });
                    t.inputEl.setAttr("rows", 2);
                    t.inputEl.addClass("templater_cmd");
                    return t;
                });
                setting.infoEl.remove();
                div.appendChild(title);
                div.appendChild(this.containerEl.lastChild);
                i += 1;
            });
            const div = this.containerEl.createEl("div");
            div.addClass("templater_div2");
            const setting = new Setting(this.containerEl).addButton((button) => {
                button
                    .setButtonText("Add new user function")
                    .setCta()
                    .onClick(() => {
                    this.plugin.settings.templates_pairs.push(["", ""]);
                    this.plugin.save_settings();
                    // Force refresh
                    this.display();
                });
            });
            setting.infoEl.remove();
            div.appendChild(this.containerEl.lastChild);
        }
    }
    add_donating_setting() {
        const s = new Setting(this.containerEl)
            .setName("Donate")
            .setDesc("If you like this Plugin, consider donating to support continued development.");
        const a1 = document.createElement("a");
        a1.setAttribute("href", "https://github.com/sponsors/silentvoid13");
        a1.addClass("templater_donating");
        const img1 = document.createElement("img");
        img1.src =
            "https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86";
        a1.appendChild(img1);
        const a2 = document.createElement("a");
        a2.setAttribute("href", "https://www.paypal.com/donate?hosted_button_id=U2SRGAFYXT32Q");
        a2.addClass("templater_donating");
        const img2 = document.createElement("img");
        img2.src =
            "https://img.shields.io/badge/paypal-silentvoid13-yellow?style=social&logo=paypal";
        a2.appendChild(img2);
        s.settingEl.appendChild(a1);
        s.settingEl.appendChild(a2);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2V0dGluZ3MvU2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFtQixnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDdEUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUMvRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQ3RDLE9BQU8sRUFBRSxTQUFTLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDaEUsT0FBTyxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUMxRSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDN0QsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0sMkNBQTJDLENBQUE7QUFZcEYsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQWE7SUFDdEMsZUFBZSxFQUFFLENBQUM7SUFDbEIsZ0JBQWdCLEVBQUUsRUFBRTtJQUNwQixlQUFlLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzQix3QkFBd0IsRUFBRSxLQUFLO0lBQy9CLG1CQUFtQixFQUFFLEtBQUs7SUFDMUIsc0JBQXNCLEVBQUUsS0FBSztJQUM3QixVQUFVLEVBQUUsRUFBRTtJQUNkLG1CQUFtQixFQUFFLEVBQUU7SUFDdkIsdUJBQXVCLEVBQUUsSUFBSTtJQUM3QixnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLENBQUM7SUFDaEQscUJBQXFCLEVBQUUsS0FBSztJQUM1QixjQUFjLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQy9DLG1CQUFtQixFQUFFLElBQUk7SUFDekIsMEJBQTBCLEVBQUUsS0FBSztJQUNqQyx5QkFBeUIsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUMvQixpQkFBaUIsRUFBRSxDQUFDLEVBQUUsQ0FBQztJQUN2QixtQkFBbUIsRUFBRSx3QkFBd0IsQ0FBQyxnQ0FBZ0M7Q0FDakYsQ0FBQztBQXNCRixNQUFNLE9BQU8sbUJBQW9CLFNBQVEsZ0JBQWdCO0lBQ3JELFlBQW9CLE1BQXVCO1FBQ3ZDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRFYsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7SUFFM0MsQ0FBQztJQUVELE9BQU87UUFDSCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXpCLElBQUksQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDO1FBQ3hDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQyx3Q0FBd0MsRUFBRSxDQUFDO1FBQ2hELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsd0JBQXdCLEVBQUU7WUFDL0MsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFDcEMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUM7U0FDckM7UUFDRCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQztRQUN6QyxJQUFJLENBQUMseUNBQXlDLEVBQUUsQ0FBQztRQUNqRCxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQsMkJBQTJCO1FBQ3ZCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDeEIsT0FBTyxDQUFDLDBCQUEwQixDQUFDO2FBQ25DLE9BQU8sQ0FBQyxzREFBc0QsQ0FBQzthQUMvRCxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUNkLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hDLEVBQUUsQ0FBQyxjQUFjLENBQUMsMEJBQTBCLENBQUM7aUJBQ3hDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztpQkFDL0MsUUFBUSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7Z0JBQ3JCLDhDQUE4QztnQkFDOUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtnQkFDOUIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUUzQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLENBQUM7Z0JBQ25ELElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUM7WUFDUCxhQUFhO1lBQ2IsRUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCw4QkFBOEI7UUFDMUIsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDL0MsSUFBSSxDQUFDLE1BQU0sQ0FDUCxpRkFBaUYsRUFDakYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDbkIsWUFBWSxFQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2YsSUFBSSxFQUFFLDJDQUEyQztZQUNqRCxJQUFJLEVBQUUsZUFBZTtTQUN4QixDQUFDLEVBQ0YscUVBQXFFLENBQ3hFLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQ3hCLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQzthQUMzQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkIsQ0FBQztJQUVELGdDQUFnQztRQUM1QixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUN0RCxXQUFXLENBQUMsTUFBTSxDQUNkLCtEQUErRCxDQUNsRSxDQUFDO1FBRUYsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDckQsVUFBVSxDQUFDLE1BQU0sQ0FDYixrRUFBa0U7WUFDOUQsa0VBQWtFO1lBQ2xFLFlBQVksQ0FDbkIsQ0FBQztRQUVGLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDeEIsT0FBTyxDQUFDLGdDQUFnQyxDQUFDO2FBQ3pDLE9BQU8sQ0FBQyxXQUFXLENBQUM7YUFDcEIsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDbEIsTUFBTTtpQkFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUM7aUJBQ2xELFFBQVEsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLG1CQUFtQjtvQkFDcEMsbUJBQW1CLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDLENBQUMsQ0FBQztRQUVQLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDeEIsT0FBTyxDQUFDLCtCQUErQixDQUFDO2FBQ3hDLE9BQU8sQ0FBQyxVQUFVLENBQUM7YUFDbkIsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDbEIsTUFBTTtpQkFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUM7aUJBQ3pELFFBQVEsQ0FBQyxDQUFDLDBCQUEwQixFQUFFLEVBQUU7Z0JBQ3JDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLDBCQUEwQjtvQkFDM0MsMEJBQTBCLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLDBCQUEwQixFQUFFLENBQUM7WUFDM0QsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCx1QkFBdUI7UUFDbkIsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDL0MsSUFBSSxDQUFDLE1BQU0sQ0FDUCx5QkFBeUIsRUFDekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxFQUNqRCw4QkFBOEIsRUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDbkIsZ0RBQWdELEVBQ2hELElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLENBQUMsRUFDakQsR0FBRyxDQUNOLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQ3hCLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQzthQUNuQyxPQUFPLENBQUMsSUFBSSxDQUFDO2FBQ2IsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDbEIsTUFBTTtpQkFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUM7aUJBQ2xELFFBQVEsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLEVBQUU7Z0JBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLG1CQUFtQjtvQkFDcEMsbUJBQW1CLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCx3Q0FBd0M7UUFDcEMsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDL0MsSUFBSSxDQUFDLE1BQU0sQ0FDUCx5SkFBeUosRUFDekosaUpBQWlKLEVBQ2pKLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQ25CLHVGQUF1RixFQUN2RixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUNuQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUNuQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNmLElBQUksRUFBRSxXQUFXO1NBQ3BCLENBQUMsRUFDRix1SkFBdUosQ0FDMUosQ0FBQztRQUVGLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDeEIsT0FBTyxDQUFDLHdDQUF3QyxDQUFDO2FBQ2pELE9BQU8sQ0FBQyxJQUFJLENBQUM7YUFDYixTQUFTLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUNsQixNQUFNO2lCQUNELFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQztpQkFDdkQsUUFBUSxDQUFDLENBQUMsd0JBQXdCLEVBQUUsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsd0JBQXdCO29CQUN6Qyx3QkFBd0IsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsK0JBQStCLEVBQUUsQ0FBQztnQkFDNUQsZ0JBQWdCO2dCQUNoQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDLENBQUMsQ0FBQztJQUNYLENBQUM7SUFFRCw2QkFBNkI7UUFDekIsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBRXZFLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQy9DLElBQUksQ0FBQyxNQUFNLENBQ1AsNkRBQTZELENBQ2hFLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHlCQUF5QixDQUFDLE9BQU8sQ0FDbEQsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDaEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztpQkFDbEMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7Z0JBQ2QsSUFBSSxXQUFXLENBQ1gsRUFBRSxDQUFDLE9BQU8sRUFDVixJQUFJLENBQUMsTUFBTSxFQUNYLGVBQWUsQ0FBQyxhQUFhLENBQ2hDLENBQUM7Z0JBQ0YsRUFBRSxDQUFDLGNBQWMsQ0FBQyxnQ0FBZ0MsQ0FBQztxQkFDOUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztxQkFDbEIsUUFBUSxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7b0JBQ3ZCLElBQ0ksWUFBWTt3QkFDWixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLENBQ25ELFlBQVksQ0FDZixFQUNIO3dCQUNFLFNBQVMsQ0FDTCxJQUFJLGNBQWMsQ0FDZCw0Q0FBNEMsQ0FDL0MsQ0FDSixDQUFDO3dCQUNGLE9BQU87cUJBQ1Y7b0JBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQzNDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUTt5QkFDZix5QkFBeUIsQ0FBQyxLQUFLLENBQUMsRUFDckMsWUFBWSxDQUNmLENBQUM7b0JBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMseUJBQXlCLENBQzFDLEtBQUssQ0FDUixHQUFHLFlBQVksQ0FBQztvQkFDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsYUFBYTtnQkFDYixFQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQztpQkFDRCxjQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtnQkFDbkIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7cUJBQ2hCLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQztxQkFDOUIsT0FBTyxDQUFDLEdBQUcsRUFBRTtvQkFDVixzREFBc0Q7b0JBQ3RELGFBQWE7b0JBQ2IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUN4QyxhQUFhO29CQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztvQkFDdkMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztvQkFDN0MsR0FBRyxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ2pDLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDO2lCQUNELGNBQWMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNuQixFQUFFLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDO3FCQUN6QixVQUFVLENBQUMsU0FBUyxDQUFDO3FCQUNyQixPQUFPLENBQUMsR0FBRyxFQUFFO29CQUNWLFNBQVMsQ0FDTCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVE7eUJBQ2YseUJBQXlCLEVBQzlCLEtBQUssRUFDTCxLQUFLLEdBQUcsQ0FBQyxDQUNaLENBQUM7b0JBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNuQixDQUFDLENBQUMsQ0FBQztZQUNYLENBQUMsQ0FBQztpQkFDRCxjQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtnQkFDbkIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztxQkFDM0IsVUFBVSxDQUFDLFdBQVcsQ0FBQztxQkFDdkIsT0FBTyxDQUFDLEdBQUcsRUFBRTtvQkFDVixTQUFTLENBQ0wsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRO3lCQUNmLHlCQUF5QixFQUM5QixLQUFLLEVBQ0wsS0FBSyxHQUFHLENBQUMsQ0FDWixDQUFDO29CQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQzVCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUM7aUJBQ0QsY0FBYyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7Z0JBQ25CLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO3FCQUNkLFVBQVUsQ0FBQyxRQUFRLENBQUM7cUJBQ3BCLE9BQU8sQ0FBQyxHQUFHLEVBQUU7b0JBQ1YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsc0JBQXNCLENBQzlDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUTt5QkFDZix5QkFBeUIsQ0FBQyxLQUFLLENBQUMsQ0FDeEMsQ0FBQztvQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyx5QkFBeUIsQ0FBQyxNQUFNLENBQ2pELEtBQUssRUFDTCxDQUFDLENBQ0osQ0FBQztvQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUM1QixnQkFBZ0I7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdEIsQ0FBQyxDQUNKLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDM0MsRUFBRSxDQUFDLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQztpQkFDMUMsTUFBTSxFQUFFO2lCQUNSLE9BQU8sQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMseUJBQXlCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUM1QixnQkFBZ0I7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELDRCQUE0QjtRQUN4QixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUMsVUFBVSxFQUFFLENBQUM7UUFFdkUsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDdEQsV0FBVyxDQUFDLE1BQU0sQ0FDZCw0Q0FBNEMsRUFDNUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFDbEQsb0NBQW9DLEVBQ3BDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQzFCLGlFQUFpRSxFQUNqRSxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUMxQixvRkFBb0YsRUFDcEYsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFDM0MsR0FBRyxDQUNOLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRW5ELE1BQU0sc0JBQXNCLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDakUsc0JBQXNCLENBQUMsTUFBTSxDQUN6Qix5TEFBeUwsQ0FDNUwsQ0FBQztRQUVGLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDeEIsT0FBTyxDQUFDLHlCQUF5QixDQUFDO2FBQ2xDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzthQUMvQixTQUFTLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUNsQixNQUFNO2lCQUNELFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQztpQkFDdEQsUUFBUSxDQUFDLENBQUMsd0JBQXdCLEVBQUUsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsdUJBQXVCO29CQUN4Qyx3QkFBd0IsQ0FBQztnQkFDN0IsSUFBSSx3QkFBd0IsRUFBRTtvQkFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDO2lCQUN0RDtnQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUM1QixnQkFBZ0I7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO1FBRVAsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHVCQUF1QixFQUFFO1lBQy9DLE9BQU87U0FDVjtRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FDekMsQ0FBQyxlQUFlLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDdkIsTUFBTSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztpQkFDbEMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7Z0JBQ2QsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3hDLEVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDO3FCQUN0QixRQUFRLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQztxQkFDaEMsUUFBUSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7b0JBQ3JCLElBQ0ksVUFBVTt3QkFDVixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQ3RDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLFVBQVUsQ0FDaEMsRUFDSDt3QkFDRSxTQUFTLENBQ0wsSUFBSSxjQUFjLENBQ2QsdURBQXVELENBQzFELENBQ0osQ0FBQzt3QkFDRixPQUFPO3FCQUNWO29CQUVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUNqQyxLQUFLLENBQ1IsQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDO29CQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsQ0FBQztnQkFDUCxhQUFhO2dCQUNiLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDO2lCQUNELFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNkLElBQUksV0FBVyxDQUNYLEVBQUUsQ0FBQyxPQUFPLEVBQ1YsSUFBSSxDQUFDLE1BQU0sRUFDWCxlQUFlLENBQUMsYUFBYSxDQUNoQyxDQUFDO2dCQUNGLEVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDO3FCQUN4QixRQUFRLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQztxQkFDbEMsUUFBUSxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7b0JBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUNqQyxLQUFLLENBQ1IsQ0FBQyxRQUFRLEdBQUcsWUFBWSxDQUFDO29CQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsQ0FBQztnQkFDUCxhQUFhO2dCQUNiLEVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDO2lCQUNELGNBQWMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNuQixFQUFFLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDO3FCQUN6QixVQUFVLENBQUMsU0FBUyxDQUFDO3FCQUNyQixPQUFPLENBQUMsR0FBRyxFQUFFO29CQUNWLFNBQVMsQ0FDTCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFDckMsS0FBSyxFQUNMLEtBQUssR0FBRyxDQUFDLENBQ1osQ0FBQztvQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUM1QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDO2lCQUNELGNBQWMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNuQixFQUFFLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDO3FCQUMzQixVQUFVLENBQUMsV0FBVyxDQUFDO3FCQUN2QixPQUFPLENBQUMsR0FBRyxFQUFFO29CQUNWLFNBQVMsQ0FDTCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFDckMsS0FBSyxFQUNMLEtBQUssR0FBRyxDQUFDLENBQ1osQ0FBQztvQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUM1QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDO2lCQUNELGNBQWMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNuQixFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztxQkFDZCxVQUFVLENBQUMsUUFBUSxDQUFDO3FCQUNwQixPQUFPLENBQUMsR0FBRyxFQUFFO29CQUNWLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FDeEMsS0FBSyxFQUNMLENBQUMsQ0FDSixDQUFDO29CQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQzVCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdEIsQ0FBQyxDQUNKLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBdUIsRUFBRSxFQUFFO1lBQ2hFLE1BQU07aUJBQ0QsYUFBYSxDQUFDLHlCQUF5QixDQUFDO2lCQUN4QyxVQUFVLENBQUMsZ0NBQWdDLENBQUM7aUJBQzVDLE1BQU0sRUFBRTtpQkFDUixPQUFPLENBQUMsR0FBRyxFQUFFO2dCQUNWLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQztvQkFDdkMsTUFBTSxFQUFFLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLEVBQUU7aUJBQ2YsQ0FBQyxDQUFDO2dCQUNILElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELDBCQUEwQjtRQUN0QixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQ3hCLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzthQUMvQixVQUFVLEVBQUUsQ0FBQztRQUVsQixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUN0RCxXQUFXLENBQUMsTUFBTSxDQUNkLGdEQUFnRCxFQUNoRCxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUNqRCw0R0FBNEcsRUFDNUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDMUIsK0VBQStFLEVBQy9FLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQzFCLE1BQU0sRUFDTixXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUM1Qyx3Q0FBd0MsQ0FDM0MsQ0FBQztRQUVGLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFbkQsTUFBTSxzQkFBc0IsR0FBRyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUNqRSxzQkFBc0IsQ0FBQyxNQUFNLENBQ3pCLHlMQUF5TCxDQUM1TCxDQUFDO1FBRUYsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQzthQUN4QixPQUFPLENBQUMsNkJBQTZCLENBQUM7YUFDdEMsT0FBTyxDQUFDLHNCQUFzQixDQUFDO2FBQy9CLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2xCLE1BQU07aUJBQ0QsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDO2lCQUNwRCxRQUFRLENBQUMsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFO2dCQUNqQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxxQkFBcUI7b0JBQ3RDLHNCQUFzQixDQUFDO2dCQUMzQixJQUFJLHNCQUFzQixFQUFFO29CQUN4QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyx1QkFBdUI7d0JBQ3hDLEtBQUssQ0FBQztpQkFDYjtnQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUM1QixnQkFBZ0I7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO1FBRVAsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFO1lBQzdDLE9BQU87U0FDVjtRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDakUsTUFBTSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztpQkFDbEMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7Z0JBQ1osRUFBRSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUM7cUJBQzFCLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO3FCQUM3QixRQUFRLENBQUMsQ0FBQyxTQUFTLEVBQUUsRUFBRTtvQkFDcEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUs7d0JBQzVDLFNBQVMsQ0FBQztvQkFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsQ0FBQztnQkFDUCxhQUFhO2dCQUNiLEVBQUUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDNUMsQ0FBQyxDQUFDO2lCQUNELFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNkLElBQUksV0FBVyxDQUNYLEVBQUUsQ0FBQyxPQUFPLEVBQ1YsSUFBSSxDQUFDLE1BQU0sRUFDWCxlQUFlLENBQUMsYUFBYSxDQUNoQyxDQUFDO2dCQUNGLEVBQUUsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDO3FCQUN4QixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQztxQkFDaEMsUUFBUSxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7b0JBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FDL0IsS0FBSyxDQUNSLENBQUMsUUFBUSxHQUFHLFlBQVksQ0FBQztvQkFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsYUFBYTtnQkFDYixFQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQztpQkFDRCxjQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtnQkFDbkIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQztxQkFDekIsVUFBVSxDQUFDLFNBQVMsQ0FBQztxQkFDckIsT0FBTyxDQUFDLEdBQUcsRUFBRTtvQkFDVixTQUFTLENBQ0wsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUNuQyxLQUFLLEVBQ0wsS0FBSyxHQUFHLENBQUMsQ0FDWixDQUFDO29CQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQzVCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUM7aUJBQ0QsY0FBYyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7Z0JBQ25CLEVBQUUsQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUM7cUJBQzNCLFVBQVUsQ0FBQyxXQUFXLENBQUM7cUJBQ3ZCLE9BQU8sQ0FBQyxHQUFHLEVBQUU7b0JBQ1YsU0FBUyxDQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFDbkMsS0FBSyxFQUNMLEtBQUssR0FBRyxDQUFDLENBQ1osQ0FBQztvQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUM1QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDO2lCQUNELGNBQWMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNuQixFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztxQkFDZCxVQUFVLENBQUMsUUFBUSxDQUFDO3FCQUNwQixPQUFPLENBQUMsR0FBRyxFQUFFO29CQUNWLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQ3RDLEtBQUssRUFDTCxDQUFDLENBQ0osQ0FBQztvQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUM1QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQXVCLEVBQUUsRUFBRTtZQUNoRSxNQUFNO2lCQUNELGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQztpQkFDbkMsVUFBVSxDQUFDLDJCQUEyQixDQUFDO2lCQUN2QyxNQUFNLEVBQUU7aUJBQ1IsT0FBTyxDQUFDLEdBQUcsRUFBRTtnQkFDVixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDO29CQUNyQyxLQUFLLEVBQUUsRUFBRTtvQkFDVCxRQUFRLEVBQUUsRUFBRTtpQkFDZixDQUFDLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25CLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsNkJBQTZCO1FBQ3pCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUV4RSxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUMvQyxJQUFJLENBQUMsTUFBTSxDQUNQLG9GQUFvRixFQUNwRixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUNuQix3Q0FBd0MsRUFDeEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDbkIscUZBQXFGLENBQ3hGLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUMvRCxNQUFNLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2lCQUNsQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtnQkFDZCxJQUFJLFdBQVcsQ0FDWCxFQUFFLENBQUMsT0FBTyxFQUNWLElBQUksQ0FBQyxNQUFNLEVBQ1gsZUFBZSxDQUFDLGFBQWEsQ0FDaEMsQ0FBQztnQkFDRixFQUFFLENBQUMsY0FBYyxDQUFDLGdDQUFnQyxDQUFDO3FCQUM5QyxRQUFRLENBQUMsUUFBUSxDQUFDO3FCQUNsQixRQUFRLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRTtvQkFDdkIsSUFDSSxZQUFZO3dCQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FDM0MsWUFBWSxDQUNmLEVBQ0g7d0JBQ0UsU0FBUyxDQUNMLElBQUksY0FBYyxDQUNkLHFDQUFxQyxDQUN4QyxDQUNKLENBQUM7d0JBQ0YsT0FBTztxQkFDVjtvQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7d0JBQ3pDLFlBQVksQ0FBQztvQkFDakIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsYUFBYTtnQkFDYixFQUFFLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQztpQkFDRCxjQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtnQkFDbkIsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7cUJBQ2QsVUFBVSxDQUFDLFFBQVEsQ0FBQztxQkFDcEIsT0FBTyxDQUFDLEdBQUcsRUFBRTtvQkFDVixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQ3pDLEtBQUssRUFDTCxDQUFDLENBQ0osQ0FBQztvQkFDRixJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUM1QixnQkFBZ0I7b0JBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdEIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDM0MsRUFBRSxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQztpQkFDdkMsTUFBTSxFQUFFO2lCQUNSLE9BQU8sQ0FBQyxHQUFHLEVBQUU7Z0JBQ1YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUM1QixnQkFBZ0I7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELGlDQUFpQztRQUM3QixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQ3hCLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQzthQUNoQyxVQUFVLEVBQUUsQ0FBQztRQUVsQixJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsTUFBTSxDQUNQLDBHQUEwRyxFQUMxRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUNuQixtREFBbUQsRUFDbkQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDbkIsWUFBWSxFQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2YsSUFBSSxFQUFFLDJDQUEyQztZQUNqRCxJQUFJLEVBQUUsZUFBZTtTQUN4QixDQUFDLEVBQ0Ysd0JBQXdCLENBQzNCLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQ3hCLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQzthQUN2QyxPQUFPLENBQUMsSUFBSSxDQUFDO2FBQ2IsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDZCxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN4QyxFQUFFLENBQUMsY0FBYyxDQUFDLDBCQUEwQixDQUFDO2lCQUN4QyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUM7aUJBQ2xELFFBQVEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO2dCQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsR0FBRyxVQUFVLENBQUM7Z0JBQ3RELElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDaEMsQ0FBQyxDQUFDLENBQUM7WUFDUCxhQUFhO1lBQ2IsRUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUMsQ0FBQztRQUVQLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDNUIsT0FBTyxDQUFDLDBCQUEwQixDQUFDO2FBQ25DLE9BQU8sQ0FBQyxzSEFBc0gsQ0FBQzthQUMvSCxXQUFXLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDZCxFQUFFO2lCQUNHLFNBQVMsQ0FBQyxHQUFHLEVBQUUsdUJBQXVCLENBQUM7aUJBQ3ZDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsd0RBQXdELENBQUM7aUJBQ3hFLFNBQVMsQ0FBQyxHQUFHLEVBQUUsK0NBQStDLENBQUM7aUJBQy9ELFNBQVMsQ0FBQyxHQUFHLEVBQUUsc0NBQXNDLENBQUM7aUJBQ3RELFNBQVMsQ0FBQyxHQUFHLEVBQUUsMkJBQTJCLENBQUM7aUJBQzNDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztpQkFDN0QsUUFBUSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNoQyxDQUFDLENBQUMsQ0FBQTtRQUNWLENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBSSxHQUFHLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQ3pDLElBQUksSUFBWSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRTtZQUMzQyxJQUFJLEdBQUcsNEJBQTRCLENBQUM7U0FDdkM7YUFBTTtZQUNILE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUMxQixHQUFHLEVBQUUsQ0FDRCxzQkFBc0IsQ0FDbEIsSUFBSSxDQUFDLEdBQUcsRUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FDM0MsRUFDTCxtQ0FBbUMsQ0FDdEMsQ0FBQztZQUNGLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQzlCLElBQUksR0FBRywwQkFBMEIsQ0FBQzthQUNyQztpQkFBTTtnQkFDSCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQ2QsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7b0JBQ3RCLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7d0JBQ3pCLEtBQUssRUFBRSxDQUFDO3dCQUNSLElBQUksQ0FBQyxNQUFNLENBQ1AsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7NEJBQ2hCLElBQUksRUFBRSxXQUFXLElBQUksQ0FBQyxRQUFRLEVBQUU7eUJBQ25DLENBQUMsQ0FDTCxDQUFDO3FCQUNMO2lCQUNKO2dCQUNELElBQUksR0FBRyxZQUFZLEtBQUssaUJBQWlCLENBQUM7YUFDN0M7U0FDSjtRQUVELElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQzthQUNiLE9BQU8sQ0FBQyxJQUFJLENBQUM7YUFDYixjQUFjLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUN0QixLQUFLO2lCQUNBLE9BQU8sQ0FBQyxNQUFNLENBQUM7aUJBQ2YsVUFBVSxDQUFDLFNBQVMsQ0FBQztpQkFDckIsT0FBTyxDQUFDLEdBQUcsRUFBRTtnQkFDVixnQkFBZ0I7Z0JBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUVELHlDQUF5QztRQUNyQyxJQUFJLElBQUksR0FBRyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsTUFBTSxDQUNQLGdFQUFnRSxFQUNoRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUNuQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNmLElBQUksRUFBRSxXQUFXO1NBQ3BCLENBQUMsRUFDRixzSkFBc0osQ0FDekosQ0FBQztRQUNGLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDeEIsT0FBTyxDQUFDLCtCQUErQixDQUFDO2FBQ3hDLFVBQVUsRUFBRSxDQUFDO1FBRWxCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDeEIsT0FBTyxDQUFDLHNDQUFzQyxDQUFDO2FBQy9DLE9BQU8sQ0FBQyxJQUFJLENBQUM7YUFDYixTQUFTLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUNsQixNQUFNO2lCQUNELFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQztpQkFDckQsUUFBUSxDQUFDLENBQUMsc0JBQXNCLEVBQUUsRUFBRTtnQkFDakMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsc0JBQXNCO29CQUN2QyxzQkFBc0IsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDNUIsZ0JBQWdCO2dCQUNoQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFDWCxDQUFDLENBQUMsQ0FBQztRQUVQLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEVBQUU7WUFDN0MsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztpQkFDeEIsT0FBTyxDQUFDLFNBQVMsQ0FBQztpQkFDbEIsT0FBTyxDQUFDLGtEQUFrRCxDQUFDO2lCQUMzRCxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDZCxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztxQkFDekIsUUFBUSxDQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FDbEQ7cUJBQ0EsUUFBUSxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUU7b0JBQ3BCLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDdEMsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUU7d0JBQ3BCLFNBQVMsQ0FDTCxJQUFJLGNBQWMsQ0FDZCwwQkFBMEIsQ0FDN0IsQ0FDSixDQUFDO3dCQUNGLE9BQU87cUJBQ1Y7b0JBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxHQUFHLFdBQVcsQ0FBQztvQkFDbkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDLENBQUMsQ0FBQztZQUVQLElBQUksR0FBRyxRQUFRLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUN6QyxJQUFJLENBQUMsTUFBTSxDQUNQLDREQUE0RCxFQUM1RCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUNuQiwyRkFBMkYsRUFDM0YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDbkIsb0ZBQW9GLENBQ3ZGLENBQUM7WUFDRixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO2lCQUN4QixPQUFPLENBQUMsdUJBQXVCLENBQUM7aUJBQ2hDLE9BQU8sQ0FBQyxJQUFJLENBQUM7aUJBQ2IsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLGNBQWMsQ0FBQyx5QkFBeUIsQ0FBQztxQkFDekMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztxQkFDekMsUUFBUSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7b0JBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7b0JBQzdDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ2hDLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUFDLENBQUM7WUFFUCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsYUFBYSxFQUFFLEVBQUU7Z0JBQzNELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3QyxHQUFHLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUU5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7b0JBQzFDLElBQUksRUFBRSxrQkFBa0IsR0FBRyxDQUFDO2lCQUMvQixDQUFDLENBQUM7Z0JBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUVsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO3FCQUN4QyxjQUFjLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtvQkFDdEIsS0FBSzt5QkFDQSxPQUFPLENBQUMsT0FBTyxDQUFDO3lCQUNoQixVQUFVLENBQUMsUUFBUSxDQUFDO3lCQUNwQixPQUFPLENBQUMsR0FBRyxFQUFFO3dCQUNWLE1BQU0sS0FBSyxHQUNQLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQ3hDLGFBQWEsQ0FDaEIsQ0FBQzt3QkFDTixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRTs0QkFDWixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUN2QyxLQUFLLEVBQ0wsQ0FBQyxDQUNKLENBQUM7NEJBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQzs0QkFDNUIsZ0JBQWdCOzRCQUNoQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7eUJBQ2xCO29CQUNMLENBQUMsQ0FBQyxDQUFDO2dCQUNYLENBQUMsQ0FBQztxQkFDRCxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtvQkFDZCxNQUFNLENBQUMsR0FBRyxJQUFJO3lCQUNULGNBQWMsQ0FBQyxlQUFlLENBQUM7eUJBQy9CLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7eUJBQzFCLFFBQVEsQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO3dCQUNwQixNQUFNLEtBQUssR0FDUCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUN4QyxhQUFhLENBQ2hCLENBQUM7d0JBQ04sSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7NEJBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUNoQyxLQUFLLENBQ1IsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUM7NEJBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUM7eUJBQy9CO29CQUNMLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUM7b0JBRXpDLE9BQU8sQ0FBQyxDQUFDO2dCQUNiLENBQUMsQ0FBQztxQkFDRCxXQUFXLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtvQkFDbEIsTUFBTSxDQUFDLEdBQUcsSUFBSTt5QkFDVCxjQUFjLENBQUMsZ0JBQWdCLENBQUM7eUJBQ2hDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7eUJBQzFCLFFBQVEsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO3dCQUNsQixNQUFNLEtBQUssR0FDUCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUN4QyxhQUFhLENBQ2hCLENBQUM7d0JBQ04sSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUU7NEJBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUNoQyxLQUFLLENBQ1IsQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUM7NEJBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQzt5QkFDL0I7b0JBQ0wsQ0FBQyxDQUFDLENBQUM7b0JBRVAsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM3QixDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFFcEMsT0FBTyxDQUFDLENBQUM7Z0JBQ2IsQ0FBQyxDQUFDLENBQUM7Z0JBRVAsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFFeEIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdkIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQWlCLENBQUMsQ0FBQztnQkFFcEQsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNYLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDN0MsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRS9CLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxTQUFTLENBQ25ELENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ1AsTUFBTTtxQkFDRCxhQUFhLENBQUMsdUJBQXVCLENBQUM7cUJBQ3RDLE1BQU0sRUFBRTtxQkFDUixPQUFPLENBQUMsR0FBRyxFQUFFO29CQUNWLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDcEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDNUIsZ0JBQWdCO29CQUNoQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQyxDQUNKLENBQUM7WUFDRixPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBRXhCLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFpQixDQUFDLENBQUM7U0FDdkQ7SUFDTCxDQUFDO0lBRUQsb0JBQW9CO1FBQ2hCLE1BQU0sQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7YUFDbEMsT0FBTyxDQUFDLFFBQVEsQ0FBQzthQUNqQixPQUFPLENBQ0osOEVBQThFLENBQ2pGLENBQUM7UUFFTixNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLDBDQUEwQyxDQUFDLENBQUM7UUFDcEUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLEdBQUc7WUFDSiw4RkFBOEYsQ0FBQztRQUNuRyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXJCLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsRUFBRSxDQUFDLFlBQVksQ0FDWCxNQUFNLEVBQ04sOERBQThELENBQ2pFLENBQUM7UUFDRixFQUFFLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbEMsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsR0FBRztZQUNKLGtGQUFrRixDQUFDO1FBQ3ZGLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFckIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFRlbXBsYXRlclBsdWdpbiBmcm9tIFwibWFpblwiO1xyXG5pbXBvcnQgeyBCdXR0b25Db21wb25lbnQsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgZXJyb3JXcmFwcGVyU3luYywgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwidXRpbHMvRXJyb3JcIjtcclxuaW1wb3J0IHsgbG9nX2Vycm9yIH0gZnJvbSBcInV0aWxzL0xvZ1wiO1xyXG5pbXBvcnQgeyBhcnJheW1vdmUsIGdldF90ZmlsZXNfZnJvbV9mb2xkZXIgfSBmcm9tIFwidXRpbHMvVXRpbHNcIjtcclxuaW1wb3J0IHsgRmlsZVN1Z2dlc3QsIEZpbGVTdWdnZXN0TW9kZSB9IGZyb20gXCIuL3N1Z2dlc3RlcnMvRmlsZVN1Z2dlc3RlclwiO1xyXG5pbXBvcnQgeyBGb2xkZXJTdWdnZXN0IH0gZnJvbSBcIi4vc3VnZ2VzdGVycy9Gb2xkZXJTdWdnZXN0ZXJcIjtcclxuaW1wb3J0IHsgSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uIH0gZnJvbSBcIi4vUmVuZGVyU2V0dGluZ3MvSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uXCJcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRm9sZGVyVGVtcGxhdGUge1xyXG4gICAgZm9sZGVyOiBzdHJpbmc7XHJcbiAgICB0ZW1wbGF0ZTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEZpbGVUZW1wbGF0ZSB7XHJcbiAgICByZWdleDogc3RyaW5nO1xyXG4gICAgdGVtcGxhdGU6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNldHRpbmdzID0ge1xyXG4gICAgY29tbWFuZF90aW1lb3V0OiA1LFxyXG4gICAgdGVtcGxhdGVzX2ZvbGRlcjogXCJcIixcclxuICAgIHRlbXBsYXRlc19wYWlyczogW1tcIlwiLCBcIlwiXV0sXHJcbiAgICB0cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb246IGZhbHNlLFxyXG4gICAgYXV0b19qdW1wX3RvX2N1cnNvcjogZmFsc2UsXHJcbiAgICBlbmFibGVfc3lzdGVtX2NvbW1hbmRzOiBmYWxzZSxcclxuICAgIHNoZWxsX3BhdGg6IFwiXCIsXHJcbiAgICB1c2VyX3NjcmlwdHNfZm9sZGVyOiBcIlwiLFxyXG4gICAgZW5hYmxlX2ZvbGRlcl90ZW1wbGF0ZXM6IHRydWUsXHJcbiAgICBmb2xkZXJfdGVtcGxhdGVzOiBbeyBmb2xkZXI6IFwiXCIsIHRlbXBsYXRlOiBcIlwiIH1dLFxyXG4gICAgZW5hYmxlX2ZpbGVfdGVtcGxhdGVzOiBmYWxzZSxcclxuICAgIGZpbGVfdGVtcGxhdGVzOiBbeyByZWdleDogXCIuKlwiLCB0ZW1wbGF0ZTogXCJcIiB9XSxcclxuICAgIHN5bnRheF9oaWdobGlnaHRpbmc6IHRydWUsXHJcbiAgICBzeW50YXhfaGlnaGxpZ2h0aW5nX21vYmlsZTogZmFsc2UsXHJcbiAgICBlbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzOiBbXCJcIl0sXHJcbiAgICBzdGFydHVwX3RlbXBsYXRlczogW1wiXCJdLFxyXG4gICAgaW50ZWxsaXNlbnNlX3JlbmRlcjogSW50ZWxsaXNlbnNlUmVuZGVyT3B0aW9uLlJlbmRlckRlc2NyaXB0aW9uUGFyYW1ldGVyUmV0dXJuXHJcbn07XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzIHtcclxuICAgIGNvbW1hbmRfdGltZW91dDogbnVtYmVyO1xyXG4gICAgdGVtcGxhdGVzX2ZvbGRlcjogc3RyaW5nO1xyXG4gICAgdGVtcGxhdGVzX3BhaXJzOiBBcnJheTxbc3RyaW5nLCBzdHJpbmddPjtcclxuICAgIHRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbjogYm9vbGVhbjtcclxuICAgIGF1dG9fanVtcF90b19jdXJzb3I6IGJvb2xlYW47XHJcbiAgICBlbmFibGVfc3lzdGVtX2NvbW1hbmRzOiBib29sZWFuO1xyXG4gICAgc2hlbGxfcGF0aDogc3RyaW5nO1xyXG4gICAgdXNlcl9zY3JpcHRzX2ZvbGRlcjogc3RyaW5nO1xyXG4gICAgZW5hYmxlX2ZvbGRlcl90ZW1wbGF0ZXM6IGJvb2xlYW47XHJcbiAgICBmb2xkZXJfdGVtcGxhdGVzOiBBcnJheTxGb2xkZXJUZW1wbGF0ZT47XHJcbiAgICBlbmFibGVfZmlsZV90ZW1wbGF0ZXM6IGJvb2xlYW47XHJcbiAgICBmaWxlX3RlbXBsYXRlczogQXJyYXk8RmlsZVRlbXBsYXRlPjtcclxuICAgIHN5bnRheF9oaWdobGlnaHRpbmc6IGJvb2xlYW47XHJcbiAgICBzeW50YXhfaGlnaGxpZ2h0aW5nX21vYmlsZTogYm9vbGVhbjtcclxuICAgIGVuYWJsZWRfdGVtcGxhdGVzX2hvdGtleXM6IEFycmF5PHN0cmluZz47XHJcbiAgICBzdGFydHVwX3RlbXBsYXRlczogQXJyYXk8c3RyaW5nPjtcclxuICAgIGludGVsbGlzZW5zZV9yZW5kZXI6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlclNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcclxuICAgICAgICBzdXBlcihwbHVnaW4uYXBwLCBwbHVnaW4pO1xyXG4gICAgfVxyXG5cclxuICAgIGRpc3BsYXkoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJFbC5lbXB0eSgpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZF90ZW1wbGF0ZV9mb2xkZXJfc2V0dGluZygpO1xyXG4gICAgICAgIHRoaXMuYWRkX2ludGVybmFsX2Z1bmN0aW9uc19zZXR0aW5nKCk7XHJcbiAgICAgICAgdGhpcy5hZGRfc3ludGF4X2hpZ2hsaWdodGluZ19zZXR0aW5ncygpO1xyXG4gICAgICAgIHRoaXMuYWRkX2F1dG9fanVtcF90b19jdXJzb3IoKTtcclxuICAgICAgICB0aGlzLmFkZF90cmlnZ2VyX29uX25ld19maWxlX2NyZWF0aW9uX3NldHRpbmcoKTtcclxuICAgICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkX2ZvbGRlcl90ZW1wbGF0ZXNfc2V0dGluZygpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZF9maWxlX3RlbXBsYXRlc19zZXR0aW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWRkX3RlbXBsYXRlc19ob3RrZXlzX3NldHRpbmcoKTtcclxuICAgICAgICB0aGlzLmFkZF9zdGFydHVwX3RlbXBsYXRlc19zZXR0aW5nKCk7XHJcbiAgICAgICAgdGhpcy5hZGRfdXNlcl9zY3JpcHRfZnVuY3Rpb25zX3NldHRpbmcoKTtcclxuICAgICAgICB0aGlzLmFkZF91c2VyX3N5c3RlbV9jb21tYW5kX2Z1bmN0aW9uc19zZXR0aW5nKCk7XHJcbiAgICAgICAgdGhpcy5hZGRfZG9uYXRpbmdfc2V0dGluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF90ZW1wbGF0ZV9mb2xkZXJfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlRlbXBsYXRlIGZvbGRlciBsb2NhdGlvblwiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIkZpbGVzIGluIHRoaXMgZm9sZGVyIHdpbGwgYmUgYXZhaWxhYmxlIGFzIHRlbXBsYXRlcy5cIilcclxuICAgICAgICAgICAgLmFkZFNlYXJjaCgoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgIG5ldyBGb2xkZXJTdWdnZXN0KHRoaXMuYXBwLCBjYi5pbnB1dEVsKTtcclxuICAgICAgICAgICAgICAgIGNiLnNldFBsYWNlaG9sZGVyKFwiRXhhbXBsZTogZm9sZGVyMS9mb2xkZXIyXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19mb2xkZXIpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKChuZXdfZm9sZGVyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyaW0gZm9sZGVyIGFuZCBTdHJpcCBlbmRpbmcgc2xhc2ggaWYgdGhlcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZvbGRlciA9IG5ld19mb2xkZXIudHJpbSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mb2xkZXIgPSBuZXdfZm9sZGVyLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19mb2xkZXIgPSBuZXdfZm9sZGVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICBjYi5jb250YWluZXJFbC5hZGRDbGFzcyhcInRlbXBsYXRlcl9zZWFyY2hcIik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF9pbnRlcm5hbF9mdW5jdGlvbnNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGRlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIlRlbXBsYXRlciBwcm92aWRlcyBtdWx0aXBsZXMgcHJlZGVmaW5lZCB2YXJpYWJsZXMgLyBmdW5jdGlvbnMgdGhhdCB5b3UgY2FuIHVzZS5cIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIkNoZWNrIHRoZSBcIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImFcIiwge1xyXG4gICAgICAgICAgICAgICAgaHJlZjogXCJodHRwczovL3NpbGVudHZvaWQxMy5naXRodWIuaW8vVGVtcGxhdGVyL1wiLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogXCJkb2N1bWVudGF0aW9uXCIsXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBcIiB0byBnZXQgYSBsaXN0IG9mIGFsbCB0aGUgYXZhaWxhYmxlIGludGVybmFsIHZhcmlhYmxlcyAvIGZ1bmN0aW9ucy5cIlxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiSW50ZXJuYWwgdmFyaWFibGVzIGFuZCBmdW5jdGlvbnNcIilcclxuICAgICAgICAgICAgLnNldERlc2MoZGVzYyk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkX3N5bnRheF9oaWdobGlnaHRpbmdfc2V0dGluZ3MoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgZGVza3RvcERlc2MgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZGVza3RvcERlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIkFkZHMgc3ludGF4IGhpZ2hsaWdodGluZyBmb3IgVGVtcGxhdGVyIGNvbW1hbmRzIGluIGVkaXQgbW9kZS5cIlxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1vYmlsZURlc2MgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgbW9iaWxlRGVzYy5hcHBlbmQoXHJcbiAgICAgICAgICAgIFwiQWRkcyBzeW50YXggaGlnaGxpZ2h0aW5nIGZvciBUZW1wbGF0ZXIgY29tbWFuZHMgaW4gZWRpdCBtb2RlIG9uIFwiICtcclxuICAgICAgICAgICAgICAgIFwibW9iaWxlLiBVc2Ugd2l0aCBjYXV0aW9uOiB0aGlzIG1heSBicmVhayBsaXZlIHByZXZpZXcgb24gbW9iaWxlIFwiICtcclxuICAgICAgICAgICAgICAgIFwicGxhdGZvcm1zLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJTeW50YXggaGlnaGxpZ2h0aW5nIG9uIGRlc2t0b3BcIilcclxuICAgICAgICAgICAgLnNldERlc2MoZGVza3RvcERlc2MpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnN5bnRheF9oaWdobGlnaHRpbmcpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKChzeW50YXhfaGlnaGxpZ2h0aW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN5bnRheF9oaWdobGlnaHRpbmcgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ludGF4X2hpZ2hsaWdodGluZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5ldmVudF9oYW5kbGVyLnVwZGF0ZV9zeW50YXhfaGlnaGxpZ2h0aW5nKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlN5bnRheCBoaWdobGlnaHRpbmcgb24gbW9iaWxlXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKG1vYmlsZURlc2MpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnN5bnRheF9oaWdobGlnaHRpbmdfbW9iaWxlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgoc3ludGF4X2hpZ2hsaWdodGluZ19tb2JpbGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3ludGF4X2hpZ2hsaWdodGluZ19tb2JpbGUgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ludGF4X2hpZ2hsaWdodGluZ19tb2JpbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZXZlbnRfaGFuZGxlci51cGRhdGVfc3ludGF4X2hpZ2hsaWdodGluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfYXV0b19qdW1wX3RvX2N1cnNvcigpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGRlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIkF1dG9tYXRpY2FsbHkgdHJpZ2dlcnMgXCIsXHJcbiAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJjb2RlXCIsIHsgdGV4dDogXCJ0cC5maWxlLmN1cnNvclwiIH0pLFxyXG4gICAgICAgICAgICBcIiBhZnRlciBpbnNlcnRpbmcgYSB0ZW1wbGF0ZS5cIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIllvdSBjYW4gYWxzbyBzZXQgYSBob3RrZXkgdG8gbWFudWFsbHkgdHJpZ2dlciBcIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImNvZGVcIiwgeyB0ZXh0OiBcInRwLmZpbGUuY3Vyc29yXCIgfSksXHJcbiAgICAgICAgICAgIFwiLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJBdXRvbWF0aWMganVtcCB0byBjdXJzb3JcIilcclxuICAgICAgICAgICAgLnNldERlc2MoZGVzYylcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b19qdW1wX3RvX2N1cnNvcilcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKGF1dG9fanVtcF90b19jdXJzb3IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b19qdW1wX3RvX2N1cnNvciA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvX2p1bXBfdG9fY3Vyc29yO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF90cmlnZ2VyX29uX25ld19maWxlX2NyZWF0aW9uX3NldHRpbmcoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjLmFwcGVuZChcclxuICAgICAgICAgICAgXCJUZW1wbGF0ZXIgd2lsbCBsaXN0ZW4gZm9yIHRoZSBuZXcgZmlsZSBjcmVhdGlvbiBldmVudCwgYW5kLCBpZiBpdCBtYXRjaGVzIGEgcnVsZSB5b3UndmUgc2V0LCByZXBsYWNlIGV2ZXJ5IGNvbW1hbmQgaXQgZmluZHMgaW4gdGhlIG5ldyBmaWxlJ3MgY29udGVudC4gXCIsXHJcbiAgICAgICAgICAgIFwiVGhpcyBtYWtlcyBUZW1wbGF0ZXIgY29tcGF0aWJsZSB3aXRoIG90aGVyIHBsdWdpbnMgbGlrZSB0aGUgRGFpbHkgbm90ZSBjb3JlIHBsdWdpbiwgQ2FsZW5kYXIgcGx1Z2luLCBSZXZpZXcgcGx1Z2luLCBOb3RlIHJlZmFjdG9yIHBsdWdpbiwgZXRjLiBcIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIFwiTWFrZSBzdXJlIHRvIHNldCB1cCBydWxlcyB1bmRlciBlaXRoZXIgZm9sZGVyIHRlbXBsYXRlcyBvciBmaWxlIHJlZ2V4IHRlbXBsYXRlIGJlbG93LlwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJcIiwge1xyXG4gICAgICAgICAgICAgICAgdGV4dDogXCJXYXJuaW5nOiBcIixcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIFwiVGhpcyBjYW4gYmUgZGFuZ2Vyb3VzIGlmIHlvdSBjcmVhdGUgbmV3IGZpbGVzIHdpdGggdW5rbm93biAvIHVuc2FmZSBjb250ZW50IG9uIGNyZWF0aW9uLiBNYWtlIHN1cmUgdGhhdCBldmVyeSBuZXcgZmlsZSdzIGNvbnRlbnQgaXMgc2FmZSBvbiBjcmVhdGlvbi5cIlxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiVHJpZ2dlciBUZW1wbGF0ZXIgb24gbmV3IGZpbGUgY3JlYXRpb25cIilcclxuICAgICAgICAgICAgLnNldERlc2MoZGVzYylcclxuICAgICAgICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbiA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZXZlbnRfaGFuZGxlci51cGRhdGVfdHJpZ2dlcl9maWxlX29uX2NyZWF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZvcmNlIHJlZnJlc2hcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF90ZW1wbGF0ZXNfaG90a2V5c19zZXR0aW5nKCk6IHZvaWQge1xyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpLnNldE5hbWUoXCJUZW1wbGF0ZSBob3RrZXlzXCIpLnNldEhlYWRpbmcoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjLmFwcGVuZChcclxuICAgICAgICAgICAgXCJUZW1wbGF0ZSBob3RrZXlzIGFsbG93cyB5b3UgdG8gYmluZCBhIHRlbXBsYXRlIHRvIGEgaG90a2V5LlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbCkuc2V0RGVzYyhkZXNjKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlZF90ZW1wbGF0ZXNfaG90a2V5cy5mb3JFYWNoKFxyXG4gICAgICAgICAgICAodGVtcGxhdGUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgICAgICAgICAuYWRkU2VhcmNoKChjYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRmlsZVN1Z2dlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYi5pbnB1dEVsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBGaWxlU3VnZ2VzdE1vZGUuVGVtcGxhdGVGaWxlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYi5zZXRQbGFjZWhvbGRlcihcIkV4YW1wbGU6IGZvbGRlcjEvdGVtcGxhdGVfZmlsZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRlbXBsYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKChuZXdfdGVtcGxhdGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld190ZW1wbGF0ZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzLmNvbnRhaW5zKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X3RlbXBsYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nX2Vycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFRlbXBsYXRlckVycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhpcyB0ZW1wbGF0ZSBpcyBhbHJlYWR5IGJvdW5kIHRvIGEgaG90a2V5XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5jb21tYW5kX2hhbmRsZXIuYWRkX3RlbXBsYXRlX2hvdGtleShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzW2luZGV4XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X3RlbXBsYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0gPSBuZXdfdGVtcGxhdGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2IuY29udGFpbmVyRWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfc2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChjYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYi5zZXRJY29uKFwiYW55LWtleVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJDb25maWd1cmUgSG90a2V5XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogUmVwbGFjZSB3aXRoIGZ1dHVyZSBcIm9mZmljaWFsXCIgd2F5IHRvIGRvIHRoaXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAuc2V0dGluZy5vcGVuVGFiQnlJZChcImhvdGtleXNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhYiA9IHRoaXMuYXBwLnNldHRpbmcuYWN0aXZlVGFiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhYi5zZWFyY2hDb21wb25lbnQuaW5wdXRFbC52YWx1ZSA9IHRlbXBsYXRlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhYi51cGRhdGVIb3RrZXlWaXNpYmlsaXR5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcInVwLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiTW92ZSB1cFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5bW92ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggLSAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcImRvd24tY2hldnJvbi1nbHlwaFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJNb3ZlIGRvd25cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcnJheW1vdmUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZW5hYmxlZF90ZW1wbGF0ZXNfaG90a2V5cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICsgMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLnNldEljb24oXCJjcm9zc1wiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJEZWxldGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5jb21tYW5kX2hhbmRsZXIucmVtb3ZlX3RlbXBsYXRlX2hvdGtleShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3NcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzW2luZGV4XVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlZF90ZW1wbGF0ZXNfaG90a2V5cy5zcGxpY2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBzLmluZm9FbC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpLmFkZEJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgY2Iuc2V0QnV0dG9uVGV4dChcIkFkZCBuZXcgaG90a2V5IGZvciB0ZW1wbGF0ZVwiKVxyXG4gICAgICAgICAgICAgICAgLnNldEN0YSgpXHJcbiAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlZF90ZW1wbGF0ZXNfaG90a2V5cy5wdXNoKFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSByZWZyZXNoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfZm9sZGVyX3RlbXBsYXRlc19zZXR0aW5nKCk6IHZvaWQge1xyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpLnNldE5hbWUoXCJGb2xkZXIgdGVtcGxhdGVzXCIpLnNldEhlYWRpbmcoKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVzY0hlYWRpbmcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZGVzY0hlYWRpbmcuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIkZvbGRlciB0ZW1wbGF0ZXMgYXJlIHRyaWdnZXJlZCB3aGVuIGEgbmV3IFwiLFxyXG4gICAgICAgICAgICBkZXNjSGVhZGluZy5jcmVhdGVFbChcInN0cm9uZ1wiLCB7IHRleHQ6IFwiZW1wdHkgXCIgfSksXHJcbiAgICAgICAgICAgIFwiZmlsZSBpcyBjcmVhdGVkIGluIGEgZ2l2ZW4gZm9sZGVyLlwiLFxyXG4gICAgICAgICAgICBkZXNjSGVhZGluZy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIlRlbXBsYXRlciB3aWxsIGZpbGwgdGhlIGVtcHR5IGZpbGUgd2l0aCB0aGUgc3BlY2lmaWVkIHRlbXBsYXRlLlwiLFxyXG4gICAgICAgICAgICBkZXNjSGVhZGluZy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIlRoZSBkZWVwZXN0IG1hdGNoIGlzIHVzZWQuIEEgZ2xvYmFsIGRlZmF1bHQgdGVtcGxhdGUgd291bGQgYmUgZGVmaW5lZCBvbiB0aGUgcm9vdCBcIixcclxuICAgICAgICAgICAgZGVzY0hlYWRpbmcuY3JlYXRlRWwoXCJjb2RlXCIsIHsgdGV4dDogXCIvXCIgfSksXHJcbiAgICAgICAgICAgIFwiLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbCkuc2V0RGVzYyhkZXNjSGVhZGluZyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRlc2NVc2VOZXdGaWxlVGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgZGVzY1VzZU5ld0ZpbGVUZW1wbGF0ZS5hcHBlbmQoXHJcbiAgICAgICAgICAgIFwiV2hlbiBlbmFibGVkLCBUZW1wbGF0ZXIgd2lsbCBtYWtlIHVzZSBvZiB0aGUgZm9sZGVyIHRlbXBsYXRlcyBkZWZpbmVkIGJlbG93LiBUaGlzIG9wdGlvbiBpcyBtdXR1YWxseSBleGNsdXNpdmUgd2l0aCBmaWxlIHJlZ2V4IHRlbXBsYXRlcyBiZWxvdywgc28gZW5hYmxpbmcgb25lIHdpbGwgZGlzYWJsZSB0aGUgb3RoZXIuXCJcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIkVuYWJsZSBmb2xkZXIgdGVtcGxhdGVzXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKGRlc2NVc2VOZXdGaWxlVGVtcGxhdGUpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZV9mb2xkZXJfdGVtcGxhdGVzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodXNlX25ld19mb2xkZXJfdGVtcGxhdGVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZV9mb2xkZXJfdGVtcGxhdGVzID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZV9uZXdfZm9sZGVyX3RlbXBsYXRlcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZV9uZXdfZm9sZGVyX3RlbXBsYXRlcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlX2ZpbGVfdGVtcGxhdGVzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSByZWZyZXNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfZm9sZGVyX3RlbXBsYXRlcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb2xkZXJfdGVtcGxhdGVzLmZvckVhY2goXHJcbiAgICAgICAgICAgIChmb2xkZXJfdGVtcGxhdGUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgICAgICAgICAuYWRkU2VhcmNoKChjYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXcgRm9sZGVyU3VnZ2VzdCh0aGlzLmFwcCwgY2IuaW5wdXRFbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLnNldFBsYWNlaG9sZGVyKFwiRm9sZGVyXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoZm9sZGVyX3RlbXBsYXRlLmZvbGRlcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X2ZvbGRlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZvbGRlciAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb2xkZXJfdGVtcGxhdGVzLnNvbWUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZSkgPT4gZS5mb2xkZXIgPT0gbmV3X2ZvbGRlclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ19lcnJvcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlRoaXMgZm9sZGVyIGFscmVhZHkgaGFzIGEgdGVtcGxhdGUgYXNzb2NpYXRlZCB3aXRoIGl0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlc1tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLmZvbGRlciA9IG5ld19mb2xkZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2IuY29udGFpbmVyRWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfc2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZFNlYXJjaCgoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEZpbGVTdWdnZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IuaW5wdXRFbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRmlsZVN1Z2dlc3RNb2RlLlRlbXBsYXRlRmlsZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0UGxhY2Vob2xkZXIoXCJUZW1wbGF0ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKGZvbGRlcl90ZW1wbGF0ZS50ZW1wbGF0ZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X3RlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlc1tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLnRlbXBsYXRlID0gbmV3X3RlbXBsYXRlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLmNvbnRhaW5lckVsLmFkZENsYXNzKFwidGVtcGxhdGVyX3NlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcInVwLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiTW92ZSB1cFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5bW92ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4IC0gMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLnNldEljb24oXCJkb3duLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiTW92ZSBkb3duXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXltb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mb2xkZXJfdGVtcGxhdGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggKyAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcImNyb3NzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcChcIkRlbGV0ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZvbGRlcl90ZW1wbGF0ZXMuc3BsaWNlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBzLmluZm9FbC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpLmFkZEJ1dHRvbigoYnV0dG9uOiBCdXR0b25Db21wb25lbnQpID0+IHtcclxuICAgICAgICAgICAgYnV0dG9uXHJcbiAgICAgICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChcIkFkZCBuZXcgZm9sZGVyIHRlbXBsYXRlXCIpXHJcbiAgICAgICAgICAgICAgICAuc2V0VG9vbHRpcChcIkFkZCBhZGRpdGlvbmFsIGZvbGRlciB0ZW1wbGF0ZVwiKVxyXG4gICAgICAgICAgICAgICAgLnNldEN0YSgpXHJcbiAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZm9sZGVyX3RlbXBsYXRlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9sZGVyOiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfZmlsZV90ZW1wbGF0ZXNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIkZpbGUgcmVnZXggdGVtcGxhdGVzXCIpXHJcbiAgICAgICAgICAgIC5zZXRIZWFkaW5nKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRlc2NIZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGRlc2NIZWFkaW5nLmFwcGVuZChcclxuICAgICAgICAgICAgXCJGaWxlIHJlZ2V4IHRlbXBsYXRlcyBhcmUgdHJpZ2dlcmVkIHdoZW4gYSBuZXcgXCIsXHJcbiAgICAgICAgICAgIGRlc2NIZWFkaW5nLmNyZWF0ZUVsKFwic3Ryb25nXCIsIHsgdGV4dDogXCJlbXB0eVwiIH0pLFxyXG4gICAgICAgICAgICBcIiBmaWxlIGlzIGNyZWF0ZWQgdGhhdCBtYXRjaGVzIG9uZSBvZiB0aGVtLiBUZW1wbGF0ZXIgd2lsbCBmaWxsIHRoZSBlbXB0eSBmaWxlIHdpdGggdGhlIHNwZWNpZmllZCB0ZW1wbGF0ZS5cIixcclxuICAgICAgICAgICAgZGVzY0hlYWRpbmcuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgXCJUaGUgZmlyc3QgbWF0Y2ggZnJvbSB0aGUgdG9wIGlzIHVzZWQsIHNvIHRoZSBvcmRlciBvZiB0aGUgcnVsZXMgaXMgaW1wb3J0YW50LlwiLFxyXG4gICAgICAgICAgICBkZXNjSGVhZGluZy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIlVzZSBcIixcclxuICAgICAgICAgICAgZGVzY0hlYWRpbmcuY3JlYXRlRWwoXCJjb2RlXCIsIHsgdGV4dDogXCIuKlwiIH0pLFxyXG4gICAgICAgICAgICBcIiBhcyBhIGZpbmFsIGNhdGNoLWFsbCwgaWYgeW91IG5lZWQgaXQuXCJcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5zZXREZXNjKGRlc2NIZWFkaW5nKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGVzY1VzZU5ld0ZpbGVUZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjVXNlTmV3RmlsZVRlbXBsYXRlLmFwcGVuZChcclxuICAgICAgICAgICAgXCJXaGVuIGVuYWJsZWQsIFRlbXBsYXRlciB3aWxsIG1ha2UgdXNlIG9mIHRoZSBmaWxlIHJlZ2V4IHRlbXBsYXRlcyBkZWZpbmVkIGJlbG93LiBUaGlzIG9wdGlvbiBpcyBtdXR1YWxseSBleGNsdXNpdmUgd2l0aCBmb2xkZXIgdGVtcGxhdGVzIGFib3ZlLCBzbyBlbmFibGluZyBvbmUgd2lsbCBkaXNhYmxlIHRoZSBvdGhlci5cIlxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiRW5hYmxlIGZpbGUgcmVnZXggdGVtcGxhdGVzXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKGRlc2NVc2VOZXdGaWxlVGVtcGxhdGUpXHJcbiAgICAgICAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZV9maWxlX3RlbXBsYXRlcylcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKHVzZV9uZXdfZmlsZV90ZW1wbGF0ZXMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlX2ZpbGVfdGVtcGxhdGVzID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZV9uZXdfZmlsZV90ZW1wbGF0ZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1c2VfbmV3X2ZpbGVfdGVtcGxhdGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfZm9sZGVyX3RlbXBsYXRlcyA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSByZWZyZXNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfZmlsZV90ZW1wbGF0ZXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZmlsZV90ZW1wbGF0ZXMuZm9yRWFjaCgoZmlsZV90ZW1wbGF0ZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcyA9IG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgICAgICAuYWRkVGV4dCgoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjYi5zZXRQbGFjZWhvbGRlcihcIkZpbGUgcmVnZXhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKGZpbGVfdGVtcGxhdGUucmVnZXgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X3JlZ2V4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlX3RlbXBsYXRlc1tpbmRleF0ucmVnZXggPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19yZWdleDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIGNiLmlucHV0RWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfc2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5hZGRTZWFyY2goKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IEZpbGVTdWdnZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYi5pbnB1dEVsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgRmlsZVN1Z2dlc3RNb2RlLlRlbXBsYXRlRmlsZXNcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNiLnNldFBsYWNlaG9sZGVyKFwiVGVtcGxhdGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKGZpbGVfdGVtcGxhdGUudGVtcGxhdGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X3RlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlX3RlbXBsYXRlc1tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXS50ZW1wbGF0ZSA9IG5ld190ZW1wbGF0ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIGNiLmNvbnRhaW5lckVsLmFkZENsYXNzKFwidGVtcGxhdGVyX3NlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcInVwLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJNb3ZlIHVwXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFycmF5bW92ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlX3RlbXBsYXRlcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCAtIDFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgLmFkZEV4dHJhQnV0dG9uKChjYikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNiLnNldEljb24oXCJkb3duLWNoZXZyb24tZ2x5cGhcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJNb3ZlIGRvd25cIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXltb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZpbGVfdGVtcGxhdGVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICsgMVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcImNyb3NzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiRGVsZXRlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZpbGVfdGVtcGxhdGVzLnNwbGljZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHMuaW5mb0VsLnJlbW92ZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5hZGRCdXR0b24oKGJ1dHRvbjogQnV0dG9uQ29tcG9uZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJBZGQgbmV3IGZpbGUgcmVnZXhcIilcclxuICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiQWRkIGFkZGl0aW9uYWwgZmlsZSByZWdleFwiKVxyXG4gICAgICAgICAgICAgICAgLnNldEN0YSgpXHJcbiAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZmlsZV90ZW1wbGF0ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2V4OiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogXCJcIixcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfc3RhcnR1cF90ZW1wbGF0ZXNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5zZXROYW1lKFwiU3RhcnR1cCB0ZW1wbGF0ZXNcIikuc2V0SGVhZGluZygpO1xyXG5cclxuICAgICAgICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgICAgIGRlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICBcIlN0YXJ0dXAgdGVtcGxhdGVzIGFyZSB0ZW1wbGF0ZXMgdGhhdCB3aWxsIGdldCBleGVjdXRlZCBvbmNlIHdoZW4gVGVtcGxhdGVyIHN0YXJ0cy5cIixcclxuICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImJyXCIpLFxyXG4gICAgICAgICAgICBcIlRoZXNlIHRlbXBsYXRlcyB3b24ndCBvdXRwdXQgYW55dGhpbmcuXCIsXHJcbiAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgXCJUaGlzIGNhbiBiZSB1c2VmdWwgdG8gc2V0IHVwIHRlbXBsYXRlcyBhZGRpbmcgaG9va3MgdG8gT2JzaWRpYW4gZXZlbnRzIGZvciBleGFtcGxlLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbCkuc2V0RGVzYyhkZXNjKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3Muc3RhcnR1cF90ZW1wbGF0ZXMuZm9yRWFjaCgodGVtcGxhdGUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHMgPSBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAgICAgLmFkZFNlYXJjaCgoY2IpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBuZXcgRmlsZVN1Z2dlc3QoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLmlucHV0RWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlU3VnZ2VzdE1vZGUuVGVtcGxhdGVGaWxlc1xyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2Iuc2V0UGxhY2Vob2xkZXIoXCJFeGFtcGxlOiBmb2xkZXIxL3RlbXBsYXRlX2ZpbGVcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRlbXBsYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKG5ld190ZW1wbGF0ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld190ZW1wbGF0ZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0dXBfdGVtcGxhdGVzLmNvbnRhaW5zKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfdGVtcGxhdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dfZXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiVGhpcyBzdGFydHVwIHRlbXBsYXRlIGFscmVhZHkgZXhpc3RcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zdGFydHVwX3RlbXBsYXRlc1tpbmRleF0gPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld190ZW1wbGF0ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIGNiLmNvbnRhaW5lckVsLmFkZENsYXNzKFwidGVtcGxhdGVyX3NlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2Iuc2V0SWNvbihcImNyb3NzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiRGVsZXRlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0dXBfdGVtcGxhdGVzLnNwbGljZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHMuaW5mb0VsLnJlbW92ZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5hZGRCdXR0b24oKGNiKSA9PiB7XHJcbiAgICAgICAgICAgIGNiLnNldEJ1dHRvblRleHQoXCJBZGQgbmV3IHN0YXJ0dXAgdGVtcGxhdGVcIilcclxuICAgICAgICAgICAgICAgIC5zZXRDdGEoKVxyXG4gICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnN0YXJ0dXBfdGVtcGxhdGVzLnB1c2goXCJcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZvcmNlIHJlZnJlc2hcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF91c2VyX3NjcmlwdF9mdW5jdGlvbnNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlVzZXIgc2NyaXB0IGZ1bmN0aW9uc1wiKVxyXG4gICAgICAgICAgICAuc2V0SGVhZGluZygpO1xyXG5cclxuICAgICAgICBsZXQgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjLmFwcGVuZChcclxuICAgICAgICAgICAgXCJBbGwgSmF2YVNjcmlwdCBmaWxlcyBpbiB0aGlzIGZvbGRlciB3aWxsIGJlIGxvYWRlZCBhcyBDb21tb25KUyBtb2R1bGVzLCB0byBpbXBvcnQgY3VzdG9tIHVzZXIgZnVuY3Rpb25zLlwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIFwiVGhlIGZvbGRlciBuZWVkcyB0byBiZSBhY2Nlc3NpYmxlIGZyb20gdGhlIHZhdWx0LlwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIFwiQ2hlY2sgdGhlIFwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYVwiLCB7XHJcbiAgICAgICAgICAgICAgICBocmVmOiBcImh0dHBzOi8vc2lsZW50dm9pZDEzLmdpdGh1Yi5pby9UZW1wbGF0ZXIvXCIsXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBcImRvY3VtZW50YXRpb25cIixcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIFwiIGZvciBtb3JlIGluZm9ybWF0aW9uLlwiXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJTY3JpcHQgZmlsZXMgZm9sZGVyIGxvY2F0aW9uXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKGRlc2MpXHJcbiAgICAgICAgICAgIC5hZGRTZWFyY2goKGNiKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBuZXcgRm9sZGVyU3VnZ2VzdCh0aGlzLmFwcCwgY2IuaW5wdXRFbCk7XHJcbiAgICAgICAgICAgICAgICBjYi5zZXRQbGFjZWhvbGRlcihcIkV4YW1wbGU6IGZvbGRlcjEvZm9sZGVyMlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VyX3NjcmlwdHNfZm9sZGVyKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X2ZvbGRlcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VyX3NjcmlwdHNfZm9sZGVyID0gbmV3X2ZvbGRlcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgY2IuY29udGFpbmVyRWwuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfc2VhcmNoXCIpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAuc2V0TmFtZSgnVXNlciBzY3JpcHQgaW50ZWxsaXNlbnNlJylcclxuICAgICAgICAuc2V0RGVzYygnRGV0ZXJtaW5lIGhvdyB5b3VcXCdkIGxpa2UgdG8gaGF2ZSB1c2VyIHNjcmlwdCBpbnRlbGxpc2Vuc2UgcmVuZGVyLiBOb3RlIHZhbHVlcyB3aWxsIG5vdCByZW5kZXIgaWYgbm90IGluIHRoZSBzY3JpcHQuJylcclxuICAgICAgICAuYWRkRHJvcGRvd24oY2IgPT4ge1xyXG4gICAgICAgICAgICBjYlxyXG4gICAgICAgICAgICAgICAgLmFkZE9wdGlvbihcIjBcIiwgXCJUdXJuIG9mZiBpbnRlbGxpc2Vuc2VcIilcclxuICAgICAgICAgICAgICAgIC5hZGRPcHRpb24oXCIxXCIsIFwiUmVuZGVyIG1ldGhvZCBkZXNjcmlwdGlvbiwgcGFyYW1ldGVycyBsaXN0LCBhbmQgcmV0dXJuXCIpXHJcbiAgICAgICAgICAgICAgICAuYWRkT3B0aW9uKFwiMlwiLCBcIlJlbmRlciBtZXRob2QgZGVzY3JpcHRpb24gYW5kIHBhcmFtZXRlcnMgbGlzdFwiKVxyXG4gICAgICAgICAgICAgICAgLmFkZE9wdGlvbihcIjNcIiwgXCJSZW5kZXIgbWV0aG9kIGRlc2NyaXB0aW9uIGFuZCByZXR1cm5cIilcclxuICAgICAgICAgICAgICAgIC5hZGRPcHRpb24oXCI0XCIsIFwiUmVuZGVyIG1ldGhvZCBkZXNjcmlwdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmludGVsbGlzZW5zZV9yZW5kZXIudG9TdHJpbmcoKSlcclxuICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbnRlbGxpc2Vuc2VfcmVuZGVyID0gcGFyc2VJbnQodmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBsZXQgbmFtZTogc3RyaW5nO1xyXG4gICAgICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlcl9zY3JpcHRzX2ZvbGRlcikge1xyXG4gICAgICAgICAgICBuYW1lID0gXCJObyB1c2VyIHNjcmlwdHMgZm9sZGVyIHNldFwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gZXJyb3JXcmFwcGVyU3luYyhcclxuICAgICAgICAgICAgICAgICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgZ2V0X3RmaWxlc19mcm9tX2ZvbGRlcihcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZXJfc2NyaXB0c19mb2xkZXJcclxuICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgYFVzZXIgc2NyaXB0cyBmb2xkZXIgZG9lc24ndCBleGlzdGBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaWYgKCFmaWxlcyB8fCBmaWxlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIG5hbWUgPSBcIk5vIHVzZXIgc2NyaXB0cyBkZXRlY3RlZFwiO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvdW50ID0gMDtcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLmV4dGVuc2lvbiA9PT0gXCJqc1wiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2MuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzYy5jcmVhdGVFbChcImxpXCIsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBgdHAudXNlci4ke2ZpbGUuYmFzZW5hbWV9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbmFtZSA9IGBEZXRlY3RlZCAke2NvdW50fSBVc2VyIFNjcmlwdChzKWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKG5hbWUpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKGRlc2MpXHJcbiAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoZXh0cmEpID0+IHtcclxuICAgICAgICAgICAgICAgIGV4dHJhXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJzeW5jXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJSZWZyZXNoXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSByZWZyZXNoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRfdXNlcl9zeXN0ZW1fY29tbWFuZF9mdW5jdGlvbnNfc2V0dGluZygpOiB2b2lkIHtcclxuICAgICAgICBsZXQgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICBkZXNjLmFwcGVuZChcclxuICAgICAgICAgICAgXCJBbGxvd3MgeW91IHRvIGNyZWF0ZSB1c2VyIGZ1bmN0aW9ucyBsaW5rZWQgdG8gc3lzdGVtIGNvbW1hbmRzLlwiLFxyXG4gICAgICAgICAgICBkZXNjLmNyZWF0ZUVsKFwiYnJcIiksXHJcbiAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiXCIsIHtcclxuICAgICAgICAgICAgICAgIHRleHQ6IFwiV2FybmluZzogXCIsXHJcbiAgICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgICBcIkl0IGNhbiBiZSBkYW5nZXJvdXMgdG8gZXhlY3V0ZSBhcmJpdHJhcnkgc3lzdGVtIGNvbW1hbmRzIGZyb20gdW50cnVzdGVkIHNvdXJjZXMuIE9ubHkgcnVuIHN5c3RlbSBjb21tYW5kcyB0aGF0IHlvdSB1bmRlcnN0YW5kLCBmcm9tIHRydXN0ZWQgc291cmNlcy5cIlxyXG4gICAgICAgICk7XHJcbiAgICAgICAgbmV3IFNldHRpbmcodGhpcy5jb250YWluZXJFbClcclxuICAgICAgICAgICAgLnNldE5hbWUoXCJVc2VyIHN5c3RlbSBjb21tYW5kIGZ1bmN0aW9uc1wiKVxyXG4gICAgICAgICAgICAuc2V0SGVhZGluZygpO1xyXG5cclxuICAgICAgICBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIkVuYWJsZSB1c2VyIHN5c3RlbSBjb21tYW5kIGZ1bmN0aW9uc1wiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhkZXNjKVxyXG4gICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHRvZ2dsZVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfc3lzdGVtX2NvbW1hbmRzKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgoZW5hYmxlX3N5c3RlbV9jb21tYW5kcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfc3lzdGVtX2NvbW1hbmRzID1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZV9zeXN0ZW1fY29tbWFuZHM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVfc3lzdGVtX2NvbW1hbmRzKSB7XHJcbiAgICAgICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgICAgICAuc2V0TmFtZShcIlRpbWVvdXRcIilcclxuICAgICAgICAgICAgICAgIC5zZXREZXNjKFwiTWF4aW11bSB0aW1lb3V0IGluIHNlY29uZHMgZm9yIGEgc3lzdGVtIGNvbW1hbmQuXCIpXHJcbiAgICAgICAgICAgICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJUaW1lb3V0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbW1hbmRfdGltZW91dC50b1N0cmluZygpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKChuZXdfdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld190aW1lb3V0ID0gTnVtYmVyKG5ld192YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXNOYU4obmV3X3RpbWVvdXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nX2Vycm9yKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlRpbWVvdXQgbXVzdCBiZSBhIG51bWJlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbW1hbmRfdGltZW91dCA9IG5ld190aW1lb3V0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuICAgICAgICAgICAgZGVzYy5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICBcIkZ1bGwgcGF0aCB0byB0aGUgc2hlbGwgYmluYXJ5IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQgd2l0aC5cIixcclxuICAgICAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgICAgIFwiVGhpcyBzZXR0aW5nIGlzIG9wdGlvbmFsIGFuZCB3aWxsIGRlZmF1bHQgdG8gdGhlIHN5c3RlbSdzIGRlZmF1bHQgc2hlbGwgaWYgbm90IHNwZWNpZmllZC5cIixcclxuICAgICAgICAgICAgICAgIGRlc2MuY3JlYXRlRWwoXCJiclwiKSxcclxuICAgICAgICAgICAgICAgIFwiWW91IGNhbiB1c2UgZm9yd2FyZCBzbGFzaGVzICgnLycpIGFzIHBhdGggc2VwYXJhdG9ycyBvbiBhbGwgcGxhdGZvcm1zIGlmIGluIGRvdWJ0LlwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgICAgICAuc2V0TmFtZShcIlNoZWxsIGJpbmFyeSBsb2NhdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgLnNldERlc2MoZGVzYylcclxuICAgICAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIkV4YW1wbGU6IC9iaW4vYmFzaCwgLi4uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaGVsbF9wYXRoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKHNoZWxsX3BhdGgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNoZWxsX3BhdGggPSBzaGVsbF9wYXRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgbGV0IGkgPSAxO1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuZm9yRWFjaCgodGVtcGxhdGVfcGFpcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGl2ID0gdGhpcy5jb250YWluZXJFbC5jcmVhdGVFbChcImRpdlwiKTtcclxuICAgICAgICAgICAgICAgIGRpdi5hZGRDbGFzcyhcInRlbXBsYXRlcl9kaXZcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgdGl0bGUgPSB0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDRcIiwge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiVXNlciBmdW5jdGlvbiBuwrBcIiArIGksXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRpdGxlLmFkZENsYXNzKFwidGVtcGxhdGVyX3RpdGxlXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoZXh0cmEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRJY29uKFwiY3Jvc3NcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiRGVsZXRlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuaW5kZXhPZihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlX3BhaXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuc3BsaWNlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNhdmVfc2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSB0ZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJGdW5jdGlvbiBuYW1lXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGVtcGxhdGVfcGFpclswXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZSgobmV3X3ZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMuaW5kZXhPZihcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlX3BhaXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnNbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdWzBdID0gbmV3X3ZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHQuaW5wdXRFbC5hZGRDbGFzcyhcInRlbXBsYXRlcl90ZW1wbGF0ZVwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZFRleHRBcmVhKCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHQgPSB0ZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJTeXN0ZW0gY29tbWFuZFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRlbXBsYXRlX3BhaXJbMV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoKG5ld19jbWQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19wYWlycy5pbmRleE9mKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVfcGFpclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnRlbXBsYXRlc19wYWlyc1tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1bMV0gPSBuZXdfY21kO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zYXZlX3NldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0LmlucHV0RWwuc2V0QXR0cihcInJvd3NcIiwgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHQuaW5wdXRFbC5hZGRDbGFzcyhcInRlbXBsYXRlcl9jbWRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdDtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZXR0aW5nLmluZm9FbC5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQodGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgZGl2LmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyRWwubGFzdENoaWxkIGFzIE5vZGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGkgKz0gMTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBkaXYgPSB0aGlzLmNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiZGl2XCIpO1xyXG4gICAgICAgICAgICBkaXYuYWRkQ2xhc3MoXCJ0ZW1wbGF0ZXJfZGl2MlwiKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmcgPSBuZXcgU2V0dGluZyh0aGlzLmNvbnRhaW5lckVsKS5hZGRCdXR0b24oXHJcbiAgICAgICAgICAgICAgICAoYnV0dG9uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiQWRkIG5ldyB1c2VyIGZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRDdGEoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub25DbGljaygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy50ZW1wbGF0ZXNfcGFpcnMucHVzaChbXCJcIiwgXCJcIl0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2F2ZV9zZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRm9yY2UgcmVmcmVzaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBzZXR0aW5nLmluZm9FbC5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIGRpdi5hcHBlbmRDaGlsZCh0aGlzLmNvbnRhaW5lckVsLmxhc3RDaGlsZCBhcyBOb2RlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYWRkX2RvbmF0aW5nX3NldHRpbmcoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgcyA9IG5ldyBTZXR0aW5nKHRoaXMuY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiRG9uYXRlXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFxyXG4gICAgICAgICAgICAgICAgXCJJZiB5b3UgbGlrZSB0aGlzIFBsdWdpbiwgY29uc2lkZXIgZG9uYXRpbmcgdG8gc3VwcG9ydCBjb250aW51ZWQgZGV2ZWxvcG1lbnQuXCJcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3QgYTEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICBhMS5zZXRBdHRyaWJ1dGUoXCJocmVmXCIsIFwiaHR0cHM6Ly9naXRodWIuY29tL3Nwb25zb3JzL3NpbGVudHZvaWQxM1wiKTtcclxuICAgICAgICBhMS5hZGRDbGFzcyhcInRlbXBsYXRlcl9kb25hdGluZ1wiKTtcclxuICAgICAgICBjb25zdCBpbWcxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuICAgICAgICBpbWcxLnNyYyA9XHJcbiAgICAgICAgICAgIFwiaHR0cHM6Ly9pbWcuc2hpZWxkcy5pby9zdGF0aWMvdjE/bGFiZWw9U3BvbnNvciZtZXNzYWdlPSVFMiU5RCVBNCZsb2dvPUdpdEh1YiZjb2xvcj0lMjNmZThlODZcIjtcclxuICAgICAgICBhMS5hcHBlbmRDaGlsZChpbWcxKTtcclxuXHJcbiAgICAgICAgY29uc3QgYTIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgICAgICBhMi5zZXRBdHRyaWJ1dGUoXHJcbiAgICAgICAgICAgIFwiaHJlZlwiLFxyXG4gICAgICAgICAgICBcImh0dHBzOi8vd3d3LnBheXBhbC5jb20vZG9uYXRlP2hvc3RlZF9idXR0b25faWQ9VTJTUkdBRllYVDMyUVwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhMi5hZGRDbGFzcyhcInRlbXBsYXRlcl9kb25hdGluZ1wiKTtcclxuICAgICAgICBjb25zdCBpbWcyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuICAgICAgICBpbWcyLnNyYyA9XHJcbiAgICAgICAgICAgIFwiaHR0cHM6Ly9pbWcuc2hpZWxkcy5pby9iYWRnZS9wYXlwYWwtc2lsZW50dm9pZDEzLXllbGxvdz9zdHlsZT1zb2NpYWwmbG9nbz1wYXlwYWxcIjtcclxuICAgICAgICBhMi5hcHBlbmRDaGlsZChpbWcyKTtcclxuXHJcbiAgICAgICAgcy5zZXR0aW5nRWwuYXBwZW5kQ2hpbGQoYTEpO1xyXG4gICAgICAgIHMuc2V0dGluZ0VsLmFwcGVuZENoaWxkKGEyKTtcclxuICAgIH1cclxufVxyXG4iXX0=