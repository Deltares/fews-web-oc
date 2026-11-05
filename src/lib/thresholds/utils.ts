import type { Location } from '@deltares/fews-pi-requests'

/**
 * Sets the threshold properties of the selected crossings on their features. The
 * features keep their geometry objects, and are not filtered: hiding locations
 * is done by a layer filter on the map.
 */
export function applyThresholdCrossingsToFeatures(
  features: GeoJSON.Feature<GeoJSON.Geometry, Location>[],
  selectedCrossings: {
    locationId: string
    severity: number
    icon: string
  }[],
) {
  const crossingsByLocationId = new Map(
    selectedCrossings.map((crossing) => [crossing.locationId, crossing]),
  )
  return features.map((feature) => {
    const crossing = crossingsByLocationId.get(feature.properties.locationId)
    if (!crossing) return feature
    return {
      ...feature,
      properties: {
        ...feature.properties,
        thresholdSeverity: crossing.severity,
        thresholdIconName: crossing.icon,
      },
    }
  })
}

export function filterLocationsByThresholds(
  locations: Location[],
  selectedSeverities: number[],
  selectedCrossings: {
    locationId: string
    severity: number
    icon: string
  }[],
) {
  const filteredLocations = locations.flatMap((location) => {
    const crossing = selectedCrossings.find(
      (s) => s.locationId === location.locationId,
    )
    if (crossing) {
      return [
        {
          ...location,
          thresholdSeverity: crossing.severity,
          thresholdIconName: crossing.icon,
        },
      ]
    }

    const severity = location.thresholdSeverity
    if (selectedSeverities.includes(severity ?? 0)) {
      return [location]
    }

    return []
  })
  return filteredLocations
}
