/**
 * The recongized render setting options
 */
export declare enum IntellisenseRenderOption {
    Off = 0,
    RenderDescriptionParameterReturn = 1,
    RenderDescriptionParameterList = 2,
    RenderDescriptionReturn = 3,
    RenderDescriptionOnly = 4
}
/**
 *
 * @param value The intellisense render setting
 * @returns True if the Return Intellisense should render, otherwise false
 */
export declare function shouldRenderReturns(render_setting: IntellisenseRenderOption | boolean): boolean;
/**
 *
 * @param value The intellisense render setting
 * @returns True if the Parameters Intellisense should render, otherwise false
 */
export declare function shouldRenderParameters(render_setting: IntellisenseRenderOption): boolean;
/**
 *
 * @param value The intellisense render setting
 * @returns True if the Description Intellisense should render, otherwise false
 */
export declare function shouldRenderDescription(render_setting: IntellisenseRenderOption): boolean;
//# sourceMappingURL=IntellisenseRenderOption.d.ts.map