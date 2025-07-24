import type { JsonSchema7 } from '@jsonforms/core'
import type { ErrorObject } from 'ajv'
import type {
  WhatIfScenarioDescriptor,
  WhatIfTemplate,
} from '@deltares/fews-pi-requests'

export type TemplateProperty = NonNullable<WhatIfTemplate['properties']>[number]
export type ScenarioProperty = NonNullable<
  WhatIfScenarioDescriptor['properties']
>[number]
export type ScenarioData = Record<string, string | number | boolean>

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
    required: properties?.map((property) => property.id),
  }
}

export function getJsonDataFromProperties(
  properties: WhatIfScenarioDescriptor['properties'],
) {
  const data: ScenarioData = {}

  properties?.forEach((property) => {
    if (property.id === undefined) return

    if (property.type === 'enumProperty') {
      data[property.id] = property.value.code
    } else {
      data[property.id] = property.value
    }
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
        title: property.name,
      }
    case 'enumProperty':
      return {
        type: 'string',
        default: property.defaultValue,
        oneOf: property.values.map((value) => ({
          const: value.code,
          title: value.label,
        })),
        title: property.name,
      }
    case 'multiProperty':
      return {
        type: 'string',
        default: property.defaultValue,
        oneOf: property.selectionOptions.map((value) => ({
          const: value.code,
          title: value.label,
        })),
        title: property.name,
      }
    case 'number':
      return {
        type: 'number',
        default: property.defaultValue,
        minimum: property.minValue,
        maximum: property.maxValue,
        title: property.name,
        description: `Min: ${property.minValue}, Max: ${property.maxValue}`,
      }
    case 'integer':
      return {
        type: 'integer',
        default: property.defaultValue,
        title: property.name,
      }
    case 'boolean':
      return {
        type: 'boolean',
        default: property.defaultValue,
        title: property.name,
      }
    case 'dateTime':
      return {
        type: 'string',
        format: 'date-time',
        default: property.defaultValue,
        title: property.name,
      }
    case 'whatIfTemplateTemplateId':
    case 'configFile':
      return {
        type: 'string',
        title: property.name,
      }
  }
}

export function getErrorsForProperties(
  properties: ScenarioData,
  schema: JsonSchema7,
) {
  const errors: ErrorObject[] = []
  for (const key in properties) {
    if (!schema.properties) continue

    const property = schema.properties[key]

    if (property.type === 'integer') {
      const value = properties[key] as number
      const title = property.title
      if (!isInteger(value.toString())) {
        errors.push({
          keyword: 'type',
          instancePath: `/${key}`,
          schemaPath: `#/properties/${key}/type`,
          params: { type: 'integer' },
          message: `"${title}" must be an integer`,
        })
      }
    }

    if (schema.required && schema.required.includes(key)) {
      if (properties[key] === undefined || properties[key] === null) {
        errors.push({
          keyword: 'required',
          instancePath: `/${key}`,
          schemaPath: `#/required`,
          params: { missingProperty: key },
          message: `"${key}" is a required property`,
        })
      }
    }

    if (property.type === 'number') {
      const value = properties[key] as number
      const min = property.minimum
      const max = property.maximum
      const title = property.title
      if (!isNumber(value.toString())) {
        errors.push({
          keyword: 'type',
          instancePath: `/${key}`,
          schemaPath: `#/properties/${key}/type`,
          params: { type: 'number' },
          message: `"${title}" must be a number`,
        })
      }
      if (min !== undefined && (value as number) < min) {
        errors.push({
          keyword: 'minimum',
          instancePath: `/${key}`,
          schemaPath: `#/properties/${key}/minimum`,
          params: { comparison: '>=', limit: min },
          message: `"${title}" must be greater than or equal to ${min}`,
        })
      }
      if (max !== undefined && (value as number) > max) {
        errors.push({
          keyword: 'maximum',
          instancePath: `/${key}`,
          schemaPath: `#/properties/${key}/maximum`,
          params: { comparison: '<=', limit: max },
          message: `"${title}" must be less than or equal to ${max}`,
        })
      }
    }
  }
  return errors
}

function isNumber(value: string) {
  return !isNaN(Number(value))
}

function isInteger(value: string) {
  return Number.isInteger(Number(value))
}
