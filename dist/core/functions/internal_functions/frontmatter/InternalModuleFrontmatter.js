import { __awaiter } from "tslib";
import { InternalModule } from "../InternalModule";
export class InternalModuleFrontmatter extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "frontmatter";
    }
    create_static_templates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    create_dynamic_templates() {
        return __awaiter(this, void 0, void 0, function* () {
            const cache = this.plugin.app.metadataCache.getFileCache(this.config.target_file);
            this.dynamic_functions = new Map(Object.entries((cache === null || cache === void 0 ? void 0 : cache.frontmatter) || {}));
        });
    }
    teardown() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJuYWxNb2R1bGVGcm9udG1hdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Z1bmN0aW9ucy9pbnRlcm5hbF9mdW5jdGlvbnMvZnJvbnRtYXR0ZXIvSW50ZXJuYWxNb2R1bGVGcm9udG1hdHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBR25ELE1BQU0sT0FBTyx5QkFBMEIsU0FBUSxjQUFjO0lBQTdEOztRQUNXLFNBQUksR0FBZSxhQUFhLENBQUM7SUFjNUMsQ0FBQztJQVpTLHVCQUF1Qjs4REFBbUIsQ0FBQztLQUFBO0lBRTNDLHdCQUF3Qjs7WUFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FDcEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQzFCLENBQUM7WUFDRixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxHQUFHLENBQzVCLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQSxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsV0FBVyxLQUFJLEVBQUUsQ0FBQyxDQUMzQyxDQUFDO1FBQ04sQ0FBQztLQUFBO0lBRUssUUFBUTs4REFBbUIsQ0FBQztLQUFBO0NBQ3JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGUgfSBmcm9tIFwiLi4vSW50ZXJuYWxNb2R1bGVcIjtcclxuaW1wb3J0IHsgTW9kdWxlTmFtZSB9IGZyb20gXCJlZGl0b3IvVHBEb2N1bWVudGF0aW9uXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxNb2R1bGVGcm9udG1hdHRlciBleHRlbmRzIEludGVybmFsTW9kdWxlIHtcclxuICAgIHB1YmxpYyBuYW1lOiBNb2R1bGVOYW1lID0gXCJmcm9udG1hdHRlclwiO1xyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9zdGF0aWNfdGVtcGxhdGVzKCk6IFByb21pc2U8dm9pZD4ge31cclxuXHJcbiAgICBhc3luYyBjcmVhdGVfZHluYW1pY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgY2FjaGUgPSB0aGlzLnBsdWdpbi5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaWxlQ2FjaGUoXHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLnRhcmdldF9maWxlXHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmR5bmFtaWNfZnVuY3Rpb25zID0gbmV3IE1hcChcclxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXMoY2FjaGU/LmZyb250bWF0dGVyIHx8IHt9KVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgdGVhcmRvd24oKTogUHJvbWlzZTx2b2lkPiB7fVxyXG59XHJcbiJdfQ==