import { defineComponent, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '@/lib/timeseries/timeSeriesResource'
import { defaultChartSettings } from '@/lib/topology/componentSettings/chartSettings'
import { useFewsPropertiesStore } from '@/stores/fewsProperties'
import TimeSeriesTable from './TimeSeriesTable.vue'

const date = new Date('2025-01-01T00:00:00.000Z')

const config = {
  id: 'table-test',
  title: 'Table test',
  series: [
    {
      id: 'editable-series',
      dataResources: ['editable-resource'],
      name: 'Editable series',
      type: 'line',
      unit: '',
      options: {},
      style: {},
      visibleInTable: true,
      editable: true,
    },
    {
      id: 'read-only-series',
      dataResources: ['read-only-resource'],
      name: 'Read-only series',
      type: 'line',
      unit: '',
      options: {},
      style: {},
      visibleInTable: true,
      editable: false,
    },
  ],
} as unknown as ChartConfig

const series = {
  'editable-resource': {
    data: [{ x: date, y: 12 }],
    lastUpdated: date,
    header: {},
  },
  'read-only-resource': {
    data: [{ x: date, y: 24 }],
    lastUpdated: date,
    header: {},
  },
} as unknown as Record<string, Series>

export const EditableCell = defineComponent({
  setup() {
    const fewsPropertiesStore = useFewsPropertiesStore()
    fewsPropertiesStore.flags = [
      {
        flag: '9',
        source: 'CORRECTED',
        quality: 'RELIABLE',
        name: 'Reliable',
      },
    ]
    fewsPropertiesStore.flagSources = [{ id: 'CORRECTED', name: 'Corrected' }]

    const savedData = ref('')

    return () =>
      h('div', { style: { height: '400px' } }, [
        h(TimeSeriesTable, {
          config,
          series,
          settings: defaultChartSettings.timeSeriesTable,
          isLoading: false,
          onChange: (value: unknown) => {
            savedData.value = JSON.stringify(value)
          },
        }),
        h('output', { 'data-testid': 'saved-data' }, savedData.value),
      ])
  },
})

function createBenchmarkStory(rowCount: number) {
  return defineComponent({
    setup() {
      const { locale, mergeDateTimeFormat } = useI18n({ useScope: 'global' })
      mergeDateTimeFormat(locale.value, {
        timeSeriesTable__date: {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          timeZone: 'UTC',
        },
      })
      const fewsPropertiesStore = useFewsPropertiesStore()
      fewsPropertiesStore.flags = [
        {
          flag: '9',
          source: 'CORRECTED',
          quality: 'RELIABLE',
          name: 'Reliable',
        },
      ]
      fewsPropertiesStore.flagSources = [{ id: 'CORRECTED', name: 'Corrected' }]
      const loadMoreDirection = ref('')

      const dates = Array.from(
        { length: rowCount },
        (_, index) => new Date(date.getTime() + index * 60_000),
      )
      const benchmarkConfig: ChartConfig = {
        id: `table-benchmark-${rowCount}`,
        title: `Table benchmark ${rowCount}`,
        series: [],
      }
      const benchmarkSeries: Record<string, Series> = {}

      for (let column = 0; column < 5; column++) {
        const id = `benchmark-series-${column}`
        benchmarkConfig.series.push({
          id,
          dataResources: [id],
          name: `Editable series ${column + 1}`,
          type: 'line',
          unit: '',
          options: {
            x: { key: 'x', axisIndex: 0 },
            y: { key: 'y', axisIndex: 0 },
          },
          style: {},
          visibleInLegend: false,
          visibleInPlot: false,
          visibleInTable: true,
          editable: true,
        })
        const timeSeries = new Series(new SeriesUrlRequest('benchmark', id))
        timeSeries.data = dates.map((x, row) => ({
          x,
          y: ((row * 17 + column * 31) % 1000) / 10,
          flag: '9',
          comment: `Row ${row + 1}, series ${column + 1}`,
        }))
        timeSeries.lastUpdated = date
        benchmarkSeries[id] = timeSeries
      }

      return () =>
        h(
          'div',
          {
            'data-testid': 'table-benchmark',
            'data-row-count': rowCount,
            'data-series-count': 5,
            style: { height: '640px', width: '100%' },
          },
          [
            h(TimeSeriesTable, {
              config: benchmarkConfig,
              series: benchmarkSeries,
              settings: defaultChartSettings.timeSeriesTable,
              isLoading: false,
              onLoadMoreData: (direction: string) => {
                loadMoreDirection.value = direction
              },
            }),
            h(
              'output',
              { 'data-testid': 'load-more-direction' },
              loadMoreDirection.value,
            ),
          ],
        )
    },
  })
}

export const Benchmark200Rows = createBenchmarkStory(200)
export const Benchmark1000Rows = createBenchmarkStory(1000)
export const Benchmark2000Rows = createBenchmarkStory(2000)
