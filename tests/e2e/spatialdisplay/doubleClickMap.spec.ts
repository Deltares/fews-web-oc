import { test, expect } from '@playwright/test'

test.describe('Map Double Click', () => {
  test('double-clicking on map should switch from location-based to coordinate-based time series display without closing', async ({
    page,
  }) => {
    // Start with a location-based time series display open
    const baseUrlWithLocation =
      'topology/early_warning/node/viewer_coastal_water_levels/viewer_coastal_water_levels_d3d/map/kzn_waterlevel/location/Umgeni_Mouth_level'

    await page.goto(baseUrlWithLocation)

    // Verify location-based time series display is open
    await expect(page.getByText('Water Level (m + MSL)')).toBeVisible()
    const chartButton = page.getByRole('button', { name: 'Chart' })
    await expect(chartButton).toBeVisible()

    // Verify URL contains location
    await expect(page).toHaveURL(/\/location\/Umgeni_Mouth_level/)

    // Wait for the map to be fully loaded
    const mapContainer = page.locator('.maplibregl-canvas')
    await expect(mapContainer).toBeVisible()
    await page.waitForTimeout(500)

    const mapBox = await mapContainer.boundingBox()
    if (!mapBox) {
      throw new Error('Map canvas not found or not visible')
    }

    const clickX = mapBox.x + mapBox.width * 0.3
    const clickY = mapBox.y + mapBox.height * 0.3

    // Double-click on an empty part of the map (not on a location marker)
    await page.mouse.dblclick(clickX, clickY)

    // Wait for navigation to complete
    await page.waitForTimeout(1000)

    await expect(page).toHaveURL(/\/coordinates\/-?\d+\.\d+\/-?\d+\.\d+/)

    // Verify that the time series display is still open (not closed by the bug)
    await expect(chartButton).toBeVisible()

    await page.waitForTimeout(500)
    await expect(chartButton).toBeVisible()
  })

  test('double-clicking on coverage layer map should open coordinate-based time series display', async ({
    page,
  }) => {
    // Navigate to a map with coverage layers (grids) and a location open
    const baseUrlWithLocation =
      'topology/early_warning/node/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1'

    await page.goto(baseUrlWithLocation)

    // Wait for the map to be visible
    const mapContainer = page.locator('.maplibregl-canvas')
    await expect(mapContainer).toBeVisible()
    await page.waitForTimeout(500)

    // Get the bounding box of the map
    const mapBox = await mapContainer.boundingBox()
    if (!mapBox) {
      throw new Error('Map canvas not found or not visible')
    }

    const centerX = mapBox.x + mapBox.width / 2
    const centerY = mapBox.y + mapBox.height / 2

    // Double-click on the map
    await page.mouse.dblclick(centerX, centerY)

    await page.waitForTimeout(1000)

    // Verify that the coordinate-based time series display is opened
    await expect(page).toHaveURL(/\/coordinates\/-?\d+\.\d+\/-?\d+\.\d+/)

    const chartButton = page.getByRole('button', { name: 'Chart' })
    await expect(chartButton).toBeVisible()

    // Verify the chart panel shows precipitation data
    const precipitationText = page.getByText('Precipitation Rate')
    await expect(precipitationText).toBeVisible()
  })
})
