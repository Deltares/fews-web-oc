import { expect, test } from 'vitest'
import { defaultChartSettings } from './chartSettings'

test('default chart settings include explicit brush visibility', () => {
  expect(defaultChartSettings.timeSeriesChart.showBrush).toBe(false)
})
