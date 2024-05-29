import { SecondaryWorkflowProperties } from '@deltares/fews-pi-requests'

/**
 * Generates a JSON schema based on an array of SecondaryWorkflowProperty objects.
 * @param properties An array of SecondaryWorkflowProperty objects.
 * @returns The generated JSON schema.
 */
export function generateJsonSchema(properties: SecondaryWorkflowProperties[]) {
  const schema: any = {
    type: 'object',
    properties: {},
  }

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

    schema.properties[property.key] = {
      type,
    }
  })

  return schema
}

/**
 * Generates a default UI schema based on an array of SecondaryWorkflowProperty objects.
 * @param properties An array of SecondaryWorkflowProperty objects.
 * @returns The generated default UI schema.
 */
export function generateDefaultUISchema(
  properties: SecondaryWorkflowProperties[],
) {
  const uiSchema: any = {
    type: 'VerticalLayout',
    elements: [],
  }

  properties.forEach((property) => {
    if (property.editable === false) return
    const element: any = {
      type: 'Control',
      scope: `#/properties/${property.key}`,
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
