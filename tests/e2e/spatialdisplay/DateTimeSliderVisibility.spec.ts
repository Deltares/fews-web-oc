import { test, expect } from '@playwright/test'

test.describe('DateTimeSlider Visibility', () => {
  const baseUrl =
    'topology/early_warning/node/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1'

  test('DateTimeSlider should be hidden when layer is completely missing', async ({
    page,
  }) => {
    // Intercept WMS capabilities requests and modify the response
    await page.route('**/wms/request=GetCapabilities**', async (route) => {
      const url = route.request().url()
      // Only intercept the actual layer capabilities request
      if (url.includes('layers=saws1')) {
        const response = await route.fetch()
        const responseBody = await response.text()

        if (response.headers()['content-type']?.includes('application/json')) {
          const jsonData = JSON.parse(responseBody)

          if (jsonData.layers && jsonData.layers.length > 0) {
            jsonData.layers.forEach((layer) => {
              if (layer.name === 'saws1') {
                layer.completelyMissing = true
              }
            })
          }

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(jsonData),
          })
        } else {
          // For non-JSON responses, fulfill with original response
          await route.continue()
        }
      } else {
        // For other requests, continue normally
        await route.continue()
      }
    })

    await page.goto(baseUrl)

    // Check that the DateTimeSlider is not visible
    const dateTimeSlider = page.locator('[aria-labelledby="date time slider"]')
    await expect(dateTimeSlider).not.toBeVisible()
  })

  test('DateTimeSlider should be visible when layer is not completely missing', async ({
    page,
  }) => {
    await page.goto(baseUrl)
    // Check that the DateTimeSlider is visible
    const dateTimeSlider = page.locator('[aria-labelledby="date time slider"]')
    await expect(dateTimeSlider).toBeVisible()
  })
})
