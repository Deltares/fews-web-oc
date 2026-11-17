import { updateChartData } from '@/lib/charts/timeSeriesChart'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { CartesianAxes } from '@deltares/fews-web-oc-charts'
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

      const previousResources = new Map(
        oldValue.map((entry) => [entry.id, entry]),
      )
      const newSeriesIds = new Set(
        newValue
          .filter((entry) => {
            const previous = previousResources.get(entry.id)
            return (
              entry.resource !== previous?.resource ||
              entry.data !== previous?.data ||
              entry.lastUpdated !== previous?.lastUpdated
            )
          })
          .map((entry) => entry.id),
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
  return Object.entries(series).map(([id, resource]) => ({
    id,
    resource,
    data: resource.data,
    lastUpdated: resource.lastUpdated?.getTime(),
  }))
}
