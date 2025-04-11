import { ButtonComponent, Modal, Platform, TextAreaComponent, TextComponent, } from "obsidian";
import { TemplaterError } from "utils/Error";
export class PromptModal extends Modal {
    constructor(app, prompt_text, default_value, multi_line) {
        super(app);
        this.prompt_text = prompt_text;
        this.default_value = default_value;
        this.multi_line = multi_line;
        this.submitted = false;
    }
    onOpen() {
        this.titleEl.setText(this.prompt_text);
        this.createForm();
    }
    onClose() {
        this.contentEl.empty();
        if (!this.submitted) {
            this.reject(new TemplaterError("Cancelled prompt"));
        }
    }
    createForm() {
        const div = this.contentEl.createDiv();
        div.addClass("templater-prompt-div");
        let textInput;
        if (this.multi_line) {
            textInput = new TextAreaComponent(div);
            // Add submit button since enter needed for multiline input on mobile
            const buttonDiv = this.contentEl.createDiv();
            buttonDiv.addClass("templater-button-div");
            const submitButton = new ButtonComponent(buttonDiv);
            submitButton.buttonEl.addClass("mod-cta");
            submitButton.setButtonText("Submit").onClick((evt) => {
                this.resolveAndClose(evt);
            });
        }
        else {
            textInput = new TextComponent(div);
        }
        this.value = this.default_value ?? "";
        textInput.inputEl.addClass("templater-prompt-input");
        textInput.setPlaceholder("Type text here");
        textInput.setValue(this.value);
        textInput.onChange((value) => (this.value = value));
        textInput.inputEl.focus();
        textInput.inputEl.addEventListener("keydown", (evt) => this.enterCallback(evt));
    }
    enterCallback(evt) {
        // Fix for Korean inputs https://github.com/SilentVoid13/Templater/issues/1284
        if (evt.isComposing || evt.keyCode === 229)
            return;
        if (this.multi_line) {
            if (Platform.isDesktop && evt.key === "Enter" && !evt.shiftKey) {
                this.resolveAndClose(evt);
            }
        }
        else {
            if (evt.key === "Enter") {
                this.resolveAndClose(evt);
            }
        }
    }
    resolveAndClose(evt) {
        this.submitted = true;
        evt.preventDefault();
        this.resolve(this.value);
        this.close();
    }
    async openAndGetValue(resolve, reject) {
        this.resolve = resolve;
        this.reject = reject;
        this.open();
    }
}
