import { test, expect } from '@playwright/test'

test.describe('Startup Dialogs', () => {
  test('dialogs should not appear when disabled in config', async ({
    page,
  }) => {
    // By default, the mock server has these dialogs disabled
    // Navigate to homepage
    await page.goto('/')

    // Verify neither dialog appears because they're disabled in config
    await expect(
      page.getByRole('dialog', { name: 'Terms and Conditions' }),
    ).not.toBeVisible()
    await expect(
      page.getByRole('dialog').filter({ has: page.locator('.info-overlay') }),
    ).not.toBeVisible()
  })

  test('terms of service dialog should appear when enabled in config', async ({
    page,
  }) => {
    // Mock the configuration response to enable terms of service
    await page.route(
      '**/weboc/config?documentFormat=PI_JSON',
      async (route) => {
        const json = await route.fetch().then((r) => r.json())

        // Add the terms and conditions configuration to the general dictionary
        if (!json.general) {
          json.general = {}
        }

        json.general.agreeToTermsAndConditions = {
          enabled: true,
        }

        await route.fulfill({ json })
      },
    )

    // Navigate to homepage
    await page.goto('/')

    // Check if terms of service dialog appears
    const termsDialog = page.getByRole('dialog', {
      name: 'Terms and Conditions',
    })
    await expect(termsDialog).toBeVisible()

    // Verify dialog content
    await expect(
      page.getByText('I have read and agree to the Terms and Conditions'),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Accept' })).toBeDisabled()

    // Check the checkbox and verify the Accept button becomes enabled
    await page
      .getByLabel('I have read and agree to the Terms and Conditions')
      .check()
    await expect(page.getByRole('button', { name: 'Accept' })).toBeEnabled()

    // Accept the terms
    await page.getByRole('button', { name: 'Accept' }).click()
    await expect(termsDialog).not.toBeVisible()
  })

  test('complete user journey through startup dialogs', async ({ page }) => {
    // Mock the configuration to enable both dialogs
    await page.route(
      '**/weboc/config?documentFormat=PI_JSON',
      async (route) => {
        const json = await route.fetch().then((r) => r.json())

        if (!json.general) {
          json.general = {}
        }

        // Enable both dialogs
        json.general.agreeToTermsAndConditions = {
          enabled: true,
        }
        json.general.splashScreen = 'images/logo.png'

        await route.fulfill({ json })
      },
    )

    // Navigate to homepage
    await page.goto('/')

    // First the terms dialog should be visible
    const termsDialog = page.getByRole('dialog', {
      name: 'Terms and Conditions',
    })
    await expect(termsDialog).toBeVisible()

    // Accept the terms
    await page
      .getByLabel('I have read and agree to the Terms and Conditions')
      .check()
    await page.getByRole('button', { name: 'Accept' }).click()

    // Terms dialog should disappear
    await expect(termsDialog).not.toBeVisible()

    // Next the splash screen should appear
    const splashScreen = page
      .getByRole('dialog')
      .filter({ has: page.locator('.info-overlay') })
    await expect(splashScreen).toBeVisible()

    // Close splash screen
    await splashScreen.click()
    await expect(splashScreen).not.toBeVisible()

    // Reload the page to verify persistence
    await page.reload()

    // Verify neither dialog reappears
    await expect(
      page.getByRole('dialog', { name: 'Terms and Conditions' }),
    ).not.toBeVisible()
    await expect(
      page.getByRole('dialog').filter({ has: page.locator('.info-overlay') }),
    ).not.toBeVisible()

    // Clear only session storage
    await page.evaluate(() => {
      sessionStorage.clear()
    })

    // Reload again, only splash screen should appear
    await page.reload()
    await expect(
      page.getByRole('dialog', { name: 'Terms and Conditions' }),
    ).not.toBeVisible()
    await expect(
      page.getByRole('dialog').filter({ has: page.locator('.info-overlay') }),
    ).toBeVisible()
  })

  test('splash screen should appear when enabled in config', async ({
    page,
  }) => {
    // Mock the configuration response to enable splash screen
    await page.route(
      '**/weboc/config?documentFormat=PI_JSON',
      async (route) => {
        const json = await route.fetch().then((r) => r.json())

        // Add the splash screen configuration to the general dictionary
        if (!json.general) {
          json.general = {}
        }

        json.general.splashScreen = 'images/logo.png'

        await route.fulfill({ json })
      },
    )
    // Navigate to homepage
    await page.goto('/')

    // Check if splash screen appears
    const splashScreen = page
      .getByRole('dialog')
      .filter({ has: page.locator('.info-overlay') })
    await expect(splashScreen).toBeVisible()

    // Verify it contains version information
    await expect(page.locator('.info-overlay')).toContainText(
      'Delft-FEWS WebOC Version',
    )

    // Close splash screen by clicking on it
    await splashScreen.click()
    await expect(splashScreen).not.toBeVisible()
  })
})
