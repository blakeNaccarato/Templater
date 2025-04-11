import { RequestUrlResponse } from "obsidian";
import { InternalModule } from "../InternalModule";
import { ModuleName } from "editor/TpDocumentation";
export declare class InternalModuleWeb extends InternalModule {
    name: ModuleName;
    create_static_templates(): Promise<void>;
    create_dynamic_templates(): Promise<void>;
    teardown(): Promise<void>;
    getRequest(url: string): Promise<RequestUrlResponse>;
    generate_daily_quote(): () => Promise<string>;
    generate_random_picture(): (size: string, query?: string, include_size?: boolean) => Promise<string>;
    generate_request(): (url: string, path?: string) => Promise<string>;
}
//# sourceMappingURL=InternalModuleWeb.d.ts.map