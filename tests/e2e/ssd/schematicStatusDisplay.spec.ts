import { test, expect } from '@playwright/test'

test.describe('Schematic Status Display Tests', () => {
  const base = 'topology/early_warning/node/'
  const topologyNode1 = 'viewer_coastal_flooding_warning_warning1'
  const topologyNode2 = 'viewer_coastal_flooding_warning_warning2'
  const url =
    base +
    `viewer_coastal_flooding_warning/${topologyNode1}/ssd/coastal_flooding1`

  test('SSD should load with filled in values', async ({ page }) => {
    await page.goto(url)
    const value1 = page.getByText('0.82')
    await expect(value1).toBeVisible()
    const value2 = page.getByText('0.67')
    await expect(value2).toBeVisible()
    const value3 = page.getByText('0.72')
    await expect(value3).toBeVisible()
    const value4 = page.getByText('0.85')
    await expect(value4).toBeVisible()
  })

  test('SSD should be responsive and switch to other display', async ({
    page,
  }) => {
    await page.goto(url)
    await page
      .getByRole('button', { name: 'Switch to Flood Warning #2' })
      .click()
    await expect(page.getByText('COASTAL FLOOD WARNING #2')).toBeVisible()
  })

  test('SSD should be responsive and switch to TimeSeriesDisplay', async ({
    page,
  }) => {
    await page.goto(url)
    await page
      .getByRole('button', { name: 'Switch to TimeSeriesDisplay' })
      .click()

    await expect(page.getByText('Water Level (m + MSL)')).toBeVisible()
    await expect(page.getByText('Wave Height (m)')).toBeVisible()
  })

  test('SSD should navigate to topology node via clicking on the select topology node button', async ({
    page,
  }) => {
    await page.goto(url)

    const selectTopologyNodeButton = await page.getByRole('button', {
      name: 'Switch to Topology Node',
    })

    // Check that the button is visible and enabled before clicking
    await expect(selectTopologyNodeButton).toBeVisible()
    await expect(selectTopologyNodeButton).toBeEnabled()

    await selectTopologyNodeButton.click()

    const expectedUrl =
      '/topology/early_warning/node/viewer_coastal_flooding_inundation/viewer_coastal_flooding_inundation_forecast/map/waterdepth_sfincs'

    await expect(page).toHaveURL(new RegExp(expectedUrl))
  })
})
