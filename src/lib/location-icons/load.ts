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
  await Promise.allSettled(
    defaultIcons.map((icon) =>
      addIconToMap(map, icon.id, `${import.meta.env.BASE_URL}${icon.path}`),
    ),
  )
}

async function addIconToMap(
  map: Map,
  iconId: string,
  url: string,
  badgeUrl?: string,
): Promise<void> {
  if (map.hasImage(iconId)) return
  const image = await createImageBitmapFromUrls(url, badgeUrl)
  map.addImage(iconId, image)
}

async function loadImage(url: string) {
  // We cannot directly set the SVG as the image source to to CSP headers, so
  // we load the SVG as a blob, then create a data URL and use that as the image
  // source.
  const response = await fetch(url)
  const blob = await response.blob()
  const imageUrl = URL.createObjectURL(blob)

  const image = new Image()
  image.src = imageUrl
  await image.decode()

  URL.revokeObjectURL(imageUrl)

  return image
}

async function createImageBitmapFromUrls(
  mainUrl: string,
  badgeUrl?: string,
  canvasSize = 32,
  badgeSize = 24,
): Promise<ImageBitmap> {
  // Load main image
  const mainImage = await loadImage(mainUrl)

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize
  canvas.height = canvasSize
  const ctx = canvas.getContext('2d')!

  // Draw main image in the center of the canvas
  ctx.drawImage(
    mainImage,
    (canvasSize - mainImage.width) / 2,
    (canvasSize - mainImage.height) / 2,
    mainImage.width,
    mainImage.height,
  )

  // Draw badge if provided in the centered on the canvas
  if (badgeUrl) {
    try {
      const badgeImage = await loadImage(badgeUrl)
      ctx.drawImage(
        badgeImage,
        (canvasSize - badgeSize) / 2,
        (canvasSize - badgeSize) / 2,
        badgeSize,
        badgeSize,
      )
    } catch (err) {
      console.warn('Failed to load badge image:', err)
    }
  }

  // Convert canvas to ImageBitmap
  return await createImageBitmap(canvas)
}

async function addCustomLocationIconsToMap(
  map: Map,
  locations: FeatureCollection<Geometry, Location>,
): Promise<void> {
  const images = `${import.meta.env.BASE_URL}images/`
  const extraIcons = [
    { id: 'has-no-data', path: 'has-no-data.svg' },
    { id: 'has-outside-data', path: 'has-outside-data.svg' },
  ]

  const locationIcons = getUniqueIconNames(locations)
  await Promise.allSettled(
    locationIcons.flatMap(async (iconName) => {
      const url = getResourcesIconsUrl(iconName)
      return [
        addIconToMap(map, iconName, url),
        ...extraIcons.map((extraIcon) =>
          addIconToMap(
            map,
            `${iconName}-${extraIcon.id}`,
            url,
            `${images}${extraIcon.path}`,
          ),
        ),
      ]
    }),
  )
}

async function addSprites(map: Map): Promise<void> {
  if (map.getSprite().find((sprite) => sprite.id === 'overlay')) return
  const url = new URL(
    `${import.meta.env.BASE_URL}sprites/mdi-overlay-sdf`,
    window.location.href,
  ).toString()
  map.addSprite('overlay', url.toString())
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
export async function addLocationIconsToMap(
  map: Map,
  locations: FeatureCollection<Geometry, Location>,
): Promise<void> {
  await Promise.allSettled([
    addDefaultIconsToMap(map),
    addSprites(map),
    addCustomLocationIconsToMap(map, locations),
  ])
}
