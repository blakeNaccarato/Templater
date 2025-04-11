import { __awaiter } from "tslib";
import { InternalModuleDate } from "./date/InternalModuleDate";
import { InternalModuleFile } from "./file/InternalModuleFile";
import { InternalModuleWeb } from "./web/InternalModuleWeb";
import { InternalModuleHooks } from "./hooks/InternalModuleHooks";
import { InternalModuleFrontmatter } from "./frontmatter/InternalModuleFrontmatter";
import { InternalModuleSystem } from "./system/InternalModuleSystem";
import { InternalModuleConfig } from "./config/InternalModuleConfig";
export class InternalFunctions {
    constructor(plugin) {
        this.plugin = plugin;
        this.modules_array = [];
        this.modules_array.push(new InternalModuleDate(this.plugin));
        this.modules_array.push(new InternalModuleFile(this.plugin));
        this.modules_array.push(new InternalModuleWeb(this.plugin));
        this.modules_array.push(new InternalModuleFrontmatter(this.plugin));
        this.modules_array.push(new InternalModuleHooks(this.plugin));
        this.modules_array.push(new InternalModuleSystem(this.plugin));
        this.modules_array.push(new InternalModuleConfig(this.plugin));
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const mod of this.modules_array) {
                yield mod.init();
            }
        });
    }
    teardown() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const mod of this.modules_array) {
                yield mod.teardown();
            }
        });
    }
    generate_object(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const internal_functions_object = {};
            for (const mod of this.modules_array) {
                internal_functions_object[mod.getName()] =
                    yield mod.generate_object(config);
            }
            return internal_functions_object;
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJuYWxGdW5jdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY29yZS9mdW5jdGlvbnMvaW50ZXJuYWxfZnVuY3Rpb25zL0ludGVybmFsRnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFHQSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUMvRCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUMvRCxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUM1RCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUNsRSxPQUFPLEVBQUUseUJBQXlCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUNwRixPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUVyRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUVyRSxNQUFNLE9BQU8saUJBQWlCO0lBRzFCLFlBQXNCLE1BQXVCO1FBQXZCLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBRnJDLGtCQUFhLEdBQTBCLEVBQUUsQ0FBQztRQUc5QyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM1RCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLHlCQUF5QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUMvRCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFSyxJQUFJOztZQUNOLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtnQkFDbEMsTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDcEI7UUFDTCxDQUFDO0tBQUE7SUFFSyxRQUFROztZQUNWLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtnQkFDbEMsTUFBTSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDeEI7UUFDTCxDQUFDO0tBQUE7SUFFSyxlQUFlLENBQ2pCLE1BQXFCOztZQUVyQixNQUFNLHlCQUF5QixHQUErQixFQUFFLENBQUM7WUFFakUsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUNsQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3BDLE1BQU0sR0FBRyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN6QztZQUVELE9BQU8seUJBQXlCLENBQUM7UUFDckMsQ0FBQztLQUFBO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IElHZW5lcmF0ZU9iamVjdCB9IGZyb20gXCJjb3JlL2Z1bmN0aW9ucy9JR2VuZXJhdGVPYmplY3RcIjtcclxuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGUgfSBmcm9tIFwiLi9JbnRlcm5hbE1vZHVsZVwiO1xyXG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZURhdGUgfSBmcm9tIFwiLi9kYXRlL0ludGVybmFsTW9kdWxlRGF0ZVwiO1xyXG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZUZpbGUgfSBmcm9tIFwiLi9maWxlL0ludGVybmFsTW9kdWxlRmlsZVwiO1xyXG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZVdlYiB9IGZyb20gXCIuL3dlYi9JbnRlcm5hbE1vZHVsZVdlYlwiO1xyXG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZUhvb2tzIH0gZnJvbSBcIi4vaG9va3MvSW50ZXJuYWxNb2R1bGVIb29rc1wiO1xyXG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZUZyb250bWF0dGVyIH0gZnJvbSBcIi4vZnJvbnRtYXR0ZXIvSW50ZXJuYWxNb2R1bGVGcm9udG1hdHRlclwiO1xyXG5pbXBvcnQgeyBJbnRlcm5hbE1vZHVsZVN5c3RlbSB9IGZyb20gXCIuL3N5c3RlbS9JbnRlcm5hbE1vZHVsZVN5c3RlbVwiO1xyXG5pbXBvcnQgeyBSdW5uaW5nQ29uZmlnIH0gZnJvbSBcImNvcmUvVGVtcGxhdGVyXCI7XHJcbmltcG9ydCB7IEludGVybmFsTW9kdWxlQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnL0ludGVybmFsTW9kdWxlQ29uZmlnXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxGdW5jdGlvbnMgaW1wbGVtZW50cyBJR2VuZXJhdGVPYmplY3Qge1xyXG4gICAgcHJpdmF0ZSBtb2R1bGVzX2FycmF5OiBBcnJheTxJbnRlcm5hbE1vZHVsZT4gPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcclxuICAgICAgICB0aGlzLm1vZHVsZXNfYXJyYXkucHVzaChuZXcgSW50ZXJuYWxNb2R1bGVEYXRlKHRoaXMucGx1Z2luKSk7XHJcbiAgICAgICAgdGhpcy5tb2R1bGVzX2FycmF5LnB1c2gobmV3IEludGVybmFsTW9kdWxlRmlsZSh0aGlzLnBsdWdpbikpO1xyXG4gICAgICAgIHRoaXMubW9kdWxlc19hcnJheS5wdXNoKG5ldyBJbnRlcm5hbE1vZHVsZVdlYih0aGlzLnBsdWdpbikpO1xyXG4gICAgICAgIHRoaXMubW9kdWxlc19hcnJheS5wdXNoKG5ldyBJbnRlcm5hbE1vZHVsZUZyb250bWF0dGVyKHRoaXMucGx1Z2luKSk7XHJcbiAgICAgICAgdGhpcy5tb2R1bGVzX2FycmF5LnB1c2gobmV3IEludGVybmFsTW9kdWxlSG9va3ModGhpcy5wbHVnaW4pKTtcclxuICAgICAgICB0aGlzLm1vZHVsZXNfYXJyYXkucHVzaChuZXcgSW50ZXJuYWxNb2R1bGVTeXN0ZW0odGhpcy5wbHVnaW4pKTtcclxuICAgICAgICB0aGlzLm1vZHVsZXNfYXJyYXkucHVzaChuZXcgSW50ZXJuYWxNb2R1bGVDb25maWcodGhpcy5wbHVnaW4pKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBpbml0KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGZvciAoY29uc3QgbW9kIG9mIHRoaXMubW9kdWxlc19hcnJheSkge1xyXG4gICAgICAgICAgICBhd2FpdCBtb2QuaW5pdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyB0ZWFyZG93bigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBmb3IgKGNvbnN0IG1vZCBvZiB0aGlzLm1vZHVsZXNfYXJyYXkpIHtcclxuICAgICAgICAgICAgYXdhaXQgbW9kLnRlYXJkb3duKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdlbmVyYXRlX29iamVjdChcclxuICAgICAgICBjb25maWc6IFJ1bm5pbmdDb25maWdcclxuICAgICk6IFByb21pc2U8UmVjb3JkPHN0cmluZywgdW5rbm93bj4+IHtcclxuICAgICAgICBjb25zdCBpbnRlcm5hbF9mdW5jdGlvbnNfb2JqZWN0OiB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSA9IHt9O1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IG1vZCBvZiB0aGlzLm1vZHVsZXNfYXJyYXkpIHtcclxuICAgICAgICAgICAgaW50ZXJuYWxfZnVuY3Rpb25zX29iamVjdFttb2QuZ2V0TmFtZSgpXSA9XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBtb2QuZ2VuZXJhdGVfb2JqZWN0KGNvbmZpZyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaW50ZXJuYWxfZnVuY3Rpb25zX29iamVjdDtcclxuICAgIH1cclxufVxyXG4iXX0=