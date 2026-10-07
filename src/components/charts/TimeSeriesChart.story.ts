import { computed, defineComponent, h } from 'vue'
import TimeSeriesChart from './TimeSeriesChart.vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '@/lib/timeseries/timeSeriesResource'
import { getDefaultSettings } from '@/lib/topology/componentSettings'

export const ThresholdSwitching = defineComponent({
  props: {
    withThresholds: { type: Boolean, default: false },
    dataReady: { type: Boolean, default: true },
    autoScaleY: { type: Boolean, default: false },
    includeMarkers: { type: Boolean, default: false },
  },
  setup(props) {
    const start = new Date('2026-01-01T00:00:00Z')
    const end = new Date('2026-01-02T00:00:00Z')
    const series = computed<Record<string, Series>>(() => {
      const observation = new Series(
        new SeriesUrlRequest('story', '/observation'),
      )
      observation.data = props.dataReady
        ? [
            { x: start, y: 1, flag: '0' },
            { x: end, y: 2, flag: '0' },
          ]
        : []
      observation.lastUpdated = start
      return { observation }
    })
    const config = computed<ChartConfig>(() => {
      const result: ChartConfig = {
        id: 'threshold-switching',
        title: 'Threshold switching',
        xAxis: [{ domain: [start, end] }],
        yAxis: [
          props.autoScaleY ? { includeZero: false } : { defaultDomain: [0, 3] },
        ],
        series: [
          {
            id: 'observation',
            dataResources: ['observation'],
            name: 'Observation',
            type: 'line',
            options: {
              x: { key: 'x', axisIndex: 0 },
              y: { key: 'y', axisIndex: 0 },
            },
            unit: 'm',
            style: { stroke: 'black' },
            visibleInLegend: true,
            visibleInPlot: true,
            visibleInTable: false,
            thresholds: props.withThresholds
              ? [
                  {
                    id: 'defense',
                    x1: start,
                    x2: end,
                    value: 100,
                    description: 'Regular Defense',
                    yAxisIndex: 0,
                    color: 'red',
                  },
                ]
              : [],
          },
        ],
      }
      if (props.includeMarkers) {
        result.series.push({
          ...result.series[0],
          type: 'marker',
          marker: { id: 0, size: 9, skip: 1 },
        })
      }
      return result
    })
    const settings = getDefaultSettings().charts.timeSeriesChart
    return () =>
      h('div', { style: { height: '400px', display: 'flex' } }, [
        h(TimeSeriesChart, {
          config: config.value,
          series: series.value,
          settings,
        }),
      ])
  },
})
