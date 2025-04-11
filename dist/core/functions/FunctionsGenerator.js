import { InternalFunctions } from "./internal_functions/InternalFunctions";
import { UserFunctions } from "./user_functions/UserFunctions";
import * as obsidian_module from "obsidian";
export var FunctionsMode;
(function (FunctionsMode) {
    FunctionsMode[FunctionsMode["INTERNAL"] = 0] = "INTERNAL";
    FunctionsMode[FunctionsMode["USER_INTERNAL"] = 1] = "USER_INTERNAL";
})(FunctionsMode || (FunctionsMode = {}));
export class FunctionsGenerator {
    constructor(plugin) {
        this.plugin = plugin;
        this.internal_functions = new InternalFunctions(this.plugin);
        this.user_functions = new UserFunctions(this.plugin);
    }
    async init() {
        await this.internal_functions.init();
    }
    async teardown() {
        await this.internal_functions.teardown();
    }
    additional_functions() {
        return {
            app: this.plugin.app,
            obsidian: obsidian_module,
        };
    }
    async generate_object(config, functions_mode = FunctionsMode.USER_INTERNAL) {
        const final_object = {};
        const additional_functions_object = this.additional_functions();
        const internal_functions_object = await this.internal_functions.generate_object(config);
        let user_functions_object = {};
        Object.assign(final_object, additional_functions_object);
        switch (functions_mode) {
            case FunctionsMode.INTERNAL:
                Object.assign(final_object, internal_functions_object);
                break;
            case FunctionsMode.USER_INTERNAL:
                user_functions_object =
                    await this.user_functions.generate_object(config);
                Object.assign(final_object, {
                    ...internal_functions_object,
                    user: user_functions_object,
                });
                break;
        }
        return final_object;
    }
}
