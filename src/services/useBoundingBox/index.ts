import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import { BBox } from 'geojson'
import { GeoJSONStoreFeatures } from 'terra-draw'
import { computed, ref } from 'vue'

export interface BoundingBox {
  lonMin: number
  lonMax: number
  latMin: number
  latMax: number
}

function isValidBoundingBox(boundingBox: BoundingBox): boolean {
  // Invalid when along x or y, min > max
  if (
    boundingBox.lonMin > boundingBox.lonMax ||
    boundingBox.latMin > boundingBox.latMax
  ) {
    return false
  }
  return (
    !isNaN(boundingBox.lonMin) &&
    !isNaN(boundingBox.lonMax) &&
    !isNaN(boundingBox.latMin) &&
    !isNaN(boundingBox.latMax)
  )
}

function getRoundedBoundingBoxFromGeoJson(
  features: GeoJSONStoreFeatures,
  longitudeStepSize: number,
  latitudeStepSize: number,
): BoundingBox | null {
  const type = features.geometry.type
  if (type !== 'Polygon') return null

  const roundToStep = (value: number, step: number): number => {
    return parseFloat((Math.round(value / step) * step).toFixed(4))
  }

  // Compute a GeoJSON bounding box from the drawn feature.
  const boundingBox = bbox(features)
  const roundedBoundingBox: BoundingBox = {
    lonMin: roundToStep(boundingBox[0], longitudeStepSize),
    lonMax: roundToStep(boundingBox[2], longitudeStepSize),
    latMin: roundToStep(boundingBox[1], latitudeStepSize),
    latMax: roundToStep(boundingBox[3], latitudeStepSize),
  }

  // Prevent the bbox from becoming a point or line in the x direction
  if (
    roundedBoundingBox.lonMax - roundedBoundingBox.lonMin <
    longitudeStepSize
  ) {
    roundedBoundingBox.lonMax = roundToStep(
      roundedBoundingBox.lonMin + longitudeStepSize,
      longitudeStepSize,
    )
  }

  // Prevent the bbox from becoming a point or line in the y direction
  if (
    roundedBoundingBox.latMax - roundedBoundingBox.latMin <
    latitudeStepSize
  ) {
    roundedBoundingBox.latMax = roundToStep(
      roundedBoundingBox.latMin + latitudeStepSize,
      latitudeStepSize,
    )
  }
  return roundedBoundingBox
}

function getGeoJsonFromBoundingBox(
  previousFeature: GeoJSONStoreFeatures | null,
  boundingBox: BoundingBox,
): GeoJSONStoreFeatures | null {
  if (!isValidBoundingBox(boundingBox)) return null

  // Convert to GeoJSON bbox.
  const bbox: BBox = [
    boundingBox.lonMin,
    boundingBox.latMin,
    boundingBox.lonMax,
    boundingBox.latMax,
  ]
  const newFeature = bboxPolygon(bbox) as GeoJSONStoreFeatures
  delete newFeature.bbox

  if (previousFeature) {
    previousFeature.geometry = newFeature.geometry
    return previousFeature
  } else {
    return newFeature
  }
}

function boundingBoxToString(boundingBox: BoundingBox): string {
  return `${boundingBox.lonMin}°E ${boundingBox.latMin}°N, ${boundingBox.lonMax}°E ${boundingBox.latMax}°N`
}

export function useBoundingBox(
  initialLongitudeStepSize: number,
  initialLatitudeStepSize: number,
) {
  const boundingBox = ref<BoundingBox | null>(null)
  const longitudeStepSize = ref(initialLongitudeStepSize)
  const latitudeStepSize = ref(initialLatitudeStepSize)

  // Preserve the previous feature when updating from an updated bounding box,
  // such that it will remain being drawn on the map.
  let previousFeature: GeoJSONStoreFeatures | null = null
  const features = computed({
    get: () => {
      if (boundingBox.value === null) return []
      const feature = getGeoJsonFromBoundingBox(
        previousFeature,
        boundingBox.value,
      )
      return feature ? [feature] : []
    },
    set: (newFeatures: GeoJSONStoreFeatures[]) => {
      if (newFeatures.length === 0) return null
      previousFeature = newFeatures[0]
      boundingBox.value = getRoundedBoundingBoxFromGeoJson(
        newFeatures[0],
        longitudeStepSize.value,
        latitudeStepSize.value,
      )
    },
  })

  const boundingBoxIsValid = computed(() => {
    return boundingBox.value !== null && isValidBoundingBox(boundingBox.value)
  })
  const boundingBoxString = computed(() => {
    return boundingBox.value !== null
      ? boundingBoxToString(boundingBox.value)
      : ''
  })

  return {
    boundingBox,
    features,
    longitudeStepSize,
    latitudeStepSize,
    boundingBoxIsValid,
    boundingBoxString,
  }
}
