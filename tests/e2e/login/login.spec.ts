import { test, expect, type Page } from '@playwright/test'

const base = '/login'

test.describe('Login view is customized', () => {

  test('button has correct text, icons and color', async ({
    page,
  }) => {
    await page.goto('/login')
    const loginButton = page.getByRole('button', { name: 'Login Button Text' })
    await expect(loginButton).toBeVisible()
    await expect(loginButton).toHaveClass(/purple/)
    await expect(loginButton.locator('.v-btn__prepend .mdi-virus')).toBeVisible()
    await expect(loginButton.locator('.v-btn__append .mdi-account')).toBeVisible()
  })

  test('has the correct app title', async ({
    page,
  }) => {
    await page.goto('/login')
    const appTitle = page.getByRole('heading', { name: 'WebOC E2E Tests' })
    await expect(appTitle).toBeVisible()
  })

  test('has the correct background image', async ({
    page,
  }) => {
    await page.goto('/login')
    const app = page.locator('#main').getByRole('main')
    await expect(app).toBeVisible()
    await expect(app).toHaveCSS(
      'background-image',
      "url(\"http://localhost:8080/FewsWebServices/rest/fewspiservice/v1/resources/static/css/images/Luchtfoto_Noordzee_small.jpg\")",
    ) 
  })

})
