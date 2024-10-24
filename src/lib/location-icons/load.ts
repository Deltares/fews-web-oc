import { type FeatureCollection, type Geometry } from 'geojson'
import { uniqBy } from 'lodash-es'
import { Map } from 'maplibre-gl'

import { type Location } from '@deltares/fews-pi-requests'
import { getResourcesIconsUrl } from '../fews-config'

function getUniqueIconNames(
  locations: FeatureCollection<Geometry, Location>,
): string[] {
  return uniqBy(locations.features, 'properties.iconName')
    .map((feature) => feature.properties.iconName)
    .filter((iconName) => iconName !== undefined) as string[]
}

async function addDefaultSelectedLocationIconToMap(map: Map): Promise<void> {
  const iconId = 'selected-location'
  if (map.hasImage(iconId)) return
  try {
    const image = await map.loadImage(
      `${import.meta.env.BASE_URL}images/map-marker.png`,
    )
    map.addImage(iconId, image.data)
  } catch (error) {
    console.error('Failed to load default location icon:', error)
  }
}

async function convertSvgToBitmap(
  url: string,
  width: number,
  height: number,
): Promise<ImageBitmap> {
  // We cannot directly set the SVG as the image source to to CSP headers, so
  // we load the SVG as a blob, then create a data URL and use that as the image
  // source.
  const response = await fetch(url)
  const blob = await response.blob()
  const imageUrl = URL.createObjectURL(blob)

  const image = new Image(width, height)
  image.src = imageUrl
  await image.decode()

  // Finally, we create an image bitmap from the image and free the data URL.
  const bitmap = await createImageBitmap(image)
  URL.revokeObjectURL(imageUrl)

  return bitmap
}

async function addCustomLocationIconsToMap(
  map: Map,
  locations: FeatureCollection<Geometry, Location>,
): Promise<void> {
  const locationIcons = getUniqueIconNames(locations)
  for (const iconName of locationIcons) {
    if (map.hasImage(iconName)) continue

    const url = getResourcesIconsUrl(iconName)

    if (url.endsWith('.svg')) {
      // Load SVG as 128x128 bitmap.
      convertSvgToBitmap(url, 128, 128).then((image) => {
        map.addImage(iconName, image)
      })
    } else {
      try {
        const image = await map.loadImage(url)
        map.addImage(iconName, image.data)
      } catch (error) {
        console.error(`Failed to load location icon ${iconName}:`, error)
      }
    }
  }
}

/**
 * Adds location icons to the map.
 *
 * This adds a default icon for selected locations and custom icons for all
 * unique `iconName` properties in the locations.
 *
 * @param map - The map object to add the icons to.
 * @param locations - The collection of locations to add icons for.
 */
export function addLocationIconsToMap(
  map: Map,
  locations: FeatureCollection<Geometry, Location>,
): void {
  addDefaultSelectedLocationIconToMap(map)
  addCustomLocationIconsToMap(map, locations)
}
