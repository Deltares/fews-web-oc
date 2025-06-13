import {
  ActionRequest,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import { Chart, FilterChart, FilterSubplotItem } from './types'

export type ChartSeriesItem = {
  chart: FilterChart
  series: FilterSubplotItem
}

export function getValidFilterCharts(charts: Chart[]) {
  return charts
    .filter((chart) => chart.type === 'filter')
    .flatMap((chart) =>
      chart.subplot.items
        .filter((series) => isOriginalTimeseries(series, chart.requests))
        .map((series) => ({ chart, series })),
    )
}

export function hasValidFilterCharts(charts: Chart[]) {
  return charts.some(
    (chart) =>
      chart.type === 'filter' &&
      chart.subplot.items.some((series) =>
        isOriginalTimeseries(series, chart.requests),
      ),
  )
}

function isOriginalTimeseries(
  series: TimeSeriesDisplaySubplotItem,
  requests: ActionRequest[],
) {
  const request = requests.find((r) => r.key === series.request)
  // FIXME: For now based on the request url but should be a value in TimeSeriesDisplaySubplotItem
  return request && !request.request.includes('resamplingMethod')
}
