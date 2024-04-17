import { type FeatureCollection, type Geometry } from 'geojson'
import { uniqBy } from 'lodash'
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

function addDefaultSelectedLocationIconToMap(map: Map): void {
  if (map.hasImage('map-marker')) return
  map.loadImage('/images/map-marker.png', function (error, image) {
    if (error) throw error
    if (image) map.addImage('map-marker', image)
  })
}

function addCustomLocationIconsToMap(
  map: Map,
  locations: FeatureCollection<Geometry, Location>,
): void {
  const locationIcons = getUniqueIconNames(locations)
  for (const iconName of locationIcons) {
    if (map.hasImage(iconName)) continue

    map.loadImage(getResourcesIconsUrl(iconName), function (error, image) {
      if (error) throw error
      if (image) map.addImage(iconName, image)
    })
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
