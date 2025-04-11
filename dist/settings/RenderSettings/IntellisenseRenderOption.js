/**
 * The recongized render setting options
 */
export var IntellisenseRenderOption;
(function (IntellisenseRenderOption) {
    IntellisenseRenderOption[IntellisenseRenderOption["Off"] = 0] = "Off";
    IntellisenseRenderOption[IntellisenseRenderOption["RenderDescriptionParameterReturn"] = 1] = "RenderDescriptionParameterReturn";
    IntellisenseRenderOption[IntellisenseRenderOption["RenderDescriptionParameterList"] = 2] = "RenderDescriptionParameterList";
    IntellisenseRenderOption[IntellisenseRenderOption["RenderDescriptionReturn"] = 3] = "RenderDescriptionReturn";
    IntellisenseRenderOption[IntellisenseRenderOption["RenderDescriptionOnly"] = 4] = "RenderDescriptionOnly";
})(IntellisenseRenderOption || (IntellisenseRenderOption = {}));
/**
 *
 * @param value The intellisense render setting
 * @returns True if the Return Intellisense should render, otherwise false
 */
export function shouldRenderReturns(render_setting) {
    // Render override
    if (isBoolean(render_setting))
        return render_setting;
    return [
        IntellisenseRenderOption.RenderDescriptionParameterReturn,
        IntellisenseRenderOption.RenderDescriptionReturn
    ].includes(render_setting);
}
/**
 *
 * @param value The intellisense render setting
 * @returns True if the Parameters Intellisense should render, otherwise false
 */
export function shouldRenderParameters(render_setting) {
    // Render override
    if (isBoolean(render_setting))
        return render_setting;
    return [
        IntellisenseRenderOption.RenderDescriptionParameterReturn,
        IntellisenseRenderOption.RenderDescriptionParameterList
    ].includes(render_setting);
}
/**
 *
 * @param value The intellisense render setting
 * @returns True if the Description Intellisense should render, otherwise false
 */
export function shouldRenderDescription(render_setting) {
    // Render override
    if (isBoolean(render_setting))
        return render_setting;
    return render_setting != IntellisenseRenderOption.Off;
}
