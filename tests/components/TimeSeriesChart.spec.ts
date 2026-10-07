import { test, expect } from '@playwright/test'

test('renders delayed series data after switching plot configurations', async ({
  mount,
}) => {
  const component = await mount('charts/TimeSeriesChart/ThresholdSwitching', {
    autoScaleY: true,
    includeMarkers: true,
  })
  const seriesPath = component
    .locator('svg .charts [data-chart-id="observation"] path')
    .first()
  await expect(seriesPath).toHaveAttribute('d', /^M.+L/)
  await expect(seriesPath).not.toHaveAttribute('d', /NaN|Infinity/)

  for (const withThresholds of [true, false, true, false]) {
    await component.update({ withThresholds, dataReady: false })
    await expect(seriesPath).not.toHaveAttribute('d', /^M.+L/)
    await component.update({ withThresholds, dataReady: true })
    await expect(seriesPath).toHaveAttribute('d', /^M.+L/)
    await expect(seriesPath).not.toHaveAttribute('d', /NaN|Infinity/)
  }
})

test('clears thresholds and restores axis limits when returning to a threshold-free plot', async ({
  mount,
}) => {
  const component = await mount('charts/TimeSeriesChart/ThresholdSwitching')
  const thresholdLabels = component.locator('svg .alert-lines text')
  const ticks = component
    .locator('svg text')
    .filter({ hasText: /^\d+(\.\d+)?$/ })
  await expect(ticks).not.toHaveCount(0)
  const initialTicks = await ticks.allTextContents()

  for (let roundTrip = 0; roundTrip < 2; roundTrip++) {
    await component.update({ withThresholds: true })
    await expect(thresholdLabels).toHaveText(['Regular Defense'])
    await expect(ticks).not.toHaveText(initialTicks)

    await component.update({ withThresholds: false })
    await expect(component.locator('svg .alert-lines > *')).toHaveCount(0)
    await expect(ticks).toHaveText(initialTicks)
  }
})
