import { expect, test } from '@playwright/test'

test('legend labels align without an extra icon-dependent gap', async ({
  page,
}) => {
  await page.route('**/test-fews/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16"/></svg>',
    }),
  )
  await page.goto('')
  await page.waitForFunction(() => 'mount' in window)
  await page.evaluate(async () => {
    const gallery = window as Window & {
      mount: (params: { story: string }) => Promise<void>
    }
    await gallery.mount({ story: 'wms/LocationsLegend/MixedIcons' })
  })
  const component = page.locator('#root')
  const labels = component.locator('.v-list-item-title')
  await expect(labels).toHaveText(['Stations', 'Points', 'Areas'])

  const positions = await component
    .locator('.v-list-item')
    .evaluateAll((rows) =>
      rows.map((row) => {
        const icon = row.querySelector(
          '.v-list-item__prepend > .location-icon',
        )!
        const label = row.querySelector('.v-list-item-title')!
        return {
          left: label.getBoundingClientRect().left,
          gap:
            label.getBoundingClientRect().left -
            icon.getBoundingClientRect().right,
        }
      }),
    )

  expect(positions).toHaveLength(3)
  for (const position of positions) {
    expect(position.left).toBeCloseTo(positions[0].left, 1)
    expect(position.gap).toBeCloseTo(8, 1)
  }
})
