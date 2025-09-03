import { ScenarioData } from '@/lib/whatif'

export function isBoundingBoxInFormData(data: ScenarioData): boolean {
  const properties = Object.keys(data)
  return (
    properties.includes('xMin') &&
    properties.includes('yMin') &&
    properties.includes('xMax') &&
    properties.includes('yMax')
  )
}

export function isCoordinateInFormData(data: ScenarioData): boolean {
  const properties = Object.keys(data)
  return properties.includes('latitude') && properties.includes('longitude')
}
