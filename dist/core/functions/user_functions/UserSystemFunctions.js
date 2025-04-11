import { FileSystemAdapter, Platform } from "obsidian";
import { UNSUPPORTED_MOBILE_TEMPLATE } from "utils/Constants";
import { TemplaterError } from "utils/Error";
import { FunctionsMode } from "../FunctionsGenerator";
export class UserSystemFunctions {
    constructor(plugin) {
        this.plugin = plugin;
        if (Platform.isMobile ||
            !(this.plugin.app.vault.adapter instanceof FileSystemAdapter)) {
            this.cwd = "";
        }
        else {
            this.cwd = this.plugin.app.vault.adapter.getBasePath();
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { promisify } = require("util");
            const { exec } = 
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require("child_process");
            this.exec_promise = promisify(exec);
        }
    }
    // TODO: Add mobile support
    async generate_system_functions(config) {
        const user_system_functions = new Map();
        const internal_functions_object = await this.plugin.templater.functions_generator.generate_object(config, FunctionsMode.INTERNAL);
        for (const template_pair of this.plugin.settings.templates_pairs) {
            const template = template_pair[0];
            let cmd = template_pair[1];
            if (!template || !cmd) {
                continue;
            }
            if (Platform.isMobile) {
                user_system_functions.set(template, () => {
                    return new Promise((resolve) => resolve(UNSUPPORTED_MOBILE_TEMPLATE));
                });
            }
            else {
                cmd = await this.plugin.templater.parser.parse_commands(cmd, internal_functions_object);
                user_system_functions.set(template, async (user_args) => {
                    const process_env = {
                        ...process.env,
                        ...user_args,
                    };
                    const cmd_options = {
                        timeout: this.plugin.settings.command_timeout * 1000,
                        cwd: this.cwd,
                        env: process_env,
                        ...(this.plugin.settings.shell_path && {
                            shell: this.plugin.settings.shell_path,
                        }),
                    };
                    try {
                        const { stdout } = await this.exec_promise(cmd, cmd_options);
                        return stdout.trimRight();
                    }
                    catch (error) {
                        throw new TemplaterError(`Error with User Template ${template}`, error);
                    }
                });
            }
        }
        return user_system_functions;
    }
    async generate_object(config) {
        const user_system_functions = await this.generate_system_functions(config);
        return Object.fromEntries(user_system_functions);
    }
}
