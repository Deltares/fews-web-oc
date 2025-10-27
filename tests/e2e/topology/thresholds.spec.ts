import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'

test.describe('Topology Thresholds', () => {
  test('should display the thresholds correctly', async ({ page }) => {
    await page.goto(base)
    const thresholdCounts = ['12', '1']

    const topologyTree = page.locator('[data-test-id="topology-tree"]')
    await expect(topologyTree).toBeVisible()

    const thresholdNodes = topologyTree.getByRole('status')
    await expect(thresholdNodes).toHaveCount(2)
    await expect(thresholdNodes).toHaveText(thresholdCounts)
  })

  test('should display the thresholds for node viewer_rivers_level_stations', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_rivers_level_stations/viewer_rivers_level_stations_forecast/map/waterdepth_sfincs_inland`,
    )
    const thresholdCounts = ['12', '4', '8', '1']

    const topologyTree = page.locator('[data-test-id="topology-tree"]')
    await expect(topologyTree).toBeVisible()

    const thresholdNodes = topologyTree.getByRole('status')
    await expect(thresholdNodes).toHaveCount(4)
    await expect(thresholdNodes).toHaveText(thresholdCounts)
  })

  test('should display the thresholds for node viewer_coastal_water_levels', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_coastal_water_levels/viewer_coastal_water_levels_d3d/map/kzn_waterlevel`,
    )
    const thresholdCounts = ['12', '1', '1']

    const topologyTree = page.locator('[data-test-id="topology-tree"]')
    await expect(topologyTree).toBeVisible()

    const thresholdNodes = topologyTree.getByRole('status')
    await expect(thresholdNodes).toHaveCount(3)
    await expect(thresholdNodes).toHaveText(thresholdCounts)
  })
})
