import { describe, expect, it } from 'vitest'
import { handleCache } from '@deltares/fews-web-oc-charts'
import { defaultChartSettings } from '@/lib/topology/componentSettings'
import { getV5PlotMargins, toPlotConfig } from './toPlotConfig'
import { createV5ChartGroup } from '@/services/useChartHandlers/v5'

describe('getV5PlotMargins', () => {
  it('uses the same default and vertical-profile margins as v4', () => {
    expect(getV5PlotMargins(defaultChartSettings.timeSeriesChart)).toEqual({
      top: 25,
      right: 50,
      bottom: 40,
      left: 50,
    })

    expect(
      getV5PlotMargins(defaultChartSettings.verticalProfileChart, {
        verticalProfile: true,
      }),
    ).toEqual({
      top: 25,
      right: 30,
      bottom: 40,
      left: 70,
    })
  })

  describe('toPlotConfig axis layout', () => {
    it('shares only the primary elevation scale between vertical profiles', () => {
      const group = createV5ChartGroup()
      const build = (verticalProfile: boolean) =>
        toPlotConfig(
          {
            id: 'profile',
            title: '',
            series: [],
            yAxis: [{ kind: 'value' }, { kind: 'value', position: 'right' }],
          },
          {},
          defaultChartSettings.verticalProfileChart,
          {
            verticalProfile,
            sharedElevationScale: group.elevationScale,
            sharedTimeScale: group.timeScale,
          },
        )
      const first = build(true)
      const second = build(true)
      expect(first.scales?.y0).toBe(group.elevationScale)
      expect(second.scales?.y0).toBe(first.scales?.y0)
      expect(second.scales?.y1).not.toBe(first.scales?.y1)
      expect(second.scales?.x).not.toBe(first.scales?.x)
      group.elevationScale.update({ domain: [10, 20] })
      expect(second.scales?.y0?.domain.get()).toEqual([10, 20])
      const regular = build(false)
      expect(regular.scales?.y0).not.toBe(group.elevationScale)
      expect(regular.scales?.x).toBe(group.timeScale)
    })

    it('fits axis space within margins and enables automatic margin sizing', () => {
      const config = toPlotConfig(
        { id: 'test', title: 'Test', series: [] },
        {},
        defaultChartSettings.timeSeriesChart,
      )

      expect(config.axisLayout).toBe('inset')
      expect(config.autoMargins).toBe(true)
      expect(config.colorContrast).toBe('auto')
    })

    it.each(['auto', 'none'] as const)(
      'applies %s color contrast to main and brush plots',
      (colorContrast) => {
        for (const isBrush of [false, true]) {
          const config = toPlotConfig(
            { id: 'test', title: 'Test', series: [] },
            {},
            defaultChartSettings.timeSeriesChart,
            { colorContrast, isBrush },
          )

          expect(config.colorContrast).toBe(colorContrast)
        }
      },
    )
  })

  describe('grid', () => {
    it('draws gridlines on the value axis only by default', () => {
      const config = toPlotConfig(
        { id: 'test', title: 'Test', series: [] },
        {},
        defaultChartSettings.timeSeriesChart,
        {},
      )

      const grids = Object.fromEntries(
        (config.axes ?? []).map((a) => [
          a.scale,
          a.options.get().resolved.grid,
        ]),
      )
      expect(grids).toMatchObject({ x: false })
      expect(Object.values(grids).filter(Boolean)).toHaveLength(1)
    })

    it('honours an explicit showGrid on a time axis', () => {
      const config = toPlotConfig(
        {
          id: 'test',
          title: 'Test',
          series: [],
          xAxis: [{ kind: 'time', position: 'bottom', showGrid: true }],
        },
        {},
        defaultChartSettings.timeSeriesChart,
        {},
      )

      const xAxis = config.axes?.find((a) => a.scale === 'x')
      expect(xAxis?.options.get().resolved.grid).toBe(true)
    })

    it('draws the grid on a right y-axis when there is no left one', () => {
      const config = toPlotConfig(
        {
          id: 'test',
          title: 'Test',
          series: [],
          yAxis: [{ kind: 'value', position: 'right' }],
        },
        {},
        defaultChartSettings.timeSeriesChart,
        {},
      )

      const yAxes = config.axes?.filter((a) => a.scale !== 'x') ?? []
      expect(yAxes).toHaveLength(1)
      expect(yAxes[0].options.get().resolved).toMatchObject({
        position: 'right',
        grid: true,
      })
    })

    it('keeps the grid on the left y-axis when both sides are present', () => {
      const config = toPlotConfig(
        {
          id: 'test',
          title: 'Test',
          series: [],
          yAxis: [
            { kind: 'value', position: 'right' },
            { kind: 'value', position: 'left' },
          ],
        },
        {},
        defaultChartSettings.timeSeriesChart,
        {},
      )

      const grids = (config.axes ?? [])
        .filter((a) => a.scale !== 'x')
        .map((a) => a.options.get().resolved)
        .map(({ position, grid }) => ({ position, grid }))
      expect(grids).toEqual([
        { position: 'right', grid: false },
        { position: 'left', grid: true },
      ])
    })
  })

  describe('brush axes', () => {
    it('shows only the x-axis with ticks and labels, without a grid', () => {
      const config = toPlotConfig(
        { id: 'test', title: 'Test', series: [] },
        {},
        defaultChartSettings.timeSeriesChart,
        { isBrush: true, locale: 'nl' },
      )

      expect(config.axes).toHaveLength(1)
      expect(config.axes?.[0].scale).toBe('x')
      expect(config.axes?.[0].options.get().resolved).toMatchObject({
        position: 'bottom',
        tickCount: 6,
        style: 'classic',
        grid: false,
        locale: 'nl',
      })
      expect(config.axes?.[0].options.get().resolved.format).toBeUndefined()
    })

    it('preserves the configured x-axis labels and position', () => {
      const config = toPlotConfig(
        {
          id: 'test',
          title: 'Test',
          series: [],
          xAxis: [
            { kind: 'time', position: 'top', label: 'Time', unit: 'UTC' },
          ],
        },
        {},
        defaultChartSettings.timeSeriesChart,
        { isBrush: true },
      )

      expect(config.axes?.[0].options.get().resolved).toMatchObject({
        position: 'top',
        label: 'Time',
        unit: 'UTC',
      })
    })

    it('respects disabled x-axis and tick settings', () => {
      for (const enabled of [false, true]) {
        const config = toPlotConfig(
          { id: 'test', title: 'Test', series: [] },
          {},
          {
            ...defaultChartSettings.timeSeriesChart,
            xAxis: {
              ...defaultChartSettings.timeSeriesChart.xAxis,
              enabled,
              xTicks: false,
            },
          },
          { isBrush: true },
        )

        expect(config.axes).toHaveLength(enabled ? 1 : 0)
        if (enabled) {
          const options = config.axes?.[0].options.get().resolved
          expect(options?.tickCount).toBe(1)
          expect(options?.format?.(0)).toBe('')
        }
      }
    })
  })

  it('applies the v4 label, legend, and brush margin overrides in order', () => {
    const noYAxisLabel = {
      ...defaultChartSettings.timeSeriesChart,
      yAxis: { ...defaultChartSettings.timeSeriesChart.yAxis, yLabel: false },
    }
    expect(getV5PlotMargins(noYAxisLabel).top).toBe(20)

    const legendUnder = {
      ...defaultChartSettings.timeSeriesChart,
      legend: {
        ...defaultChartSettings.timeSeriesChart.legend,
        placement: 'under chart',
      },
    }
    expect(getV5PlotMargins(legendUnder)).toMatchObject({
      top: 40,
      bottom: 25,
    })
    expect(
      getV5PlotMargins(noYAxisLabel, {
        isBrush: true,
      }),
    ).toMatchObject({ top: 5, bottom: 25 })
  })
})

describe('toPlotConfig x scale without a shared time scale', () => {
  const period: [Date, Date] = [new Date(1000), new Date(5000)]
  const build = (
    handles: ReturnType<typeof handleCache>,
    zoom?: [Date, Date],
  ) =>
    toPlotConfig(
      {
        id: 'chart',
        title: '',
        series: [],
        xAxis: [{ kind: 'time', position: 'bottom', domain: period }],
      },
      {},
      defaultChartSettings.timeSeriesChart,
      { domain: zoom, handles },
    )

  it('resets a zoom to the configured domain, not to the zoom', () => {
    const handles = handleCache()
    const x = build(handles, [new Date(2000), new Date(3000)]).scales?.x
    expect(x?.domain.get()).toEqual([2000, 3000])
    expect(x?.options.get().resolved.defaultDomain).toEqual([1000, 5000])

    x?.update({ domain: undefined })
    expect(x?.domain.get()).toEqual([1000, 5000])
  })

  it('clears the zoom when it is left out again', () => {
    const handles = handleCache()
    build(handles, [new Date(2000), new Date(3000)])
    const x = build(handles).scales?.x
    expect(x?.options.get().explicit.domain).toBeUndefined()
    expect(x?.domain.get()).toEqual([1000, 5000])
  })
})
