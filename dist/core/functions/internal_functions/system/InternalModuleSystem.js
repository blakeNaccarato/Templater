import { InternalModule } from "../InternalModule";
import { PromptModal } from "./PromptModal";
import { SuggesterModal } from "./SuggesterModal";
export class InternalModuleSystem extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "system";
    }
    async create_static_templates() {
        this.static_functions.set("clipboard", this.generate_clipboard());
        this.static_functions.set("prompt", this.generate_prompt());
        this.static_functions.set("suggester", this.generate_suggester());
    }
    async create_dynamic_templates() { }
    async teardown() { }
    generate_clipboard() {
        return async () => {
            return await navigator.clipboard.readText();
        };
    }
    generate_prompt() {
        return async (prompt_text, default_value, throw_on_cancel = false, multi_line = false) => {
            const prompt = new PromptModal(this.plugin.app, prompt_text, default_value, multi_line);
            const promise = new Promise((resolve, reject) => prompt.openAndGetValue(resolve, reject));
            try {
                return await promise;
            }
            catch (error) {
                if (throw_on_cancel) {
                    throw error;
                }
                return null;
            }
        };
    }
    generate_suggester() {
        return async (text_items, items, throw_on_cancel = false, placeholder = "", limit) => {
            const suggester = new SuggesterModal(this.plugin.app, text_items, items, placeholder, limit);
            const promise = new Promise((resolve, reject) => suggester.openAndGetValue(resolve, reject));
            try {
                return await promise;
            }
            catch (error) {
                if (throw_on_cancel) {
                    throw error;
                }
                return null;
            }
        };
    }
}
