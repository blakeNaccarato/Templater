import { __awaiter } from "tslib";
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
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.internal_functions.init();
        });
    }
    teardown() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.internal_functions.teardown();
        });
    }
    additional_functions() {
        return {
            app: this.plugin.app,
            obsidian: obsidian_module,
        };
    }
    generate_object(config, functions_mode = FunctionsMode.USER_INTERNAL) {
        return __awaiter(this, void 0, void 0, function* () {
            const final_object = {};
            const additional_functions_object = this.additional_functions();
            const internal_functions_object = yield this.internal_functions.generate_object(config);
            let user_functions_object = {};
            Object.assign(final_object, additional_functions_object);
            switch (functions_mode) {
                case FunctionsMode.INTERNAL:
                    Object.assign(final_object, internal_functions_object);
                    break;
                case FunctionsMode.USER_INTERNAL:
                    user_functions_object =
                        yield this.user_functions.generate_object(config);
                    Object.assign(final_object, Object.assign(Object.assign({}, internal_functions_object), { user: user_functions_object }));
                    break;
            }
            return final_object;
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRnVuY3Rpb25zR2VuZXJhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvZnVuY3Rpb25zL0Z1bmN0aW9uc0dlbmVyYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7QUFDM0UsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBSS9ELE9BQU8sS0FBSyxlQUFlLE1BQU0sVUFBVSxDQUFDO0FBRTVDLE1BQU0sQ0FBTixJQUFZLGFBR1g7QUFIRCxXQUFZLGFBQWE7SUFDckIseURBQVEsQ0FBQTtJQUNSLG1FQUFhLENBQUE7QUFDakIsQ0FBQyxFQUhXLGFBQWEsS0FBYixhQUFhLFFBR3hCO0FBRUQsTUFBTSxPQUFPLGtCQUFrQjtJQUkzQixZQUFvQixNQUF1QjtRQUF2QixXQUFNLEdBQU4sTUFBTSxDQUFpQjtRQUN2QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVLLElBQUk7O1lBQ04sTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDekMsQ0FBQztLQUFBO0lBRUssUUFBUTs7WUFDVixNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QyxDQUFDO0tBQUE7SUFFRCxvQkFBb0I7UUFDaEIsT0FBTztZQUNILEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUc7WUFDcEIsUUFBUSxFQUFFLGVBQWU7U0FDNUIsQ0FBQztJQUNOLENBQUM7SUFFSyxlQUFlLENBQ2pCLE1BQXFCLEVBQ3JCLGlCQUFnQyxhQUFhLENBQUMsYUFBYTs7WUFFM0QsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sMkJBQTJCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDaEUsTUFBTSx5QkFBeUIsR0FDM0IsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzFELElBQUkscUJBQXFCLEdBQUcsRUFBRSxDQUFDO1lBRS9CLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLDJCQUEyQixDQUFDLENBQUM7WUFDekQsUUFBUSxjQUFjLEVBQUU7Z0JBQ3BCLEtBQUssYUFBYSxDQUFDLFFBQVE7b0JBQ3ZCLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLHlCQUF5QixDQUFDLENBQUM7b0JBQ3ZELE1BQU07Z0JBQ1YsS0FBSyxhQUFhLENBQUMsYUFBYTtvQkFDNUIscUJBQXFCO3dCQUNqQixNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUN0RCxNQUFNLENBQUMsTUFBTSxDQUFDLFlBQVksa0NBQ25CLHlCQUF5QixLQUM1QixJQUFJLEVBQUUscUJBQXFCLElBQzdCLENBQUM7b0JBQ0gsTUFBTTthQUNiO1lBRUQsT0FBTyxZQUFZLENBQUM7UUFDeEIsQ0FBQztLQUFBO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbnRlcm5hbEZ1bmN0aW9ucyB9IGZyb20gXCIuL2ludGVybmFsX2Z1bmN0aW9ucy9JbnRlcm5hbEZ1bmN0aW9uc1wiO1xyXG5pbXBvcnQgeyBVc2VyRnVuY3Rpb25zIH0gZnJvbSBcIi4vdXNlcl9mdW5jdGlvbnMvVXNlckZ1bmN0aW9uc1wiO1xyXG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IElHZW5lcmF0ZU9iamVjdCB9IGZyb20gXCIuL0lHZW5lcmF0ZU9iamVjdFwiO1xyXG5pbXBvcnQgeyBSdW5uaW5nQ29uZmlnIH0gZnJvbSBcImNvcmUvVGVtcGxhdGVyXCI7XHJcbmltcG9ydCAqIGFzIG9ic2lkaWFuX21vZHVsZSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmV4cG9ydCBlbnVtIEZ1bmN0aW9uc01vZGUge1xyXG4gICAgSU5URVJOQUwsXHJcbiAgICBVU0VSX0lOVEVSTkFMLFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRnVuY3Rpb25zR2VuZXJhdG9yIGltcGxlbWVudHMgSUdlbmVyYXRlT2JqZWN0IHtcclxuICAgIHB1YmxpYyBpbnRlcm5hbF9mdW5jdGlvbnM6IEludGVybmFsRnVuY3Rpb25zO1xyXG4gICAgcHVibGljIHVzZXJfZnVuY3Rpb25zOiBVc2VyRnVuY3Rpb25zO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcclxuICAgICAgICB0aGlzLmludGVybmFsX2Z1bmN0aW9ucyA9IG5ldyBJbnRlcm5hbEZ1bmN0aW9ucyh0aGlzLnBsdWdpbik7XHJcbiAgICAgICAgdGhpcy51c2VyX2Z1bmN0aW9ucyA9IG5ldyBVc2VyRnVuY3Rpb25zKHRoaXMucGx1Z2luKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuaW50ZXJuYWxfZnVuY3Rpb25zLmluaXQoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyB0ZWFyZG93bigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBhd2FpdCB0aGlzLmludGVybmFsX2Z1bmN0aW9ucy50ZWFyZG93bigpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZGl0aW9uYWxfZnVuY3Rpb25zKCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBhcHA6IHRoaXMucGx1Z2luLmFwcCxcclxuICAgICAgICAgICAgb2JzaWRpYW46IG9ic2lkaWFuX21vZHVsZSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdlbmVyYXRlX29iamVjdChcclxuICAgICAgICBjb25maWc6IFJ1bm5pbmdDb25maWcsXHJcbiAgICAgICAgZnVuY3Rpb25zX21vZGU6IEZ1bmN0aW9uc01vZGUgPSBGdW5jdGlvbnNNb2RlLlVTRVJfSU5URVJOQUxcclxuICAgICk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcclxuICAgICAgICBjb25zdCBmaW5hbF9vYmplY3QgPSB7fTtcclxuICAgICAgICBjb25zdCBhZGRpdGlvbmFsX2Z1bmN0aW9uc19vYmplY3QgPSB0aGlzLmFkZGl0aW9uYWxfZnVuY3Rpb25zKCk7XHJcbiAgICAgICAgY29uc3QgaW50ZXJuYWxfZnVuY3Rpb25zX29iamVjdCA9XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW50ZXJuYWxfZnVuY3Rpb25zLmdlbmVyYXRlX29iamVjdChjb25maWcpO1xyXG4gICAgICAgIGxldCB1c2VyX2Z1bmN0aW9uc19vYmplY3QgPSB7fTtcclxuXHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbihmaW5hbF9vYmplY3QsIGFkZGl0aW9uYWxfZnVuY3Rpb25zX29iamVjdCk7XHJcbiAgICAgICAgc3dpdGNoIChmdW5jdGlvbnNfbW9kZSkge1xyXG4gICAgICAgICAgICBjYXNlIEZ1bmN0aW9uc01vZGUuSU5URVJOQUw6XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGZpbmFsX29iamVjdCwgaW50ZXJuYWxfZnVuY3Rpb25zX29iamVjdCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBGdW5jdGlvbnNNb2RlLlVTRVJfSU5URVJOQUw6XHJcbiAgICAgICAgICAgICAgICB1c2VyX2Z1bmN0aW9uc19vYmplY3QgPVxyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMudXNlcl9mdW5jdGlvbnMuZ2VuZXJhdGVfb2JqZWN0KGNvbmZpZyk7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGZpbmFsX29iamVjdCwge1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLmludGVybmFsX2Z1bmN0aW9uc19vYmplY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlcjogdXNlcl9mdW5jdGlvbnNfb2JqZWN0LFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBmaW5hbF9vYmplY3Q7XHJcbiAgICB9XHJcbn1cclxuIl19