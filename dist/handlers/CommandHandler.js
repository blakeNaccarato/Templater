import { Platform } from "obsidian";
import { errorWrapperSync } from "utils/Error";
import { resolve_tfile } from "utils/Utils";
export class CommandHandler {
    constructor(plugin) {
        this.plugin = plugin;
    }
    setup() {
        this.plugin.addCommand({
            id: "insert-templater",
            name: "Open insert template modal",
            icon: "templater-icon",
            hotkeys: Platform.isMacOS
                ? undefined
                : [
                    {
                        modifiers: ["Alt"],
                        key: "e",
                    },
                ],
            callback: () => {
                this.plugin.fuzzy_suggester.insert_template();
            },
        });
        this.plugin.addCommand({
            id: "replace-in-file-templater",
            name: "Replace templates in the active file",
            icon: "templater-icon",
            hotkeys: Platform.isMacOS
                ? undefined
                : [
                    {
                        modifiers: ["Alt"],
                        key: "r",
                    },
                ],
            callback: () => {
                this.plugin.templater.overwrite_active_file_commands();
            },
        });
        this.plugin.addCommand({
            id: "jump-to-next-cursor-location",
            name: "Jump to next cursor location",
            icon: "text-cursor",
            hotkeys: [
                {
                    modifiers: ["Alt"],
                    key: "Tab",
                },
            ],
            callback: () => {
                this.plugin.editor_handler.jump_to_next_cursor_location();
            },
        });
        this.plugin.addCommand({
            id: "create-new-note-from-template",
            name: "Create new note from template",
            icon: "templater-icon",
            hotkeys: Platform.isMacOS
                ? undefined
                : [
                    {
                        modifiers: ["Alt"],
                        key: "n",
                    },
                ],
            callback: () => {
                this.plugin.fuzzy_suggester.create_new_note_from_template();
            },
        });
        this.register_templates_hotkeys();
    }
    register_templates_hotkeys() {
        this.plugin.settings.enabled_templates_hotkeys.forEach((template) => {
            if (template) {
                this.add_template_hotkey(null, template);
            }
        });
    }
    add_template_hotkey(old_template, new_template) {
        this.remove_template_hotkey(old_template);
        if (new_template) {
            this.plugin.addCommand({
                id: new_template,
                name: `Insert ${new_template}`,
                icon: "templater-icon",
                callback: () => {
                    const template = errorWrapperSync(() => resolve_tfile(this.plugin.app, new_template), `Couldn't find the template file associated with this hotkey`);
                    if (!template) {
                        return;
                    }
                    this.plugin.templater.append_template_to_active_file(template);
                },
            });
            this.plugin.addCommand({
                id: `create-${new_template}`,
                name: `Create ${new_template}`,
                icon: "templater-icon",
                callback: () => {
                    const template = errorWrapperSync(() => resolve_tfile(this.plugin.app, new_template), `Couldn't find the template file associated with this hotkey`);
                    if (!template) {
                        return;
                    }
                    this.plugin.templater.create_new_note_from_template(template);
                },
            });
        }
    }
    remove_template_hotkey(template) {
        if (template) {
            this.plugin.removeCommand(`${template}`);
            this.plugin.removeCommand(`create-${template}`);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tbWFuZEhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaGFuZGxlcnMvQ29tbWFuZEhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUNwQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDL0MsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUU1QyxNQUFNLE9BQU8sY0FBYztJQUN2QixZQUFvQixNQUF1QjtRQUF2QixXQUFNLEdBQU4sTUFBTSxDQUFpQjtJQUFHLENBQUM7SUFFL0MsS0FBSztRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDO1lBQ25CLEVBQUUsRUFBRSxrQkFBa0I7WUFDdEIsSUFBSSxFQUFFLDRCQUE0QjtZQUNsQyxJQUFJLEVBQUUsZ0JBQWdCO1lBQ3RCLE9BQU8sRUFBRSxRQUFRLENBQUMsT0FBTztnQkFDckIsQ0FBQyxDQUFDLFNBQVM7Z0JBQ1gsQ0FBQyxDQUFDO29CQUNJO3dCQUNJLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQzt3QkFDbEIsR0FBRyxFQUFFLEdBQUc7cUJBQ1g7aUJBQ0o7WUFDUCxRQUFRLEVBQUUsR0FBRyxFQUFFO2dCQUNYLElBQUksQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ2xELENBQUM7U0FDSixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUNuQixFQUFFLEVBQUUsMkJBQTJCO1lBQy9CLElBQUksRUFBRSxzQ0FBc0M7WUFDNUMsSUFBSSxFQUFFLGdCQUFnQjtZQUN0QixPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU87Z0JBQ3JCLENBQUMsQ0FBQyxTQUFTO2dCQUNYLENBQUMsQ0FBQztvQkFDSTt3QkFDSSxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUM7d0JB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QyxRQUFRLEVBQUU7d0JBQ1gsT0FBTztxQkFDVjtvQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsQ0FDL0MsUUFBUSxDQUNYLENBQUM7Z0JBQ04sQ0FBQzthQUNKLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztJQUVELHNCQUFzQixDQUFDLFFBQXVCO1FBQzFDLElBQUksUUFBUSxFQUFFO1lBQ1YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFVBQVUsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUNuRDtJQUNMLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBUZW1wbGF0ZXJQbHVnaW4gZnJvbSBcIm1haW5cIjtcclxuaW1wb3J0IHsgUGxhdGZvcm0gfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgZXJyb3JXcmFwcGVyU3luYyB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5pbXBvcnQgeyByZXNvbHZlX3RmaWxlIH0gZnJvbSBcInV0aWxzL1V0aWxzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tbWFuZEhhbmRsZXIge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge31cclxuXHJcbiAgICBzZXR1cCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnBsdWdpbi5hZGRDb21tYW5kKHtcclxuICAgICAgICAgICAgaWQ6IFwiaW5zZXJ0LXRlbXBsYXRlclwiLFxyXG4gICAgICAgICAgICBuYW1lOiBcIk9wZW4gaW5zZXJ0IHRlbXBsYXRlIG1vZGFsXCIsXHJcbiAgICAgICAgICAgIGljb246IFwidGVtcGxhdGVyLWljb25cIixcclxuICAgICAgICAgICAgaG90a2V5czogUGxhdGZvcm0uaXNNYWNPU1xyXG4gICAgICAgICAgICAgICAgPyB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIDogW1xyXG4gICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmaWVyczogW1wiQWx0XCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogXCJlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZnV6enlfc3VnZ2VzdGVyLmluc2VydF90ZW1wbGF0ZSgpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLnBsdWdpbi5hZGRDb21tYW5kKHtcclxuICAgICAgICAgICAgaWQ6IFwicmVwbGFjZS1pbi1maWxlLXRlbXBsYXRlclwiLFxyXG4gICAgICAgICAgICBuYW1lOiBcIlJlcGxhY2UgdGVtcGxhdGVzIGluIHRoZSBhY3RpdmUgZmlsZVwiLFxyXG4gICAgICAgICAgICBpY29uOiBcInRlbXBsYXRlci1pY29uXCIsXHJcbiAgICAgICAgICAgIGhvdGtleXM6IFBsYXRmb3JtLmlzTWFjT1NcclxuICAgICAgICAgICAgICAgID8gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICA6IFtcclxuICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RpZmllcnM6IFtcIkFsdFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6IFwiclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnRlbXBsYXRlci5vdmVyd3JpdGVfYWN0aXZlX2ZpbGVfY29tbWFuZHMoKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgICAgIGlkOiBcImp1bXAtdG8tbmV4dC1jdXJzb3ItbG9jYXRpb25cIixcclxuICAgICAgICAgICAgbmFtZTogXCJKdW1wIHRvIG5leHQgY3Vyc29yIGxvY2F0aW9uXCIsXHJcbiAgICAgICAgICAgIGljb246IFwidGV4dC1jdXJzb3JcIixcclxuICAgICAgICAgICAgaG90a2V5czogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZGlmaWVyczogW1wiQWx0XCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIGtleTogXCJUYWJcIixcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5lZGl0b3JfaGFuZGxlci5qdW1wX3RvX25leHRfY3Vyc29yX2xvY2F0aW9uKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMucGx1Z2luLmFkZENvbW1hbmQoe1xyXG4gICAgICAgICAgICBpZDogXCJjcmVhdGUtbmV3LW5vdGUtZnJvbS10ZW1wbGF0ZVwiLFxyXG4gICAgICAgICAgICBuYW1lOiBcIkNyZWF0ZSBuZXcgbm90ZSBmcm9tIHRlbXBsYXRlXCIsXHJcbiAgICAgICAgICAgIGljb246IFwidGVtcGxhdGVyLWljb25cIixcclxuICAgICAgICAgICAgaG90a2V5czogUGxhdGZvcm0uaXNNYWNPU1xyXG4gICAgICAgICAgICAgICAgPyB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIDogW1xyXG4gICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmaWVyczogW1wiQWx0XCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogXCJuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uZnV6enlfc3VnZ2VzdGVyLmNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJfdGVtcGxhdGVzX2hvdGtleXMoKTtcclxuICAgIH1cclxuXHJcbiAgICByZWdpc3Rlcl90ZW1wbGF0ZXNfaG90a2V5cygpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVkX3RlbXBsYXRlc19ob3RrZXlzLmZvckVhY2goKHRlbXBsYXRlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0ZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRfdGVtcGxhdGVfaG90a2V5KG51bGwsIHRlbXBsYXRlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZF90ZW1wbGF0ZV9ob3RrZXkoXHJcbiAgICAgICAgb2xkX3RlbXBsYXRlOiBzdHJpbmcgfCBudWxsLFxyXG4gICAgICAgIG5ld190ZW1wbGF0ZTogc3RyaW5nXHJcbiAgICApOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnJlbW92ZV90ZW1wbGF0ZV9ob3RrZXkob2xkX3RlbXBsYXRlKTtcclxuXHJcbiAgICAgICAgaWYgKG5ld190ZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hZGRDb21tYW5kKHtcclxuICAgICAgICAgICAgICAgIGlkOiBuZXdfdGVtcGxhdGUsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBgSW5zZXJ0ICR7bmV3X3RlbXBsYXRlfWAsXHJcbiAgICAgICAgICAgICAgICBpY29uOiBcInRlbXBsYXRlci1pY29uXCIsXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZXJyb3JXcmFwcGVyU3luYyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4gcmVzb2x2ZV90ZmlsZSh0aGlzLnBsdWdpbi5hcHAsIG5ld190ZW1wbGF0ZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGBDb3VsZG4ndCBmaW5kIHRoZSB0ZW1wbGF0ZSBmaWxlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGhvdGtleWBcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi50ZW1wbGF0ZXIuYXBwZW5kX3RlbXBsYXRlX3RvX2FjdGl2ZV9maWxlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uYWRkQ29tbWFuZCh7XHJcbiAgICAgICAgICAgICAgICBpZDogYGNyZWF0ZS0ke25ld190ZW1wbGF0ZX1gLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogYENyZWF0ZSAke25ld190ZW1wbGF0ZX1gLFxyXG4gICAgICAgICAgICAgICAgaWNvbjogXCJ0ZW1wbGF0ZXItaWNvblwiLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGVycm9yV3JhcHBlclN5bmMoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICgpID0+IHJlc29sdmVfdGZpbGUodGhpcy5wbHVnaW4uYXBwLCBuZXdfdGVtcGxhdGUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgQ291bGRuJ3QgZmluZCB0aGUgdGVtcGxhdGUgZmlsZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBob3RrZXlgXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIXRlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4udGVtcGxhdGVyLmNyZWF0ZV9uZXdfbm90ZV9mcm9tX3RlbXBsYXRlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlX3RlbXBsYXRlX2hvdGtleSh0ZW1wbGF0ZTogc3RyaW5nIHwgbnVsbCk6IHZvaWQge1xyXG4gICAgICAgIGlmICh0ZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5yZW1vdmVDb21tYW5kKGAke3RlbXBsYXRlfWApO1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5yZW1vdmVDb21tYW5kKGBjcmVhdGUtJHt0ZW1wbGF0ZX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19