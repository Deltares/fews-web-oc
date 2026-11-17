import type {
  FilterActionsFilter,
  TimeSeriesParameter,
} from '@deltares/fews-pi-requests'

type SelectionParameter = Pick<TimeSeriesParameter, 'id' | 'parameterGroup'>

export function createSelectionFilters(
  filterId: string | undefined,
  locationIds: string[],
  parameters: (SelectionParameter | undefined)[],
  moduleInstanceIds: string[],
): FilterActionsFilter[] {
  if (!filterId || !locationIds.length) return []

  const parameterIdsByGroup = new Map<string, string[]>()
  parameters.forEach((parameter) => {
    const group = parameter?.parameterGroup
    if (!group) return

    const parameterIds = parameterIdsByGroup.get(group) ?? []
    parameterIds.push(parameter.id)
    parameterIdsByGroup.set(group, parameterIds)
  })

  return Array.from(parameterIdsByGroup.values(), (parameterIds) => ({
    filterId,
    locationIds: locationIds.join(','),
    parameterIds: parameterIds.join(','),
    moduleInstanceIds: moduleInstanceIds.length
      ? moduleInstanceIds.join(',')
      : undefined,
  }))
}
