import { test, expect } from '@playwright/test'

test('summarizes ensemble hover with the nearest member and min–max', async ({
  mount,
  page,
}) => {
  const component = await mount('charts/TimeSeriesChart/EnsembleMembers', {
    dataReady: true,
  })
  const curves = component.locator(
    '.chart-container svg .charts [data-chart-id^="forecast:"] path',
  )
  const summary = component.locator('.ensemble-hover-summary')
  let pointer = { x: 0, y: 0 }
  for (const index of [0, 1]) {
    const point = await curves
      .nth(index)
      .evaluate((element: SVGPathElement) => {
        const point = element.getPointAtLength(0)
        const screen = new DOMPoint(point.x + 1, point.y).matrixTransform(
          element.getScreenCTM()!,
        )
        return { x: screen.x, y: screen.y }
      })
    pointer = point
    await page.mouse.move(point.x, point.y)
    await expect(summary).toHaveCount(1)
    await expect(summary).not.toContainText('GEFS forecast')
    await expect(summary).toContainText(`member ${index} = ${index + 1} m`)
    await expect(summary).toContainText('min–max: 1–2 m')
  }
  await component.update({ dataReady: true, offset: 0.5 })
  await page.mouse.move(pointer.x + 1, pointer.y)
  await expect(summary).toContainText('min–max: 1.5–2.5 m')

  await component
    .getByRole('button', { name: 'GEFS forecast', exact: true })
    .click()
  await page.mouse.move(pointer.x + 2, pointer.y)
  await expect(component.locator('.tooltip')).toHaveCSS('opacity', '0')
})

test('draws ensemble members independently when the last member has no values', async ({
  mount,
}) => {
  const component = await mount('charts/TimeSeriesChart/EnsembleMembers')
  await component.update({ dataReady: true })
  const memberPaths = component.locator(
    '.chart-container svg .charts [data-chart-id^="forecast:"] path',
  )
  await expect(memberPaths).toHaveCount(3)
  await expect(memberPaths.nth(0)).toHaveAttribute('d', /^M.+L/)
  await expect(memberPaths.nth(1)).toHaveAttribute('d', /^M.+L/)
  await expect(memberPaths.nth(2)).not.toHaveAttribute('d', /^M.+L/)
  await expect(
    component.getByText('GEFS forecast', { exact: true }),
  ).toHaveCount(1)

  const firstCurve = await memberPaths.first().elementHandle()
  const previousPath = await memberPaths.first().getAttribute('d')
  await component.update({ dataReady: true, offset: 0.5 })
  await expect(memberPaths.first()).not.toHaveAttribute('d', previousPath!)
  expect(await firstCurve!.evaluate((element) => element.isConnected)).toBe(
    true,
  )

  const legend = component.getByRole('button', {
    name: 'GEFS forecast',
    exact: true,
  })
  await legend.click()
  for (const curve of await memberPaths.all()) {
    await expect(curve).toHaveCSS('visibility', 'hidden')
  }
  await legend.click()
  await expect(memberPaths.first()).toHaveCSS('visibility', 'visible')

  await component.update({ dataReady: true, memberCount: 1 })
  await expect(memberPaths).toHaveCount(1)
  await expect(memberPaths.first()).toHaveAttribute('d', /^M.+L/)
})

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

  await component.update({ chartCount: 1 })

  await expect(charts).toHaveCount(1)
  await expect(charts.first()).toHaveCSS('max-height', 'max(50%, 400px)')
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
