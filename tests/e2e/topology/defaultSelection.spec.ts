import { test, expect } from '@playwright/test'

const base = '/topology/early_warning/node'

test.describe('Default Selection in Topology', () => {
  test('when no defaultPath is defined, the first topology node should be auto selected', async ({
    page,
  }) => {
    // Mock the configuration response to remove defaultPath from topology component
    await page.route(
      '**/weboc/config?documentFormat=PI_JSON',
      async (route) => {
        const response = await route.fetch()
        const json = await response.json()

        // Find the topology component and remove its defaultPath
        if (json.webOcComponents) {
          json.webOcComponents = json.webOcComponents.map((component) => {
            if (component.type === 'TopologyDisplay') {
              // Make a copy of the component without the defaultPath
              const { defaultPath, ...topologyWithoutDefaultPath } = component
              return topologyWithoutDefaultPath
            }
            return component
          })
        }

        await route.fulfill({ json })
      },
    )

    // Go to the base topology URL without specifying a node
    await page.goto(base)

    // Wait for the page to load and the topology tree to be visible
    const topologyTree = page.locator('[data-test-id="topology-tree"]')
    await expect(topologyTree).toBeVisible()

    // Check that we're redirected to a specific node page (URL should change from /topology to include a node ID)
    const url = page.url()
    expect(url).toMatch(/\/topology\/early_warning\/node\/[^/]+/)

    // Verify that the first node in the topology tree is selected (has active class or visual indicator)
    const firstNode = topologyTree.getByRole('listitem').first()
    await expect(firstNode).toHaveClass(/active/)

    // Verify that content related to the selected node is displayed
    // This depends on what the first node actually shows, but there should be some content visible
    const mainContent = page.locator('main').first()
    await expect(mainContent).not.toBeEmpty()
  })
  test('when defaultPath is explicitly set, that specific node should be selected', async ({
    page,
  }) => {
    // Mock the configuration response to set a specific defaultPath for topology component
    await page.route(
      '**/weboc/config?documentFormat=PI_JSON',
      async (route) => {
        const response = await route.fetch()
        const json = await response.json()

        // Find the topology component and set the defaultPath
        if (json.components) {
          json.components = json.components.map((component) => {
            if (component.type === 'TopologyDisplay') {
              return {
                ...component,
                defaultPath: {
                  nodeId: 'viewer_meteorology_rainfall_hazard_map',
                },
              }
            }
            return component
          })
        }

        await route.fulfill({ json })
      },
    )

    // Go to the base topology URL without specifying a node
    await page.goto(base)

    // Wait for the page to load and the topology tree to be visible
    const topologyTree = page.locator('[data-test-id="topology-tree"]')
    await expect(topologyTree).toBeVisible()

    // Wait for the topology to load and the node to be selected
    await page.waitForTimeout(1000)

    // Check that we're redirected to the specific node defined in defaultPath
    const url = page.url()
    await expect(url).toContain('viewer_meteorology_rainfall_hazard_map')

    // Verify that the specified node is selected in the topology tree
    const nodeLink = await topologyTree
      .getByRole('listitem')
      .filter({ hasText: 'Hazard map' })
    await expect(nodeLink).toHaveClass(/active/)

    // Verify content specific to this node is displayed
    await expect(page.getByText('WATCH (2 YEAR)')).toBeVisible()
  })
})
