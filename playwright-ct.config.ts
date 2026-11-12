import { defineConfig, devices } from '@playwright/test'
import { CT_SERVER_PORT } from './vite.config-ct'

// A dedicated port, so an existing server is only reused when it is the
// component gallery and not, for example, the WebOC dev server on 5173
const galleryUrl = `http://localhost:${CT_SERVER_PORT}/playwright/gallery/index.html`

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
    baseURL: galleryUrl,
    serviceWorkers: 'block',
    reuseContext: true,
  },
  webServer: {
    command: 'vite --config vite.config-ct.ts',
    url: galleryUrl,
    reuseExistingServer: !process.env.CI,
  },
})
