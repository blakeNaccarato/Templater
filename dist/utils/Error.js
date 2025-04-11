import { log_error } from "./Log";
export class TemplaterError extends Error {
    constructor(msg, console_msg) {
        super(msg);
        this.console_msg = console_msg;
        this.name = this.constructor.name;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
export async function errorWrapper(fn, msg) {
    try {
        return await fn();
    }
    catch (e) {
        if (!(e instanceof TemplaterError)) {
            log_error(new TemplaterError(msg, e.message));
        }
        else {
            log_error(e);
        }
        return null;
    }
}
export function errorWrapperSync(fn, msg) {
    try {
        return fn();
    }
    catch (e) {
        log_error(new TemplaterError(msg, e.message));
        return null;
    }
}
