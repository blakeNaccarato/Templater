import { __awaiter } from "tslib";
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
export function errorWrapper(fn, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield fn();
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
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXJyb3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvRXJyb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFFbEMsTUFBTSxPQUFPLGNBQWUsU0FBUSxLQUFLO0lBQ3JDLFlBQVksR0FBVyxFQUFTLFdBQW9CO1FBQ2hELEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQURpQixnQkFBVyxHQUFYLFdBQVcsQ0FBUztRQUVoRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO1FBQ2xDLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQ3pCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ25EO0lBQ0wsQ0FBQztDQUNKO0FBRUQsTUFBTSxVQUFnQixZQUFZLENBQzlCLEVBQW9CLEVBQ3BCLEdBQVc7O1FBRVgsSUFBSTtZQUNBLE9BQU8sTUFBTSxFQUFFLEVBQUUsQ0FBQztTQUNyQjtRQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ1IsSUFBSSxDQUFDLENBQUMsQ0FBQyxZQUFZLGNBQWMsQ0FBQyxFQUFFO2dCQUNoQyxTQUFTLENBQUMsSUFBSSxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQ2pEO2lCQUFNO2dCQUNILFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNoQjtZQUNELE9BQU8sSUFBUyxDQUFDO1NBQ3BCO0lBQ0wsQ0FBQztDQUFBO0FBRUQsTUFBTSxVQUFVLGdCQUFnQixDQUFJLEVBQVcsRUFBRSxHQUFXO0lBQ3hELElBQUk7UUFDQSxPQUFPLEVBQUUsRUFBRSxDQUFDO0tBQ2Y7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNSLFNBQVMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDOUMsT0FBTyxJQUFTLENBQUM7S0FDcEI7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbG9nX2Vycm9yIH0gZnJvbSBcIi4vTG9nXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVyRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgICBjb25zdHJ1Y3Rvcihtc2c6IHN0cmluZywgcHVibGljIGNvbnNvbGVfbXNnPzogc3RyaW5nKSB7XHJcbiAgICAgICAgc3VwZXIobXNnKTtcclxuICAgICAgICB0aGlzLm5hbWUgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgICAgICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XHJcbiAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVycm9yV3JhcHBlcjxUPihcclxuICAgIGZuOiAoKSA9PiBQcm9taXNlPFQ+LFxyXG4gICAgbXNnOiBzdHJpbmdcclxuKTogUHJvbWlzZTxUPiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBhd2FpdCBmbigpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGlmICghKGUgaW5zdGFuY2VvZiBUZW1wbGF0ZXJFcnJvcikpIHtcclxuICAgICAgICAgICAgbG9nX2Vycm9yKG5ldyBUZW1wbGF0ZXJFcnJvcihtc2csIGUubWVzc2FnZSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxvZ19lcnJvcihlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGwgYXMgVDtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVycm9yV3JhcHBlclN5bmM8VD4oZm46ICgpID0+IFQsIG1zZzogc3RyaW5nKTogVCB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBmbigpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGxvZ19lcnJvcihuZXcgVGVtcGxhdGVyRXJyb3IobXNnLCBlLm1lc3NhZ2UpKTtcclxuICAgICAgICByZXR1cm4gbnVsbCBhcyBUO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==