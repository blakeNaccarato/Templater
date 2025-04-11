import { __awaiter } from "tslib";
import { addIcon, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, TemplaterSettingTab, } from "settings/Settings";
import { FuzzySuggester } from "handlers/FuzzySuggester";
import { ICON_DATA } from "utils/Constants";
import { Templater } from "core/Templater";
import EventHandler from "handlers/EventHandler";
import { CommandHandler } from "handlers/CommandHandler";
import { Editor } from "editor/Editor";
export default class TemplaterPlugin extends Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.load_settings();
            this.templater = new Templater(this);
            yield this.templater.setup();
            this.editor_handler = new Editor(this);
            yield this.editor_handler.setup();
            this.fuzzy_suggester = new FuzzySuggester(this);
            this.event_handler = new EventHandler(this, this.templater, this.settings);
            this.event_handler.setup();
            this.command_handler = new CommandHandler(this);
            this.command_handler.setup();
            addIcon("templater-icon", ICON_DATA);
            this.addRibbonIcon("templater-icon", "Templater", () => __awaiter(this, void 0, void 0, function* () {
                this.fuzzy_suggester.insert_template();
            })).setAttribute("id", "rb-templater-icon");
            this.addSettingTab(new TemplaterSettingTab(this));
            // Files might not be created yet
            this.app.workspace.onLayoutReady(() => {
                this.templater.execute_startup_scripts();
            });
        });
    }
    onunload() {
        // Failsafe in case teardown doesn't happen immediately after template execution
        this.templater.functions_generator.teardown();
    }
    save_settings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
            this.editor_handler.updateEditorIntellisenseSetting(this.settings.intellisense_render);
        });
    }
    load_settings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUUzQyxPQUFPLEVBQ0gsZ0JBQWdCLEVBRWhCLG1CQUFtQixHQUN0QixNQUFNLG1CQUFtQixDQUFDO0FBQzNCLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDNUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzNDLE9BQU8sWUFBWSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN6RCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXZDLE1BQU0sQ0FBQyxPQUFPLE9BQU8sZUFBZ0IsU0FBUSxNQUFNO0lBUXpDLE1BQU07O1lBQ1IsTUFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFM0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFN0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFbEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVoRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksWUFBWSxDQUNqQyxJQUFJLEVBQ0osSUFBSSxDQUFDLFNBQVMsRUFDZCxJQUFJLENBQUMsUUFBUSxDQUNoQixDQUFDO1lBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUUzQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFN0IsT0FBTyxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLEdBQVMsRUFBRTtnQkFDekQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUMzQyxDQUFDLENBQUEsQ0FBQyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztZQUUzQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVsRCxpQ0FBaUM7WUFDakMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRTtnQkFDbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzdDLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUFBO0lBRUQsUUFBUTtRQUNKLGdGQUFnRjtRQUNoRixJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ2xELENBQUM7SUFFSyxhQUFhOztZQUNmLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLGNBQWMsQ0FBQywrQkFBK0IsQ0FDL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FDcEMsQ0FBQztRQUNOLENBQUM7S0FBQTtJQUVLLGFBQWE7O1lBQ2YsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUN6QixFQUFFLEVBQ0YsZ0JBQWdCLEVBQ2hCLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUN4QixDQUFDO1FBQ04sQ0FBQztLQUFBO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhZGRJY29uLCBQbHVnaW4gfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuXHJcbmltcG9ydCB7XHJcbiAgICBERUZBVUxUX1NFVFRJTkdTLFxyXG4gICAgU2V0dGluZ3MsXHJcbiAgICBUZW1wbGF0ZXJTZXR0aW5nVGFiLFxyXG59IGZyb20gXCJzZXR0aW5ncy9TZXR0aW5nc1wiO1xyXG5pbXBvcnQgeyBGdXp6eVN1Z2dlc3RlciB9IGZyb20gXCJoYW5kbGVycy9GdXp6eVN1Z2dlc3RlclwiO1xyXG5pbXBvcnQgeyBJQ09OX0RBVEEgfSBmcm9tIFwidXRpbHMvQ29uc3RhbnRzXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlciB9IGZyb20gXCJjb3JlL1RlbXBsYXRlclwiO1xyXG5pbXBvcnQgRXZlbnRIYW5kbGVyIGZyb20gXCJoYW5kbGVycy9FdmVudEhhbmRsZXJcIjtcclxuaW1wb3J0IHsgQ29tbWFuZEhhbmRsZXIgfSBmcm9tIFwiaGFuZGxlcnMvQ29tbWFuZEhhbmRsZXJcIjtcclxuaW1wb3J0IHsgRWRpdG9yIH0gZnJvbSBcImVkaXRvci9FZGl0b3JcIjtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRlbXBsYXRlclBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XHJcbiAgICBwdWJsaWMgc2V0dGluZ3M6IFNldHRpbmdzO1xyXG4gICAgcHVibGljIHRlbXBsYXRlcjogVGVtcGxhdGVyO1xyXG4gICAgcHVibGljIGV2ZW50X2hhbmRsZXI6IEV2ZW50SGFuZGxlcjtcclxuICAgIHB1YmxpYyBjb21tYW5kX2hhbmRsZXI6IENvbW1hbmRIYW5kbGVyO1xyXG4gICAgcHVibGljIGZ1enp5X3N1Z2dlc3RlcjogRnV6enlTdWdnZXN0ZXI7XHJcbiAgICBwdWJsaWMgZWRpdG9yX2hhbmRsZXI6IEVkaXRvcjtcclxuXHJcbiAgICBhc3luYyBvbmxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5sb2FkX3NldHRpbmdzKCk7XHJcblxyXG4gICAgICAgIHRoaXMudGVtcGxhdGVyID0gbmV3IFRlbXBsYXRlcih0aGlzKTtcclxuICAgICAgICBhd2FpdCB0aGlzLnRlbXBsYXRlci5zZXR1cCgpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvcl9oYW5kbGVyID0gbmV3IEVkaXRvcih0aGlzKTtcclxuICAgICAgICBhd2FpdCB0aGlzLmVkaXRvcl9oYW5kbGVyLnNldHVwKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZnV6enlfc3VnZ2VzdGVyID0gbmV3IEZ1enp5U3VnZ2VzdGVyKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLmV2ZW50X2hhbmRsZXIgPSBuZXcgRXZlbnRIYW5kbGVyKFxyXG4gICAgICAgICAgICB0aGlzLFxyXG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlcixcclxuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncyxcclxuICAgICAgICApO1xyXG4gICAgICAgIHRoaXMuZXZlbnRfaGFuZGxlci5zZXR1cCgpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbW1hbmRfaGFuZGxlciA9IG5ldyBDb21tYW5kSGFuZGxlcih0aGlzKTtcclxuICAgICAgICB0aGlzLmNvbW1hbmRfaGFuZGxlci5zZXR1cCgpO1xyXG5cclxuICAgICAgICBhZGRJY29uKFwidGVtcGxhdGVyLWljb25cIiwgSUNPTl9EQVRBKTtcclxuICAgICAgICB0aGlzLmFkZFJpYmJvbkljb24oXCJ0ZW1wbGF0ZXItaWNvblwiLCBcIlRlbXBsYXRlclwiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuZnV6enlfc3VnZ2VzdGVyLmluc2VydF90ZW1wbGF0ZSgpO1xyXG4gICAgICAgIH0pLnNldEF0dHJpYnV0ZShcImlkXCIsIFwicmItdGVtcGxhdGVyLWljb25cIik7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgVGVtcGxhdGVyU2V0dGluZ1RhYih0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIEZpbGVzIG1pZ2h0IG5vdCBiZSBjcmVhdGVkIHlldFxyXG4gICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbkxheW91dFJlYWR5KCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZXIuZXhlY3V0ZV9zdGFydHVwX3NjcmlwdHMoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvbnVubG9hZCgpOiB2b2lkIHtcclxuICAgICAgICAvLyBGYWlsc2FmZSBpbiBjYXNlIHRlYXJkb3duIGRvZXNuJ3QgaGFwcGVuIGltbWVkaWF0ZWx5IGFmdGVyIHRlbXBsYXRlIGV4ZWN1dGlvblxyXG4gICAgICAgIHRoaXMudGVtcGxhdGVyLmZ1bmN0aW9uc19nZW5lcmF0b3IudGVhcmRvd24oKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzYXZlX3NldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XHJcbiAgICAgICAgdGhpcy5lZGl0b3JfaGFuZGxlci51cGRhdGVFZGl0b3JJbnRlbGxpc2Vuc2VTZXR0aW5nKFxyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLmludGVsbGlzZW5zZV9yZW5kZXIsXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkX3NldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKFxyXG4gICAgICAgICAgICB7fSxcclxuICAgICAgICAgICAgREVGQVVMVF9TRVRUSU5HUyxcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkRGF0YSgpLFxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuIl19