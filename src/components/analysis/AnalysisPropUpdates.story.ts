import { defineComponent, h, shallowRef, type Component } from 'vue'
import AnalysisChartCard from './AnalysisChartCard.vue'
import AnalysisChartEdit from './AnalysisChartEdit.vue'
import AnalysisCollection from './AnalysisCollection.vue'
import AnalysisLineStyleEdit from './AnalysisLineStyleEdit.vue'
import type { Chart, Collection, PlotChart } from '@/lib/analysis'
import type {
  DataAnalysisDisplayElement,
  TimeSeriesDisplaySubplotItem,
} from '@deltares/fews-pi-requests'

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach(freezeDeep)
    Object.freeze(value)
  }
  return value
}

function stateful<T>(
  component: Component,
  propName: string,
  initialValue: T,
  displayValue: (value: T) => string,
  extraProps: Record<string, unknown> = {},
) {
  return defineComponent({
    setup() {
      const value = shallowRef(freezeDeep(initialValue))

      return () =>
        h('div', [
          h(component, {
            ...extraProps,
            [propName]: value.value,
            [`onUpdate:${propName}`]: (updatedValue: T) => {
              value.value = freezeDeep(updatedValue)
            },
          }),
          h(
            'output',
            { 'data-testid': 'prop-value' },
            displayValue(value.value),
          ),
        ])
    },
  })
}

function collection(name: string): Collection {
  return {
    name,
    charts: [],
    settings: {
      startTime: new Date('2025-01-01T00:00:00Z'),
      endTime: new Date('2025-01-02T00:00:00Z'),
      liveUpdate: {
        enabled: false,
        daysBeforeNow: 0,
        daysAfterNow: 0,
      },
    },
  }
}

const plotChart = {
  id: 'chart-1',
  title: 'Original title',
  type: 'correlation',
  filter: {},
  subplot: {
    items: [
      {
        id: 'series-1',
        legend: 'Series',
        lineStyle: 'solid;thick',
        lineWidth: 1,
        color: '#000000',
        markerStyle: 'none',
      },
    ],
  },
} as unknown as PlotChart

export const Collections = stateful(
  AnalysisCollection,
  'collections',
  [collection('First'), collection('Second')],
  (collections) => collections.map(({ name }) => name).join(', '),
  { config: {} as DataAnalysisDisplayElement },
)

export const LineStyle = stateful(
  AnalysisLineStyleEdit,
  'item',
  { lineStyle: 'solid;thick' } as TimeSeriesDisplaySubplotItem,
  (item) => item.lineStyle ?? '',
)

export const ChartCard = stateful(
  AnalysisChartCard,
  'chart',
  {
    id: 'chart-1',
    title: 'Original title',
    type: 'product',
    product: {},
  } as Chart,
  (chart) => chart.title,
)

export const ChartEdit = stateful(
  AnalysisChartEdit,
  'chart',
  plotChart,
  (chart) => chart.title,
  { modelValue: true, 'onUpdate:modelValue': () => {} },
)
