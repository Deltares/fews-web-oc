import { map } from 'd3'
import { test, expect } from '../map-testing'

test('Thresholds locations should be visible on map', async ({
  page,
  mapLocator,
  mapController,
}) => {
  await page.goto(
    '/topology/node/viewer_rivers_level_stations/viewer_rivers_level_stations_forecast/map/waterdepth_sfincs_inland',
  )

  await mapController('mainMap').waitToMapLoaded()
  await mapController('mainMap').setView({ zoom: 8, center: [31, -30] })
  await mapController('mainMap').waitToMapStable()

  const alertLocations = mapLocator(
    'map[id=mainMap] layer[id=weboc-layer-location-symbol] filter["all", ["==", ["get", "thresholdSeverity"], 2]]',
  )
  const alertLocationsCount = await alertLocations.count()

  await expect(alertLocations, 'Alert locations visible').toBeVisibleOnMap()
  await expect(alertLocationsCount, 'Alert locations count').toBe(1)

  const warningLocations = mapLocator(
    'map[id=mainMap] layer[id=weboc-layer-location-symbol] filter["all", ["==", ["get", "thresholdSeverity"], 3]]',
  )
  const warningLocationsCount = await warningLocations.count()

  await expect(warningLocations, 'Warning locations visible').toBeVisibleOnMap()
  await expect(warningLocationsCount, 'Warning locations count').toBe(1)

  const watchLocations = mapLocator(
    'map[id=mainMap] layer[id=weboc-layer-location-symbol] filter["all", ["==", ["get", "thresholdSeverity"], 9]]',
  )
  const watchLocationsCount = await watchLocations.count()

  await expect(watchLocations, 'Watch locations visible').toBeVisibleOnMap()
  await expect(watchLocationsCount, 'Watch locations count').toBe(1)

  const noThresholdLocations = mapLocator(
    'map[id=mainMap] layer[id=weboc-layer-location-symbol] filter["all", ["!", ["has", "thresholdSeverity"]]]',
  )
  const noThresholdLocationsCount = await noThresholdLocations.count()

  await expect(
    noThresholdLocations,
    'No threshold locations visible',
  ).toBeVisibleOnMap()
  await expect(noThresholdLocationsCount, 'No threshold locations count').toBe(
    24,
  )
})
