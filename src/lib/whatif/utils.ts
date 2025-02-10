import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement,
  VerticalLayout,
} from '@jsonforms/core'

import type {
  WhatIfScenarioDescriptor,
  WhatIfTemplate,
} from '@deltares/fews-pi-requests'

export type TemplateProperty = NonNullable<WhatIfTemplate['properties']>[number]
export type ScenarioProperty = NonNullable<
  WhatIfScenarioDescriptor['properties']
>[number]
export type ScenarioData = Record<string, ScenarioProperty['value']>

/**
 * Generates a JSON schema based on an array of SecondaryWorkflowProperty objects.
 * @param properties An array of SecondaryWorkflowProperty objects.
 * @returns The generated JSON schema.
 */
export function generateJsonSchema(
  properties: WhatIfTemplate['properties'],
): JsonSchema7 {
  const schemaProperties: NonNullable<JsonSchema7['properties']> = {}

  properties?.forEach((property) => {
    schemaProperties[property.id] =
      convertPropertyToJsonSchemaProperty(property)
  })

  return {
    type: 'object',
    properties: schemaProperties,
  }
}

/**
 * Generates a default UI schema based on an array of SecondaryWorkflowProperty objects.
 * @param properties An array of SecondaryWorkflowProperty objects.
 * @returns The generated default UI schema.
 */
export function generateDefaultUISchema(
  properties: WhatIfTemplate['properties'],
): UISchemaElement {
  const uiSchema: VerticalLayout = {
    type: 'VerticalLayout',
    elements: [],
  }

  properties?.forEach((property) => {
    const element: ControlElement = {
      type: 'Control',
      scope: `#/properties/${property.id}`,
      label: property.name,
    }

    switch (property.type) {
      case 'dateTime':
        element.options = {
          format: 'date-time',
        }
        break
      case 'number':
      case 'integer':
        element.options = {
          format: 'number',
        }
        break
      case 'boolean':
        element.options = {
          format: 'checkbox',
        }
        break
      case 'configFile':
      case 'whatIfTemplateTemplateId':
      case 'enumProperty':
      case 'string':
        break
    }

    uiSchema.elements.push(element)
  })

  return uiSchema
}

export function getJsonDataFromProperties(
  properties: WhatIfScenarioDescriptor['properties'],
) {
  const data: ScenarioData = {}

  properties?.forEach((property) => {
    data[property.id] = property.value
  })

  return data
}

function convertPropertyToJsonSchemaProperty(
  property: TemplateProperty,
): JsonSchema7 {
  switch (property.type) {
    case 'string':
      return {
        type: 'string',
        default: property.defaultValue,
      }
    case 'enumProperty':
      return {
        type: 'string',
        default: property.defaultValue,
        oneOf: property.values.map((value) => ({
          const: value.code,
          title: value.label,
        })),
      }
    case 'number':
      return {
        type: 'number',
        default: property.defaultValue,
        minimum: property.minValue,
        maximum: property.maxValue,
      }
    case 'integer':
      return {
        type: 'integer',
        default: property.defaultValue,
      }
    case 'boolean':
      return {
        type: 'boolean',
        default: property.defaultValue,
      }
    case 'dateTime':
      return {
        type: 'string',
        format: 'date-time',
        default: property.defaultValue,
      }
    case 'whatIfTemplateTemplateId':
    case 'configFile':
      return {
        type: 'string',
      }
  }
}
