import { computed, defineComponent, h, ref } from 'vue'
import TimeSeriesChartBrush from './TimeSeriesChartBrush.vue'
import TimeSeriesChartBrushSwitch from './TimeSeriesChartBrushSwitch.vue'
import type { Margin } from '@deltares/fews-web-oc-charts'
import TimeSeriesChart from './TimeSeriesChartSwitch.vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '@/lib/timeseries/timeSeriesResource'
import { getDefaultSettings } from '@/lib/topology/componentSettings'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useRoute, useRouter } from 'vue-router'

export const ThresholdSwitching = defineComponent({
  props: {
    engine: { type: String, default: 'v4' },
    queryEngine: String,
    withThresholds: { type: Boolean, default: false },
    dataReady: { type: Boolean, default: true },
    autoScaleY: { type: Boolean, default: false },
    includeMarkers: { type: Boolean, default: false },
    chartCount: { type: Number, default: 1 },
    verticalProfile: { type: Boolean, default: false },
    withBrush: { type: Boolean, default: false },
    plotWeight: Number,
  },
  setup(props) {
    const userSettings = useUserSettingsStore()
    const route = useRoute()
    const router = useRouter()
    const chartEngineSetting = userSettings.get('charts.engine')
    if (chartEngineSetting?.type === 'oneOfMultiple') {
      userSettings.add({
        ...chartEngineSetting,
        value: props.engine,
      })
    }
    const query = { ...route.query }
    if (props.queryEngine) {
      query['charts.engine'] = props.queryEngine
    } else {
      delete query['charts.engine']
    }
    void router.replace({ query })

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
        plotWeight: props.plotWeight,
        xAxis: [{ kind: 'time', domain: [start, end] }],
        yAxis: [
          props.autoScaleY
            ? { kind: 'value', includeZero: false }
            : { kind: 'value', defaultDomain: [0, 3] },
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
          marker: { shape: 'circle', size: 9, skip: 1 },
        })
      }
      return result
    })
    const settings = { ...getDefaultSettings().charts.timeSeriesChart }
    return () =>
      h(
        'div',
        { style: { height: '400px', display: 'flex' } },
        Array.from({ length: props.chartCount }, () =>
          h(
            TimeSeriesChart,
            {
              config: config.value,
              series: series.value,
              settings,
              verticalProfile: props.verticalProfile,
            },
            props.withBrush
              ? {
                  brush: ({ margin }: { margin: Margin }) =>
                    h(TimeSeriesChartBrushSwitch, {
                      config: config.value,
                      series: series.value,
                      settings,
                      fullDomain: [start, end],
                      mainChartMargin: margin,
                    }),
                }
              : undefined,
          ),
        ),
      )
  },
})

function createMockChart(
  index: number,
  domain: [Date, Date],
  plotWeight?: number,
) {
  const [start, end] = domain
  const resourceId = `observation-${index + 1}`
  const observation = new Series(
    new SeriesUrlRequest('story', `/${resourceId}`),
  )
  observation.data = [
    { x: start, y: index + 1, flag: '0' },
    { x: end, y: index + 2, flag: '0' },
  ]
  observation.lastUpdated = start

  const config: ChartConfig = {
    id: `mock-chart-${index + 1}`,
    title: `Mock chart ${index + 1}`,
    plotWeight,
    xAxis: [{ kind: 'time', domain }],
    yAxis: [{ kind: 'value', defaultDomain: [0, 8] }],
    series: [
      {
        id: resourceId,
        dataResources: [resourceId],
        name: `Observation ${index + 1}`,
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
      },
    ],
  }
  return { config, series: { [resourceId]: observation } }
}

function createChartStory(
  chartCount: number,
  containerHeight = 852,
  plotWeights?: number[],
  withBrush = false,
) {
  return defineComponent({
    setup() {
      const start = new Date('2026-01-01T00:00:00Z')
      const end = new Date('2026-01-02T00:00:00Z')
      const domain = ref<[Date, Date]>([start, end])
      const updateDomain = (value: [Date, Date] | undefined) => {
        if (value) domain.value = value
      }
      const settings = { ...getDefaultSettings().charts.timeSeriesChart }
      if (plotWeights) {
        settings.legend = { ...settings.legend, placement: 'upper left' }
      }
      const charts = Array.from({ length: chartCount }, (_, index) =>
        createMockChart(index, [start, end], plotWeights?.[index]),
      )

      return () =>
        h(
          'div',
          {
            'data-testid': 'chart-container',
            style: {
              height: `${containerHeight}px`,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              containerType: 'size',
            },
          },
          charts.map(({ config, series }) =>
            h(
              TimeSeriesChart,
              {
                key: config.id,
                config,
                series,
                settings,
                domain: domain.value,
                'onUpdate:domain': updateDomain,
              },
              withBrush
                ? {
                    brush: ({ margin }: { margin: Margin }) =>
                      h(TimeSeriesChartBrush, {
                        config,
                        series,
                        settings,
                        fullDomain: [start, end],
                        mainChartMargin: margin,
                        domain: domain.value,
                        'onUpdate:domain': updateDomain,
                      }),
                  }
                : undefined,
            ),
          ),
        )
    },
  })
}

export const OneChart = createChartStory(1)
export const TwoCharts = createChartStory(2)
export const ThreeCharts = createChartStory(3)
export const FourCharts = createChartStory(4)
export const FiveCharts = createChartStory(5)
export const FourWeightedCharts = createChartStory(4, 861, [1, 2, 2, 1])
export const FourWeightedChartsWithBrush = createChartStory(
  4,
  861,
  [1, 2, 2, 1],
  true,
)
