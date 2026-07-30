import { toHumanReadableDateTime } from '../date'
import type { WhatIfTemplateProperty } from './types'
import type { ScenarioProperty } from './utils'

export function formatWhatIfScenarioProperty(
  property: ScenarioProperty,
  whatIfTemplateProperty?: WhatIfTemplateProperty,
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
    case 'multiProperty':
      return formatMultiProperty(property, whatIfTemplateProperty)
    default:
      // Handle the rest by just returning its (string) value.
      return property.value
  }
}

function formatMultiProperty(
  property: ScenarioProperty & { type: 'multiProperty' },
  whatIfTemplateProperty?: WhatIfTemplateProperty,
): string {
  // Fall back to just the index if we get no (valid) what-if template
  // property.
  const fallback = String(property.defaultValue ?? '')
  if (
    whatIfTemplateProperty === undefined ||
    whatIfTemplateProperty.type !== 'multiProperty'
  ) {
    return fallback
  }
  const selectedOption = whatIfTemplateProperty.selectionOptions.find(
    (option) => option.code === String(property.defaultValue),
  )
  return selectedOption?.label ?? fallback
}
