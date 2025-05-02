import { expect, Page } from '@playwright/test'

/**
 * Common helper to navigate to the homepage and complete initial steps
 * such as accepting terms & conditions and dismissing the splash screen
 */
export async function loadHomePage(page: Page): Promise<void> {
  // Navigate to the home page
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
  await page.waitForTimeout(300) // Wait for the splash screen to load
  splashScreen.click()
  await expect(splashScreen).not.toBeVisible()
}

/**
 * Helper for selecting an item from a Vuetify select component
 */
export async function vuetifySelectByTestId(
  page: Page,
  id: string,
  text: string,
): Promise<void> {
  await expect(page.getByTestId(id)).toBeVisible()
  await page.getByTestId(id).click()
  await page
    .locator('.v-select__content .v-list-item')
    .filter({ has: page.getByText(text, { exact: true }) })
    .click()
}
