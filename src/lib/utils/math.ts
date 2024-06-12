/**
 * Get decimal places of float
 * @param {number} a - float number
 * @returns {number} The number of decimal places of the float number.
 * @example
 * floatPrecision(54.6545) // 4
 */
export function floatPrecision(a: number): number {
  if (!isFinite(a)) return 0
  var e = 1,
    p = 0
  while (Math.round(a * e) / e !== a) {
    e *= 10
    p++
  }
  return p
}

/**
 * Round a number to the nearest step precision
 * @param {number} value - The number to round.
 * @param {number} step - The step to round to.
 * @returns {number} The rounded number.
 * @example
 * roundToStepPrecision(54.6545, 0.1) // 54.7
 */
export function roundToStepPrecision(value: number, step: number): number {
  const precision = floatPrecision(step)
  return roundToDecimalPlaces(value, precision)
}

/**
 * Round a number to a specified number of decimal places
 * @param {number} value - The number to round.
 * @param {number} decimalPlaces - The number of decimal places to round to.
 * @returns {number} The rounded number.
 * @example
 * roundToDecimalPlaces(54.6545, 2) // 54.65
 */
export function roundToDecimalPlaces(
  value: number,
  decimalPlaces: number,
): number {
  const num = Number(`${value}e+${decimalPlaces}`)
  return Number(Math.round(num) + `e-${decimalPlaces}`)
}
