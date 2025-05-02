import { expect, test } from '@playwright/test'

test.describe('Topology Display', () => {
  test('should load the topology and display shark attack nodes', async ({
    page,
  }) => {
    // Navigate to the home page which should load the topology display by default
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
    await page.waitForTimeout(1000) // Wait for the splash screen to load
    await splashScreen.click()
    await expect(splashScreen).not.toBeVisible()

    // Check if the shark attacks node is displayed
    await expect(page.getByText('All Attacks')).toBeVisible()

    // Setup a watcher for API requests
    const locationsRequest = page.waitForResponse(
      (response) =>
        response.url().includes('locations') &&
        response.url().includes('filterId=shark-attacks'),
    )

    // Click on the JAWS node
    page.getByText('All Attacks').click()

    // We expect the filterId parameter to be present in the URL
    expect(await locationsRequest).toBeTruthy()
  })
  test('should filter shark attacks by hemisphere', async ({ page }) => {
    // Navigate to the home page which should load the topology display by default
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
    await page.waitForTimeout(1000) // Wait for the splash screen to load
    await splashScreen.click()
    await expect(splashScreen).not.toBeVisible()

    // Wait until all is loaded
    await expect(page.getByText('Southern Hemisphere')).toBeVisible()

    // Setup a watcher for API requests
    const locationsRequest = page.waitForResponse(
      (response) =>
        response.url().includes('locations') &&
        response.url().includes('filterId=shark-attacks-southern-hemisphere'),
    )
    // Click on the Southern Hemisphere filter
    page.getByText('Southern Hemisphere').click()

    // We expect the filterId parameter to be present in the URL
    expect(await locationsRequest).toBeTruthy()
  })
})
