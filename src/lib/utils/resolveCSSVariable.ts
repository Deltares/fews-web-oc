/**
 * Resolves a CSS variable to its value
  * @param {string} cssVariable - The CSS variable to resolve.
  * @returns {string} The value of the CSS variable.
  */
export function resolveCSSVariable(cssVariable: string): string {
  const property = cssVariable.replace('var(', '').replace(')', '')
  return getComputedStyle(document.documentElement).getPropertyValue(property)
}
