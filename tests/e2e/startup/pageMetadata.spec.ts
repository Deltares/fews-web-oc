import { expect, test } from '@playwright/test'

test.describe('Page metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/FewsWebServices/**', (route) =>
      route.fulfill({
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }),
    )
  })

  test('applies the configured title and favicon during startup', async ({
    page,
  }) => {
    await page.route('**/weboc/config?documentFormat=PI_JSON', (route) =>
      route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        json: {
          general: {
            title: 'Configured Web OC title',
            icons: { favicon: 'configured-favicon.svg' },
          },
          components: [],
        },
      }),
    )

    await page.goto('/')

    await expect(page).toHaveTitle('Configured Web OC title')
    await expect(page.locator("link[rel='icon']")).toHaveAttribute(
      'href',
      /\/resources\/static\/configured-favicon\.svg$/,
    )
  })

  test('keeps the default title and favicon when not configured', async ({
    page,
  }) => {
    await page.route('**/weboc/config?documentFormat=PI_JSON', (route) =>
      route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        json: { general: {}, components: [] },
      }),
    )

    await page.goto('/')
    await expect(page.locator('#app')).not.toBeEmpty()

    await expect(page).toHaveTitle('Delft-FEWS WebOC')
    await expect(page.locator("link[rel='icon']")).toHaveAttribute(
      'href',
      '/images/favicon.ico',
    )
  })
})
