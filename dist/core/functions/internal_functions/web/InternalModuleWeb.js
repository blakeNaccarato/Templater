import { __awaiter } from "tslib";
import { requestUrl } from "obsidian";
import { TemplaterError } from "utils/Error";
import { InternalModule } from "../InternalModule";
export class InternalModuleWeb extends InternalModule {
    constructor() {
        super(...arguments);
        this.name = "web";
    }
    create_static_templates() {
        return __awaiter(this, void 0, void 0, function* () {
            this.static_functions.set("daily_quote", this.generate_daily_quote());
            this.static_functions.set("request", this.generate_request());
            this.static_functions.set("random_picture", this.generate_random_picture());
        });
    }
    create_dynamic_templates() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    teardown() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    getRequest(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield requestUrl(url);
                if (response.status < 200 && response.status >= 300) {
                    throw new TemplaterError("Error performing GET request");
                }
                return response;
            }
            catch (error) {
                throw new TemplaterError("Error performing GET request");
            }
        });
    }
    generate_daily_quote() {
        return () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.getRequest("https://raw.githubusercontent.com/Zachatoo/quotes-database/refs/heads/main/quotes.json");
                const quotes = response.json;
                const random_quote = quotes[Math.floor(Math.random() * quotes.length)];
                const { quote, author } = random_quote;
                const new_content = `> [!quote] ${quote}\n> — ${author}`;
                return new_content;
            }
            catch (error) {
                new TemplaterError("Error generating daily quote");
                return "Error generating daily quote";
            }
        });
    }
    generate_random_picture() {
        return (size, query, include_size = false) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.getRequest(`https://templater-unsplash-2.fly.dev/${query ? "?q=" + query : ""}`).then((res) => res.json);
                let url = response.full;
                if (size && !include_size) {
                    if (size.includes("x")) {
                        const [width, height] = size.split("x");
                        url = url.concat(`&w=${width}&h=${height}`);
                    }
                    else {
                        url = url.concat(`&w=${size}`);
                    }
                }
                if (include_size) {
                    return `![photo by ${response.photog}(${response.photogUrl}) on Unsplash|${size}](${url})`;
                }
                return `![photo by ${response.photog}(${response.photogUrl}) on Unsplash](${url})`;
            }
            catch (error) {
                new TemplaterError("Error generating random picture");
                return "Error generating random picture";
            }
        });
    }
    generate_request() {
        return (url, path) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.getRequest(url);
                const jsonData = yield response.json;
                if (path && jsonData) {
                    return path.split(".").reduce((obj, key) => {
                        if (obj && obj.hasOwnProperty(key)) {
                            return obj[key];
                        }
                        else {
                            throw new Error(`Path ${path} not found in the JSON response`);
                        }
                    }, jsonData);
                }
                return jsonData;
            }
            catch (error) {
                console.error(error);
                throw new TemplaterError("Error fetching and extracting value");
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJuYWxNb2R1bGVXZWIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY29yZS9mdW5jdGlvbnMvaW50ZXJuYWxfZnVuY3Rpb25zL3dlYi9JbnRlcm5hbE1vZHVsZVdlYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLFVBQVUsRUFBc0IsTUFBTSxVQUFVLENBQUM7QUFDMUQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUM3QyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFHbkQsTUFBTSxPQUFPLGlCQUFrQixTQUFRLGNBQWM7SUFBckQ7O1FBQ0ksU0FBSSxHQUFlLEtBQUssQ0FBQztJQXlHN0IsQ0FBQztJQXZHUyx1QkFBdUI7O1lBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUNyQixnQkFBZ0IsRUFDaEIsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQ2pDLENBQUM7UUFDTixDQUFDO0tBQUE7SUFFSyx3QkFBd0I7OERBQW1CLENBQUM7S0FBQTtJQUU1QyxRQUFROzhEQUFtQixDQUFDO0tBQUE7SUFFNUIsVUFBVSxDQUFDLEdBQVc7O1lBQ3hCLElBQUk7Z0JBQ0EsTUFBTSxRQUFRLEdBQUcsTUFBTSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxHQUFHLEVBQUU7b0JBQ2pELE1BQU0sSUFBSSxjQUFjLENBQUMsOEJBQThCLENB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Q0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7d0JBQ3ZDLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7NEJBQ2hDLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3lCQUNuQjs2QkFBTTs0QkFDSCxNQUFNLElBQUksS0FBSyxDQUNYLFFBQVEsSUFBSSxpQ0FBaUMsQ0FDaEQsQ0FBQzt5QkFDTDtvQkFDTCxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7aUJBQ2hCO2dCQUVELE9BQU8sUUFBUSxDQUFDO2FBQ25CO1lBQUMsT0FBTyxLQUFLLEVBQUU7Z0JBQ1osT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckIsTUFBTSxJQUFJLGNBQWMsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO2FBQ25FO1FBQ0wsQ0FBQyxDQUFBLENBQUM7SUFDTixDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXF1ZXN0VXJsLCBSZXF1ZXN0VXJsUmVzcG9uc2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgVGVtcGxhdGVyRXJyb3IgfSBmcm9tIFwidXRpbHMvRXJyb3JcIjtcclxuaW1wb3J0IHsgSW50ZXJuYWxNb2R1bGUgfSBmcm9tIFwiLi4vSW50ZXJuYWxNb2R1bGVcIjtcclxuaW1wb3J0IHsgTW9kdWxlTmFtZSB9IGZyb20gXCJlZGl0b3IvVHBEb2N1bWVudGF0aW9uXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxNb2R1bGVXZWIgZXh0ZW5kcyBJbnRlcm5hbE1vZHVsZSB7XHJcbiAgICBuYW1lOiBNb2R1bGVOYW1lID0gXCJ3ZWJcIjtcclxuXHJcbiAgICBhc3luYyBjcmVhdGVfc3RhdGljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwiZGFpbHlfcXVvdGVcIiwgdGhpcy5nZW5lcmF0ZV9kYWlseV9xdW90ZSgpKTtcclxuICAgICAgICB0aGlzLnN0YXRpY19mdW5jdGlvbnMuc2V0KFwicmVxdWVzdFwiLCB0aGlzLmdlbmVyYXRlX3JlcXVlc3QoKSk7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNfZnVuY3Rpb25zLnNldChcclxuICAgICAgICAgICAgXCJyYW5kb21fcGljdHVyZVwiLFxyXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlX3JhbmRvbV9waWN0dXJlKClcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNyZWF0ZV9keW5hbWljX3RlbXBsYXRlcygpOiBQcm9taXNlPHZvaWQ+IHt9XHJcblxyXG4gICAgYXN5bmMgdGVhcmRvd24oKTogUHJvbWlzZTx2b2lkPiB7fVxyXG5cclxuICAgIGFzeW5jIGdldFJlcXVlc3QodXJsOiBzdHJpbmcpOiBQcm9taXNlPFJlcXVlc3RVcmxSZXNwb25zZT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybCh1cmwpO1xyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzIDwgMjAwICYmIHJlc3BvbnNlLnN0YXR1cyA+PSAzMDApIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcIkVycm9yIHBlcmZvcm1pbmcgR0VUIHJlcXVlc3RcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUZW1wbGF0ZXJFcnJvcihcIkVycm9yIHBlcmZvcm1pbmcgR0VUIHJlcXVlc3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX2RhaWx5X3F1b3RlKCk6ICgpID0+IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXRSZXF1ZXN0KFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL1phY2hhdG9vL3F1b3Rlcy1kYXRhYmFzZS9yZWZzL2hlYWRzL21haW4vcXVvdGVzLmpzb25cIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHF1b3RlcyA9IHJlc3BvbnNlLmpzb247XHJcbiAgICAgICAgICAgICAgICBjb25zdCByYW5kb21fcXVvdGUgPVxyXG4gICAgICAgICAgICAgICAgICAgIHF1b3Rlc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBxdW90ZXMubGVuZ3RoKV07XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgeyBxdW90ZSwgYXV0aG9yIH0gPSByYW5kb21fcXVvdGU7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdfY29udGVudCA9IGA+IFshcXVvdGVdICR7cXVvdGV9XFxuPiDigJQgJHthdXRob3J9YDtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3X2NvbnRlbnQ7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBuZXcgVGVtcGxhdGVyRXJyb3IoXCJFcnJvciBnZW5lcmF0aW5nIGRhaWx5IHF1b3RlXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiRXJyb3IgZ2VuZXJhdGluZyBkYWlseSBxdW90ZVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBnZW5lcmF0ZV9yYW5kb21fcGljdHVyZSgpOiAoXHJcbiAgICAgICAgc2l6ZTogc3RyaW5nLFxyXG4gICAgICAgIHF1ZXJ5Pzogc3RyaW5nLFxyXG4gICAgICAgIGluY2x1ZGVfc2l6ZT86IGJvb2xlYW5cclxuICAgICkgPT4gUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgICAgICByZXR1cm4gYXN5bmMgKHNpemU6IHN0cmluZywgcXVlcnk/OiBzdHJpbmcsIGluY2x1ZGVfc2l6ZSA9IGZhbHNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuZ2V0UmVxdWVzdChcclxuICAgICAgICAgICAgICAgICAgICBgaHR0cHM6Ly90ZW1wbGF0ZXItdW5zcGxhc2gtMi5mbHkuZGV2LyR7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXJ5ID8gXCI/cT1cIiArIHF1ZXJ5IDogXCJcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1gXHJcbiAgICAgICAgICAgICAgICApLnRoZW4oKHJlcykgPT4gcmVzLmpzb24pO1xyXG4gICAgICAgICAgICAgICAgbGV0IHVybCA9IHJlc3BvbnNlLmZ1bGw7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZSAmJiAhaW5jbHVkZV9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNpemUuaW5jbHVkZXMoXCJ4XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFt3aWR0aCwgaGVpZ2h0XSA9IHNpemUuc3BsaXQoXCJ4XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmwgPSB1cmwuY29uY2F0KGAmdz0ke3dpZHRofSZoPSR7aGVpZ2h0fWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybCA9IHVybC5jb25jYXQoYCZ3PSR7c2l6ZX1gKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZV9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAhW3Bob3RvIGJ5ICR7cmVzcG9uc2UucGhvdG9nfSgke3Jlc3BvbnNlLnBob3RvZ1VybH0pIG9uIFVuc3BsYXNofCR7c2l6ZX1dKCR7dXJsfSlgO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGAhW3Bob3RvIGJ5ICR7cmVzcG9uc2UucGhvdG9nfSgke3Jlc3BvbnNlLnBob3RvZ1VybH0pIG9uIFVuc3BsYXNoXSgke3VybH0pYDtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIG5ldyBUZW1wbGF0ZXJFcnJvcihcIkVycm9yIGdlbmVyYXRpbmcgcmFuZG9tIHBpY3R1cmVcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJFcnJvciBnZW5lcmF0aW5nIHJhbmRvbSBwaWN0dXJlXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlX3JlcXVlc3QoKTogKHVybDogc3RyaW5nLCBwYXRoPzogc3RyaW5nKSA9PiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIHJldHVybiBhc3luYyAodXJsOiBzdHJpbmcsIHBhdGg/OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5nZXRSZXF1ZXN0KHVybCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBqc29uRGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb247XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHBhdGggJiYganNvbkRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aC5zcGxpdChcIi5cIikucmVkdWNlKChvYmosIGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2JqICYmIG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2JqW2tleV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYFBhdGggJHtwYXRofSBub3QgZm91bmQgaW4gdGhlIEpTT04gcmVzcG9uc2VgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwganNvbkRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBqc29uRGF0YTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFRlbXBsYXRlckVycm9yKFwiRXJyb3IgZmV0Y2hpbmcgYW5kIGV4dHJhY3RpbmcgdmFsdWVcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbiJdfQ==