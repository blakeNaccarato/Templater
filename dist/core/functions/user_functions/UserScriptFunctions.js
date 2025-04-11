import { __awaiter } from "tslib";
import { get_tfiles_from_folder } from "utils/Utils";
import { errorWrapperSync, TemplaterError } from "utils/Error";
export class UserScriptFunctions {
    constructor(plugin) {
        this.plugin = plugin;
    }
    generate_user_script_functions() {
        return __awaiter(this, void 0, void 0, function* () {
            const user_script_functions = new Map();
            const files = errorWrapperSync(() => get_tfiles_from_folder(this.plugin.app, this.plugin.settings.user_scripts_folder), `Couldn't find user script folder "${this.plugin.settings.user_scripts_folder}"`);
            if (!files) {
                return new Map();
            }
            for (const file of files) {
                if (file.extension.toLowerCase() === "js") {
                    yield this.load_user_script_function(file, user_script_functions);
                }
            }
            return user_script_functions;
        });
    }
    load_user_script_function(file, user_script_functions) {
        return __awaiter(this, void 0, void 0, function* () {
            const req = (s) => {
                return window.require && window.require(s);
            };
            const exp = {};
            const mod = {
                exports: exp,
            };
            const file_content = yield this.plugin.app.vault.read(file);
            try {
                const wrapping_fn = window.eval("(function anonymous(require, module, exports){" +
                    file_content +
                    "\n})");
                wrapping_fn(req, mod, exp);
            }
            catch (err) {
                throw new TemplaterError(`Failed to load user script at "${file.path}".`, err.message);
            }
            const user_function = exp["default"] || mod.exports;
            if (!user_function) {
                throw new TemplaterError(`Failed to load user script at "${file.path}". No exports detected.`);
            }
            if (!(user_function instanceof Function)) {
                throw new TemplaterError(`Failed to load user script at "${file.path}". Default export is not a function.`);
            }
            user_script_functions.set(`${file.basename}`, user_function);
        });
    }
    generate_object() {
        return __awaiter(this, void 0, void 0, function* () {
            const user_script_functions = yield this.generate_user_script_functions();
            return Object.fromEntries(user_script_functions);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlclNjcmlwdEZ1bmN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3JlL2Z1bmN0aW9ucy91c2VyX2Z1bmN0aW9ucy9Vc2VyU2NyaXB0RnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFJQSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDckQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUUvRCxNQUFNLE9BQU8sbUJBQW1CO0lBQzVCLFlBQW9CLE1BQXVCO1FBQXZCLFdBQU0sR0FBTixNQUFNLENBQWlCO0lBQUcsQ0FBQztJQUV6Qyw4QkFBOEI7O1lBR2hDLE1BQU0scUJBQXFCLEdBQStCLElBQUksR0FBRyxFQUFFLENBQUM7WUFDcEUsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQzFCLEdBQUcsRUFBRSxDQUNELHNCQUFzQixDQUNsQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFDZixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FDM0MsRUFDTCxxQ0FBcUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEdBQUcsQ0FDbkYsQ0FBQztZQUNGLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1IsT0FBTyxJQUFJLEdBQUcsRUFBRSxDQUFDO2FBQ3BCO1lBRUQsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUU7Z0JBQ3RCLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsS0FBSyxJQUFJLEVBQUU7b0JBQ3ZDLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUNoQyxJQUFJLEVBQ0oscUJBQXFCLENBQ3hCLENBQUM7aUJBQ0w7YUFDSjtZQUNELE9BQU8scUJBQXFCLENBQUM7UUFDakMsQ0FBQztLQUFBO0lBRUsseUJBQXlCLENBQzNCLElBQVcsRUFDWCxxQkFBaUQ7O1lBRWpELE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBUyxFQUFFLEVBQUU7Z0JBQ3RCLE9BQU8sTUFBTSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUMsQ0FBQztZQUNGLE1BQU0sR0FBRyxHQUE0QixFQUFFLENBQUM7WUFDeEMsTUFBTSxHQUFHLEdBQUc7Z0JBQ1IsT0FBTyxFQUFFLEdBQUc7YUFDZixDQUFDO1lBRUYsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELElBQUk7Z0JBQ0EsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FDM0IsZ0RBQWdEO29CQUM1QyxZQUFZO29CQUNaLE1BQU0sQ0FDYixDQUFDO2dCQUNGLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQzlCO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1YsTUFBTSxJQUFJLGNBQWMsQ0FDcEIsa0NBQWtDLElBQUksQ0FBQyxJQUFJLElBQUksRUFDL0MsR0FBRyxDQUFDLE9BQU8sQ0FDZCxDQUFDO2FBQ0w7WUFDRCxNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQztZQUVwRCxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUNoQixNQUFNLElBQUksY0FBYyxDQUNwQixrQ0FBa0MsSUFBSSxDQUFDLElBQUkseUJBQXlCLENBQ3ZFLENBQUM7YUFDTDtZQUNELElBQUksQ0FBQyxDQUFDLGFBQWEsWUFBWSxRQUFRLENBQUMsRUFBRTtnQkFDdEMsTUFBTSxJQUFJLGNBQWMsQ0FDcEIsa0NBQWtDLElBQUksQ0FBQyxJQUFJLHNDQUFzQyxDQUNwRixDQUFDO2FBQ0w7WUFDRCxxQkFBcUIsQ0FBQyxHQUFHLENBQ3JCLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUNsQixhQUE4QixDQUNqQyxDQUFDO1FBQ04sQ0FBQztLQUFBO0lBRUssZUFBZTs7WUFDakIsTUFBTSxxQkFBcUIsR0FDdkIsTUFBTSxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztZQUNoRCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNyRCxDQUFDO0tBQUE7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcblxyXG5pbXBvcnQgVGVtcGxhdGVyUGx1Z2luIGZyb20gXCJtYWluXCI7XHJcbmltcG9ydCB7IElHZW5lcmF0ZU9iamVjdCB9IGZyb20gXCIuLi9JR2VuZXJhdGVPYmplY3RcIjtcclxuaW1wb3J0IHsgZ2V0X3RmaWxlc19mcm9tX2ZvbGRlciB9IGZyb20gXCJ1dGlscy9VdGlsc1wiO1xyXG5pbXBvcnQgeyBlcnJvcldyYXBwZXJTeW5jLCBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFVzZXJTY3JpcHRGdW5jdGlvbnMgaW1wbGVtZW50cyBJR2VuZXJhdGVPYmplY3Qge1xyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBwbHVnaW46IFRlbXBsYXRlclBsdWdpbikge31cclxuXHJcbiAgICBhc3luYyBnZW5lcmF0ZV91c2VyX3NjcmlwdF9mdW5jdGlvbnMoKTogUHJvbWlzZTxcclxuICAgICAgICBNYXA8c3RyaW5nLCAoKSA9PiB1bmtub3duPlxyXG4gICAgPiB7XHJcbiAgICAgICAgY29uc3QgdXNlcl9zY3JpcHRfZnVuY3Rpb25zOiBNYXA8c3RyaW5nLCAoKSA9PiB1bmtub3duPiA9IG5ldyBNYXAoKTtcclxuICAgICAgICBjb25zdCBmaWxlcyA9IGVycm9yV3JhcHBlclN5bmMoXHJcbiAgICAgICAgICAgICgpID0+XHJcbiAgICAgICAgICAgICAgICBnZXRfdGZpbGVzX2Zyb21fZm9sZGVyKFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VyX3NjcmlwdHNfZm9sZGVyXHJcbiAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBgQ291bGRuJ3QgZmluZCB1c2VyIHNjcmlwdCBmb2xkZXIgXCIke3RoaXMucGx1Z2luLnNldHRpbmdzLnVzZXJfc2NyaXB0c19mb2xkZXJ9XCJgXHJcbiAgICAgICAgKTtcclxuICAgICAgICBpZiAoIWZpbGVzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWFwKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcclxuICAgICAgICAgICAgaWYgKGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgPT09IFwianNcIikge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkX3VzZXJfc2NyaXB0X2Z1bmN0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdXNlcl9zY3JpcHRfZnVuY3Rpb25zXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB1c2VyX3NjcmlwdF9mdW5jdGlvbnM7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgbG9hZF91c2VyX3NjcmlwdF9mdW5jdGlvbihcclxuICAgICAgICBmaWxlOiBURmlsZSxcclxuICAgICAgICB1c2VyX3NjcmlwdF9mdW5jdGlvbnM6IE1hcDxzdHJpbmcsICgpID0+IHVua25vd24+XHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCByZXEgPSAoczogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cucmVxdWlyZSAmJiB3aW5kb3cucmVxdWlyZShzKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IGV4cDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcclxuICAgICAgICBjb25zdCBtb2QgPSB7XHJcbiAgICAgICAgICAgIGV4cG9ydHM6IGV4cCxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBmaWxlX2NvbnRlbnQgPSBhd2FpdCB0aGlzLnBsdWdpbi5hcHAudmF1bHQucmVhZChmaWxlKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB3cmFwcGluZ19mbiA9IHdpbmRvdy5ldmFsKFxyXG4gICAgICAgICAgICAgICAgXCIoZnVuY3Rpb24gYW5vbnltb3VzKHJlcXVpcmUsIG1vZHVsZSwgZXhwb3J0cyl7XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbGVfY29udGVudCArXHJcbiAgICAgICAgICAgICAgICAgICAgXCJcXG59KVwiXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHdyYXBwaW5nX2ZuKHJlcSwgbW9kLCBleHApO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICBgRmFpbGVkIHRvIGxvYWQgdXNlciBzY3JpcHQgYXQgXCIke2ZpbGUucGF0aH1cIi5gLFxyXG4gICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2VcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdXNlcl9mdW5jdGlvbiA9IGV4cFtcImRlZmF1bHRcIl0gfHwgbW9kLmV4cG9ydHM7XHJcblxyXG4gICAgICAgIGlmICghdXNlcl9mdW5jdGlvbikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICBgRmFpbGVkIHRvIGxvYWQgdXNlciBzY3JpcHQgYXQgXCIke2ZpbGUucGF0aH1cIi4gTm8gZXhwb3J0cyBkZXRlY3RlZC5gXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKHVzZXJfZnVuY3Rpb24gaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFRlbXBsYXRlckVycm9yKFxyXG4gICAgICAgICAgICAgICAgYEZhaWxlZCB0byBsb2FkIHVzZXIgc2NyaXB0IGF0IFwiJHtmaWxlLnBhdGh9XCIuIERlZmF1bHQgZXhwb3J0IGlzIG5vdCBhIGZ1bmN0aW9uLmBcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdXNlcl9zY3JpcHRfZnVuY3Rpb25zLnNldChcclxuICAgICAgICAgICAgYCR7ZmlsZS5iYXNlbmFtZX1gLFxyXG4gICAgICAgICAgICB1c2VyX2Z1bmN0aW9uIGFzICgpID0+IHVua25vd25cclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGdlbmVyYXRlX29iamVjdCgpOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB7XHJcbiAgICAgICAgY29uc3QgdXNlcl9zY3JpcHRfZnVuY3Rpb25zID1cclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5nZW5lcmF0ZV91c2VyX3NjcmlwdF9mdW5jdGlvbnMoKTtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKHVzZXJfc2NyaXB0X2Z1bmN0aW9ucyk7XHJcbiAgICB9XHJcbn1cclxuIl19