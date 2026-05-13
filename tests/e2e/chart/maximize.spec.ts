import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'
const url = `${base}/viewer_rivers_level_stations/viewer_rivers_level_stations_forecast/map/waterdepth_sfincs_inland/location/Umgeni_Mouth_level`

test.describe('Maximize individual chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(url)
  })

  test('should maximize a single chart and hide the others', async ({
    page,
  }) => {
    const charts = page.locator('.chart-with-chips')
    await expect(charts.first()).toBeVisible()

    // There should be multiple charts rendered
    const chartCount = await charts.count()
    expect(chartCount).toBeGreaterThan(1)

    // Hover over first chart to reveal the maximize button
    await charts.first().hover()
    const maximizeBtn = charts.first().getByRole('button', { name: 'Maximize chart' })
    await expect(maximizeBtn).toBeVisible()

    // Click maximize
    await maximizeBtn.click()

    // First chart should still be visible and marked as maximized
    await expect(charts.first()).toBeVisible()
    await expect(charts.first()).toHaveClass(/maximized/)

    // All other charts should be hidden
    for (let i = 1; i < chartCount; i++) {
      await expect(charts.nth(i)).not.toBeVisible()
    }
  })

  test('should restore all charts after clicking restore', async ({ page }) => {
    const charts = page.locator('.chart-with-chips')
    await expect(charts.first()).toBeVisible()
    const chartCount = await charts.count()

    // Maximize the first chart
    await charts.first().hover()
    await charts.first().getByRole('button', { name: 'Maximize chart' }).click()

    // Restore via the restore button
    await charts.first().hover()
    const restoreBtn = charts.first().getByRole('button', { name: 'Restore chart' })
    await expect(restoreBtn).toBeVisible()
    await restoreBtn.click()

    // All charts should be visible again and none marked as maximized
    for (let i = 0; i < chartCount; i++) {
      await expect(charts.nth(i)).toBeVisible()
      await expect(charts.nth(i)).not.toHaveClass(/maximized/)
    }
  })
})
