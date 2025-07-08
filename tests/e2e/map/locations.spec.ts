import { map } from 'd3'
import { test, expect } from '../map-testing'

test('Thresholds locations should be visible for viewer_rivers_level_stations_forecast', async ({
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
    'map[id=mainMap] layer[id=weboc-layer-location-symbol] filter["all", ["==", ["get", "thresholdSeverity"], 1]]',
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

test('Thresholds locations should be visible for viewer_rivers_critical_points', async ({
  page,
  mapLocator,
  mapController,
}) => {
  await page.goto(
    '/topology/node/viewer_rivers_critical_points/viewer_rivers_critical_points_forecast/map/',
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
  await expect(warningLocationsCount, 'Warning locations count').toBe(7)

  const watchLocations = mapLocator(
    'map[id=mainMap] layer[id=weboc-layer-location-symbol] filter["all", ["==", ["get", "thresholdSeverity"], 1]]',
  )
  const watchLocationsCount = await watchLocations.count()

  await expect(watchLocations, 'Watch locations visible').toBeHiddenOnMap()
  await expect(watchLocationsCount, 'Watch locations count').toBe(0)

  const noThresholdLocations = mapLocator(
    'map[id=mainMap] layer[id=weboc-layer-location-symbol] filter["all", ["!", ["has", "thresholdSeverity"]]]',
  )
  const noThresholdLocationsCount = await noThresholdLocations.count()

  await expect(
    noThresholdLocations,
    'No threshold locations visible',
  ).toBeVisibleOnMap()
  await expect(noThresholdLocationsCount, 'No threshold locations count').toBe(
    225,
  )
})

