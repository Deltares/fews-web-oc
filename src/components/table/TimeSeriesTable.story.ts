import { defineComponent, h, ref } from 'vue'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import { Series } from '@/lib/timeseries/timeSeries'
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
