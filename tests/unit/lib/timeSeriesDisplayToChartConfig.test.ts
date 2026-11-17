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
