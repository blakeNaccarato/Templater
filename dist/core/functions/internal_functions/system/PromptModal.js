import { __awaiter } from "tslib";
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
        var _a;
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
        this.value = (_a = this.default_value) !== null && _a !== void 0 ? _a : "";
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
    openAndGetValue(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            this.resolve = resolve;
            this.reject = reject;
            this.open();
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvbXB0TW9kYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9mdW5jdGlvbnMvaW50ZXJuYWxfZnVuY3Rpb25zL3N5c3RlbS9Qcm9tcHRNb2RhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUVILGVBQWUsRUFDZixLQUFLLEVBQ0wsUUFBUSxFQUNSLGlCQUFpQixFQUNqQixhQUFhLEdBQ2hCLE1BQU0sVUFBVSxDQUFDO0FBQ2xCLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFN0MsTUFBTSxPQUFPLFdBQVksU0FBUSxLQUFLO0lBTWxDLFlBQ0ksR0FBUSxFQUNBLFdBQW1CLEVBQ25CLGFBQXFCLEVBQ3JCLFVBQW1CO1FBRTNCLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUpILGdCQUFXLEdBQVgsV0FBVyxDQUFRO1FBQ25CLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1FBQ3JCLGVBQVUsR0FBVixVQUFVLENBQVM7UUFQdkIsY0FBUyxHQUFHLEtBQUssQ0FBQztJQVUxQixDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVELE9BQU87UUFDSCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1NBQ3ZEO0lBQ0wsQ0FBQztJQUVELFVBQVU7O1FBQ04sTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN2QyxHQUFHLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDckMsSUFBSSxTQUFTLENBQUM7UUFDZCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDakIsU0FBUyxHQUFHLElBQUksaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFdkMscUVBQXFFO1lBQ3JFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDN0MsU0FBUyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sWUFBWSxHQUFHLElBQUksZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzFDLFlBQVksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBVSxFQUFFLEVBQUU7Z0JBQ3hELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDOUIsQ0FBQyxDQUFDLENBQUM7U0FDTjthQUFNO1lBQ0gsU0FBUyxHQUFHLElBQUksYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFBLElBQUksQ0FBQyxhQUFhLG1DQUFJLEVBQUUsQ0FBQztRQUN0QyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3JELFNBQVMsQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUMzQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNwRCxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFCLFNBQVMsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsR0FBa0IsRUFBRSxFQUFFLENBQ2pFLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQzFCLENBQUM7SUFDTixDQUFDO0lBRU8sYUFBYSxDQUFDLEdBQWtCO1FBQ3BDLDhFQUE4RTtRQUM5RSxJQUFJLEdBQUcsQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLE9BQU8sS0FBSyxHQUFHO1lBQUUsT0FBTztRQUVuRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDakIsSUFBSSxRQUFRLENBQUMsU0FBUyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEtBQUssT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRTtnQkFDNUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUM3QjtTQUNKO2FBQU07WUFDSCxJQUFJLEdBQUcsQ0FBQyxHQUFHLEtBQUssT0FBTyxFQUFFO2dCQUNyQixJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzdCO1NBQ0o7SUFDTCxDQUFDO0lBRU8sZUFBZSxDQUFDLEdBQTBCO1FBQzlDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVLLGVBQWUsQ0FDakIsT0FBZ0MsRUFDaEMsTUFBeUM7O1lBRXpDLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoQixDQUFDO0tBQUE7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XHJcbiAgICBBcHAsXHJcbiAgICBCdXR0b25Db21wb25lbnQsXHJcbiAgICBNb2RhbCxcclxuICAgIFBsYXRmb3JtLFxyXG4gICAgVGV4dEFyZWFDb21wb25lbnQsXHJcbiAgICBUZXh0Q29tcG9uZW50LFxyXG59IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZXJFcnJvciB9IGZyb20gXCJ1dGlscy9FcnJvclwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFByb21wdE1vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG4gICAgcHJpdmF0ZSByZXNvbHZlOiAodmFsdWU6IHN0cmluZykgPT4gdm9pZDtcclxuICAgIHByaXZhdGUgcmVqZWN0OiAocmVhc29uPzogVGVtcGxhdGVyRXJyb3IpID0+IHZvaWQ7XHJcbiAgICBwcml2YXRlIHN1Ym1pdHRlZCA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSB2YWx1ZTogc3RyaW5nO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIGFwcDogQXBwLFxyXG4gICAgICAgIHByaXZhdGUgcHJvbXB0X3RleHQ6IHN0cmluZyxcclxuICAgICAgICBwcml2YXRlIGRlZmF1bHRfdmFsdWU6IHN0cmluZyxcclxuICAgICAgICBwcml2YXRlIG11bHRpX2xpbmU6IGJvb2xlYW5cclxuICAgICkge1xyXG4gICAgICAgIHN1cGVyKGFwcCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25PcGVuKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudGl0bGVFbC5zZXRUZXh0KHRoaXMucHJvbXB0X3RleHQpO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRm9ybSgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uQ2xvc2UoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcclxuICAgICAgICBpZiAoIXRoaXMuc3VibWl0dGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVqZWN0KG5ldyBUZW1wbGF0ZXJFcnJvcihcIkNhbmNlbGxlZCBwcm9tcHRcIikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVGb3JtKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGRpdiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdigpO1xyXG4gICAgICAgIGRpdi5hZGRDbGFzcyhcInRlbXBsYXRlci1wcm9tcHQtZGl2XCIpO1xyXG4gICAgICAgIGxldCB0ZXh0SW5wdXQ7XHJcbiAgICAgICAgaWYgKHRoaXMubXVsdGlfbGluZSkge1xyXG4gICAgICAgICAgICB0ZXh0SW5wdXQgPSBuZXcgVGV4dEFyZWFDb21wb25lbnQoZGl2KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCBzdWJtaXQgYnV0dG9uIHNpbmNlIGVudGVyIG5lZWRlZCBmb3IgbXVsdGlsaW5lIGlucHV0IG9uIG1vYmlsZVxyXG4gICAgICAgICAgICBjb25zdCBidXR0b25EaXYgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoKTtcclxuICAgICAgICAgICAgYnV0dG9uRGl2LmFkZENsYXNzKFwidGVtcGxhdGVyLWJ1dHRvbi1kaXZcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IHN1Ym1pdEJ1dHRvbiA9IG5ldyBCdXR0b25Db21wb25lbnQoYnV0dG9uRGl2KTtcclxuICAgICAgICAgICAgc3VibWl0QnV0dG9uLmJ1dHRvbkVsLmFkZENsYXNzKFwibW9kLWN0YVwiKTtcclxuICAgICAgICAgICAgc3VibWl0QnV0dG9uLnNldEJ1dHRvblRleHQoXCJTdWJtaXRcIikub25DbGljaygoZXZ0OiBFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNvbHZlQW5kQ2xvc2UoZXZ0KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGV4dElucHV0ID0gbmV3IFRleHRDb21wb25lbnQoZGl2KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmRlZmF1bHRfdmFsdWUgPz8gXCJcIjtcclxuICAgICAgICB0ZXh0SW5wdXQuaW5wdXRFbC5hZGRDbGFzcyhcInRlbXBsYXRlci1wcm9tcHQtaW5wdXRcIik7XHJcbiAgICAgICAgdGV4dElucHV0LnNldFBsYWNlaG9sZGVyKFwiVHlwZSB0ZXh0IGhlcmVcIik7XHJcbiAgICAgICAgdGV4dElucHV0LnNldFZhbHVlKHRoaXMudmFsdWUpO1xyXG4gICAgICAgIHRleHRJbnB1dC5vbkNoYW5nZSgodmFsdWUpID0+ICh0aGlzLnZhbHVlID0gdmFsdWUpKTtcclxuICAgICAgICB0ZXh0SW5wdXQuaW5wdXRFbC5mb2N1cygpO1xyXG4gICAgICAgIHRleHRJbnB1dC5pbnB1dEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldnQ6IEtleWJvYXJkRXZlbnQpID0+XHJcbiAgICAgICAgICAgIHRoaXMuZW50ZXJDYWxsYmFjayhldnQpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGVudGVyQ2FsbGJhY2soZXZ0OiBLZXlib2FyZEV2ZW50KSB7XHJcbiAgICAgICAgLy8gRml4IGZvciBLb3JlYW4gaW5wdXRzIGh0dHBzOi8vZ2l0aHViLmNvbS9TaWxlbnRWb2lkMTMvVGVtcGxhdGVyL2lzc3Vlcy8xMjg0XHJcbiAgICAgICAgaWYgKGV2dC5pc0NvbXBvc2luZyB8fCBldnQua2V5Q29kZSA9PT0gMjI5KSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm11bHRpX2xpbmUpIHtcclxuICAgICAgICAgICAgaWYgKFBsYXRmb3JtLmlzRGVza3RvcCAmJiBldnQua2V5ID09PSBcIkVudGVyXCIgJiYgIWV2dC5zaGlmdEtleSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNvbHZlQW5kQ2xvc2UoZXZ0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChldnQua2V5ID09PSBcIkVudGVyXCIpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzb2x2ZUFuZENsb3NlKGV2dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZXNvbHZlQW5kQ2xvc2UoZXZ0OiBFdmVudCB8IEtleWJvYXJkRXZlbnQpIHtcclxuICAgICAgICB0aGlzLnN1Ym1pdHRlZCA9IHRydWU7XHJcbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdGhpcy5yZXNvbHZlKHRoaXMudmFsdWUpO1xyXG4gICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBvcGVuQW5kR2V0VmFsdWUoXHJcbiAgICAgICAgcmVzb2x2ZTogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQsXHJcbiAgICAgICAgcmVqZWN0OiAocmVhc29uPzogVGVtcGxhdGVyRXJyb3IpID0+IHZvaWRcclxuICAgICk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7XHJcbiAgICAgICAgdGhpcy5yZWplY3QgPSByZWplY3Q7XHJcbiAgICAgICAgdGhpcy5vcGVuKCk7XHJcbiAgICB9XHJcbn1cclxuIl19