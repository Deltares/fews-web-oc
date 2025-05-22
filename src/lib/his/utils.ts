import {
  ActionRequest,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'
import { Chart } from './types'

export function getValidFilterCharts(charts: Chart[]) {
  return charts
    .filter((chart) => chart.type === 'filter')
    .flatMap((chart) =>
      chart.subplot.items.filter((series) =>
        isOriginalTimeseries(series, chart.requests),
      ),
    )
    .filter(
      (series, index, self) =>
        index === self.findIndex((s) => s.request === series.request),
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
