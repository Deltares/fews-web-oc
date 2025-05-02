import { expect, test } from '@playwright/test'
import { loadHomePage, vuetifySelectByTestId } from './helpers/common'

test.describe('Theme switch', () => {
  test('Should be able to switch to dark mode', async ({ page }) => {
    // Use the helper to navigate and handle initial screens
    await loadHomePage(page)

    // Go to the settings page
    await page.getByTestId('fews-user-settings-button').click()
    // Click the all settings button
    await page.getByText('All Settings ...').click()
    // Switch to dark mode
    await vuetifySelectByTestId(page, 'Theme', 'dark')
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })
})
