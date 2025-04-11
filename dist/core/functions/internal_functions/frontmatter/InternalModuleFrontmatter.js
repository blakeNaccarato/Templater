import { InternalModule } from "../InternalModule";
export class InternalModuleFrontmatter extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "frontmatter";
    }
    async create_static_templates() { }
    async create_dynamic_templates() {
        const cache = this.plugin.app.metadataCache.getFileCache(this.config.target_file);
        this.dynamic_functions = new Map(Object.entries(cache?.frontmatter || {}));
    }
    async teardown() { }
}
