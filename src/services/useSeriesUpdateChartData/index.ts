import { redraw, updateChartData } from '@/lib/charts/timeSeriesChart'
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
  let hasRenderedOnce = false

  watch(
    () => ({
      config: getConfigSignature(toValue(config)),
      series: getSeriesSignature(toValue(series)),
    }),
    (newValue, oldValue) => {
      const _config = toValue(config)
      const _series = toValue(series)
      const _axis = toValue(axis)

      if (!_axis) return

      const newSeriesIds = new Set(
        difference(newValue.series, oldValue.series).map((id) =>
          id.substring(0, id.lastIndexOf('-')),
        ),
      )
      const hasConfigChanged =
        newValue.config.join('|') !== oldValue.config.join('|')
      const requiredSeries = _config.series.filter(
        (s) =>
          s.visibleInPlot &&
          (hasConfigChanged ||
            s.dataResources.some((resourceId) =>
              newSeriesIds.has(resourceId),
            ) ||
            !hasChart(_axis, s.id)),
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
    { flush: 'post' },
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

function getConfigSignature(config: ChartConfig) {
  return config.series.map(
    (s) => `${s.id}:${s.visibleInPlot}:${s.type}:${s.dataResources.join(',')}`,
  )
}

function hasChart(axis: CartesianAxes, id: string) {
  return axis.charts.some((chart) => chart.id === id)
}
