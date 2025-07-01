/**
 * Generates a unique identifier string based on the current timestamp and a random value.
 *
 * @returns {string} A unique identifier composed of the current time in base-36 and a random base-36 string.
 */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
