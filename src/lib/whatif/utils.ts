import type { JsonSchema7 } from '@jsonforms/core'
import type { ErrorObject } from 'ajv'
import type {
  WhatIfScenarioDescriptor,
  WhatIfTemplate,
} from '@deltares/fews-pi-requests'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import { WhatIfProperty } from './types'

export type TemplateProperty = NonNullable<WhatIfTemplate['properties']>[number]
export type ScenarioProperty = NonNullable<
  WhatIfScenarioDescriptor['properties']
>[number]
export type ScenarioValue = string | number | boolean | Date
export type ScenarioData = Record<string, ScenarioValue | undefined>

export interface RelativeViewPeriodOptions {
  startHours: number
  endHours: number
}
export interface CardinalTimeStepOptions {
  timeZoneOffset: number
  timeStepHours: number
}
export interface DateValidationOptions {
  relativeViewPeriod?: RelativeViewPeriodOptions
  cardinalTimeStep?: CardinalTimeStepOptions
}
export interface ExtendedJsonSchema7 extends JsonSchema7 {
  dateValidation?: DateValidationOptions
}

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
): ExtendedJsonSchema7 {
  const schemaProperties: NonNullable<ExtendedJsonSchema7['properties']> = {}

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
): ExtendedJsonSchema7 {
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
      const dateValidation = convertPropertyToDateValidationOptions(property)
      return {
        type: 'string',
        format: 'date-time',
        default: property.defaultValue,
        title: property.name,
        dateValidation,
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

// TODO: these types should come from fews-pi-requests instead; they should be
//       added to the API specification?
interface RawRelativeViewPeriod {
  unit: string
  start: string
  end: string
}

interface RawCardinalTimeStep {
  timeZone: string
  unit: string
  multiplier: 1
}

function convertPropertyToDateValidationOptions(
  property: TemplateProperty,
): DateValidationOptions | undefined {
  const relativeViewPeriod = convertRelativeViewPeriodToOptions(property)
  const cardinalTimeStep = convertCardinalTimeStepToOptions(property)
  if (relativeViewPeriod || cardinalTimeStep) {
    return { relativeViewPeriod, cardinalTimeStep }
  } else {
    return undefined
  }
}

function convertRelativeViewPeriodToOptions(
  property: TemplateProperty,
): RelativeViewPeriodOptions | undefined {
  // @ts-expect-error  this field should be added to the type.
  const raw = property.relativeViewPeriod as RawRelativeViewPeriod | undefined
  if (!raw) return undefined

  return {
    startHours: convertMultiplierToHours(parseFloat(raw.start), raw.unit),
    endHours: convertMultiplierToHours(parseFloat(raw.end), raw.unit),
  }
}

function convertCardinalTimeStepToOptions(
  property: TemplateProperty,
): CardinalTimeStepOptions | undefined {
  // @ts-expect-error  this field should be added to the type.
  const raw = property.cardinalTimeStep as RawCardinalTimeStep | undefined
  if (!raw) return undefined

  if (raw?.timeZone !== 'GMT') {
    throw new Error('Only "GMT" timezone is supported.')
  }
  return {
    timeZoneOffset: 0,
    timeStepHours: convertMultiplierToHours(raw.multiplier, raw.unit),
  }
}

function convertMultiplierToHours(multiplier: number, unit: string): number {
  if (unit !== 'day' && unit !== 'hour') {
    throw new Error('Invalid unit for time multiplier, use "day" or "hour".')
  }
  const factor = unit === 'day' ? 24 : 1
  return factor * multiplier
}

export function getErrorsForProperties(
  properties: ScenarioData,
  schema: ExtendedJsonSchema7 | undefined,
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
 * Converts scenario properties to a format compatible with the FEWS PI API.
 * @param properties - A record of property key-value pairs to be converted
 * @param template - The WhatIfTemplate that defines property types used for conversion
 * @returns A record of properties with values compatible with FEWS PI
 * @remarks
 * - If no template is provided, properties are returned as-is.
 * - Handles type-specific conversions only for:
 *   - dateTime: converts Date-like values to FEWS PI query parameter format.
 * - All other property types, including those without matching template definitions,
 *   are passed through unchanged.
 */
export function convertPropertiesToFewsPi(
  properties: Record<string, any>,
  templateProperties: WhatIfProperty[] | undefined,
): Record<string, string | number> {
  if (!templateProperties) return properties as Record<string, string | number>
  const converted: Record<string, string | number> = {}
  for (const [key, property] of Object.entries(properties)) {
    const prop = templateProperties?.find((p) => p.id === key)
    switch (prop?.type) {
      case 'dateTime': {
        const convertedValue = convertJSDateToFewsPiParameter(
          new Date(properties[key]),
        )
        if (convertedValue != null) {
          converted[key] = convertedValue
        }
        break
      }
      default:
        converted[key] = property
    }
  }
  return converted
}
