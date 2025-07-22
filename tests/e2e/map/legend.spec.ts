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

test.describe('WMS Legend with different display and system units', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${base}/viewer_wind_gfs/viewer_wind_gfs_forecast/map/noaa_gfs_wind`,
    )

    // Disable animated vectors for the test
    await page.route(
      '**request=GetCapabilities&format=application/json&version=1.3&layers=noaa_gfs_wind',
      async (route) => {
        const response = await route.fetch()
        const json = await response.json()

        if (json.layers) {
          json.layers = json.layers.map((layer) => {
            return {
              ...layer,
              animatedVectors: undefined,
            }
          })
        }

        await route.fulfill({ json })
      },
    )
  })

  test('when changing display units the legend should change', async ({
    page,
  }) => {
    const legendSvg = locateLegendSvg(page)

    await expect(legendSvg).toContainText('01224364860GFS wind [knots]')

    await switchToSystemUnits(page)

    await expect(legendSvg).toContainText(
      '06.17312.34718.5224.69330.867GFS wind [m/s]',
    )
  })

  test('when changing display units the range is reset', async ({ page }) => {
    const legendSvg = locateLegendSvg(page)

    await expect(legendSvg).toContainText('01224364860GFS wind [knots]')

    await page.getByRole('button', { name: 'Layer information' }).click()

    const maxInput = page.getByRole('textbox', { name: 'Max Max' })
    await maxInput.click()
    await maxInput.fill('100')
    await maxInput.press('Enter')

    await expect(legendSvg).toContainText(
      '0204060.00180.001100.001GFS wind [knots]',
    )

    await switchToSystemUnits(page)

    await expect(legendSvg).toContainText(
      '06.17312.34718.5224.69330.867GFS wind [m/s]',
    )
  })
})

test.describe('WMS Legend with the same display and system units', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1`,
    )
  })

  test('when changing display units the legend should change', async ({
    page,
  }) => {
    const legendSvg = locateLegendSvg(page)

    await expect(legendSvg).toContainText('0210203050SAWS forecast (1x1 km)')

    await switchToSystemUnits(page)

    await expect(legendSvg).toContainText('0210203050SAWS forecast (1x1 km)')
  })

  test('when changing the range of the legend, the legend should update', async ({
    page,
  }) => {
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

  test('when changing display units the range is reset', async ({ page }) => {
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
