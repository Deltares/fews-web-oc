import { expect, Page, test } from '@playwright/test'
import exp from 'constants'

async function vuetifySelectByTestId(page: Page, id: string, text: string) {
  await expect(page.getByTestId(id)).toBeVisible()
  await page.getByTestId(id).click()
  await page
    .locator('.v-select__content .v-list-item')
    .filter({ has: page.getByText(text, { exact: true }) })
    .click()
}

test.describe('Theme switch', () => {
  test('Should be able to switch to dark mode', async ({ page }) => {
    await page.goto('/')

    // Accept terms and conditions if prompted
    const checkbox = page.getByLabel(
      'I have read and agree to the Terms and Conditions',
    )
    await checkbox.click()
    const acceptButton = page.getByRole('button', { name: 'Accept' })
    await acceptButton.click()

    // Check if the splash screen is displayed and click to close it
    const splashScreen = page.getByTestId('fews-splash-screen')
    await expect(splashScreen).toBeVisible()
    splashScreen.click()
    await expect(splashScreen).not.toBeVisible()
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
