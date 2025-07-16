import { test, expect } from '@playwright/test'

test.describe('Thresholds displayed in graph', () => {
  test('should display the thresholds correctly', async ({ page }) => {
    await page.goto(
      '/topology/node/viewer_rivers_level_stations/viewer_rivers_level_stations_forecast/map/waterdepth_sfincs_inland/location/Umgeni_Mouth_level',
    )
    // Open thresholds panel
    await page.getByRole('button', { name: 'Badge' }).click()
    // Click on the v-card containing the text
    await page.locator('.v-card:has-text("Umgeni Mouth")').click()
    // Verify three thresholds are displayed in the graph
    const alertGroup = page.locator('g').filter({ hasText: /^Alert$/ })
    await expect(alertGroup).toBeVisible()
    const watch = page.locator('g').filter({ hasText: /^Watch$/ })
    await expect(watch).toBeVisible()
    const warning = page.locator('g').filter({ hasText: /^Warning$/ })
    await expect(warning).toBeVisible()
  })
})
