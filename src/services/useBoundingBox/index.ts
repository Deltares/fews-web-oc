import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import { BBox } from 'geojson'
import { GeoJSONStoreFeatures } from 'terra-draw'
import { computed, ref } from 'vue'

function isValidBoundingBox(boundingBox: BBox): boolean {
  // Invalid when along x or y, min > max
  if (boundingBox[0] > boundingBox[2] || boundingBox[1] > boundingBox[3]) {
    return false
  }
  return boundingBox.every((v) => !isNaN(v))
}

function getRoundedBoundingBoxFromGeoJson(
  features: GeoJSONStoreFeatures,
  longitudeStepSize: number,
  latitudeStepSize: number,
): BBox | null {
  const type = features.geometry.type
  if (type !== 'Polygon') return null

  const roundToStep = (value: number, step: number): number => {
    return parseFloat((Math.round(value / step) * step).toFixed(4))
  }

  const boundingBox = bbox(features)
  const roundedBoundingBox: BBox = [
    roundToStep(boundingBox[0], longitudeStepSize),
    roundToStep(boundingBox[1], latitudeStepSize),
    roundToStep(boundingBox[2], longitudeStepSize),
    roundToStep(boundingBox[3], latitudeStepSize),
  ]

  // Prevent the bbox from becoming a point or line in the x direction
  if (
    Math.abs(roundedBoundingBox[0] - roundedBoundingBox[2]) < longitudeStepSize
  ) {
    roundedBoundingBox[2] = roundToStep(
      roundedBoundingBox[0] + longitudeStepSize,
      longitudeStepSize,
    )
  }

  // Prevent the bbox from becoming a point or line in the y direction
  if (
    Math.abs(roundedBoundingBox[1] - roundedBoundingBox[3]) < latitudeStepSize
  ) {
    roundedBoundingBox[3] = roundToStep(
      roundedBoundingBox[1] + latitudeStepSize,
      latitudeStepSize,
    )
  }
  return roundedBoundingBox
}

function getGeoJsonFromBoundingBox(
  previousFeature: GeoJSONStoreFeatures | null,
  boundingBox: BBox,
): GeoJSONStoreFeatures | null {
  if (!isValidBoundingBox(boundingBox)) return null
  const newFeature = bboxPolygon(boundingBox) as GeoJSONStoreFeatures
  delete newFeature.bbox

  if (previousFeature) {
    previousFeature.geometry = newFeature.geometry
    return previousFeature
  } else {
    return newFeature
  }
}

function boundingBoxToString(boundingBox: BBox): string {
  return `${boundingBox[0]}°E ${boundingBox[1]}°N , ${boundingBox[2]}°E ${boundingBox[3]}°N`
}

export function useBoundingBox(
  initialLongitudeStepSize: number,
  initialLatitudeStepSize: number,
) {
  const boundingBox = ref<BBox | null>(null)
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
