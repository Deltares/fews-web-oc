import { expect, test } from '@playwright/test'
import { loadHomePage } from './helpers/common'

test.describe('Topology Display', () => {
  test('should load the topology and display shark attack nodes', async ({
    page,
  }) => {
    // Use the helper to navigate and handle initial screens
    await loadHomePage(page)

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
    // Use the helper to navigate and handle initial screens
    await loadHomePage(page)

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
