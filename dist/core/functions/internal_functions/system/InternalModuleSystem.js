import { __awaiter } from "tslib";
import { InternalModule } from "../InternalModule";
import { PromptModal } from "./PromptModal";
import { SuggesterModal } from "./SuggesterModal";
export class InternalModuleSystem extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "system";
    }
    create_static_templates() {
        return __awaiter(this, void 0, void 0, function* () {
            this.static_functions.set("clipboard", this.generate_clipboard());
            this.static_functions.set("prompt", this.generate_prompt());
            this.static_functions.set("suggester", this.generate_suggester());
        });
    }
    create_dynamic_templates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    teardown() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    generate_clipboard() {
        return () => __awaiter(this, void 0, void 0, function* () {
            return yield navigator.clipboard.readText();
        });
    }
    generate_prompt() {
        return (prompt_text, default_value, throw_on_cancel = false, multi_line = false) => __awaiter(this, void 0, void 0, function* () {
            const prompt = new PromptModal(this.plugin.app, prompt_text, default_value, multi_line);
            const promise = new Promise((resolve, reject) => prompt.openAndGetValue(resolve, reject));
            try {
                return yield promise;
            }
            catch (error) {
                if (throw_on_cancel) {
                    throw error;
                }
                return null;
            }
        });
    }
    generate_suggester() {
        return (text_items, items, throw_on_cancel = false, placeholder = "", limit) => __awaiter(this, void 0, void 0, function* () {
            const suggester = new SuggesterModal(this.plugin.app, text_items, items, placeholder, limit);
            const promise = new Promise((resolve, reject) => suggester.openAndGetValue(resolve, reject));
            try {
                return yield promise;
            }
            catch (error) {
                if (throw_on_cancel) {
                    throw error;
                }
                return null;
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJuYWxNb2R1bGVTeXN0ZW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9mdW5jdGlvbnMvaW50ZXJuYWxfZnVuY3Rpb25zL3N5c3RlbS9JbnRlcm5hbE1vZHVsZVN5c3RlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBSWxELE1BQU0sT0FBTyxvQkFBcUIsU0FBUSxjQUFjO0lBQXhEOztRQUNXLFNBQUksR0FBZSxRQUFRLENBQUM7SUEwRnZDLENBQUM7SUF4RlMsdUJBQXVCOztZQUN6QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQzVELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7UUFDdEUsQ0FBQztLQUFBO0lBRUssd0JBQXdCOzhEQUFtQixDQUFDO0tBQUE7SUFFNUMsUUFBUTs4REFBbUIsQ0FBQztLQUFBO0lBRWxDLGtCQUFrQjtRQUNkLE9BQU8sR0FBUyxFQUFFO1lBQ2QsT0FBTyxNQUFNLFNBQVMsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDaEQsQ0FBQyxDQUFBLENBQUM7SUFDTixDQUFDO0lBRUQsZUFBZTtRQU1YLE9BQU8sQ0FDSCxXQUFtQixFQUNuQixhQUFxQixFQUNyQixlQUFlLEdBQUcsS0FBSyxFQUN2QixVQUFVLEdBQUcsS0FBSyxFQUNJLEVBQUU7WUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxXQUFXLENBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUNmLFdBQVcsRUFDWCxhQUFhLEVBQ2IsVUFBVSxDQUNiLENBQUM7WUFDRixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FDdkIsQ0FDSSxPQUFnQyxFQUNoQyxNQUF5QyxFQUMzQyxFQUFFLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQy9DLENBQUM7WUFDRixJQUFJO2dCQUNBLE9BQU8sTUFBTSxPQUFPLENBQUM7YUFDeEI7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWixJQUFJLGVBQWUsRUFBRTtvQkFDakIsTUFBTSxLQUFLLENBQUM7aUJBQ2Y7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7YUFDZjtRQUNMLENBQUMsQ0FBQSxDQUFDO0lBQ04sQ0FBQztJQUVELGtCQUFrQjtRQU9kLE9BQU8sQ0FDSCxVQUE0QyxFQUM1QyxLQUFVLEVBQ1YsZUFBZSxHQUFHLEtBQUssRUFDdkIsV0FBVyxHQUFHLEVBQUUsRUFDaEIsS0FBYyxFQUNKLEVBQUU7WUFDWixNQUFNLFNBQVMsR0FBRyxJQUFJLGNBQWMsQ0FDaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQ2YsVUFBVSxFQUNWLEtBQUssRUFDTCxXQUFXLEVBQ1gsS0FBSyxDQUNSLENBQUM7WUFDRixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FDdkIsQ0FDSSxPQUEyQixFQUMzQixNQUF5QyxFQUMzQyxFQUFFLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQ2xELENBQUM7WUFDRixJQUFJO2dCQUNBLE9BQU8sTUFBTSxPQUFPLENBQUM7YUFDeEI7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDWixJQUFJLGVBQWUsRUFBRTtvQkFDakIsTUFBTSxLQUFLLENBQUM7aUJBQ2Y7Z0JBQ0QsT0FBTyxJQUFTLENBQUM7YUFDcEI7UUFDTCxDQUFDLENBQUEsQ0FBQztJQUNOLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEludGVybmFsTW9kdWxlIH0gZnJvbSBcIi4uL0ludGVybmFsTW9kdWxlXCI7XHJcbmltcG9ydCB7IFByb21wdE1vZGFsIH0gZnJvbSBcIi4vUHJvbXB0TW9kYWxcIjtcclxuaW1wb3J0IHsgU3VnZ2VzdGVyTW9kYWwgfSBmcm9tIFwiLi9TdWdnZXN0ZXJNb2RhbFwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5pbXBvcnQgeyBNb2R1bGVOYW1lIH0gZnJvbSBcImVkaXRvci9UcERvY3VtZW50YXRpb25cIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBJbnRlcm5hbE1vZHVsZVN5c3RlbSBleHRlbmRzIEludGVybmFsTW9kdWxlIHtcclxuICAgIHB1YmxpYyBuYW1lOiBNb2R1bGVOYW1lID0gXCJzeXN0ZW1cIjtcclxuXHJcbiAgICBhc3luYyBjcmVhdGVfc3RhdGljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwiY2xpcGJvYXJkXCIsIHRoaXMuZ2VuZXJhdGVfY2xpcGJvYXJkKCkpO1xyXG4gICAgICAgIHRoaXMuc3RhdGljX2Z1bmN0aW9ucy5zZXQoXCJwcm9tcHRcIiwgdGhpcy5nZW5lcmF0ZV9wcm9tcHQoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcInN1Z2dlc3RlclwiLCB0aGlzLmdlbmVyYXRlX3N1Z2dlc3RlcigpKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBjcmVhdGVfZHluYW1pY190ZW1wbGF0ZXMoKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICAgIGFzeW5jIHRlYXJkb3duKCk6IFByb21pc2U8dm9pZD4ge31cclxuXHJcbiAgICBnZW5lcmF0ZV9jbGlwYm9hcmQoKTogKCkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQucmVhZFRleHQoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX3Byb21wdCgpOiAoXHJcbiAgICAgICAgcHJvbXB0X3RleHQ6IHN0cmluZyxcclxuICAgICAgICBkZWZhdWx0X3ZhbHVlOiBzdHJpbmcsXHJcbiAgICAgICAgdGhyb3dfb25fY2FuY2VsOiBib29sZWFuLFxyXG4gICAgICAgIG11bHRpX2xpbmU6IGJvb2xlYW5cclxuICAgICkgPT4gUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcclxuICAgICAgICAgICAgcHJvbXB0X3RleHQ6IHN0cmluZyxcclxuICAgICAgICAgICAgZGVmYXVsdF92YWx1ZTogc3RyaW5nLFxyXG4gICAgICAgICAgICB0aHJvd19vbl9jYW5jZWwgPSBmYWxzZSxcclxuICAgICAgICAgICAgbXVsdGlfbGluZSA9IGZhbHNlXHJcbiAgICAgICAgKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb21wdCA9IG5ldyBQcm9tcHRNb2RhbChcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcCxcclxuICAgICAgICAgICAgICAgIHByb21wdF90ZXh0LFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdF92YWx1ZSxcclxuICAgICAgICAgICAgICAgIG11bHRpX2xpbmVcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKFxyXG4gICAgICAgICAgICAgICAgKFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmU6ICh2YWx1ZTogc3RyaW5nKSA9PiB2b2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdDogKHJlYXNvbj86IFRlbXBsYXRlckVycm9yKSA9PiB2b2lkXHJcbiAgICAgICAgICAgICAgICApID0+IHByb21wdC5vcGVuQW5kR2V0VmFsdWUocmVzb2x2ZSwgcmVqZWN0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHByb21pc2U7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhyb3dfb25fY2FuY2VsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVfc3VnZ2VzdGVyKCk6IDxUPihcclxuICAgICAgICB0ZXh0X2l0ZW1zOiBzdHJpbmdbXSB8ICgoaXRlbTogVCkgPT4gc3RyaW5nKSxcclxuICAgICAgICBpdGVtczogVFtdLFxyXG4gICAgICAgIHRocm93X29uX2NhbmNlbDogYm9vbGVhbixcclxuICAgICAgICBwbGFjZWhvbGRlcjogc3RyaW5nLFxyXG4gICAgICAgIGxpbWl0PzogbnVtYmVyXHJcbiAgICApID0+IFByb21pc2U8VD4ge1xyXG4gICAgICAgIHJldHVybiBhc3luYyA8VD4oXHJcbiAgICAgICAgICAgIHRleHRfaXRlbXM6IHN0cmluZ1tdIHwgKChpdGVtOiBUKSA9PiBzdHJpbmcpLFxyXG4gICAgICAgICAgICBpdGVtczogVFtdLFxyXG4gICAgICAgICAgICB0aHJvd19vbl9jYW5jZWwgPSBmYWxzZSxcclxuICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSBcIlwiLFxyXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlclxyXG4gICAgICAgICk6IFByb21pc2U8VD4gPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBzdWdnZXN0ZXIgPSBuZXcgU3VnZ2VzdGVyTW9kYWwoXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXHJcbiAgICAgICAgICAgICAgICB0ZXh0X2l0ZW1zLFxyXG4gICAgICAgICAgICAgICAgaXRlbXMsXHJcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcixcclxuICAgICAgICAgICAgICAgIGxpbWl0XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShcclxuICAgICAgICAgICAgICAgIChcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiAodmFsdWU6IFQpID0+IHZvaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0OiAocmVhc29uPzogVGVtcGxhdGVyRXJyb3IpID0+IHZvaWRcclxuICAgICAgICAgICAgICAgICkgPT4gc3VnZ2VzdGVyLm9wZW5BbmRHZXRWYWx1ZShyZXNvbHZlLCByZWplY3QpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgcHJvbWlzZTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aHJvd19vbl9jYW5jZWwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsIGFzIFQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbiJdfQ==