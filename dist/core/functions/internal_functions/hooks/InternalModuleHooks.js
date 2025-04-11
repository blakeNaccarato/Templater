import { __awaiter } from "tslib";
import { delay } from "utils/Utils";
import { InternalModule } from "../InternalModule";
export class InternalModuleHooks extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "hooks";
        this.event_refs = [];
    }
    create_static_templates() {
        return __awaiter(this, void 0, void 0, function* () {
            this.static_functions.set("on_all_templates_executed", this.generate_on_all_templates_executed());
        });
    }
    create_dynamic_templates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    teardown() {
        return __awaiter(this, void 0, void 0, function* () {
            this.event_refs.forEach((eventRef) => {
                eventRef.e.offref(eventRef);
            });
            this.event_refs = [];
        });
    }
    generate_on_all_templates_executed() {
        return (callback_function) => {
            const event_ref = this.plugin.app.workspace.on("templater:all-templates-executed", () => __awaiter(this, void 0, void 0, function* () {
                yield delay(1);
                callback_function();
            }));
            if (event_ref) {
                this.event_refs.push(event_ref);
            }
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJuYWxNb2R1bGVIb29rcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jb3JlL2Z1bmN0aW9ucy9pbnRlcm5hbF9mdW5jdGlvbnMvaG9va3MvSW50ZXJuYWxNb2R1bGVIb29rcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBRUEsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNwQyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFbkQsTUFBTSxPQUFPLG1CQUFvQixTQUFRLGNBQWM7SUFBdkQ7O1FBQ1csU0FBSSxHQUFlLE9BQU8sQ0FBQztRQUMxQixlQUFVLEdBQWUsRUFBRSxDQUFDO0lBa0N4QyxDQUFDO0lBaENTLHVCQUF1Qjs7WUFDekIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FDckIsMkJBQTJCLEVBQzNCLElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxDQUM1QyxDQUFDO1FBQ04sQ0FBQztLQUFBO0lBRUssd0JBQXdCOzhEQUFtQixDQUFDO0tBQUE7SUFFNUMsUUFBUTs7WUFDVixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUNqQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoQyxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLENBQUM7S0FBQTtJQUVELGtDQUFrQztRQUc5QixPQUFPLENBQUMsaUJBQWlCLEVBQUUsRUFBRTtZQUN6QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUMxQyxrQ0FBa0MsRUFDbEMsR0FBUyxFQUFFO2dCQUNQLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNmLGlCQUFpQixFQUFFLENBQUM7WUFDeEIsQ0FBQyxDQUFBLENBQ0osQ0FBQztZQUNGLElBQUksU0FBUyxFQUFFO2dCQUNYLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ25DO1FBQ0wsQ0FBQyxDQUFDO0lBQ04sQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRSZWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgTW9kdWxlTmFtZSB9IGZyb20gXCJlZGl0b3IvVHBEb2N1bWVudGF0aW9uXCI7XHJcbmltcG9ydCB7IGRlbGF5IH0gZnJvbSBcInV0aWxzL1V0aWxzXCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlIH0gZnJvbSBcIi4uL0ludGVybmFsTW9kdWxlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxNb2R1bGVIb29rcyBleHRlbmRzIEludGVybmFsTW9kdWxlIHtcclxuICAgIHB1YmxpYyBuYW1lOiBNb2R1bGVOYW1lID0gXCJob29rc1wiO1xyXG4gICAgcHJpdmF0ZSBldmVudF9yZWZzOiBFdmVudFJlZltdID0gW107XHJcblxyXG4gICAgYXN5bmMgY3JlYXRlX3N0YXRpY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcclxuICAgICAgICAgICAgXCJvbl9hbGxfdGVtcGxhdGVzX2V4ZWN1dGVkXCIsXHJcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVfb25fYWxsX3RlbXBsYXRlc19leGVjdXRlZCgpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBjcmVhdGVfZHluYW1pY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICAgIGFzeW5jIHRlYXJkb3duKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMuZXZlbnRfcmVmcy5mb3JFYWNoKChldmVudFJlZikgPT4ge1xyXG4gICAgICAgICAgICBldmVudFJlZi5lLm9mZnJlZihldmVudFJlZik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5ldmVudF9yZWZzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfb25fYWxsX3RlbXBsYXRlc19leGVjdXRlZCgpOiAoXHJcbiAgICAgICAgY2FsbGJhY2tfZnVuY3Rpb246ICgpID0+IHVua25vd25cclxuICAgICkgPT4gdm9pZCB7XHJcbiAgICAgICAgcmV0dXJuIChjYWxsYmFja19mdW5jdGlvbikgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudF9yZWYgPSB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9uKFxyXG4gICAgICAgICAgICAgICAgXCJ0ZW1wbGF0ZXI6YWxsLXRlbXBsYXRlcy1leGVjdXRlZFwiLFxyXG4gICAgICAgICAgICAgICAgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGRlbGF5KDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrX2Z1bmN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGlmIChldmVudF9yZWYpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRfcmVmcy5wdXNoKGV2ZW50X3JlZik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbiJdfQ==