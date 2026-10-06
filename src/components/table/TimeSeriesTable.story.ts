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

function createBenchmarkStory(
  rowCount: number,
  selectedDateIndex?: number,
  pageSize = 0,
  useIncrementalPages = false,
  allowLoadMore = pageSize > 0,
) {
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
      const loadMoreCount = ref(0)
      const loadedRowCount = ref(rowCount)
      const isLoadingMore = ref(false)
      const pageUpdate = ref<
        { revision: number; direction: 'before' | 'after' } | undefined
      >()

      const totalRowCount = pageSize > 0 ? 50_000 : rowCount
      const dates = Array.from(
        { length: totalRowCount },
        (_, index) => new Date(date.getTime() + index * 60_000),
      )
      const benchmarkConfig: ChartConfig = {
        id: `table-benchmark-${rowCount}`,
        title: `Table benchmark ${rowCount}`,
        series: [],
      }
      const benchmarkSeries = ref<Record<string, Series>>({})
      const allSeriesEvents: Record<string, NonNullable<Series['data']>> = {}

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
        allSeriesEvents[id] = dates.map((x, row) => ({
          x: new Date(x),
          y: ((row * 17 + column * 31) % 1000) / 10,
          flag: '9',
          comment: `Row ${row + 1}, series ${column + 1}`,
        }))
        timeSeries.data = allSeriesEvents[id].slice(0, rowCount)
        timeSeries.lastUpdated = date
        benchmarkSeries.value[id] = timeSeries
      }

      function loadMore(direction: string) {
        loadMoreDirection.value = direction
        if (
          pageSize === 0 ||
          loadedRowCount.value >= totalRowCount ||
          isLoadingMore.value
        ) {
          return
        }

        isLoadingMore.value = true
        loadMoreCount.value++
        setTimeout(() => {
          const nextRowCount = Math.min(
            loadedRowCount.value + pageSize,
            totalRowCount,
          )
          const lastUpdated = new Date(date.getTime() + nextRowCount * 60_000)
          for (const [id, timeSeries] of Object.entries(
            benchmarkSeries.value,
          )) {
            timeSeries.data = allSeriesEvents[id].slice(0, nextRowCount)
            timeSeries.lastUpdated = lastUpdated
          }
          loadedRowCount.value = nextRowCount
          if (useIncrementalPages) {
            pageUpdate.value = {
              revision: (pageUpdate.value?.revision ?? 0) + 1,
              direction: direction as 'before' | 'after',
            }
          }
          isLoadingMore.value = false
        }, 20)
      }

      return () =>
        h(
          'div',
          {
            'data-testid': 'table-benchmark',
            'data-row-count': loadedRowCount.value,
            'data-series-count': 5,
            style: { height: '640px', width: '100%' },
          },
          [
            h(TimeSeriesTable, {
              config: benchmarkConfig,
              series: benchmarkSeries.value,
              settings: defaultChartSettings.timeSeriesTable,
              isLoading: isLoadingMore.value,
              isLoadingMore: isLoadingMore.value,
              ...(allowLoadMore ? { allowLoadMore: true } : {}),
              pageUpdate: pageUpdate.value,
              selectedDate:
                selectedDateIndex === undefined
                  ? undefined
                  : dates[selectedDateIndex],
              onLoadMoreData: loadMore,
            }),
            h(
              'output',
              { 'data-testid': 'load-more-direction' },
              loadMoreDirection.value,
            ),
            h(
              'output',
              { 'data-testid': 'loaded-row-count' },
              loadedRowCount.value,
            ),
            h(
              'output',
              { 'data-testid': 'load-more-count' },
              loadMoreCount.value,
            ),
            h(
              'output',
              { 'data-testid': 'is-loading-more' },
              String(isLoadingMore.value),
            ),
          ],
        )
    },
  })
}

export const Benchmark200Rows = createBenchmarkStory(200)
export const LoadMore200Rows = createBenchmarkStory(
  200,
  undefined,
  0,
  false,
  true,
)
export const Benchmark1000Rows = createBenchmarkStory(1000)
export const Benchmark2000Rows = createBenchmarkStory(2000)
export const SelectedDateRow = createBenchmarkStory(200, 150)
export const IncrementalPageLoadBenchmark = createBenchmarkStory(
  10_000,
  undefined,
  5_000,
  true,
)
export const FullRebuildPageLoadBenchmark = createBenchmarkStory(
  10_000,
  undefined,
  5_000,
)
