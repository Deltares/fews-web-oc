import { test, expect } from '@playwright/test'

test.describe('Schematic Status Display Tests', () => {
  const base = 'topology/early_warning/node/'
  const topologyNode1 = 'viewer_coastal_flooding_warning_warning1'
  const topologyNode2 = 'viewer_coastal_flooding_warning_warning2'
  const url =
    base +
    `viewer_coastal_flooding_warning/${topologyNode1}/ssd/coastal_flooding1`

  test('SSD should load with filled in values', async ({ page }) => {
    await page.goto(url)
    const value1 = page.getByText('0.82')
    await expect(value1).toBeVisible()
    const value2 = page.getByText('0.67')
    await expect(value2).toBeVisible()
    const value3 = page.getByText('0.72')
    await expect(value3).toBeVisible()
    const value4 = page.getByText('0.85')
    await expect(value4).toBeVisible()
  })

  test('SSD should be responsive and switch to other display', async ({
    page,
  }) => {
    await page.goto(url)
    await page
      .getByRole('button', { name: 'Switch to Flood Warning #2' })
      .click()
    await expect(page.getByText('COASTAL FLOOD WARNING #2')).toBeVisible()
  })

  test('SSD should be responsive and switch to TimeSeriesDisplay', async ({
    page,
  }) => {
    await page.goto(url)
    await page
      .getByRole('button', { name: 'Switch to TimeSeriesDisplay' })
      .click()

    await expect(page.getByText('Water Level (m + MSL)')).toBeVisible()
    await expect(page.getByText('Wave Height (m)')).toBeVisible()
  })

  test('SSD should navigate to topology node via selectTopologyNode custom event', async ({
    page,
  }) => {
    await page.goto(url)

    await page.evaluate((nodeId) => {
      const element = document.querySelector('schematic-status-display')
      if (!element) {
        throw new Error('schematic-status-display element not found')
      }

      element.dispatchEvent(
        new CustomEvent('selectTopologyNode', {
          detail: { nodeId },
          bubbles: true,
          composed: true,
        }),
      )
    }, topologyNode2)

    await expect(page).toHaveURL(
      new RegExp(`/topology/early_warning/node/.*/${topologyNode2}/ssd/`),
    )
  })

  test('SSD should navigate to topology node via SELECT_TOPOLOGY_NODE_BY_ID action result fallback', async ({
    page,
  }) => {
    await page.goto(url)

    await page.evaluate((nodeId) => {
      const element = document.querySelector('schematic-status-display')
      if (!element) {
        throw new Error('schematic-status-display element not found')
      }

      element.dispatchEvent(
        new CustomEvent('action', {
          detail: {
            panelId: 'coastal_flooding1',
            objectId: '',
            results: [
              {
                type: 'SELECT_TOPOLOGY_NODE_BY_ID',
                requests: [{ request: nodeId }],
              },
            ],
          },
          bubbles: true,
          composed: true,
        }),
      )
    }, topologyNode2)

    await expect(page).toHaveURL(
      new RegExp(`/topology/early_warning/node/.*/${topologyNode2}/ssd/`),
    )
  })
})
