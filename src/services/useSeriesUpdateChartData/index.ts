import { updateChartData } from '@/lib/charts/timeSeriesChart'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { CartesianAxes } from '@deltares/fews-web-oc-charts'
import { difference } from 'lodash-es'
import { MaybeRefOrGetter, toValue, watch } from 'vue'

export function useSeriesUpdateChartData(
  series: MaybeRefOrGetter<Record<string, Series>>,
  config: MaybeRefOrGetter<ChartConfig>,
  axis: MaybeRefOrGetter<CartesianAxes | undefined>,
) {
  let hasResetAxes = false

  watch(
    () => getSeriesSignature(toValue(series)),
    (newValue, oldValue) => {
      const _config = toValue(config)
      const _series = toValue(series)
      const _axis = toValue(axis)

      if (!_axis) return

      const newSeriesIds = new Set(
        difference(newValue, oldValue).map((id) =>
          id.substring(0, id.lastIndexOf('-')),
        ),
      )
      const requiredSeries = _config.series.filter(
        (s) =>
          s.visibleInPlot &&
          s.dataResources.some((resourceId) => newSeriesIds.has(resourceId)),
      )
      if (requiredSeries.length > 0) {
        hasResetAxes = updateChartData(
          _axis,
          requiredSeries,
          _series,
          hasResetAxes,
        )
      }
    },
  )

  const resetAxes = (value: boolean) => {
    hasResetAxes = value
  }

  return { resetAxes }
}

function getSeriesSignature(series: Record<string, Series>) {
  return Object.entries(series).map(
    ([k, s]) => `${k}-${s.lastUpdated?.getTime()}`,
  )
}
