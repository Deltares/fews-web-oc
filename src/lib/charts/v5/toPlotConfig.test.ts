import { describe, expect, it } from 'vitest'
import { defaultChartSettings } from '@/lib/topology/componentSettings'
import { getV5PlotMargins, toPlotConfig } from './toPlotConfig'

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
    it('fits axis space within margins and enables automatic margin sizing', () => {
      const config = toPlotConfig(
        { id: 'test', title: 'Test', series: [] },
        {},
        defaultChartSettings.timeSeriesChart,
      )

      expect(config.axisLayout).toBe('inset')
      expect(config.autoMargins).toBe(true)
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
