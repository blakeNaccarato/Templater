import { InternalModule } from "../InternalModule";
export class InternalModuleConfig extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "config";
    }
    async create_static_templates() { }
    async create_dynamic_templates() { }
    async teardown() { }
    async generate_object(config) {
        return config;
    }
}
