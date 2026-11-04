import { test, expect, type Page } from '@playwright/test'

const base = '/topology/side_panel/node'

// An empty report display makes the nodes visible without loading a map.
const nodes = [
  { id: 'configured', name: 'Configured', componentSettingsId: 'run_task' },
  {
    id: 'configured_other',
    name: 'Other',
    componentSettingsId: 'task_overview',
  },
  { id: 'none', name: 'Not configured' },
  { id: 'explicit_none', name: 'Explicit none', componentSettingsId: 'none' },
].map((node) => ({ ...node, reportDisplay: { reports: [] } }))

const showComponentForSettingsId: Record<string, string> = {
  run_task: 'runTask',
  task_overview: 'taskOverview',
  none: 'None',
}

async function mockBackend(page: Page) {
  await page.route(
    '**/fewspiservice/v1/weboc/config?documentFormat=PI_JSON',
    (route) =>
      route.fulfill({
        json: {
          general: {
            title: 'Side panel settings',
            sidePanel: {
              taskOverview: { enabled: true },
              runTask: { enabled: true },
              nonCurrentData: { enabled: true },
            },
          },
          components: [
            {
              id: 'side_panel',
              type: 'TopologyDisplay',
              title: 'Topology',
              showInNavigationMenu: true,
              topologyDisplayNodes: nodes.map((node) => node.id),
            },
          ],
        },
      }),
  )
  await page.route('**/fewspiservice/v1/topology/nodes*', (route) =>
    route.fulfill({ json: { topologyNodes: nodes } }),
  )
  await page.route('**/fewspiservice/v1/topology/thresholds*', (route) =>
    route.abort(),
  )
  await page.route(
    '**/fewspiservice/v1/weboc/config/componentsettings*',
    (route) => {
      const id = new URL(route.request().url()).searchParams.get(
        'componentSettingsId',
      )
      return route.fulfill({
        json: {
          webOCComponentSettings: {
            id,
            sidePanel: { showComponent: showComponentForSettingsId[id ?? ''] },
          },
        },
      })
    },
  )
}

async function openNode(page: Page, name: string) {
  await page
    .locator('[data-test-id="topology-tree"]')
    .getByRole('link', { name, exact: true })
    .click()
}

async function openNonCurrentDataPanel(page: Page) {
  await page.getByRole('button', { name: 'More Sidepanel Options' }).click()
  await page
    .locator('.v-list-item')
    .filter({ has: page.locator('.mdi-chart-box-multiple') })
    .click()
}

async function expectPanel(page: Page, type: string) {
  await expect(page).toHaveURL(new RegExp(`[?&]sidePanel=${type}(&|$)`))
  await expect(page.getByLabel('Side panel')).toBeVisible()
}

async function expectNoPanel(page: Page, nodeId: string) {
  await expect(page).toHaveURL(new RegExp(`/node/${nodeId}/reports$`))
  await expect(page.getByLabel('Side panel')).toHaveCount(0)
}

/** Waits until the node is opened and its settings have been applied. */
async function expectNode(page: Page, nodeId: string) {
  await expect(page).toHaveURL(new RegExp(`/node/${nodeId}/reports(\\?|$)`))
  await page.waitForLoadState('networkidle')
}

function pinButton(page: Page) {
  return page.getByLabel('Side panel').locator('button[aria-pressed]')
}

function closeButton(page: Page) {
  return page
    .getByLabel('Side panel')
    .getByRole('button')
    .filter({ has: page.locator('.mdi-close') })
}

test.describe('Side panel from component settings', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page)
  })

  test('opens the configured panel and closes it on a node without a panel', async ({
    page,
  }) => {
    await page.goto(`${base}/none`)
    await expectNode(page, 'none')
    await expectNoPanel(page, 'none')

    await openNode(page, 'Configured')
    await expectPanel(page, 'runTask')

    await openNode(page, 'Not configured')
    await expectNoPanel(page, 'none')
  })

  test('closes an opened panel after switching between configured nodes', async ({
    page,
  }) => {
    await page.goto(`${base}/configured`)
    await expectPanel(page, 'runTask')

    await openNode(page, 'Other')
    await expectPanel(page, 'taskOverview')

    await openNode(page, 'Explicit none')
    await expectNoPanel(page, 'explicit_none')
  })

  test('keeps a manually opened panel on a node without a panel', async ({
    page,
  }) => {
    await page.goto(`${base}/none`)
    await expectNode(page, 'none')
    await openNonCurrentDataPanel(page)
    await expectPanel(page, 'nonCurrentData')

    await openNode(page, 'Explicit none')
    await expectNode(page, 'explicit_none')
    await expectPanel(page, 'nonCurrentData')
  })

  test('keeps a manually opened panel that was switched by a configured node', async ({
    page,
  }) => {
    await page.goto(`${base}/none`)
    await expectNode(page, 'none')
    await openNonCurrentDataPanel(page)
    await expectPanel(page, 'nonCurrentData')

    await openNode(page, 'Configured')
    await expectPanel(page, 'runTask')

    await openNode(page, 'Not configured')
    await expectNode(page, 'none')
    await expectPanel(page, 'runTask')
  })

  test('opens a closed panel again when another configured node is opened', async ({
    page,
  }) => {
    await page.goto(`${base}/configured`)
    await expectPanel(page, 'runTask')

    await closeButton(page).click()
    await expectNoPanel(page, 'configured')

    await openNode(page, 'Other')
    await expectPanel(page, 'taskOverview')
  })

  test('ignores the settings while pinned and keeps the pin after a reload', async ({
    page,
  }) => {
    await page.goto(`${base}/configured`)
    await expectPanel(page, 'runTask')
    await pinButton(page).click()

    await openNode(page, 'Not configured')
    await expectNode(page, 'none')
    await expectPanel(page, 'runTask')

    await page.reload()
    await expectPanel(page, 'runTask')
    await expect(pinButton(page)).toHaveAttribute('aria-pressed', 'true')

    await openNode(page, 'Other')
    await expectNode(page, 'configured_other')
    await expectPanel(page, 'runTask')
  })

  test('releases the pin when the panel is closed', async ({ page }) => {
    await page.goto(`${base}/configured`)
    await expectPanel(page, 'runTask')
    await pinButton(page).click()

    await closeButton(page).click()
    await expectNoPanel(page, 'configured')

    await openNode(page, 'Other')
    await expectPanel(page, 'taskOverview')
    await expect(pinButton(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('prefers the panel in the URL over the settings', async ({ page }) => {
    await page.goto(`${base}/configured?sidePanel=nonCurrentData`)
    await expectNode(page, 'configured')
    await expectPanel(page, 'nonCurrentData')
  })

  test('falls back to the settings for an unknown panel in the URL', async ({
    page,
  }) => {
    await page.goto(`${base}/configured?sidePanel=unknown`)
    await expectPanel(page, 'runTask')
  })
})
