import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'

test.describe('Chart Legend Interaction', () => {
  test.describe('Line Series Toggle', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `${base}/viewer_coastal_water_levels/viewer_coastal_water_levels_d3d/map/kzn_waterlevel/location/NSRI_Tide_Gauge_level`,
      )
    })

    test('should toggle visibility of a single line series via legend', async ({
      page,
    }) => {
      const lineSeries = page.locator(
        'g.charts > g:first-child > g:nth-child(3)',
      )
      await expect(lineSeries).toBeVisible()

      const legendItem = page.getByRole('button', {
        name: 'Water level [1] Delft3D',
      })
      await legendItem.click() // Toggle off

      await expect(lineSeries).not.toBeVisible()

      await legendItem.click() // Toggle back on

      await expect(lineSeries).toBeVisible()
    })
  })

  test.describe('Line with Markers Series Toggle', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `${base}/viewer_coastal_water_levels/viewer_coastal_water_levels_d3d/map/kzn_waterlevel/location/NSRI_Tide_Gauge_level`,
      )
    })

    test('should toggle visibility of a line with markers series via legend', async ({
      page,
    }) => {
      const lineSeries = page.locator(
        'g.charts > g:first-child > g:nth-child(1)',
      )
      const markers = page.locator('g.charts > g:first-child > g:nth-child(2)')

      await expect(lineSeries).toBeVisible()
      await expect(markers).toBeVisible()

      const legendItem = page.getByRole('button', {
        name: 'Water level (obs)',
      })
      await legendItem.click() // Toggle off

      await expect(lineSeries).not.toBeVisible()
      await expect(markers).not.toBeVisible()

      await legendItem.click() // Toggle back on

      await expect(lineSeries).toBeVisible()
      await expect(markers).toBeVisible()
    })
  })

  // FIXME: Add test for area series toggle once it is added to the test config
  test.describe.fixme('Area Series Toggle', () => {
    test('should toggle visibility of an area series via legend', () => {})
  })

  test.describe('Bar Series Toggle', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(
        `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1/coordinates/-28.781/31.841`,
      )
    })

    test('should toggle visibility of a bar series via legend', async ({
      page,
    }) => {
      const barSeries = page.locator('g.charts > g:first-child > g:first-child')
      await expect(barSeries).toBeVisible()

      const legendItem = page.getByRole('button', {
        name: 'Precipitation [1] Regional NWP',
      })
      await legendItem.click() // Toggle off

      await expect(barSeries).not.toBeVisible()

      await legendItem.click() // Toggle back on

      await expect(barSeries).toBeVisible()
    })
  })
})
