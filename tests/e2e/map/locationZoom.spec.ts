import { expect, test } from '@playwright/test'

const mapUrl = '/topology/test_nodes/node/map_locations_layer_zoom_level/map'
const locationId = 'Cato_Ridge_Abattoir_rain'

test('locations respect their configured zoom range', async ({ page }) => {
  await page.goto(mapUrl)
  await expect(
    page.getByRole('region', { name: 'Map', exact: true }),
  ).toBeVisible()
  await page.waitForFunction(() => window.__e2eLocationMap !== undefined)

  for (const [zoom, expected] of [
    [6, true],
    [5, false],
    [6, true],
  ] as const) {
    await page.evaluate(
      (level) => window.__e2eLocationMap!.setZoom(level),
      zoom,
    )
    await expect
      .poll(
        () =>
          page.evaluate(
            (id) => window.__e2eLocationMap?.hasLocation(id),
            locationId,
          ),
        { message: `Location ${locationId} at zoom ${zoom}` },
      )
      .toBe(expected)
  }
})
