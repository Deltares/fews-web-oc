import {
  type filterActionsFilter,
  type timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'

export type Filter = timeSeriesGridActionsFilter | filterActionsFilter

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
