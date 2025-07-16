import { test, expect, type Page } from '@playwright/test'

const base = '/topology/early_warning/node'

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

function locateLegendSvg(page: Page) {
  return page.getByLabel('map legend').getByRole('img')
}

test.describe('WMS Legend', () => {
  test.fixme(
    'when changing display units for layer with different units the legend should change',
    async ({ page }) => {
      // FIXME: Requires a node with different units in the legend
      await page.goto('')

      const legendSvg = locateLegendSvg(page)

      // TODO: Add before text
      await expect(legendSvg).toContainText('')

      await switchToSystemUnits(page)

      // TODO: Add after text
      await expect(legendSvg).toContainText('')
    },
  )

  test('when changing display units for layer with same units the legend should not change', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1`,
    )

    const legendSvg = locateLegendSvg(page)

    await expect(legendSvg).toContainText('0210203050SAWS forecast (1x1 km)')

    await switchToSystemUnits(page)

    await expect(legendSvg).toContainText('0210203050SAWS forecast (1x1 km)')
  })

  test('when changing the range of the legend, the legend should update', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1`,
    )

    const legendSvg = locateLegendSvg(page)
    const originalText = '0210203050SAWS forecast (1x1 km)'

    await expect(legendSvg).toContainText(originalText)

    await page.getByRole('button', { name: 'Layer information' }).click()

    const maxInput = page.getByRole('textbox', { name: 'Max Max' })
    await maxInput.click()
    await maxInput.fill('100')
    await maxInput.press('Enter')

    await expect(legendSvg).toContainText('04204060100SAWS forecast (1x1 km)')

    const minInput = page.getByRole('textbox', { name: 'Min Min' })
    await minInput.click()
    await minInput.fill('20')
    await minInput.press('Enter')

    await expect(legendSvg).toContainText(
      '2023.2365268100SAWS forecast (1x1 km)',
    )

    await page
      .getByRole('button', { name: 'Reset current colour scale' })
      .click()

    await expect(legendSvg).toContainText(originalText)
  })

  test.fixme(
    'when changing display units for layer with different units the range is reset',
    async ({ page }) => {
      // FIXME: Requires a node with different units in the legend
      await page.goto('')

      const legendSvg = locateLegendSvg(page)

      // TODO: Add before text
      await expect(legendSvg).toContainText('')

      await page.getByRole('button', { name: 'Layer information' }).click()

      const maxInput = page.getByRole('textbox', { name: 'Max Max' })
      await maxInput.click()
      await maxInput.fill('100')
      await maxInput.press('Enter')

      // TODO: Add after range change text
      await expect(legendSvg).toContainText('')

      await switchToSystemUnits(page)

      // TODO: Add after switch to systems units text
      await expect(legendSvg).toContainText('')
    },
  )

  test('when changing display units for layer with same units the range is reset', async ({
    page,
  }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1`,
    )

    const legendSvg = locateLegendSvg(page)
    const originalText = '0210203050SAWS forecast (1x1 km)'

    await expect(legendSvg).toContainText(originalText)

    await page.getByRole('button', { name: 'Layer information' }).click()

    const maxInput = page.getByRole('textbox', { name: 'Max Max' })
    await maxInput.click()
    await maxInput.fill('100')
    await maxInput.press('Enter')

    await expect(legendSvg).toContainText('04204060100SAWS forecast (1x1 km)')

    await switchToSystemUnits(page)

    await expect(legendSvg).toContainText(originalText)
  })
})
