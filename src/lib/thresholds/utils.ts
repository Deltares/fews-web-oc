import type { Location } from '@deltares/fews-pi-requests'

export function filterFeaturesByThresholds(
  features: GeoJSON.Feature<GeoJSON.Geometry, Location>[],
  selectedSeverities: number[],
  selectedCrossings: {
    locationId: string
    severity: number
    icon: string
  }[],
) {
  const filteredFeatures = features.flatMap((feature) => {
    const crossing = selectedCrossings.find(
      (s) => s.locationId === feature.properties.locationId,
    )
    if (crossing) {
      return [
        {
          ...feature,
          properties: {
            ...feature.properties,
            thresholdSeverity: crossing.severity,
            thresholdIconName: crossing.icon,
          },
        },
      ]
    }

    const severity = feature.properties.thresholdSeverity
    if (selectedSeverities.includes(severity ?? 0)) {
      return [feature]
    }

    return []
  })
  return filteredFeatures
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
