import { toHumanReadableDateTime } from '../date'
import { ScenarioProperty } from './utils'

export function formatWhatIfScenarioProperty(
  property: ScenarioProperty,
): string {
  switch (property.type) {
    case 'boolean':
      return property.value ? 'yes' : 'no'
    case 'dateTime':
      return toHumanReadableDateTime(property.value)
    case 'enumProperty':
      return property.value.label
    case 'integer':
    case 'number':
      // Show values with 3 significant digits.
      return property.value.toPrecision(3)
    default:
      // Handle the rest by just returning its (string) value.
      return property.value
  }
}
