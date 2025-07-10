import { test, expect, type Page } from '@playwright/test'

async function switchToSystemUnits(page: Page) {
  await page.getByRole('button', { name: 'User Settings' }).click()
  await page.getByRole('button', { name: 'All User Settings' }).click()
  await page
    .getByRole('combobox')
    .filter({ hasText: 'Unit SystemUnit SystemDisplay' })
    .click()
  await page.getByLabel('Units Unit System System').click()
  await page.getByRole('button', { name: 'Close User Settings' }).click()
}

function locateLegendImage(page: Page) {
  return page.getByLabel('map legend').getByRole('img')
}

test.describe('WMS Legend', () => {
  test.fixme(
    'when changing display units for layer with different units the legend should change',
    async ({ page }) => {
      // FIXME: Requires a node with different units in the legend
      await page.goto('')

      const legendImage = locateLegendImage(page)

      // TODO: Add before text
      await expect(legendImage).toContainText('')

      await switchToSystemUnits(page)

      // TODO: Add after text
      await expect(legendImage).toContainText('')
    },
  )

  test('when changing display units for layer with same units the legend should not change', async ({
    page,
  }) => {
    await page.goto(
      '/topology/node/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1',
    )

    const legendImage = locateLegendImage(page)

    await expect(legendImage).toContainText('0210203050SAWS forecast (1x1 km)')

    await switchToSystemUnits(page)

    await expect(legendImage).toContainText('0210203050SAWS forecast (1x1 km)')
  })
})
