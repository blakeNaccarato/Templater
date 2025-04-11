import { Templater } from "core/Templater";
import { TFolder, } from "obsidian";
export default class EventHandler {
    constructor(plugin, templater, settings) {
        this.plugin = plugin;
        this.templater = templater;
        this.settings = settings;
    }
    setup() {
        if (Array.isArray(this.plugin.app.workspace.onLayoutReadyCallbacks)) {
            // Use onLayoutReadyCallbacks instead of onLayoutReady
            // to ensure that the event is registered before core plugin events (e.g. daily notes autorun)
            this.plugin.app.workspace.onLayoutReadyCallbacks.push({
                pluginId: this.plugin.manifest.id,
                callback: () => {
                    this.update_trigger_file_on_creation();
                },
            });
        }
        else {
            // Fallback to onLayoutReady if onLayoutReadyCallbacks is not available
            this.plugin.app.workspace.onLayoutReady(() => {
                this.update_trigger_file_on_creation();
            });
        }
        this.update_syntax_highlighting();
        this.update_file_menu();
    }
    update_syntax_highlighting() {
        const desktopShouldHighlight = this.plugin.editor_handler.desktopShouldHighlight();
        const mobileShouldHighlight = this.plugin.editor_handler.mobileShouldHighlight();
        if (desktopShouldHighlight || mobileShouldHighlight) {
            this.plugin.editor_handler.enable_highlighter();
        }
        else {
            this.plugin.editor_handler.disable_highlighter();
        }
    }
    update_trigger_file_on_creation() {
        if (this.settings.trigger_on_file_creation) {
            this.trigger_on_file_creation_event = this.plugin.app.vault.on("create", (file) => Templater.on_file_creation(this.templater, this.plugin.app, file));
            this.plugin.registerEvent(this.trigger_on_file_creation_event);
        }
        else {
            if (this.trigger_on_file_creation_event) {
                this.plugin.app.vault.offref(this.trigger_on_file_creation_event);
                this.trigger_on_file_creation_event = undefined;
            }
        }
    }
    update_file_menu() {
        this.plugin.registerEvent(this.plugin.app.workspace.on("file-menu", (menu, file) => {
            if (file instanceof TFolder) {
                menu.addItem((item) => {
                    item.setTitle("Create new note from template")
                        .setIcon("templater-icon")
                        .onClick(() => {
                        this.plugin.fuzzy_suggester.create_new_note_from_template(file);
                    });
                });
            }
        }));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2hhbmRsZXJzL0V2ZW50SGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFM0MsT0FBTyxFQU1ILE9BQU8sR0FDVixNQUFNLFVBQVUsQ0FBQztBQUVsQixNQUFNLENBQUMsT0FBTyxPQUFPLFlBQVk7SUFHN0IsWUFDWSxNQUF1QixFQUN2QixTQUFvQixFQUNwQixRQUFrQjtRQUZsQixXQUFNLEdBQU4sTUFBTSxDQUFpQjtRQUN2QixjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQ3BCLGFBQVEsR0FBUixRQUFRLENBQVU7SUFDM0IsQ0FBQztJQUVKLEtBQUs7UUFDRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLHNCQUFzQixDQUFDLEVBQUU7WUFDakUsc0RBQXNEO1lBQ3RELDhGQUE4RjtZQUM5RixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDO2dCQUNsRCxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDakMsUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFDWCxJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQztnQkFDM0MsQ0FBQzthQUNKLENBQUMsQ0FBQztTQUNOO2FBQU07WUFDSCx1RUFBdUU7WUFDdkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUU7Z0JBQ3pDLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDO1lBQzNDLENBQUMsQ0FBQyxDQUFDO1NBQ047UUFDRCxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUNsQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRUQsMEJBQTBCO1FBQ3RCLE1BQU0sc0JBQXNCLEdBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDeEQsTUFBTSxxQkFBcUIsR0FDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUV2RCxJQUFJLHNCQUFzQixJQUFJLHFCQUFxQixFQUFFO1lBQ2pELElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLGtCQUFrQixFQUFFLENBQUM7U0FDbkQ7YUFBTTtZQUNILElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLG1CQUFtQixFQUFFLENBQUM7U0FDcEQ7SUFDTCxDQUFDO0lBRUQsK0JBQStCO1FBQzNCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRTtZQUN4QyxJQUFJLENBQUMsOEJBQThCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDMUQsUUFBUSxFQUNSLENBQUMsSUFBbUIsRUFBRSxFQUFFLENBQ3BCLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FDdEIsSUFBSSxDQUFDLFNBQVMsRUFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFDZixJQUFJLENBQ1AsQ0FDUixDQUFDO1lBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7U0FDbEU7YUFBTTtZQUNILElBQUksSUFBSSxDQUFDLDhCQUE4QixFQUFFO2dCQUNyQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUN4QixJQUFJLENBQUMsOEJBQThCLENBQ3RDLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLDhCQUE4QixHQUFHLFNBQVMsQ0FBQzthQUNuRDtTQUNKO0lBQ0wsQ0FBQztJQUVELGdCQUFnQjtRQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUN4QixXQUFXLEVBQ1gsQ0FBQyxJQUFVLEVBQUUsSUFBVyxFQUFFLEVBQUU7WUFDeEIsSUFBSSxJQUFJLFlBQVksT0FBTyxFQUFFO2dCQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBYyxFQUFFLEVBQUU7b0JBQzVCLElBQUksQ0FBQyxRQUFRLENBQUMsK0JBQStCLENBQUM7eUJBQ3pDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzt5QkFDekIsT0FBTyxDQUFDLEdBQUcsRUFBRTt3QkFDVixJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyw2QkFBNkIsQ0FDckQsSUFBSSxDQUNQLENBQUM7b0JBQ04sQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsQ0FBQyxDQUFDLENBQUM7YUFDTjtRQUNMLENBQUMsQ0FDSixDQUNKLENBQUM7SUFDTixDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlciB9IGZyb20gXCJjb3JlL1RlbXBsYXRlclwiO1xyXG5pbXBvcnQgeyBTZXR0aW5ncyB9IGZyb20gXCJzZXR0aW5ncy9TZXR0aW5nc1wiO1xyXG5pbXBvcnQge1xyXG4gICAgRXZlbnRSZWYsXHJcbiAgICBNZW51LFxyXG4gICAgTWVudUl0ZW0sXHJcbiAgICBUQWJzdHJhY3RGaWxlLFxyXG4gICAgVEZpbGUsXHJcbiAgICBURm9sZGVyLFxyXG59IGZyb20gXCJvYnNpZGlhblwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXZlbnRIYW5kbGVyIHtcclxuICAgIHByaXZhdGUgdHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uX2V2ZW50OiBFdmVudFJlZiB8IHVuZGVmaW5lZDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwcml2YXRlIHBsdWdpbjogVGVtcGxhdGVyUGx1Z2luLFxyXG4gICAgICAgIHByaXZhdGUgdGVtcGxhdGVyOiBUZW1wbGF0ZXIsXHJcbiAgICAgICAgcHJpdmF0ZSBzZXR0aW5nczogU2V0dGluZ3NcclxuICAgICkge31cclxuXHJcbiAgICBzZXR1cCgpOiB2b2lkIHtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHlDYWxsYmFja3MpKSB7XHJcbiAgICAgICAgICAgIC8vIFVzZSBvbkxheW91dFJlYWR5Q2FsbGJhY2tzIGluc3RlYWQgb2Ygb25MYXlvdXRSZWFkeVxyXG4gICAgICAgICAgICAvLyB0byBlbnN1cmUgdGhhdCB0aGUgZXZlbnQgaXMgcmVnaXN0ZXJlZCBiZWZvcmUgY29yZSBwbHVnaW4gZXZlbnRzIChlLmcuIGRhaWx5IG5vdGVzIGF1dG9ydW4pXHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub25MYXlvdXRSZWFkeUNhbGxiYWNrcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHBsdWdpbklkOiB0aGlzLnBsdWdpbi5tYW5pZmVzdC5pZCxcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVfdHJpZ2dlcl9maWxlX29uX2NyZWF0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBGYWxsYmFjayB0byBvbkxheW91dFJlYWR5IGlmIG9uTGF5b3V0UmVhZHlDYWxsYmFja3MgaXMgbm90IGF2YWlsYWJsZVxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHkoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVfdHJpZ2dlcl9maWxlX29uX2NyZWF0aW9uKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZV9zeW50YXhfaGlnaGxpZ2h0aW5nKCk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVfZmlsZV9tZW51KCk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlX3N5bnRheF9oaWdobGlnaHRpbmcoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgZGVza3RvcFNob3VsZEhpZ2hsaWdodCA9XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmVkaXRvcl9oYW5kbGVyLmRlc2t0b3BTaG91bGRIaWdobGlnaHQoKTtcclxuICAgICAgICBjb25zdCBtb2JpbGVTaG91bGRIaWdobGlnaHQgPVxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5lZGl0b3JfaGFuZGxlci5tb2JpbGVTaG91bGRIaWdobGlnaHQoKTtcclxuXHJcbiAgICAgICAgaWYgKGRlc2t0b3BTaG91bGRIaWdobGlnaHQgfHwgbW9iaWxlU2hvdWxkSGlnaGxpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmVkaXRvcl9oYW5kbGVyLmVuYWJsZV9oaWdobGlnaHRlcigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLmVkaXRvcl9oYW5kbGVyLmRpc2FibGVfaGlnaGxpZ2h0ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlX3RyaWdnZXJfZmlsZV9vbl9jcmVhdGlvbigpOiB2b2lkIHtcclxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy50cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb24pIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb25fZXZlbnQgPSB0aGlzLnBsdWdpbi5hcHAudmF1bHQub24oXHJcbiAgICAgICAgICAgICAgICBcImNyZWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgKGZpbGU6IFRBYnN0cmFjdEZpbGUpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgVGVtcGxhdGVyLm9uX2ZpbGVfY3JlYXRpb24oXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGVtcGxhdGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnJlZ2lzdGVyRXZlbnQodGhpcy50cmlnZ2VyX29uX2ZpbGVfY3JlYXRpb25fZXZlbnQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbl9ldmVudCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLnZhdWx0Lm9mZnJlZihcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJfb25fZmlsZV9jcmVhdGlvbl9ldmVudFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcl9vbl9maWxlX2NyZWF0aW9uX2V2ZW50ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZV9maWxlX21lbnUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4ucmVnaXN0ZXJFdmVudChcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5vbihcclxuICAgICAgICAgICAgICAgIFwiZmlsZS1tZW51XCIsXHJcbiAgICAgICAgICAgICAgICAobWVudTogTWVudSwgZmlsZTogVEZpbGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zZXRUaXRsZShcIkNyZWF0ZSBuZXcgbm90ZSBmcm9tIHRlbXBsYXRlXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJ0ZW1wbGF0ZXItaWNvblwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZnV6enlfc3VnZ2VzdGVyLmNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==