import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import type { Series } from '@/lib/timeseries/timeSeries'

vi.mock('@deltares/fews-web-oc-charts', () => {
  class MockChart {
    data: unknown[]
    id = ''

    constructor(data: unknown[]) {
      this.data = data
    }

    addTo(axis: { charts: MockChart[] }, _options: unknown, id?: string) {
      this.id = id ?? ''
      axis.charts.push(this)
      return this
    }
  }

  return {
    ChartArea: MockChart,
    ChartBar: MockChart,
    ChartLine: MockChart,
    ChartMarker: MockChart,
    ChartMatrix: MockChart,
    ChartRule: MockChart,
    TooltipAnchor: { Top: 'top' },
  }
})

import { refreshChart, updateChartData } from '@/lib/charts/timeSeriesChart'
import { useSeriesUpdateChartData } from '@/services/useSeriesUpdateChartData'

function createAxis() {
  return {
    charts: [],
    redraw: vi.fn(),
    removeAllCharts: vi.fn(),
    removeChart: vi.fn(),
    removeInitialExtent: vi.fn(),
    setOptions: vi.fn(),
  } as any
}

function createChartSeries(
  id = 'combined-series',
  dataResources = ['resource-a', 'resource-b'],
): ChartSeries {
  return {
    id,
    dataResources,
    name: 'Combined series',
    type: 'line',
    options: {},
    unit: 'm',
    style: {},
    visibleInLegend: true,
    visibleInPlot: true,
    visibleInTable: false,
  }
}

function createConfig(series: ChartSeries, domain?: [Date, Date]): ChartConfig {
  return {
    id: 'subplot',
    title: 'Subplot',
    series: [series],
    xAxis: domain ? [{ domain }] : undefined,
  }
}

function createSeries(value: number, lastUpdated?: Date): Series {
  return {
    data: [{ x: new Date('2026-01-01T00:00:00Z'), y: value, flag: '' }],
    lastUpdated,
  } as Series
}

describe('timeSeriesChart helpers', () => {
  it('does not create a chart while a required data resource is missing', () => {
    const axis = createAxis()
    const chartSeries = createChartSeries()

    refreshChart(axis, createConfig(chartSeries), {
      'resource-a': createSeries(1),
    })

    expect(axis.charts).toEqual([])
  })

  it('creates a missing chart when the data update has all required resources', () => {
    const axis = createAxis()
    const chartSeries = createChartSeries()

    updateChartData(axis, [chartSeries], {
      'resource-a': createSeries(1),
      'resource-b': createSeries(2),
    })

    expect(axis.charts).toHaveLength(1)
    expect(axis.charts[0].id).toBe('combined-series')
    expect(axis.charts[0].data).toEqual([
      {
        x: new Date('2026-01-01T00:00:00Z'),
        y: [1, 2],
        flag: ['', ''],
      },
    ])
    expect(axis.redraw).toHaveBeenCalledWith({ y: { autoScale: true } })
  })

  it('reconciles a missing chart when its data resource updates', async () => {
    const scope = effectScope()
    const axis = createAxis()
    const config = ref(
      createConfig(createChartSeries('new-series', ['resource-a'])),
    )
    const series = ref<Record<string, Series>>({
      'resource-a': createSeries(1, new Date('2026-01-01T00:00:00Z')),
    })

    scope.run(() => {
      useSeriesUpdateChartData(series, config, () => axis)
    })

    series.value = {
      'resource-a': createSeries(1, new Date('2026-01-01T00:00:01Z')),
    }

    await nextTick()
    scope.stop()

    expect(axis.charts).toHaveLength(1)
    expect(axis.charts[0].id).toBe('new-series')
    expect(axis.charts[0].data).toEqual([
      { x: new Date('2026-01-01T00:00:00Z'), y: 1, flag: '' },
    ])
    expect(axis.redraw).toHaveBeenCalledWith({ y: { autoScale: true } })
  })

  it('does not redraw the x-axis after data updates', async () => {
    const scope = effectScope()
    const originalDomain: [Date, Date] = [
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-10T00:00:00Z'),
    ]
    const axis = createAxis()
    const chartSeries = createChartSeries('series', ['resource-a'])
    axis.charts.push({ id: 'series', data: [] })

    const config = ref(createConfig(chartSeries, originalDomain))
    const series = ref<Record<string, Series>>({
      'resource-a': createSeries(1, new Date('2026-01-01T00:00:00Z')),
    })

    scope.run(() => {
      useSeriesUpdateChartData(series, config, () => axis)
    })

    series.value = {
      'resource-a': createSeries(2, new Date('2026-01-01T00:00:01Z')),
    }

    await nextTick()
    scope.stop()

    expect(axis.redraw).not.toHaveBeenCalledWith({
      x: { domain: originalDomain },
      y: { autoScale: true },
    })
    expect(axis.redraw).toHaveBeenCalledWith({ y: { autoScale: true } })
  })
})
