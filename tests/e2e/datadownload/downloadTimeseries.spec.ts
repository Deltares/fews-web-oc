import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'

test.describe('Download Time Series', () => {
  test.describe('Go to Download Time Series', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `${base}/viewer_coastal_water_levels/viewer_coastal_water_levels_d3d/map/kzn_waterlevel/location/NSRI_Tide_Gauge_level`,
      )
      const actionmenu = page.locator('[aria-labelledby="display-action-menu"]')
      // Wait for the action menu to be visible
      await expect(actionmenu).toBeVisible()
      await actionmenu.click()
    })

    test('Should download in CSV format', async ({ page }) => {
      await page.getByText('Download time series').click()

      // Set up the download promise before clicking the download button
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Download' }).click()
      // Wait for the download to complete
      const download = await downloadPromise
      const path = await download.path()
      expect(path).toBeDefined()
      // Check if the file has a .csv extension
      expect(path.endsWith('.csv')).toBeTruthy()
      // Optionally, you can check the content of the CSV file
      const fs = require('fs')
      const content = fs.readFileSync(path, 'utf8')
      expect(content).toContain('Expected CSV content')
    })
  })
})
