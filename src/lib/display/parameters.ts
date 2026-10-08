import type { LocationQueryValue } from 'vue-router'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'

export function getParameterIds(subplots: ChartConfig[]): string[] {
  return [
    ...new Set(
      subplots.flatMap((subplot) =>
        subplot.series.flatMap((series) =>
          series.parameterId ? [series.parameterId] : [],
        ),
      ),
    ),
  ]
}

export function parseParameterIds(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
): string[] | undefined {
  if (value === undefined) return undefined
  return (Array.isArray(value) ? value : [value]).filter(
    (id): id is string => typeof id === 'string' && id.length > 0,
  )
}

export function filterSubplotsByParameterIds(
  subplots: ChartConfig[],
  parameterIds: string[] | undefined,
): ChartConfig[] {
  if (parameterIds === undefined) return subplots
  const selected = new Set(parameterIds)
  return subplots
    .map((subplot) => ({
      ...subplot,
      series: subplot.series.filter(
        (series) =>
          series.parameterId !== undefined && selected.has(series.parameterId),
      ),
    }))
    .filter((subplot) => subplot.series.length > 0)
}

export function getParameterIdsQuery(
  selected: string[],
  available: string[],
): string[] | string | undefined {
  if (available.every((id) => selected.includes(id))) return undefined
  return selected.length ? selected : ''
}
