import type {
  CorrelationFilter,
  TimeSeriesFilter,
  TimeSeriesTopologyActionsFilter,
  FilterActionsFilter,
  TimeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import type { DataDownloadFilter } from '@/lib/download/types'

export type Filter =
  | TimeSeriesGridActionsFilter
  | FilterActionsFilter
  | TimeSeriesFilter
  | DataDownloadFilter
  | CorrelationFilter
  | TimeSeriesTopologyActionsFilter

export function isFilterActionsFilter(
  filter: Filter,
): filter is FilterActionsFilter {
  return (filter as FilterActionsFilter).filterId !== undefined
}

export function isTimeSeriesGridActionsFilter(
  filter: Filter,
): filter is TimeSeriesGridActionsFilter {
  return (filter as TimeSeriesGridActionsFilter).x !== undefined
}

export function isDataDownloadFilter(
  filter: Filter,
): filter is DataDownloadFilter {
  return (filter as DataDownloadFilter)?.filterId !== undefined
}

export function isTimeSeriesFilter(filter: Filter): filter is TimeSeriesFilter {
  return (filter as TimeSeriesFilter).timeSeriesIds !== undefined
}
export function isCorrelationFilter(
  filter: Filter,
): filter is CorrelationFilter {
  return (filter as CorrelationFilter).timeSeriesIdXaxis !== undefined
}

export function isTimeSeriesTopologyActionsFilter(
  filter: Filter,
): filter is TimeSeriesTopologyActionsFilter {
  return (filter as TimeSeriesTopologyActionsFilter).nodeId !== undefined
}
