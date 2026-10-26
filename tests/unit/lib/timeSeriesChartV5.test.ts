// @vitest-environment jsdom
import {
  createPlot,
  createSeries,
  handleCache,
} from '@deltares/fews-web-oc-charts'
import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { defaultChartSettings } from '@/lib/topology/componentSettings/chartSettings'
import type { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { ChartSeries } from '@/lib/charts/types/ChartSeries'
import type { Series } from '@/lib/timeseries/timeSeries'
import { toPlotConfig } from '@/lib/charts/v5/toPlotConfig'
import { useSeriesStores } from '@/lib/charts/v5/useSeriesStores'

function createChartSeries(
  id: string,
  type: ChartSeries['type'],
  dataResources: string[],
  axisIndex = 0,
  marker?: ChartSeries['marker'],
): ChartSeries {
  return {
    id,
    dataResources,
    name: id,
    type,
    options: {
      x: { key: 'x', axisIndex: 0 },
      y: { key: 'y', axisIndex },
    },
    unit: '',
    style: {
      fill: '#336699',
      stroke: '#336699',
      'stroke-width': '2',
    },
    marker,
    classBreaks: undefined,
    barMargin: undefined,
    visibleInLegend: true,
    visibleInPlot: true,
    visibleInTable: false,
  }
}

function createResource(
  values: { x: Date; y: number; flag?: string }[],
): Series {
  return {
    data: values,
  } as Series
}

describe('v5 static chart config', () => {
  it.each(['line', 'marker', 'area'] as const)(
    'preserves elevation order, gaps and legends for %s profiles with reversing x values',
    (type) => {
      const item = createChartSeries('profile', type, ['profile'])
      const plotConfig = toPlotConfig(
        { id: 'profile', title: '', series: [item] },
        {},
        defaultChartSettings.verticalProfileChart,
        { verticalProfile: true },
        {
          profile: {
            data: [
              { x: 3, y: 0, flag: '0' },
              { x: 2, y: 25, flag: '0' },
              { x: 1, y: 50, flag: '6' },
              { x: null, y: 75, flag: '0' },
              { x: 2, y: 100, flag: '0' },
            ],
          } as Series,
        },
      )
      expect(plotConfig.marks).toHaveLength(1)
      const mark = plotConfig.marks![0]
      if (!('xValues' in mark)) throw new Error('Expected a profile line mark')
      expect(mark.xValues).toEqual([3, 2, 1, null, 2])
      expect(mark.yValues).toEqual([0, 25, null, 75, 100])
      expect(mark).toMatchObject({
        id: '0:profile:0',
        x: 'x',
        y: 'y0',
        line: type === 'line',
      })
      if (!('markers' in mark)) throw new Error('Expected a profile line mark')
      expect(!!mark.markers).toBe(type === 'marker')
      expect(!!mark.area).toBe(type === 'area')
    },
  )

  it('reuses bands across data, style, scale binding and legend changes', () => {
    const handles = handleCache()
    const item = createChartSeries('range', 'area', ['low', 'high'])
    const config: ChartConfig = {
      id: 'subplot',
      title: '',
      series: [item],
      yAxis: [{ kind: 'value' }, { kind: 'value', position: 'right' }],
    }
    const resources = {
      low: createResource([
        { x: new Date(0), y: 1 },
        { x: new Date(1000), y: 2 },
      ]),
      high: createResource([
        { x: new Date(0), y: 3 },
        { x: new Date(1000), y: 4 },
      ]),
    }
    const build = () =>
      toPlotConfig(
        config,
        {},
        defaultChartSettings.timeSeriesChart,
        { handles },
        resources,
      ).marks![0]
    const first = build()
    if (!('yValues' in first)) throw new Error('Expected a band mark')
    expect(first.yValues).toEqual([[1, 3]])
    resources.low = createResource([
      { x: new Date(0), y: 2 },
      { x: new Date(2000), y: 4 },
    ])
    item.style.fill = '#ff0000'
    expect(build()).toBe(first)
    expect(first.fill).toBe('#ff0000')
    expect(first.xValues).toEqual([
      [0, 1000],
      [1000, 2000],
    ])
    expect(first.yValues).toEqual([[2, 3], null])
    item.options.y.axisIndex = 1
    const rebound = build()
    expect(rebound).toBe(first)
    expect(rebound.y).toBe('y1')
    item.name = 'Renamed'
    const renamed = build()
    expect(renamed).toBe(first)
    expect(first.label).toBe('Renamed')
    expect(first.legendGroup).toBe('Renamed')
    item.visibleInLegend = false
    const hidden = build()
    expect(hidden).toBe(first)
    expect(first.label).toBeUndefined()
    expect(first.legendGroup).toBeUndefined()
    expect(build()).toBe(hidden)
    config.series = []
    toPlotConfig(
      config,
      {},
      defaultChartSettings.timeSeriesChart,
      { handles },
      resources,
    )
    expect(handles.has('mark:0:range')).toBe(false)
  })

  it('reuses handles, updates options, and preserves interactive scale domains', () => {
    const handles = handleCache()
    const item = createChartSeries('line', 'line', ['resource'])
    const config: ChartConfig = {
      id: 'subplot',
      title: '',
      series: [item],
    }
    const stores = { resource: createSeries({ x: [0, 1], y: [1, 2] }) }
    const settings = structuredClone(defaultChartSettings.timeSeriesChart)
    const build = () => toPlotConfig(config, stores, settings, { handles })
    const first = build()
    first.scales!.x!.update({ domain: [10, 20] })
    item.style.stroke = '#ff0000'
    const second = build()
    expect(second.scales!.x).toBe(first.scales!.x)
    expect(second.scales!.y0).toBe(first.scales!.y0)
    expect(second.scales!.x!.domain.get()).toEqual([10, 20])
    expect(second.axes![0]).toBe(first.axes![0])
    expect(second.marks![0]).toBe(first.marks![0])
    const mark = second.marks![0]
    if (!('options' in mark)) throw new Error('Expected an updatable mark')
    expect(mark.options.get().resolved).toMatchObject({
      line: { stroke: '#ff0000' },
    })
    mark.update({ visible: false })
    build()
    expect(mark.options.get().resolved.visible).toBe(false)
    settings.xAxis.xTicks = false
    const withoutTicks = build()
    expect(withoutTicks.axes![0]).toBe(first.axes![0])
    expect(withoutTicks.axes![0].options.get().resolved.format?.(1)).toBe('')
    settings.xAxis.xTicks = true
    expect(build().axes![0].options.get().resolved.format).toBeUndefined()
  })

  it('forgets removed handles and replaces handles when their inputs change', () => {
    const handles = handleCache()
    const config: ChartConfig = {
      id: 'subplot',
      title: '',
      series: [createChartSeries('line', 'line', ['resource'])],
    }
    const stores = { resource: createSeries({ x: [0, 1], y: [1, 2] }) }
    const build = () =>
      toPlotConfig(config, stores, defaultChartSettings.timeSeriesChart, {
        handles,
      })
    const first = build()
    stores.resource = createSeries({ x: [0, 1], y: [3, 4] })
    expect(build().marks![0]).not.toBe(first.marks![0])
    config.yAxis = [{ kind: 'degrees', position: 'left' }]
    expect(build().scales!.y0).not.toBe(first.scales!.y0)
    config.series = []
    expect(build().marks).toEqual([])
    expect(handles.has('mark:0:line:0')).toBe(false)
    config.series = [createChartSeries('line', 'line', ['resource'])]
    expect(build().marks![0]).not.toBe(first.marks![0])
    const independent = toPlotConfig(
      config,
      stores,
      defaultChartSettings.timeSeriesChart,
      { handles: handleCache() },
    )
    expect(independent.scales!.x).not.toBe(first.scales!.x)
  })

  it('keeps bar marks and tables stable while updating their data and style', () => {
    const handles = handleCache()
    const item = createChartSeries('bars', 'bar', ['resource'])
    const config: ChartConfig = { id: 'subplot', title: '', series: [item] }
    const resources = {
      resource: createResource([
        { x: new Date(0), y: 1 },
        { x: new Date(1000), y: 2 },
      ]),
    }
    const build = () =>
      toPlotConfig(
        config,
        {},
        defaultChartSettings.timeSeriesChart,
        { handles },
        resources,
      )
    const first = build().marks![0]
    if (!('data' in first) || !('valueAt' in first.data)) {
      throw new Error('Expected a table-backed mark')
    }
    const table = first.data
    resources.resource = createResource([
      { x: new Date(0), y: 3 },
      { x: new Date(2000), y: 4 },
    ])
    item.style.fill = '#ff0000'
    const second = build().marks![0]
    expect(second).toBe(first)
    expect(first.data).toBe(table)
    expect(table.valueAt('y', 0)).toBe(3)
    expect(table.valueAt('start', 1)).toBe(0)
    expect(table.valueAt('x', 1)).toBe(2000)
    if (!('options' in second)) throw new Error('Expected an updatable mark')
    expect(second.options.get().resolved).toMatchObject({ fill: '#ff0000' })
    resources.resource.data = []
    build()
    expect(table.length).toBe(0)
    config.series = []
    build()
    expect(handles.has('table:0:bars')).toBe(false)
  })

  it('gives time bars explicit preceding-sample intervals without bridging missing values', () => {
    const handles = handleCache()
    const config: ChartConfig = {
      id: 'subplot',
      title: '',
      series: [createChartSeries('bars', 'bar', ['resource'])],
    }
    const plotConfig = toPlotConfig(
      config,
      {},
      defaultChartSettings.timeSeriesChart,
      { handles },
      {
        resource: createResource([
          { x: new Date(0), y: 1 },
          { x: new Date(1000), y: 2 },
          { x: new Date(3000), y: 3, flag: '6' },
          { x: new Date(6000), y: 4 },
        ]),
      },
    )
    const mark = plotConfig.marks?.[0]
    expect(mark).toBeDefined()
    if (!mark || !('data' in mark) || !('valueAt' in mark.data)) {
      throw new Error('Expected a table-backed bar mark')
    }
    expect(mark.options.get().resolved).toMatchObject({
      interval: { start: 'start', end: 'x' },
      scales: { x: 'x', y: 'y0' },
    })
    expect(
      Array.from({ length: mark.data.length }, (_, index) => [
        mark.data.valueAt('start', index),
        mark.data.valueAt('x', index),
        mark.data.valueAt('y', index),
      ]),
    ).toEqual([
      [0, 0, 1],
      [0, 1000, 2],
      [3000, 6000, 4],
    ])

    class Observer {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', Observer)
    vi.stubGlobal('IntersectionObserver', Observer)
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
    const container = document.createElement('div')
    try {
      const plot = createPlot(container, plotConfig)
      try {
        expect(() => plot.setConfig(plotConfig)).not.toThrow()
        expect(() =>
          plot.setConfig(
            toPlotConfig(
              config,
              {},
              defaultChartSettings.timeSeriesChart,
              { handles },
              {
                resource: createResource([
                  { x: new Date(0), y: 5 },
                  { x: new Date(2000), y: 6 },
                ]),
              },
            ),
          ),
        ).not.toThrow()
      } finally {
        plot.destroy()
      }
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('assigns unique, repeatable mark IDs when FEWS entries share a series ID', () => {
    const config: ChartConfig = {
      id: 'subplot',
      title: '',
      series: [
        createChartSeries('shared', 'line', ['lower', 'upper']),
        createChartSeries('shared', 'marker', ['lower']),
        createChartSeries('shared', 'line', ['lower']),
        createChartSeries('shared', 'area', ['lower']),
        createChartSeries('shared', 'area', ['lower', 'upper']),
        createChartSeries('shared', 'bar', ['lower']),
      ],
    }
    const stores = {
      lower: createSeries({ x: [0, 1], y: [1, 2] }),
      upper: createSeries({ x: [0, 1], y: [3, 4] }),
    }
    const resources = {
      lower: createResource([
        { x: new Date(0), y: 1 },
        { x: new Date(1), y: 2 },
      ]),
      upper: createResource([
        { x: new Date(0), y: 3 },
        { x: new Date(1), y: 4 },
      ]),
    }
    const build = () =>
      toPlotConfig(
        config,
        stores,
        defaultChartSettings.timeSeriesChart,
        {},
        resources,
      )
    const ids = build().marks?.map((mark) => mark.id)

    expect(ids).toHaveLength(7)
    expect(new Set(ids).size).toBe(7)
    expect(build().marks?.map((mark) => mark.id)).toEqual(ids)
    expect(config.series.every((item) => item.id === 'shared')).toBe(true)
  })

  it('merges a line and its paired marker series into a single mark', () => {
    const config: ChartConfig = {
      id: 'subplot',
      title: '',
      series: [
        createChartSeries('observed', 'line', ['observed']),
        createChartSeries('observed', 'marker', ['observed'], 0, {
          shape: 'diamond',
          size: 16,
          skip: 1,
        }),
        createChartSeries('other', 'marker', ['observed']),
      ],
    }
    config.series[1].style = { fill: '#ff0000', stroke: '#ff0000' }

    const plotConfig = toPlotConfig(
      config,
      { observed: createSeries({ x: [0, 1], y: [1, 2] }) },
      defaultChartSettings.timeSeriesChart,
    )

    expect(plotConfig.marks?.map((mark) => mark.id)).toEqual([
      '0:observed:0',
      '2:other:0',
    ])
    const merged = plotConfig.marks?.[0]
    if (!merged || !('options' in merged)) {
      throw new Error('Expected a series mark')
    }
    const resolved = merged.options.get().resolved as {
      line: unknown
      markers: unknown
    }
    expect(resolved.line).toMatchObject({ stroke: '#336699' })
    expect(resolved.markers).toMatchObject({
      symbol: 'diamond',
      size: 16,
      fill: '#ff0000',
    })
  })

  it.each(['line', 'marker', 'area'] as const)(
    'binds %s marks to their configured left and right y scales',
    (type) => {
      const config: ChartConfig = {
        id: 'subplot',
        title: '',
        yAxis: [
          { kind: 'value', position: 'left' },
          { kind: 'value', position: 'right' },
        ],
        series: [
          createChartSeries('left', type, ['resource'], 0),
          createChartSeries('right', type, ['resource'], 1),
        ],
      }
      const plotConfig = toPlotConfig(
        config,
        { resource: createSeries({ x: [0, 1], y: [1, 2] }) },
        defaultChartSettings.timeSeriesChart,
      )

      expect(plotConfig.marks?.map((mark) => mark.y)).toEqual(['y0', 'y1'])
      for (const mark of plotConfig.marks ?? []) {
        expect(plotConfig.scales?.[mark.x]).toBeDefined()
        expect(plotConfig.scales?.[mark.y]).toBeDefined()
      }
    },
  )

  it('reuses stores when resources update and converts unreliable values to gaps', async () => {
    const time = new Date('2026-01-01T00:00:00Z')
    const resource = ref({
      observation: createResource([
        { x: time, y: 2 },
        { x: new Date(time.getTime() + 1), y: 3, flag: '6' },
      ]),
    })
    const scope = effectScope()
    let stores!: ReturnType<typeof useSeriesStores>
    scope.run(() => {
      stores = useSeriesStores(resource)
    })

    const store = stores.value.observation
    expect(store.length).toBe(2)
    expect(store.yAt(0)).toBe(2)
    expect(Number.isNaN(store.yAt(1))).toBe(true)

    resource.value = {
      observation: createResource([{ x: time, y: 5 }]),
    }
    await nextTick()

    expect(stores.value.observation).toBe(store)
    expect(store.length).toBe(1)
    expect(store.yAt(0)).toBe(5)
    scope.stop()
  })

  it('maps line, marker, area, band and bar series onto time and dual y scales', () => {
    const first = new Date('2026-01-01T00:00:00Z')
    const second = new Date('2026-01-02T00:00:00Z')
    const stores = {
      line: createSeries({
        x: [first.getTime(), second.getTime()],
        y: [1, 2],
      }),
      marker: createSeries({ x: [first.getTime()], y: [3] }),
      area: createSeries({ x: [first.getTime()], y: [4] }),
      bar: createSeries({ x: [first.getTime()], y: [5] }),
    }
    const line = createChartSeries('line', 'line', ['line'])
    line.visibleInLegend = false
    const config: ChartConfig = {
      id: 'subplot',
      title: 'Static v5 chart',
      xAxis: [{ kind: 'time', position: 'bottom', label: 'Time' }],
      yAxis: [
        { kind: 'value', position: 'left', label: 'Level' },
        { kind: 'value', position: 'right', label: 'Flow' },
      ],
      series: [
        line,
        createChartSeries('marker', 'marker', ['marker'], 0, {
          shape: 'triangle-up',
          size: 9,
          skip: 1,
        }),
        createChartSeries('area', 'area', ['area']),
        createChartSeries('band', 'area', ['lower', 'upper'], 1),
        createChartSeries('bar', 'bar', ['bar']),
      ],
    }
    const resources = {
      lower: createResource([
        { x: first, y: 1 },
        { x: second, y: 2 },
      ]),
      upper: createResource([
        { x: first, y: 3 },
        { x: second, y: 4 },
      ]),
      bar: createResource([{ x: first, y: 5 }]),
    }

    const plotConfig = toPlotConfig(
      config,
      stores,
      defaultChartSettings.timeSeriesChart,
      { locale: 'en' },
      resources,
    )

    expect(plotConfig.scales?.x?.kind).toBe('time')
    expect(plotConfig.scales?.y0?.kind).toBe('linear')
    expect(plotConfig.scales?.y1?.kind).toBe('linear')
    expect(plotConfig.axes).toHaveLength(3)
    expect(
      plotConfig.axes?.map((axis) => axis.options.get().resolved.style),
    ).toEqual(['classic', 'classic', 'classic'])
    expect(plotConfig.marks).toHaveLength(5)
    expect(plotConfig.marks?.filter((mark) => 'xValues' in mark)).toHaveLength(
      1,
    )
    expect(plotConfig.marks?.filter((mark) => 'data' in mark)).toHaveLength(4)
    const lineMark = plotConfig.marks?.[0]
    expect(lineMark && 'visible' in lineMark && lineMark.visible).toBe(true)
  })

  it('uses the selected axis kind and honors disabled tick settings', () => {
    const config: ChartConfig = {
      id: 'subplot',
      title: '',
      xAxis: [
        {
          kind: 'degrees',
          position: 'bottom',
          domain: [0, 360],
          nice: false,
        },
      ],
      yAxis: [{ kind: 'degrees', position: 'left', domain: [0, 360] }],
      series: [],
    }
    const settings = {
      ...defaultChartSettings.timeSeriesChart,
      xAxis: {
        ...defaultChartSettings.timeSeriesChart.xAxis,
        xTicks: false,
        xLabel: false,
      },
    }

    const plotConfig = toPlotConfig(config, {}, settings)

    expect(plotConfig.scales?.x?.kind).toBe('degrees')
    expect(plotConfig.scales?.y0?.kind).toBe('degrees')
  })
})
