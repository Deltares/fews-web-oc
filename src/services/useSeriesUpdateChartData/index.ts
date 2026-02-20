import { redraw, updateChartData } from '@/lib/charts/timeSeriesChart'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { CartesianAxes } from '@deltares/fews-web-oc-charts'
import { difference } from 'lodash-es'
import { MaybeRefOrGetter, ref, toValue, watch } from 'vue'

export function useSeriesUpdateChartData(
  series: MaybeRefOrGetter<Record<string, Series>>,
  config: MaybeRefOrGetter<ChartConfig>,
  axis: MaybeRefOrGetter<CartesianAxes>,
) {
  let hasResetAxes = false
  let hasRenderedOnce = false

  watch(
    () =>
      Object.entries(toValue(series)).map(
        ([k, s]) => `${k}-${s.lastUpdated?.getTime()}`,
      ),
    (newValue, oldValue) => {
      const _config = toValue(config)
      const _series = toValue(series)
      const _axis = toValue(axis)

      const newSeriesIds = difference(newValue, oldValue).map((id) =>
        id.substring(0, id.lastIndexOf('-')),
      )
      const requiredSeries = _config.series.filter((s) =>
        s.dataResources.some((resourceId) => newSeriesIds.includes(resourceId)),
      )
      if (requiredSeries.length > 0) {
        hasResetAxes = updateChartData(
          _axis,
          requiredSeries,
          _series,
          hasResetAxes,
        )

        if (!hasRenderedOnce) {
          redraw(_axis, _config)
          hasRenderedOnce = true
        }
      }
    },
  )

  const resetAxes = (value: boolean) => {
    hasResetAxes = value
  }

  return { resetAxes }
}
