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

async function addDefaultIconsToMap(map: Map): Promise<void> {
  const defaultIcons = [
    { id: 'selected-location', path: 'images/map-marker.png' },
  ]
  await Promise.all(
    defaultIcons.map((icon) =>
      addIconToMap(map, icon.id, `${import.meta.env.BASE_URL}${icon.path}`),
    ),
  )
}

async function addIconToMap(
  map: Map,
  iconId: string,
  url: string,
): Promise<void> {
  if (map.hasImage(iconId)) return

  if (url.toLowerCase().endsWith('.svg')) {
    // Load SVG as 128x128 bitmap.
    const image = await convertSvgToBitmap(url, 128, 128)
    map.addImage(iconId, image)
  } else {
    const image = await map.loadImage(url)
    map.addImage(iconId, image.data)
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
  await Promise.all(
    locationIcons.map(async (iconName) => {
      const url = getResourcesIconsUrl(iconName)
      await addIconToMap(map, iconName, url)
    }),
  )
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
  addDefaultIconsToMap(map)
  addCustomLocationIconsToMap(map, locations)
}
