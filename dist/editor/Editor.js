import { __awaiter } from "tslib";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Platform } from "obsidian";
import { TemplaterError } from "utils/Error";
import { CursorJumper } from "editor/CursorJumper";
import { log_error } from "utils/Log";
import { get_active_file } from "utils/Utils";
import { Autocomplete } from "editor/Autocomplete";
import "editor/mode/javascript";
import "editor/mode/custom_overlay";
import { StreamLanguage } from "@codemirror/language";
import { Prec } from "@codemirror/state";
//import "editor/mode/show-hint";
const TEMPLATER_MODE_NAME = "templater";
const TP_CMD_TOKEN_CLASS = "templater-command";
const TP_INLINE_CLASS = "templater-inline";
const TP_OPENING_TAG_TOKEN_CLASS = "templater-opening-tag";
const TP_CLOSING_TAG_TOKEN_CLASS = "templater-closing-tag";
const TP_INTERPOLATION_TAG_TOKEN_CLASS = "templater-interpolation-tag";
const TP_EXEC_TAG_TOKEN_CLASS = "templater-execution-tag";
export class Editor {
    constructor(plugin) {
        this.plugin = plugin;
        this.cursor_jumper = new CursorJumper(plugin.app);
        this.activeEditorExtensions = [];
    }
    desktopShouldHighlight() {
        return (Platform.isDesktopApp && this.plugin.settings.syntax_highlighting);
    }
    mobileShouldHighlight() {
        return (Platform.isMobile && this.plugin.settings.syntax_highlighting_mobile);
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            this.autocomplete = new Autocomplete(this.plugin);
            this.plugin.registerEditorSuggest(this.autocomplete);
            // We define our overlay as a stand-alone extension and keep a reference
            // to it around. This lets us dynamically turn it on and off as needed.
            yield this.registerCodeMirrorMode();
            this.templaterLanguage = Prec.high(StreamLanguage.define(window.CodeMirror.getMode({}, TEMPLATER_MODE_NAME)));
            if (this.templaterLanguage === undefined) {
                log_error(new TemplaterError("Unable to enable syntax highlighting. Could not define language."));
            }
            // Dynamic reconfiguration is now done by passing an array. If we modify
            // that array and then call `Workspace.updateOptions` the new extension
            // will be picked up.
            this.plugin.registerEditorExtension(this.activeEditorExtensions);
            // Selectively enable syntax highlighting via per-platform preferences.
            if (this.desktopShouldHighlight() || this.mobileShouldHighlight()) {
                yield this.enable_highlighter();
            }
        });
    }
    enable_highlighter() {
        return __awaiter(this, void 0, void 0, function* () {
            // Make sure it is idempotent
            if (this.activeEditorExtensions.length === 0 &&
                this.templaterLanguage) {
                // There should only ever be this one extension if the array is not
                // empty.
                this.activeEditorExtensions.push(this.templaterLanguage);
                // This is expensive
                this.plugin.app.workspace.updateOptions();
            }
        });
    }
    disable_highlighter() {
        return __awaiter(this, void 0, void 0, function* () {
            // Make sure that it is idempotent.
            if (this.activeEditorExtensions.length > 0) {
                // There should only ever be one extension if the array is not empty.
                this.activeEditorExtensions.pop();
                // This is expensive
                this.plugin.app.workspace.updateOptions();
            }
        });
    }
    jump_to_next_cursor_location(file = null, auto_jump = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (auto_jump && !this.plugin.settings.auto_jump_to_cursor) {
                return;
            }
            if (file && get_active_file(this.plugin.app) !== file) {
                return;
            }
            yield this.cursor_jumper.jump_to_next_cursor_location();
        });
    }
    registerCodeMirrorMode() {
        return __awaiter(this, void 0, void 0, function* () {
            // cm-editor-syntax-highlight-obsidian plugin
            // https://codemirror.net/doc/manual.html#modeapi
            // https://codemirror.net/mode/diff/diff.js
            // https://codemirror.net/demo/mustache.html
            // https://marijnhaverbeke.nl/blog/codemirror-mode-system.html
            // If no configuration requests highlighting we should bail.
            if (!this.desktopShouldHighlight() && !this.mobileShouldHighlight()) {
                return;
            }
            const js_mode = window.CodeMirror.getMode({}, "javascript");
            if (js_mode.name === "null") {
                log_error(new TemplaterError("Javascript syntax mode couldn't be found, can't enable syntax highlighting."));
                return;
            }
            // Custom overlay mode used to handle edge cases
            // @ts-ignore
            const overlay_mode = window.CodeMirror.customOverlayMode;
            if (overlay_mode == null) {
                log_error(new TemplaterError("Couldn't find customOverlayMode, can't enable syntax highlighting."));
                return;
            }
            window.CodeMirror.defineMode(TEMPLATER_MODE_NAME, function (config) {
                const templaterOverlay = {
                    startState: function () {
                        const js_state = window.CodeMirror.startState(js_mode);
                        return Object.assign(Object.assign({}, js_state), { inCommand: false, tag_class: "", freeLine: false });
                    },
                    copyState: function (state) {
                        const js_state = window.CodeMirror.startState(js_mode);
                        const new_state = Object.assign(Object.assign({}, js_state), { inCommand: state.inCommand, tag_class: state.tag_class, freeLine: state.freeLine });
                        return new_state;
                    },
                    blankLine: function (state) {
                        if (state.inCommand) {
                            return `line-background-templater-command-bg`;
                        }
                        return null;
                    },
                    token: function (stream, state) {
                        if (stream.sol() && state.inCommand) {
                            state.freeLine = true;
                        }
                        if (state.inCommand) {
                            let keywords = "";
                            if (stream.match(/[-_]{0,1}%>/, true)) {
                                state.inCommand = false;
                                state.freeLine = false;
                                const tag_class = state.tag_class;
                                state.tag_class = "";
                                return `line-${TP_INLINE_CLASS} ${TP_CMD_TOKEN_CLASS} ${TP_CLOSING_TAG_TOKEN_CLASS} ${tag_class}`;
                            }
                            const js_result = js_mode.token && js_mode.token(stream, state);
                            if (stream.peek() == null && state.freeLine) {
                                keywords += ` line-background-templater-command-bg`;
                            }
                            if (!state.freeLine) {
                                keywords += ` line-${TP_INLINE_CLASS}`;
                            }
                            return `${keywords} ${TP_CMD_TOKEN_CLASS} ${js_result}`;
                        }
                        const match = stream.match(/<%[-_]{0,1}\s*([*+]{0,1})/, true);
                        if (match != null) {
                            switch (match[1]) {
                                case "*":
                                    state.tag_class = TP_EXEC_TAG_TOKEN_CLASS;
                                    break;
                                default:
                                    state.tag_class =
                                        TP_INTERPOLATION_TAG_TOKEN_CLASS;
                                    break;
                            }
                            state.inCommand = true;
                            return `line-${TP_INLINE_CLASS} ${TP_CMD_TOKEN_CLASS} ${TP_OPENING_TAG_TOKEN_CLASS} ${state.tag_class}`;
                        }
                        while (stream.next() != null && !stream.match(/<%/, false))
                            ;
                        return null;
                    },
                };
                return overlay_mode(window.CodeMirror.getMode(config, "hypermd"), templaterOverlay);
            });
        });
    }
    updateEditorIntellisenseSetting(value) {
        this.autocomplete.updateAutocompleteIntellisenseSetting(value);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2VkaXRvci9FZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHVEQUF1RDtBQUN2RCxPQUFPLEVBQUUsUUFBUSxFQUFTLE1BQU0sVUFBVSxDQUFDO0FBRTNDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDN0MsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ25ELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDdEMsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUM5QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFFbkQsT0FBTyx3QkFBd0IsQ0FBQztBQUNoQyxPQUFPLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN0RCxPQUFPLEVBQWEsSUFBSSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDcEQsaUNBQWlDO0FBRWpDLE1BQU0sbUJBQW1CLEdBQUcsV0FBVyxDQUFDO0FBRXhDLE1BQU0sa0JBQWtCLEdBQUcsbUJBQW1CLENBQUM7QUFDL0MsTUFBTSxlQUFlLEdBQUcsa0JBQWtCLENBQUM7QUFFM0MsTUFBTSwwQkFBMEIsR0FBRyx1QkFBdUIsQ0FBQztBQUMzRCxNQUFNLDBCQUEwQixHQUFHLHVCQUF1QixDQUFDO0FBRTNELE1BQU0sZ0NBQWdDLEdBQUcsNkJBQTZCLENBQUM7QUFDdkUsTUFBTSx1QkFBdUIsR0FBRyx5QkFBeUIsQ0FBQztBQUUxRCxNQUFNLE9BQU8sTUFBTTtJQVNmLFlBQTJCLE1BQXVCO1FBQXZCLFdBQU0sR0FBTixNQUFNLENBQWlCO1FBQzlDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xELElB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QUNKIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xyXG5pbXBvcnQgeyBQbGF0Zm9ybSwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IFRlbXBsYXRlclBsdWdpbiBmcm9tIFwibWFpblwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5pbXBvcnQgeyBDdXJzb3JKdW1wZXIgfSBmcm9tIFwiZWRpdG9yL0N1cnNvckp1bXBlclwiO1xyXG5pbXBvcnQgeyBsb2dfZXJyb3IgfSBmcm9tIFwidXRpbHMvTG9nXCI7XHJcbmltcG9ydCB7IGdldF9hY3RpdmVfZmlsZSB9IGZyb20gXCJ1dGlscy9VdGlsc1wiO1xyXG5pbXBvcnQgeyBBdXRvY29tcGxldGUgfSBmcm9tIFwiZWRpdG9yL0F1dG9jb21wbGV0ZVwiO1xyXG5cclxuaW1wb3J0IFwiZWRpdG9yL21vZGUvamF2YXNjcmlwdFwiO1xyXG5pbXBvcnQgXCJlZGl0b3IvbW9kZS9jdXN0b21fb3ZlcmxheVwiO1xyXG5pbXBvcnQgeyBTdHJlYW1MYW5ndWFnZSB9IGZyb20gXCJAY29kZW1pcnJvci9sYW5ndWFnZVwiO1xyXG5pbXBvcnQgeyBFeHRlbnNpb24sIFByZWMgfSBmcm9tIFwiQGNvZGVtaXJyb3Ivc3RhdGVcIjtcclxuLy9pbXBvcnQgXCJlZGl0b3IvbW9kZS9zaG93LWhpbnRcIjtcclxuXHJcbmNvbnN0IFRFTVBMQVRFUl9NT0RFX05BTUUgPSBcInRlbXBsYXRlclwiO1xyXG5cclxuY29uc3QgVFBfQ01EX1RPS0VOX0NMQVNTID0gXCJ0ZW1wbGF0ZXItY29tbWFuZFwiO1xyXG5jb25zdCBUUF9JTkxJTkVfQ0xBU1MgPSBcInRlbXBsYXRlci1pbmxpbmVcIjtcclxuXHJcbmNvbnN0IFRQX09QRU5JTkdfVEFHX1RPS0VOX0NMQVNTID0gXCJ0ZW1wbGF0ZXItb3BlbmluZy10YWdcIjtcclxuY29uc3QgVFBfQ0xPU0lOR19UQUdfVE9LRU5fQ0xBU1MgPSBcInRlbXBsYXRlci1jbG9zaW5nLXRhZ1wiO1xyXG5cclxuY29uc3QgVFBfSU5URVJQT0xBVElPTl9UQUdfVE9LRU5fQ0xBU1MgPSBcInRlbXBsYXRlci1pbnRlcnBvbGF0aW9uLXRhZ1wiO1xyXG5jb25zdCBUUF9FWEVDX1RBR19UT0tFTl9DTEFTUyA9IFwidGVtcGxhdGVyLWV4ZWN1dGlvbi10YWdcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFZGl0b3Ige1xyXG4gICAgcHJpdmF0ZSBjdXJzb3JfanVtcGVyOiBDdXJzb3JKdW1wZXI7XHJcbiAgICBwcml2YXRlIGFjdGl2ZUVkaXRvckV4dGVuc2lvbnM6IEFycmF5PEV4dGVuc2lvbj47XHJcblxyXG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgaXMgYHVuZGVmaW5lZGAgdW50aWwgYHNldHVwYCBoYXMgcnVuLlxyXG4gICAgcHJpdmF0ZSB0ZW1wbGF0ZXJMYW5ndWFnZTogRXh0ZW5zaW9uIHwgdW5kZWZpbmVkO1xyXG5cclxuICAgIHByaXZhdGUgYXV0b2NvbXBsZXRlOiBBdXRvY29tcGxldGU7XHJcblxyXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgcGx1Z2luOiBUZW1wbGF0ZXJQbHVnaW4pIHtcclxuICAgICAgICB0aGlzLmN1cnNvcl9qdW1wZXIgPSBuZXcgQ3Vyc29ySnVtcGVyKHBsdWdpbi5hcHApO1xyXG4gICAgICAgIHRoaXMuYWN0aXZlRWRpdG9yRXh0ZW5zaW9ucyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGRlc2t0b3BTaG91bGRIaWdobGlnaHQoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgUGxhdGZvcm0uaXNEZXNrdG9wQXBwICYmIHRoaXMucGx1Z2luLnNldHRpbmdzLnN5bnRheF9oaWdobGlnaHRpbmdcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIG1vYmlsZVNob3VsZEhpZ2hsaWdodCgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBQbGF0Zm9ybS5pc01vYmlsZSAmJiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zeW50YXhfaGlnaGxpZ2h0aW5nX21vYmlsZVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc2V0dXAoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdGhpcy5hdXRvY29tcGxldGUgPSBuZXcgQXV0b2NvbXBsZXRlKHRoaXMucGx1Z2luKTtcclxuICAgICAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvclN1Z2dlc3QodGhpcy5hdXRvY29tcGxldGUpO1xyXG5cclxuICAgICAgICAvLyBXZSBkZWZpbmUgb3VyIG92ZXJsYXkgYXMgYSBzdGFuZC1hbG9uZSBleHRlbnNpb24gYW5kIGtlZXAgYSByZWZlcmVuY2VcclxuICAgICAgICAvLyB0byBpdCBhcm91bmQuIFRoaXMgbGV0cyB1cyBkeW5hbWljYWxseSB0dXJuIGl0IG9uIGFuZCBvZmYgYXMgbmVlZGVkLlxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVnaXN0ZXJDb2RlTWlycm9yTW9kZSgpO1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGVyTGFuZ3VhZ2UgPSBQcmVjLmhpZ2goXHJcbiAgICAgICAgICAgIFN0cmVhbUxhbmd1YWdlLmRlZmluZShcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5Db2RlTWlycm9yLmdldE1vZGUoe30sIFRFTVBMQVRFUl9NT0RFX05BTUUpIGFzIGFueVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKTtcclxuICAgICAgICBpZiAodGhpcy50ZW1wbGF0ZXJMYW5ndWFnZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGxvZ19lcnJvcihcclxuICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBcIlVuYWJsZSB0byBlbmFibGUgc3ludGF4IGhpZ2hsaWdodGluZy4gQ291bGQgbm90IGRlZmluZSBsYW5ndWFnZS5cIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRHluYW1pYyByZWNvbmZpZ3VyYXRpb24gaXMgbm93IGRvbmUgYnkgcGFzc2luZyBhbiBhcnJheS4gSWYgd2UgbW9kaWZ5XHJcbiAgICAgICAgLy8gdGhhdCBhcnJheSBhbmQgdGhlbiBjYWxsIGBXb3Jrc3BhY2UudXBkYXRlT3B0aW9uc2AgdGhlIG5ldyBleHRlbnNpb25cclxuICAgICAgICAvLyB3aWxsIGJlIHBpY2tlZCB1cC5cclxuICAgICAgICB0aGlzLnBsdWdpbi5yZWdpc3RlckVkaXRvckV4dGVuc2lvbih0aGlzLmFjdGl2ZUVkaXRvckV4dGVuc2lvbnMpO1xyXG5cclxuICAgICAgICAvLyBTZWxlY3RpdmVseSBlbmFibGUgc3ludGF4IGhpZ2hsaWdodGluZyB2aWEgcGVyLXBsYXRmb3JtIHByZWZlcmVuY2VzLlxyXG4gICAgICAgIGlmICh0aGlzLmRlc2t0b3BTaG91bGRIaWdobGlnaHQoKSB8fCB0aGlzLm1vYmlsZVNob3VsZEhpZ2hsaWdodCgpKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZW5hYmxlX2hpZ2hsaWdodGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVuYWJsZV9oaWdobGlnaHRlcigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICAvLyBNYWtlIHN1cmUgaXQgaXMgaWRlbXBvdGVudFxyXG4gICAgICAgIGlmIChcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVFZGl0b3JFeHRlbnNpb25zLmxlbmd0aCA9PT0gMCAmJlxyXG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlckxhbmd1YWdlXHJcbiAgICAgICAgKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIHNob3VsZCBvbmx5IGV2ZXIgYmUgdGhpcyBvbmUgZXh0ZW5zaW9uIGlmIHRoZSBhcnJheSBpcyBub3RcclxuICAgICAgICAgICAgLy8gZW1wdHkuXHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlRWRpdG9yRXh0ZW5zaW9ucy5wdXNoKHRoaXMudGVtcGxhdGVyTGFuZ3VhZ2UpO1xyXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGV4cGVuc2l2ZVxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnVwZGF0ZU9wdGlvbnMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZGlzYWJsZV9oaWdobGlnaHRlcigpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBpdCBpcyBpZGVtcG90ZW50LlxyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZUVkaXRvckV4dGVuc2lvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBzaG91bGQgb25seSBldmVyIGJlIG9uZSBleHRlbnNpb24gaWYgdGhlIGFycmF5IGlzIG5vdCBlbXB0eS5cclxuICAgICAgICAgICAgdGhpcy5hY3RpdmVFZGl0b3JFeHRlbnNpb25zLnBvcCgpO1xyXG4gICAgICAgICAgICAvLyBUaGlzIGlzIGV4cGVuc2l2ZVxyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnVwZGF0ZU9wdGlvbnMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMganVtcF90b19uZXh0X2N1cnNvcl9sb2NhdGlvbihcclxuICAgICAgICBmaWxlOiBURmlsZSB8IG51bGwgPSBudWxsLFxyXG4gICAgICAgIGF1dG9fanVtcCA9IGZhbHNlXHJcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBpZiAoYXV0b19qdW1wICYmICF0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvX2p1bXBfdG9fY3Vyc29yKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGZpbGUgJiYgZ2V0X2FjdGl2ZV9maWxlKHRoaXMucGx1Z2luLmFwcCkgIT09IGZpbGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBhd2FpdCB0aGlzLmN1cnNvcl9qdW1wZXIuanVtcF90b19uZXh0X2N1cnNvcl9sb2NhdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHJlZ2lzdGVyQ29kZU1pcnJvck1vZGUoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgLy8gY20tZWRpdG9yLXN5bnRheC1oaWdobGlnaHQtb2JzaWRpYW4gcGx1Z2luXHJcbiAgICAgICAgLy8gaHR0cHM6Ly9jb2RlbWlycm9yLm5ldC9kb2MvbWFudWFsLmh0bWwjbW9kZWFwaVxyXG4gICAgICAgIC8vIGh0dHBzOi8vY29kZW1pcnJvci5uZXQvbW9kZS9kaWZmL2RpZmYuanNcclxuICAgICAgICAvLyBodHRwczovL2NvZGVtaXJyb3IubmV0L2RlbW8vbXVzdGFjaGUuaHRtbFxyXG4gICAgICAgIC8vIGh0dHBzOi8vbWFyaWpuaGF2ZXJiZWtlLm5sL2Jsb2cvY29kZW1pcnJvci1tb2RlLXN5c3RlbS5odG1sXHJcblxyXG4gICAgICAgIC8vIElmIG5vIGNvbmZpZ3VyYXRpb24gcmVxdWVzdHMgaGlnaGxpZ2h0aW5nIHdlIHNob3VsZCBiYWlsLlxyXG4gICAgICAgIGlmICghdGhpcy5kZXNrdG9wU2hvdWxkSGlnaGxpZ2h0KCkgJiYgIXRoaXMubW9iaWxlU2hvdWxkSGlnaGxpZ2h0KCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QganNfbW9kZSA9IHdpbmRvdy5Db2RlTWlycm9yLmdldE1vZGUoe30sIFwiamF2YXNjcmlwdFwiKTtcclxuICAgICAgICBpZiAoanNfbW9kZS5uYW1lID09PSBcIm51bGxcIikge1xyXG4gICAgICAgICAgICBsb2dfZXJyb3IoXHJcbiAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGVyRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJKYXZhc2NyaXB0IHN5bnRheCBtb2RlIGNvdWxkbid0IGJlIGZvdW5kLCBjYW4ndCBlbmFibGUgc3ludGF4IGhpZ2hsaWdodGluZy5cIlxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDdXN0b20gb3ZlcmxheSBtb2RlIHVzZWQgdG8gaGFuZGxlIGVkZ2UgY2FzZXNcclxuICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgY29uc3Qgb3ZlcmxheV9tb2RlID0gd2luZG93LkNvZGVNaXJyb3IuY3VzdG9tT3ZlcmxheU1vZGU7XHJcbiAgICAgICAgaWYgKG92ZXJsYXlfbW9kZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxvZ19lcnJvcihcclxuICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcclxuICAgICAgICAgICAgICAgICAgICBcIkNvdWxkbid0IGZpbmQgY3VzdG9tT3ZlcmxheU1vZGUsIGNhbid0IGVuYWJsZSBzeW50YXggaGlnaGxpZ2h0aW5nLlwiXHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdpbmRvdy5Db2RlTWlycm9yLmRlZmluZU1vZGUoVEVNUExBVEVSX01PREVfTkFNRSwgZnVuY3Rpb24gKGNvbmZpZykge1xyXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZXJPdmVybGF5ID0ge1xyXG4gICAgICAgICAgICAgICAgc3RhcnRTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGpzX3N0YXRlID0gd2luZG93LkNvZGVNaXJyb3Iuc3RhcnRTdGF0ZShcclxuICAgICAgICAgICAgICAgICAgICAgICAganNfbW9kZVxyXG4gICAgICAgICAgICAgICAgICAgICkgYXMgT2JqZWN0O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmpzX3N0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbkNvbW1hbmQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWdfY2xhc3M6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyZWVMaW5lOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNvcHlTdGF0ZTogZnVuY3Rpb24gKHN0YXRlOiBhbnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBqc19zdGF0ZSA9IHdpbmRvdy5Db2RlTWlycm9yLnN0YXJ0U3RhdGUoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpzX21vZGVcclxuICAgICAgICAgICAgICAgICAgICApIGFzIE9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdfc3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmpzX3N0YXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbkNvbW1hbmQ6IHN0YXRlLmluQ29tbWFuZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFnX2NsYXNzOiBzdGF0ZS50YWdfY2xhc3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyZWVMaW5lOiBzdGF0ZS5mcmVlTGluZSxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXdfc3RhdGU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYmxhbmtMaW5lOiBmdW5jdGlvbiAoc3RhdGU6IGFueSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5pbkNvbW1hbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBsaW5lLWJhY2tncm91bmQtdGVtcGxhdGVyLWNvbW1hbmQtYmdgO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB0b2tlbjogZnVuY3Rpb24gKHN0cmVhbTogYW55LCBzdGF0ZTogYW55KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0cmVhbS5zb2woKSAmJiBzdGF0ZS5pbkNvbW1hbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZnJlZUxpbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlLmluQ29tbWFuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQga2V5d29yZHMgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RyZWFtLm1hdGNoKC9bLV9dezAsMX0lPi8sIHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5pbkNvbW1hbmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLmZyZWVMaW5lID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWdfY2xhc3MgPSBzdGF0ZS50YWdfY2xhc3M7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS50YWdfY2xhc3MgPSBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgbGluZS0ke1RQX0lOTElORV9DTEFTU30gJHtUUF9DTURfVE9LRU5fQ0xBU1N9ICR7VFBfQ0xPU0lOR19UQUdfVE9LRU5fQ0xBU1N9ICR7dGFnX2NsYXNzfWA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGpzX3Jlc3VsdCA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBqc19tb2RlLnRva2VuICYmIGpzX21vZGUudG9rZW4oc3RyZWFtLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHJlYW0ucGVlaygpID09IG51bGwgJiYgc3RhdGUuZnJlZUxpbmUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXdvcmRzICs9IGAgbGluZS1iYWNrZ3JvdW5kLXRlbXBsYXRlci1jb21tYW5kLWJnYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YXRlLmZyZWVMaW5lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXl3b3JkcyArPSBgIGxpbmUtJHtUUF9JTkxJTkVfQ0xBU1N9YDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2tleXdvcmRzfSAke1RQX0NNRF9UT0tFTl9DTEFTU30gJHtqc19yZXN1bHR9YDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gc3RyZWFtLm1hdGNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvPCVbLV9dezAsMX1cXHMqKFsqK117MCwxfSkvLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2ggIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKG1hdGNoWzFdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiKlwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLnRhZ19jbGFzcyA9IFRQX0VYRUNfVEFHX1RPS0VOX0NMQVNTO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS50YWdfY2xhc3MgPVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUUF9JTlRFUlBPTEFUSU9OX1RBR19UT0tFTl9DTEFTUztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5pbkNvbW1hbmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYGxpbmUtJHtUUF9JTkxJTkVfQ0xBU1N9ICR7VFBfQ01EX1RPS0VOX0NMQVNTfSAke1RQX09QRU5JTkdfVEFHX1RPS0VOX0NMQVNTfSAke3N0YXRlLnRhZ19jbGFzc31gO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHN0cmVhbS5uZXh0KCkgIT0gbnVsbCAmJiAhc3RyZWFtLm1hdGNoKC88JS8sIGZhbHNlKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gb3ZlcmxheV9tb2RlKFxyXG4gICAgICAgICAgICAgICAgd2luZG93LkNvZGVNaXJyb3IuZ2V0TW9kZShjb25maWcsIFwiaHlwZXJtZFwiKSxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlck92ZXJsYXlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVFZGl0b3JJbnRlbGxpc2Vuc2VTZXR0aW5nKHZhbHVlOiBhbnkpe1xyXG4gICAgICAgIHRoaXMuYXV0b2NvbXBsZXRlLnVwZGF0ZUF1dG9jb21wbGV0ZUludGVsbGlzZW5zZVNldHRpbmcodmFsdWUpXHJcbiAgICB9XHJcbn1cclxuIl19