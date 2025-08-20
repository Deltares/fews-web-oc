import { test, expect } from '@playwright/test'

test.describe('Schematic Status Display Tests', () => {
  const base = 'topology/early_warning/node/'
  const url =
    base +
    'viewer_coastal_flooding_warning/viewer_coastal_flooding_warning_warning1/ssd/coastal_flooding1'

  test.beforeEach(async ({ page }) => {
    await page.goto(url)
    const value1 = page.getByText('0.82')
    await expect(value1).toBeVisible()
    const value2 = page.getByText('0.67')
    await expect(value2).toBeVisible()
  })

  test('SSD should load with filled in values', async ({ page }) => {
    const value3 = page.getByText('0.72')
    await expect(value3).toBeVisible()
    const value4 = page.getByText('0.85')
    await expect(value4).toBeVisible()
  })

  test('SSD should be responsive and switch to other display', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: 'Switch to Flood Warning #' })
      .click()
    const value1 = page.getByText('0.82')
    await expect(value1).not.toBeVisible()
    const value2 = page.getByText('0.67')
    await expect(value2).not.toBeVisible()
    const value3 = page.getByText('0.73')
    await expect(value3).toBeVisible()
    const value4 = page.getByText('0.85')
    await expect(value4).toBeVisible()
  })

  test('SSD should be responsive and switch to TimeSeriesDisplay', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: 'Switch to TimeSeriesDisplay' })
      .click()
    const graphs = page.getByRole('img')
    await expect(graphs).toHaveCount(2)
  })
})
