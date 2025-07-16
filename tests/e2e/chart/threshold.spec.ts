import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'

test.describe('Thresholds displayed in graph', () => {
  test('should display the thresholds correctly', async ({ page }) => {
    await page.goto(
      `${base}/viewer_rivers_level_stations/viewer_rivers_level_stations_forecast/map/waterdepth_sfincs_inland/location/Umgeni_Mouth_level`,
    )
    // Verify three thresholds are displayed in the graph
    const alertGroup = page.locator('g').filter({ hasText: /^Alert$/ })
    await expect(alertGroup).toBeVisible()
    const watch = page.locator('g').filter({ hasText: /^Watch$/ })
    await expect(watch).toBeVisible()
    const warning = page.locator('g').filter({ hasText: /^Warning$/ })
    await expect(warning).toBeVisible()
  })
})
