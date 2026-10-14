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

test('sets chart max height based on the number of chart siblings', async ({
  mount,
}) => {
  const component = await mount('charts/TimeSeriesChart/ThresholdSwitching', {
    chartCount: 1,
  })
  const charts = component.locator('.chart-with-chips')

  await expect(charts).toHaveCount(1)
  await expect(charts.first()).toHaveCSS('max-height', 'max(50%, 400px)')

  await component.update({ chartCount: 2 })

  await expect(charts).toHaveCount(2)
  await expect(charts.nth(0)).toHaveCSS('max-height', '50%')
  await expect(charts.nth(1)).toHaveCSS('max-height', '50%')

  const svg = charts.nth(0).locator('.chart-container > svg')
  const initialHeight = (await svg.boundingBox())?.height ?? 0
  expect(initialHeight).toBeGreaterThan(0)

  await charts.first().evaluate((chart) => {
    const container = chart.parentElement as HTMLElement
    container.style.height = '600px'
  })

  await expect
    .poll(async () => (await svg.boundingBox())?.height ?? 0)
    .toBeGreaterThan(initialHeight + 50)
})

test('vertical profile charts are not limited by the regular chart heights', async ({
  mount,
}) => {
  const component = await mount('charts/TimeSeriesChart/ThresholdSwitching', {
    chartCount: 1,
    verticalProfile: true,
  })
  const charts = component.locator('.chart-with-chips')

  await expect(charts).toHaveCount(1)
  await expect(charts.first()).toHaveClass(/vertical-profile/)
  await expect(charts.first()).toHaveCSS('max-height', 'none')

  await component.update({ chartCount: 2, verticalProfile: true })

  await expect(charts).toHaveCount(2)
  await expect(charts.nth(0)).toHaveCSS('max-height', 'none')
  await expect(charts.nth(1)).toHaveCSS('max-height', 'none')

  const svg = charts.first().locator('.chart-container > svg')
  const initialHeight = (await svg.boundingBox())?.height ?? 0
  expect(initialHeight).toBeGreaterThan(0)

  await charts.first().evaluate((chart) => {
    const container = chart.parentElement as HTMLElement
    container.style.height = '600px'
  })

  await expect
    .poll(async () => (await svg.boundingBox())?.height ?? 0)
    .toBeGreaterThan(initialHeight + 50)
})
