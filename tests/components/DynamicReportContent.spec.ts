import { test, expect, type Locator, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

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
    input: component.getByLabel('Value at 2026-10-27T06:00:00Z'),
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
          timeSeriesIndex: '0',
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

for (const story of ['GovernorateTableEditing', 'DistrictTableEditing']) {
  test(`${story}: table headers stay styled while editing and after an edit`, async ({
    mount,
  }) => {
    const component = await mount(`reports/DynamicReportContent/${story}`)
    const header = component.locator('.report-body table th').first()
    const expectHeaderStyle = async () => {
      await expect(header).toHaveCSS('background-color', 'rgb(36, 90, 129)')
      await expect(header).toHaveCSS('color', 'rgb(255, 255, 255)')
    }

    await expectHeaderStyle()
    await component.getByRole('button', { name: 'Edit' }).click()
    await expect(component.locator('.tiptap')).toBeVisible()
    await expectHeaderStyle()
    await header.click()
    await header.press('End')
    await header.press('!')
    await expect(header).toContainText('!')
    await component.getByRole('button', { name: 'Preview' }).click()
    await expect(component.locator('.tiptap')).toHaveCount(0)
    await expect(header).toContainText('!')
    await expectHeaderStyle()
  })
}

test('governorate print table emphasizes status colors on every row', async ({
  page,
}) => {
  const html = await readFile(
    resolve(
      'tests',
      'fixtures',
      'dynamic-report',
      'DynamicReportGovernoratePerLocationTemplate.html',
    ),
    'utf8',
  )
  await page.setContent(
    html.replace(
      '<tbody>',
      `<tbody>
      <tr><td>District 1</td><td class="warning-cell yellow">10</td></tr>
      <tr><td>District 2</td><td class="warning-cell yellow">12</td></tr>
      <tr><td>District 3</td><td class="warning-cell orange">20</td></tr>
      <tr><td>District 4</td><td class="warning-cell orange">22</td></tr>
      <tr><td>District 5</td><td class="warning-cell red">30</td></tr>
      <tr><td>District 6</td><td class="warning-cell red">40</td></tr>`,
    ),
  )
  const table = page.locator('.report-body .ensemble-table')
  const colors = {
    yellow: 'rgb(244, 208, 63)',
    orange: 'rgb(233, 139, 39)',
    red: 'rgb(214, 69, 69)',
  }
  const expectStatusColors = async () => {
    for (const [status, color] of Object.entries(colors)) {
      const cells = table.locator(`td.warning-cell.${status}`)
      await expect(cells).toHaveCount(2)
      await expect(cells.nth(0)).toHaveCSS('background-color', color)
      await expect(cells.nth(1)).toHaveCSS('background-color', color)
    }
  }

  await expect(page.locator('.report-body')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  )
  await expect(table.locator('th').first()).toHaveCSS(
    'background-color',
    'rgb(36, 90, 129)',
  )
  await expect(table.locator('th').nth(1)).toHaveCSS('width', '200px')
  await expectStatusColors()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.report-body')).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  )
  await expectStatusColors()
  await expect(table.locator('th').first()).toHaveCSS(
    'background-color',
    'rgb(36, 90, 129)',
  )
  await expect(table.locator('th').nth(1)).toHaveCSS('width', '200px')
  await expect(
    table.locator('tbody tr').nth(1).locator('td').first(),
  ).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(table.locator('.warning-cell.red').first()).toHaveCSS(
    'print-color-adjust',
    'exact',
  )
  await expect(table.locator('.warning-cell.red').first()).toHaveCSS(
    'font-weight',
    '700',
  )
})

test('district print table uses neutral rows and emphasizes threshold status', async ({
  page,
}) => {
  const html = await readFile(
    resolve(
      'tests',
      'fixtures',
      'dynamic-report',
      'DynamicReportDistrictInundationPerLocationTemplate.html',
    ),
    'utf8',
  )
  await page.setContent(
    html.replace(
      '<tbody>',
      `<tbody>
      <tr><td>Member 1</td><td>250</td><td>Yes</td></tr>
      <tr><td>Member 2</td><td>100</td><td>No</td></tr>`,
    ),
  )
  // The district report also has a report body with the flooded areas
  const body = page
    .locator('.report-body')
    .filter({ has: page.locator('.ensemble-table') })
  const table = body.locator('.ensemble-table')

  await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(table.locator('th').first()).toHaveCSS(
    'background-color',
    'rgb(36, 90, 129)',
  )
  await page.emulateMedia({ media: 'print' })
  await expect(body).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(table.locator('th').first()).toHaveCSS(
    'background-color',
    'rgb(36, 90, 129)',
  )
  await expect(
    table.locator('tbody tr').nth(1).locator('td').first(),
  ).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(table.locator('tbody tr').nth(0).locator('td').last()).toHaveCSS(
    'font-weight',
    '700',
  )
  await expect(
    page.locator('.report-body .legend-dot.yellow').first(),
  ).toHaveCSS('print-color-adjust', 'exact')
})

for (const [file, title] of [
  [
    'DynamicReportGovernoratePerLocationTemplate.html',
    'Coastal Governorate flood forecast report',
  ],
  [
    'DynamicReportDistrictInundationPerLocationTemplate.html',
    'District inundation forecast report',
  ],
]) {
  test(`${file}: generated page headers and footer parse as print CSS`, async ({
    page,
  }) => {
    let html = await readFile(
      resolve('tests', 'fixtures', 'dynamic-report', file),
      'utf8',
    )
    const values: Record<string, string> = {
      '[[${Event == null or #lists.isEmpty(Event) ? "" : Event[0].governorate_name}]]':
        'Kafr El Sheikh',
      '[[${event == null or #lists.isEmpty(event) ? "" : event[0].governorate_name}]]':
        'Kafr El Sheikh',
      '[[${event == null or #lists.isEmpty(event) ? "" : event[0].district_name}]]':
        'Baltim',
      '[[${Time == null or #lists.isEmpty(Time) ? "" : Time[0].t0}]]':
        'Sun Nov 15 18:00:00 GMT 2026',
    }
    for (const [expression, value] of Object.entries(values)) {
      html = html.replaceAll(
        expression,
        await page.evaluate((text) => CSS.escape(text), value),
      )
    }
    await page.setContent(html)
    const rules = await page.evaluate(() => {
      const sheet = Array.from(document.styleSheets).find(
        (style) =>
          style.ownerNode instanceof HTMLStyleElement &&
          style.ownerNode.media === 'print',
      )
      return Array.from(sheet?.cssRules ?? [], (rule) => rule.cssText)
    })
    const pageRule = rules.find((rule) => rule.startsWith('@page {'))
    expect(pageRule).toContain('Kafr El Sheikh')
    expect(pageRule).toContain(title)
    expect(pageRule).toContain('Sun Nov 15 18:00:00 GMT 2026')
    expect(pageRule).toContain('counter(page)')
    expect(pageRule).toContain('counter(pages)')
    expect(rules.find((rule) => rule.startsWith('@page :first'))).toContain(
      'content: none',
    )
  })
}

for (const story of ['WebOcOverlay', 'IsolatedOverlay'] as const) {
  test(`${story}: fixed positioned report content stays inside the report`, async ({
    mount,
    page,
  }) => {
    await mockFewsWebServices(page)
    const component = await mount(`reports/DynamicReportContent/${story}`)
    const overlay = component.getByTestId('overlay')
    await expect(overlay).toHaveCSS('position', 'fixed')

    const root = await component.locator('.dynamic-report-root').boundingBox()
    const box = await overlay.boundingBox()
    expect(root).not.toBeNull()
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(root!.y)
    expect(box!.y + box!.height).toBeLessThanOrEqual(root!.y + root!.height)

    // The overlay does not cover the content outside the report
    const outside = await component.getByTestId('outside').boundingBox()
    const testId = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.getAttribute('data-testid'),
      [outside!.x + outside!.width / 2, outside!.y + outside!.height / 2],
    )
    expect(testId).toBe('outside')
  })
}
