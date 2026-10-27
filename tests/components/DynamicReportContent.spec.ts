import { test, expect, type Locator, type Page } from '@playwright/test'

async function mockFewsWebServices(page: Page) {
  await page.route('**/test-fews/**', async (route) => {
    // The report style sheets are served by the gallery server, see
    // vite.config-ct.ts
    if (route.request().url().includes('/resources/static/')) {
      return route.continue()
    }
    return route.fulfill({ json: { permissions: [] } })
  })
}

function isInShadowRoot(locator: Locator) {
  return locator.evaluate(
    (element) => element.getRootNode() instanceof ShadowRoot,
  )
}

function getFontFamily(locator: Locator) {
  return locator.evaluate((element) => getComputedStyle(element).fontFamily)
}

function getReport(component: Locator) {
  // Locators pierce open shadow roots, so this works for both stylings
  const table = component.locator('.dynamic-report table.document-file-table')
  return {
    table,
    header: table.locator('th').first(),
    cell: table.locator('td').first(),
    input: component.getByLabel(
      'Value for time series 0 at 2026-10-27T06:00:00Z',
    ),
  }
}

for (const story of ['WebOc', 'Isolated'] as const) {
  test.describe(`DynamicReportContent ${story}`, () => {
    test.beforeEach(async ({ page }) => {
      await mockFewsWebServices(page)
    })

    test('renders the report with its linked style sheet', async ({
      mount,
    }) => {
      const component = await mount(`reports/DynamicReportContent/${story}`)
      const { table, header } = getReport(component)

      await expect(table.locator('tbody tr')).toHaveCount(5)
      await expect(header).toHaveText('Location')
      // From the report style sheet in the FEWS static resources
      await expect(header).toHaveCSS('font-weight', '800')
      await expect(header).toHaveCSS('text-align', 'center')
    })

    test('does not apply the report styles outside the report', async ({
      mount,
    }) => {
      const component = await mount(`reports/DynamicReportContent/${story}`)
      const { header } = getReport(component)
      await expect(header).toHaveCSS('font-weight', '800')
      await expect(header).toHaveCSS('padding-left', '15px')

      const outside = component.getByTestId('outside')
      await expect(outside).toHaveCSS('font-weight', '700')
      await expect(outside).not.toHaveCSS('padding-left', '15px')
      // The story report has a style element with an unbalanced "}"
      await expect(outside).not.toHaveCSS('color', 'rgb(255, 0, 0)')

      // The node styles are scoped to the report as well
      const { input } = getReport(component)
      await expect(input).toHaveCSS('border-radius', '4px')
      await expect(component.getByTestId('outside-input')).not.toHaveCSS(
        'border-radius',
        '4px',
      )
    })

    test('renders an editable input and emits edits', async ({ mount }) => {
      const component = await mount(`reports/DynamicReportContent/${story}`)
      const { input } = getReport(component)

      await expect(input).toHaveValue('-0.699')
      // Node styles are applied, also inside a shadow root
      await expect(input).toHaveCSS('border-radius', '4px')

      await input.fill('-0.5')
      await expect(component.getByTestId('last-edit')).toHaveText(
        JSON.stringify({
          timeSeriesIndex: 0,
          time: '2026-10-27T06:00:00Z',
          value: '-0.5',
        }),
      )
    })
  })
}

test.describe('DynamicReportContent styling', () => {
  test.beforeEach(async ({ page }) => {
    await mockFewsWebServices(page)
  })

  test('WebOC styling renders in the document and inherits WebOC styles', async ({
    mount,
  }) => {
    const component = await mount('reports/DynamicReportContent/WebOc')
    const { table, cell } = getReport(component)

    await expect(table).toBeVisible()
    expect(await isInShadowRoot(table)).toBe(false)
    await expect(cell).toHaveCSS(
      'font-family',
      await getFontFamily(component.getByTestId('story')),
    )
  })

  test('isolated styling renders in a shadow root and does not inherit WebOC styles', async ({
    mount,
  }) => {
    const component = await mount('reports/DynamicReportContent/Isolated')
    const { table, cell } = getReport(component)

    await expect(table).toBeVisible()
    expect(await isInShadowRoot(table)).toBe(true)
    await expect(cell).toHaveCSS('font-family', 'system-ui, sans-serif')
    expect(await getFontFamily(component.getByTestId('story'))).not.toBe(
      'system-ui, sans-serif',
    )
  })

  test('isolated styling follows the WebOC dark mode', async ({ mount }) => {
    const component = await mount('reports/DynamicReportContent/Isolated', {
      theme: 'dark',
    })
    const { table, cell } = getReport(component)

    await expect(table).toBeVisible()
    await expect(table.locator('thead')).toHaveCSS(
      'background-color',
      'rgb(40, 70, 95)',
    )
    await expect(cell).toHaveCSS('color', 'rgb(255, 255, 255)')
    await expect(component.locator('.dynamic-report')).toHaveCSS(
      'background-color',
      'rgb(33, 33, 33)',
    )
  })

  test('isolated styling uses the light colours in light mode', async ({
    mount,
  }) => {
    const component = await mount('reports/DynamicReportContent/Isolated', {
      theme: 'light',
    })
    const { table, cell } = getReport(component)

    await expect(table.locator('thead')).toHaveCSS(
      'background-color',
      'rgb(14, 40, 65)',
    )
    await expect(cell).toHaveCSS('color', 'rgb(33, 33, 33)')
  })
})
