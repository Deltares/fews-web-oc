import type {
  CorrelationFilter,
  TimeSeriesFilter,
  filterActionsFilter,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import type { DataDownloadFilter } from '@/lib/download/types'

export type Filter =
  | timeSeriesGridActionsFilter
  | filterActionsFilter
  | TimeSeriesFilter
  | DataDownloadFilter
  | CorrelationFilter

export function isFilterActionsFilter(
  filter: Filter,
): filter is filterActionsFilter {
  return (filter as filterActionsFilter).filterId !== undefined
}

export function isTimeSeriesGridActionsFilter(
  filter: Filter,
): filter is timeSeriesGridActionsFilter {
  return (filter as timeSeriesGridActionsFilter).x !== undefined
}

export function isDataDownloadFilter(
  filter: Filter,
): filter is DataDownloadFilter {
  return (filter as DataDownloadFilter)?.filterId !== undefined
}

export function isTimeSeriesFilter(filter: Filter): filter is TimeSeriesFilter {
  // @ts-expect-error: FIXME: Should be updated in the json schema and PI requests
  return (filter as TimeSeriesFilter).timeSeriesIds !== undefined
}
export function isCorrelationFilter(
  filter: Filter,
): filter is CorrelationFilter {
  return (filter as CorrelationFilter).timeSeriesIdXaxis !== undefined
}
