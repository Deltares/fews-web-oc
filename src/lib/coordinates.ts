export const COORDINATE_DECIMAL_PLACES = 5

export function roundCoordinateToString(value: number): string {
  return value.toFixed(COORDINATE_DECIMAL_PLACES)
}
