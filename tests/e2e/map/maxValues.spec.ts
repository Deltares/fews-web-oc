import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'

test.describe('Maximum values legend on the date time slider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1`,
    )
  })

  test('should contain a max value on initial load', async ({ page }) => {
    const maxValues = page.getByLabel('map maximum values').getByRole('img')

    await expect(maxValues).toBeVisible()

    const maxValuesRects = maxValues.locator('rect')
    await expect(maxValuesRects.first()).toBeVisible()
  })

  test('should contain a max value on node switch', async ({ page }) => {
    await page.getByRole('link').filter({ hasText: 'Observed' }).click()

    const maxValues = page.getByLabel('map maximum values').getByRole('img')

    await expect(maxValues).toBeVisible()

    const maxValuesRects = maxValues.locator('rect')
    await expect(maxValuesRects.first()).toBeVisible()
  })
})
