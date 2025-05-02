import { expect } from '@playwright/test'
import { test } from './setup'
import { spawn } from 'child_process'

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
    await splashScreen.click()

    // Check if the shark attacks node is displayed
    await expect(page.getByText('All Attacks')).toBeVisible()

    // Click on the JAWS node
    await page.getByText('All Attacks').click()

    // Check that the locations API was called
    const locationsRequest = await page.waitForResponse(
      (response) =>
        response.url().includes('locations') &&
        response.url().includes('filterId=shark-attacks'),
    )

    // We expect the filterId parameter to be present in the URL
    expect(locationsRequest).toBeTruthy()
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
    await splashScreen.click()

    // Sleep for 1 second to ensure the map is loaded
    await page.waitForTimeout(1000)

    // Click on the Southern Hemisphere filter
    page.getByText('Southern Hemisphere').click()

    // Check that the locations API was called
    const locationsRequest = await page.waitForResponse(
      (response) =>
        response.url().includes('locations') &&
        response.url().includes('filterId=shark-attacks-southern-hemisphere'),
    )

    // We expect the filterId parameter to be present in the URL
    expect(locationsRequest).toBeTruthy()
  })
})
