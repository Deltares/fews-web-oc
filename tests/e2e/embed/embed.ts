import { test, expect } from '@playwright/test'

const base = '/embed/topology/early_warning/node'

test.describe('Embed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1`,
    )
  })

  test('should have no sidebar', async ({ page }) => {
    const sidebar = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(sidebar).not.toBeVisible()
  })

  test('should have no app bar', async ({ page }) => {
    const appBar = page.getByRole('banner', { name: 'Application header' })
    await expect(appBar).not.toBeVisible()
  })

  test('should have no topology sidebar menu', async ({ page }) => {
    const topologySidebarMenu = page.getByTestId('topology-tree')
    await expect(topologySidebarMenu).not.toBeVisible()
  })

  test('should have no leaf node buttons', async ({ page }) => {
    const leafNodeButtons = page.getByRole('button', { name: 'Leaf node' })
    await expect(leafNodeButtons).not.toBeVisible()
  })

  test('should have no display tab selection', async ({ page }) => {
    const displayTabSelection = page.getByRole('tablist', {
      name: 'Node tab selection',
    })
    await expect(displayTabSelection).not.toBeVisible()
  })

  test('should show the map legend', async ({ page }) => {
    const legend = page.getByLabel('map legend').getByRole('img')
    await expect(legend).toBeVisible()
  })
})
