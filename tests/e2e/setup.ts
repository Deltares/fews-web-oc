import { test as base } from '@playwright/test'

// Extend basic test with a "mockServiceWorker" fixture
export const test = base.extend({
  // Add page fixture to ensure MSW is ready before running tests
  page: async ({ page }, use) => {
    // Expose function to get the url with querystring parameters
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        // Expose URL params directly in the window object for the tests to use
        const urlParams = new URLSearchParams(window.location.search)
        // @ts-ignore
        window.testUrlParams = Object.fromEntries(urlParams.entries())
      })
    })

    // Wait for the service worker to be registered
    await page.goto('/')

    // Wait for MSW to be active
    await page.waitForFunction(
      () => {
        return window.navigator.serviceWorker.controller !== null
      },
      { timeout: 5000 },
    )

    await use(page)
  },
})
