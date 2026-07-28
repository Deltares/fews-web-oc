import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/components',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'html',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:5173/playwright/gallery/index.html',
    serviceWorkers: 'block',
    reuseContext: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/playwright/gallery/index.html',
    reuseExistingServer: !process.env.CI,
  },
})
