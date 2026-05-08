import { test, expect, type Page } from '@playwright/test'
import { describeFromVersion } from '../utils/versionedTest'

const base = '/topology/early_warning/node'
const url = `${base}/viewer_meteorology_rainfall_forecast/viewer_meteorology_rainfall_forecast_saws_1x1/map/saws1`

async function copyToClipboard(page: Page) {
  const copyButton = page.getByRole('button', { name: 'Copy to clipboard' })
  await copyButton.click()

  return await page.evaluate(() => navigator.clipboard.readText())
}

describeFromVersion('202402', 'Share', () => {
  test.beforeEach(async ({ page, context }) => {
    context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto(url)

    // Open share panel
    await page.getByRole('button', { name: 'More Sidepanel Options' }).click()
    await page.getByRole('listitem').filter({ hasText: 'Share' }).click()
  })

  test('should copy embed url', async ({ page }) => {
    const clipboardContent = await copyToClipboard(page)

    expect(clipboardContent).toContain(`/embed${url}`)
  })

  test('should copy iframe with embed url', async ({ page }) => {
    await page.getByRole('tab', { name: 'Iframe' }).click()

    const clipboardContent = await copyToClipboard(page)

    expect(clipboardContent).toContain(`<iframe src=`)
    expect(clipboardContent).toContain(`/embed${url}`)
  })

  test('should change user setting of url', async ({ page }) => {
    let clipboardContent = await copyToClipboard(page)

    await page.getByText('Datum', { exact: true }).click()

    await page
      .getByRole('checkbox', { name: 'Absolute vertical datum' })
      .uncheck()

    clipboardContent = await copyToClipboard(page)
    expect(clipboardContent).toContain(`datum.verticalDatum=false`)

    await page
      .getByRole('checkbox', { name: 'Absolute vertical datum' })
      .check()

    clipboardContent = await copyToClipboard(page)
    expect(clipboardContent).toContain(`datum.verticalDatum=true`)
  })
})
