import { moment } from "obsidian";
import { TemplaterError } from "utils/Error";
import { InternalModule } from "../InternalModule";
export class InternalModuleDate extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "date";
    }
    async create_static_templates() {
        this.static_functions.set("now", this.generate_now());
        this.static_functions.set("tomorrow", this.generate_tomorrow());
        this.static_functions.set("weekday", this.generate_weekday());
        this.static_functions.set("yesterday", this.generate_yesterday());
    }
    async create_dynamic_templates() { }
    async teardown() { }
    generate_now() {
        return (format = "YYYY-MM-DD", offset, reference, reference_format) => {
            if (reference && !moment(reference, reference_format).isValid()) {
                throw new TemplaterError("Invalid reference date format, try specifying one with the argument 'reference_format'");
            }
            let duration;
            if (typeof offset === "string") {
                duration = moment.duration(offset);
            }
            else if (typeof offset === "number") {
                duration = moment.duration(offset, "days");
            }
            return moment(reference, reference_format)
                .add(duration)
                .format(format);
        };
    }
    generate_tomorrow() {
        return (format = "YYYY-MM-DD") => {
            return moment().add(1, "days").format(format);
        };
    }
    generate_weekday() {
        return (format = "YYYY-MM-DD", weekday, reference, reference_format) => {
            if (reference && !moment(reference, reference_format).isValid()) {
                throw new TemplaterError("Invalid reference date format, try specifying one with the argument 'reference_format'");
            }
            return moment(reference, reference_format)
                .weekday(weekday)
                .format(format);
        };
    }
    generate_yesterday() {
        return (format = "YYYY-MM-DD") => {
            return moment().add(-1, "days").format(format);
        };
    }
}
