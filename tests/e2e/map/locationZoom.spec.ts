import { expect, test } from '@playwright/test'

const mapUrl = '/topology/test_nodes/node/map_locations_layer_zoom_level/map'
const locationSourceId = 'weboc-source-location'
const locationId = 'Cato_Ridge_Abattoir_rain'

type VueComponent = {
  parent?: VueComponent | null
  refs?: Record<string, unknown>
  setupState?: Record<string, unknown>
}

async function getLocationIds(
  page: import('@playwright/test').Page,
  zoom?: number,
) {
  return page.locator('.maplibregl-map').evaluate(
    async (element, { locationSourceId, zoom }) => {
      const root = element as HTMLElement & {
        __vueParentComponent?: VueComponent
      }
      let component = root.__vueParentComponent

      while (component) {
        const mapRef = component.setupState?.mapRef ?? component.refs?.mapRef
        const mapComponent =
          mapRef && typeof mapRef === 'object' && 'value' in mapRef
            ? mapRef.value
            : mapRef
        const map = (
          mapComponent as
            | {
                map?: {
                  getSource: (id: string) => unknown
                  setZoom: (zoom: number) => void
                }
              }
            | undefined
        )?.map

        if (map) {
          if (zoom !== undefined) {
            map.setZoom(zoom)
          }
          const source = map.getSource(locationSourceId)
          if (
            !source ||
            typeof source !== 'object' ||
            !('getData' in source) ||
            typeof source.getData !== 'function'
          ) {
            return []
          }

          const data = (await source.getData()) as {
            features?: Array<{ properties?: { locationId?: string } }>
          }
          return (
            data.features
              ?.map((feature) => feature.properties?.locationId)
              .filter((id): id is string => id !== undefined) ?? []
          )
        }

        component = component.parent
      }

      throw new Error('Map instance was not found')
    },
    { locationSourceId, zoom },
  )
}

test('locations respect their configured zoom range', async ({ page }) => {
  await page.goto(mapUrl)
  await expect(page.locator('.maplibregl-map')).toBeVisible()

  await expect.poll(() => getLocationIds(page, 6)).toContain(locationId)

  await getLocationIds(page, 0)
  await expect.poll(() => getLocationIds(page)).not.toContain(locationId)

  await getLocationIds(page, 6)
  await expect.poll(() => getLocationIds(page)).toContain(locationId)
})
