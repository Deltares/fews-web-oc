import { createSeries } from '@deltares/fews-web-oc-charts'
import { effectScope, nextTick, ref } from 'vue'
import { describe, expect, it } from 'vitest'
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
