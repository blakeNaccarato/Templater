export class InternalModule {
    constructor(plugin) {
        this.plugin = plugin;
        this.static_functions = new Map();
        this.dynamic_functions = new Map();
    }
    getName() {
        return this.name;
    }
    async init() {
        await this.create_static_templates();
        this.static_object = Object.fromEntries(this.static_functions);
    }
    async generate_object(new_config) {
        this.config = new_config;
        await this.create_dynamic_templates();
        return {
            ...this.static_object,
            ...Object.fromEntries(this.dynamic_functions),
        };
    }
}
