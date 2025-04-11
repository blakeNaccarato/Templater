import { delay } from "utils/Utils";
import { InternalModule } from "../InternalModule";
export class InternalModuleHooks extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "hooks";
        this.event_refs = [];
    }
    async create_static_templates() {
        this.static_functions.set("on_all_templates_executed", this.generate_on_all_templates_executed());
    }
    async create_dynamic_templates() { }
    async teardown() {
        this.event_refs.forEach((eventRef) => {
            eventRef.e.offref(eventRef);
        });
        this.event_refs = [];
    }
    generate_on_all_templates_executed() {
        return (callback_function) => {
            const event_ref = this.plugin.app.workspace.on("templater:all-templates-executed", async () => {
                await delay(1);
                callback_function();
            });
            if (event_ref) {
                this.event_refs.push(event_ref);
            }
        };
    }
}
