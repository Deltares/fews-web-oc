import { SecondaryWorkflowProperties } from '@deltares/fews-pi-requests'

import { WorkflowFormData } from './types'
import {
  ControlElement,
  JsonSchema,
  UISchemaElement,
  VerticalLayout,
} from '@jsonforms/core'

export function isBoundingBoxInFormData(data: WorkflowFormData): boolean {
  const properties = Object.keys(data)
  return (
    properties.includes('xMin') &&
    properties.includes('yMin') &&
    properties.includes('xMax') &&
    properties.includes('yMax')
  )
}

export function isCoordinateInFormData(data: WorkflowFormData): boolean {
  const properties = Object.keys(data)
  return properties.includes('latitude') && properties.includes('longitude')
}

/**
 * Generates a JSON schema based on an array of SecondaryWorkflowProperty objects.
 * @param properties An array of SecondaryWorkflowProperty objects.
 * @returns The generated JSON schema.
 */
export function generateJsonSchema(
  properties: SecondaryWorkflowProperties[],
): JsonSchema {
  const schemaProperties: { [key: string]: { type: string } } = {}
  properties.forEach((property) => {
    let type = 'string'
    switch (property.type) {
      case 'dateTime':
        type = 'string'
        break
      case 'float':
      case 'double':
      case 'int':
        type = 'number'
        break
      case 'string':
        break
    }

    schemaProperties[property.key] = {
      type,
    }
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
  properties: SecondaryWorkflowProperties[],
): UISchemaElement {
  const uiSchema: VerticalLayout = {
    type: 'VerticalLayout',
    elements: [],
  }

  properties.forEach((property) => {
    if (property.editable === false) return
    const element: ControlElement = {
      type: 'Control',
      scope: `#/properties/${property.key}`,
      label: property.description,
    }

    switch (property.type) {
      case 'dateTime':
        element.options = {
          format: 'date-time',
        }
        break
      case 'float':
      case 'double':
      case 'int':
        element.options = {
          placeholder: property.description,
          format: 'number',
        }
        break
      case 'string':
        element.options = {
          placeholder: property.description,
        }
        break
    }

    uiSchema.elements.push(element)
  })

  return uiSchema
}
