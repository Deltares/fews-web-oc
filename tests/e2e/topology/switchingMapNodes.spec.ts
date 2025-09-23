import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'

test.describe('Switching Nodes with TopologySpatialTimeSeriesDisplay', () => {
  test('when switching nodes the location has to be remembered', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_coastal_water_levels/viewer_coastal_water_levels_d3d/map/kzn_waterlevel/location/Umgeni_Mouth_level`,
    )

    await expect(page.getByText('Water Level (m + MSL)')).toBeVisible()

    await page.getByText('Rivers').click()
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Level stations' })
      .click()

    await expect(page.getByText('Water Level (m + MSL)')).toBeVisible()
    await expect(page.getByText('Total Water Depth (m)')).toBeVisible()
  })

  test('when switching nodes the location should not be displayed if the node does not have the selected location', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_coastal_water_levels/viewer_coastal_water_levels_d3d/map/kzn_waterlevel/location/Umgeni_Mouth_level`,
    )

    await expect(page.getByText('Water Level (m + MSL)')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chart' })).toBeVisible()

    await page.getByText('Rivers').click()
    await page.getByRole('listitem').filter({ hasText: 'Palmiet' }).click()

    await expect(page.getByText('Water Level (m + MSL)')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Chart' })).not.toBeVisible()
  })
})

test.describe('Switching Nodes with TopologySpatialTimeSeriesDisplayWithCoordinates', () => {
  test('when switching nodes the coordinates remembered', async ({ page }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1/coordinates/-29.115/32.083`,
    )
    await expect(page.getByText('Precipitation Rate (mm)')).toBeVisible()

    await page.getByText('Coastal processes').click()
    await page.getByRole('listitem').filter({ hasText: 'Currents' }).click()

    await expect(page.getByText('Current Speed (m/s)')).toBeVisible()
    await expect(
      page.getByText('Current direction (going to) [1] Delft3D'),
    ).toBeVisible()
  })

  test('when switching nodes if the node does not support coordinates, the coordinates should not be displayed', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_rivers_palmiet/viewer_rivers_palmiet_scenario/map/waterdepth_sfincs_palmiet/coordinates/-29.812/30.905`,
    )

    await expect(page.getByText('Water Level (m + MSL)')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chart' })).toBeVisible()

    await page
      .getByRole('listitem')
      .filter({ hasText: 'Critical points' })
      .click()

    await expect(page.getByText('Water Level (m + MSL)')).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Chart' })).not.toBeVisible()
  })
})
