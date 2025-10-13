import { test, expect } from '@playwright/test'

const saws1 =
  '/topology/early_warning/node/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1'
const systemLog = '/topology/admin/node/viewer_log_system_log/log'

test.describe('Leaf nodes as buttons enabled', () => {
  test('has leaf nodes button', async ({ page }) => {
    await page.goto(saws1)
    const leafNodeButton = page.getByRole('button', { name: 'Leaf node' })
    await expect(leafNodeButton).toBeVisible()
  })

  test('when changing nodes with the leaf nodes button', async ({ page }) => {
    await page.goto(saws1)

    const leafNodeButton = page.getByRole('button', { name: 'Leaf node' })
    const layerInfo = page.getByRole('button', { name: 'Layer information' })

    await expect(leafNodeButton).toBeVisible()
    await expect(layerInfo).toContainText('Regional NWP forecast (1x1 km)')

    await leafNodeButton.click()
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Regional NWP 4x4' })
      .click()

    await expect(layerInfo).toContainText('Regional NWP forecast (4x4 km)')
  })

  test('when navigating to node group with leaf nodes as buttons disabled', async ({
    page,
  }) => {
    await page.goto(saws1)

    const leafNodeButton = page.getByRole('button', { name: 'Leaf node' })
    const menuButton = page.getByRole('button', {
      name: 'Switch topology group',
    })

    await expect(leafNodeButton).toBeVisible()
    await expect(menuButton).toBeVisible()
    await expect(menuButton).toContainText('Early Warning')

    await menuButton.click()
    await page.getByRole('option', { name: 'Admin' }).click()

    await expect(menuButton).not.toContainText('Early Warning')
    await expect(leafNodeButton).not.toBeVisible()
  })
})

test.describe('Leaf nodes as buttons disabled', () => {
  test('does not have leaf nodes button', async ({ page }) => {
    await page.goto(systemLog)
    const leafNodeButton = page.getByRole('button', { name: 'Leaf node' })
    await expect(leafNodeButton).not.toBeVisible()
  })

  test('when navigating to node group with leaf nodes as buttons enabled', async ({
    page,
  }) => {
    await page.goto(systemLog)

    const menuButton = page.getByRole('button', {
      name: 'Switch topology group',
    })

    await expect(menuButton).toBeVisible()
    await expect(menuButton).toContainText('Admin')

    await menuButton.click()

    await page.getByRole('option', { name: 'Early Warning' }).click()
    await expect(menuButton).not.toContainText('Admin')

    const leafNodeButton = page.getByRole('button', { name: 'Leaf node' })
    await expect(leafNodeButton).toBeVisible()
  })
})
