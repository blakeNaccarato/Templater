import { TFile } from "obsidian";
import TemplaterPlugin from "main";
import "editor/mode/javascript";
import "editor/mode/custom_overlay";
export declare class Editor {
    private plugin;
    private cursor_jumper;
    private activeEditorExtensions;
    private templaterLanguage;
    private autocomplete;
    constructor(plugin: TemplaterPlugin);
    desktopShouldHighlight(): boolean;
    mobileShouldHighlight(): boolean;
    setup(): Promise<void>;
    enable_highlighter(): Promise<void>;
    disable_highlighter(): Promise<void>;
    jump_to_next_cursor_location(file?: TFile | null, auto_jump?: boolean): Promise<void>;
    registerCodeMirrorMode(): Promise<void>;
    updateEditorIntellisenseSetting(value: any): void;
}
//# sourceMappingURL=Editor.d.ts.map