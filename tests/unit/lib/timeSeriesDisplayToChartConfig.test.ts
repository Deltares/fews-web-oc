import { describe, expect, it } from 'vitest'
import type { TimeSeriesDisplaySubplot } from '@deltares/fews-pi-requests'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'

function createSubplot(
  request: string,
  legend = 'Observation',
): TimeSeriesDisplaySubplot {
  return {
    items: [
      {
        request,
        legend,
        type: 'line',
        lineStyle: 'solid',
        visibleInLegend: true,
        visibleInPlot: true,
        visibleInTable: true,
        yAxis: { axisPosition: 'left', axisLabel: 'Water level' },
      },
    ],
  }
}

describe('subplot identity', () => {
  it('distinguishes subplots with identical axis labels but different requests', () => {
    const first = timeSeriesDisplayToChartConfig(createSubplot('observation'))
    const second = timeSeriesDisplayToChartConfig(createSubplot('forecast'))

    expect(first.id).not.toBe(second.id)
  })

  describe('line and marker styles', () => {
    it('combines a line and marker while retaining their separate styles', () => {
      const subplot = createSubplot('observation')
      subplot.items[0].markerStyle = 'diamond'
      subplot.items[0].markerSize = 4
      subplot.items[0].color = '#336699'

      const config = timeSeriesDisplayToChartConfig(subplot)

      expect(config.series).toHaveLength(1)
      expect(config.series[0]).toMatchObject({
        type: 'line',
        marker: { shape: 'diamond', size: 16 },
        style: { fill: 'none' },
        markerStyle: { fill: '#336699', stroke: '#336699' },
      })
    })

    it.each(['area', 'bar'])(
      'keeps a separate marker for a %s series',
      (lineStyle) => {
        const subplot = createSubplot('observation')
        subplot.items[0].lineStyle = lineStyle
        subplot.items[0].markerStyle = 'diamond'

        expect(
          timeSeriesDisplayToChartConfig(subplot).series.map((item) => item.type),
        ).toEqual([lineStyle, 'marker'])
      },
    )

    it('keeps marker-only series when the line is disabled', () => {
      const subplot = createSubplot('observation')
      subplot.items[0].lineStyle = 'none'
      subplot.items[0].markerStyle = 'diamond'

      expect(
        timeSeriesDisplayToChartConfig(subplot).series.map((item) => item.type),
      ).toEqual(['marker'])
    })
  })

  it('distinguishes different configurations of the same request', () => {
    const first = timeSeriesDisplayToChartConfig(
      createSubplot('observation', 'First observation'),
    )
    const second = timeSeriesDisplayToChartConfig(
      createSubplot('observation', 'Second observation'),
    )

    expect(first.id).not.toBe(second.id)
  })

  it('preserves subplot identity when the display is rebuilt in a different order', () => {
    const original = [
      createSubplot('observation'),
      createSubplot('forecast'),
    ].map((subplot) => timeSeriesDisplayToChartConfig(subplot))
    const reordered = [
      createSubplot('forecast'),
      createSubplot('observation'),
    ].map((subplot) => timeSeriesDisplayToChartConfig(subplot))

    expect(reordered.map((subplot) => subplot.id)).toEqual(
      original.map((subplot) => subplot.id).reverse(),
    )
  })
})
