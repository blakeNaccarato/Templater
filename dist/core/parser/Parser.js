import { __awaiter } from "tslib";
import init, { ParserConfig, Renderer } from "@silentvoid13/rusty_engine";
// TODO: find a cleaner way to embed wasm
// @ts-ignore
import { default as wasmbin } from "../../../node_modules/@silentvoid13/rusty_engine/rusty_engine_bg.wasm";
export class Parser {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield init(wasmbin);
            const config = new ParserConfig("<%", "%>", "\0", "*", "-", "_", "tR");
            this.renderer = new Renderer(config);
        });
    }
    parse_commands(content, context) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.renderer.render_content(content, context);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvcmUvcGFyc2VyL1BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxJQUFJLEVBQUUsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFMUUseUNBQXlDO0FBQ3pDLGFBQWE7QUFDYixPQUFPLEVBQUUsT0FBTyxJQUFJLE9BQU8sRUFBRSxNQUFNLHVFQUF1RSxDQUFDO0FBRTNHLE1BQU0sT0FBTyxNQUFNO0lBR1QsSUFBSTs7WUFDTixNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwQixNQUFNLE1BQU0sR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUN2RSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FBQTtJQUVLLGNBQWMsQ0FDaEIsT0FBZSxFQUNmLE9BQWdDOztZQUVoQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBQUE7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBpbml0LCB7IFBhcnNlckNvbmZpZywgUmVuZGVyZXIgfSBmcm9tIFwiQHNpbGVudHZvaWQxMy9ydXN0eV9lbmdpbmVcIjtcclxuXHJcbi8vIFRPRE86IGZpbmQgYSBjbGVhbmVyIHdheSB0byBlbWJlZCB3YXNtXHJcbi8vIEB0cy1pZ25vcmVcclxuaW1wb3J0IHsgZGVmYXVsdCBhcyB3YXNtYmluIH0gZnJvbSBcIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ac2lsZW50dm9pZDEzL3J1c3R5X2VuZ2luZS9ydXN0eV9lbmdpbmVfYmcud2FzbVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBhcnNlciB7XHJcbiAgICBwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjtcclxuXHJcbiAgICBhc3luYyBpbml0KCkge1xyXG4gICAgICAgIGF3YWl0IGluaXQod2FzbWJpbik7XHJcbiAgICAgICAgY29uc3QgY29uZmlnID0gbmV3IFBhcnNlckNvbmZpZyhcIjwlXCIsIFwiJT5cIiwgXCJcXDBcIiwgXCIqXCIsIFwiLVwiLCBcIl9cIiwgXCJ0UlwiKTtcclxuICAgICAgICB0aGlzLnJlbmRlcmVyID0gbmV3IFJlbmRlcmVyKGNvbmZpZyk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcGFyc2VfY29tbWFuZHMoXHJcbiAgICAgICAgY29udGVudDogc3RyaW5nLFxyXG4gICAgICAgIGNvbnRleHQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+XHJcbiAgICApOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlbmRlcmVyLnJlbmRlcl9jb250ZW50KGNvbnRlbnQsIGNvbnRleHQpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==