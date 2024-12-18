import { WorkflowFormData } from './types'

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
