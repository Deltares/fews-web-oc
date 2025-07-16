import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'

test.describe('Topology Thresholds Overview Visibility', () => {
  test('should show ThresholdsOverview by default', async ({ page }) => {
    // Navigate to a specific node in the topology
    await page.goto(
      `${base}/viewer_rivers_level_stations/viewer_rivers_level_stations_forecast/map/waterdepth_sfincs_inland/location/Umgeni_Mouth_level`,
    )

    // Check that the ThresholdsControl button is visible in the app bar
    const thresholdButton = await page.getByRole('button', { name: 'Badge' })
    await expect(thresholdButton).toBeVisible()
  })

  test('should hide ThresholdsOverview when showActiveThresholdCrossingsForFilters is false', async ({
    page,
  }) => {
    // Mock the configuration response to set showActiveThresholdCrossingsForFilters to false
    await page.route(
      '**/weboc/config?documentFormat=PI_JSON',
      async (route) => {
        const response = await route.fetch()
        const json = await response.json()

        // Find topology component and set showActiveThresholdCrossingsForFilters to false
        if (json.components) {
          json.components = json.components.map((component) => {
            if (component.type === 'TopologyDisplay') {
              return {
                ...component,
                showActiveThresholdCrossingsForFilters: false,
              }
            }
            return component
          })
        }

        await route.fulfill({ json })
      },
    )

    // Navigate to the same location
    await page.goto(
      `${base}/viewer_rivers_level_stations/viewer_rivers_level_stations_forecast/map/waterdepth_sfincs_inland/location/Umgeni_Mouth_level`,
    )

    // Check that the ThresholdsControl button is not visible in the app bar
    const thresholdButton = await page.getByRole('button', { name: 'Badge' })
    await expect(thresholdButton).not.toBeVisible()
  })
})
