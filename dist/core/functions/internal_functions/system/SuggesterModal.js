import { TemplaterError } from "utils/Error";
import { FuzzySuggestModal } from "obsidian";
export class SuggesterModal extends FuzzySuggestModal {
    constructor(app, text_items, items, placeholder, limit) {
        super(app);
        this.text_items = text_items;
        this.items = items;
        this.submitted = false;
        this.setPlaceholder(placeholder);
        limit && (this.limit = limit);
    }
    getItems() {
        return this.items;
    }
    onClose() {
        if (!this.submitted) {
            this.reject(new TemplaterError("Cancelled prompt"));
        }
    }
    selectSuggestion(value, evt) {
        this.submitted = true;
        this.close();
        this.onChooseSuggestion(value, evt);
    }
    getItemText(item) {
        if (this.text_items instanceof Function) {
            return this.text_items(item);
        }
        return (this.text_items[this.items.indexOf(item)] || "Undefined Text Item");
    }
    onChooseItem(item) {
        this.resolve(item);
    }
    async openAndGetValue(resolve, reject) {
        this.resolve = resolve;
        this.reject = reject;
        this.open();
    }
}
