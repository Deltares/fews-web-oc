import type { JsonSchema7 } from '@jsonforms/core'
import type { ErrorObject } from 'ajv'
import type {
  WhatIfScenarioDescriptor,
  WhatIfTemplate,
} from '@deltares/fews-pi-requests'
import { convertJSDateToFewsPiParameter } from '@/lib/date'

export type TemplateProperty = NonNullable<WhatIfTemplate['properties']>[number]
export type ScenarioProperty = NonNullable<
  WhatIfScenarioDescriptor['properties']
>[number]
export type ScenarioValue = string | number | boolean | Date
export type ScenarioData = Record<string, ScenarioValue | undefined>

const EXCLUDED_PROPERTY_IDS = ['GET_PROCESS_DATA', 'hideT0']

function isValidPropertyId(id: string | undefined) {
  return id !== undefined && !EXCLUDED_PROPERTY_IDS.includes(id)
}

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
    if (!isValidPropertyId(property.id)) return

    schemaProperties[property.id] =
      convertPropertyToJsonSchemaProperty(property)
  })

  return {
    type: 'object',
    properties: schemaProperties,
    required: Object.keys(schemaProperties),
  }
}

export function getJsonDataFromProperties(
  templateProperties: WhatIfTemplate['properties'],
  scenarioProperties: WhatIfScenarioDescriptor['properties'],
) {
  const data: ScenarioData = {}

  templateProperties?.forEach((property) => {
    if (!isValidPropertyId(property.id)) return

    const schemaProperty = convertPropertyToJsonSchemaProperty(property)
    data[property.id] = schemaProperty.default
  })

  scenarioProperties?.forEach((property) => {
    if (!isValidPropertyId(property.id)) return

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
      return {
        type: 'string',
        title: property.name,
        default: property.templateId,
      }
    case 'configFile':
      return {
        type: 'string',
        title: property.name,
        default: property.default,
      }
    default:
      console.warn('Unsupported property type:', property)
      return {}
  }
}

export function getErrorsForProperties(
  properties: ScenarioData,
  schema: JsonSchema7 | undefined,
) {
  const errors: ErrorObject[] = []
  for (const key in properties) {
    if (!schema?.properties) continue

    const property = schema.properties[key]
    if (!property) continue

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

/**
 * Converts scenario properties to a format compatible with FEWS PI API.
 * @param properties - A record of property key-value pairs to be converted
 * @param template - The WhatIfTemplate that defines the property types and conversion rules
 * @returns A record of converted properties with string or number values compatible with FEWS PI
 * @remarks
 * - If no template is provided, properties are returned as-is cast to the appropriate type
 * - Handles type-specific conversions:
 *   - string: converts to String type
 *   - number: converts to Number type
 *   - dateTime: converts Date to FEWS PI query parameter format
 *   - other types: passed through unchanged
 * - Properties without matching template definitions are skipped
 */
export function convertPropertiesToFewsPi(
  properties: Record<string, any>,
  template: WhatIfTemplate | undefined,
): Record<string, string | number> {
  if (!template) return properties as Record<string, string | number>
  const converted: Record<string, string | number> = {}
  for (const key in properties) {
    const prop = template.properties?.find((p) => p.id === key)
    switch (prop?.type) {
      case 'dateTime':
        converted[key] =
          convertJSDateToFewsPiParameter(new Date(properties[key])) ?? ''
        break
      default:
        converted[key] = properties[key]
    }
  }
  return converted
}
