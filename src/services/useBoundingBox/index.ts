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

function roundBoundingBox(
  boundingBox: BoundingBox,
  longitudeStepSize: number,
  latitudeStepSize: number,
): BoundingBox | null {
  const roundToStep = (value: number, step: number): number => {
    return parseFloat((Math.round(value / step) * step).toFixed(4))
  }

  // Round the bounding box to the specified step size.
  const roundedBoundingBox: BoundingBox = {
    lonMin: roundToStep(boundingBox.lonMin, longitudeStepSize),
    lonMax: roundToStep(boundingBox.lonMax, longitudeStepSize),
    latMin: roundToStep(boundingBox.latMin, latitudeStepSize),
    latMax: roundToStep(boundingBox.latMin, latitudeStepSize),
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

function boundingBoxToString(boundingBox: BoundingBox): string {
  return `${boundingBox.lonMin}°E ${boundingBox.latMin}°N, ${boundingBox.lonMax}°E ${boundingBox.latMax}°N`
}

export function useBoundingBox(
  initialLongitudeStepSize: number,
  initialLatitudeStepSize: number,
) {
  const _boundingBox = ref<BoundingBox | null>(null)
  const longitudeStepSize = ref(initialLongitudeStepSize)
  const latitudeStepSize = ref(initialLatitudeStepSize)

  // The bounding box that is publicly exposed ensures that the "inner" bounding
  // box (i.e. _boundingBox) is always rounded to the nearest step size.
  const boundingBox = computed({
    get: () => {
      return _boundingBox.value
    },
    set: (value: BoundingBox | null) => {
      if (value !== null) {
        _boundingBox.value = roundBoundingBox(
          value,
          longitudeStepSize.value,
          latitudeStepSize.value,
        )
      } else {
        _boundingBox.value = value
      }
    },
  })

  const boundingBoxIsValid = computed(() => {
    return _boundingBox.value !== null && isValidBoundingBox(_boundingBox.value)
  })
  const boundingBoxString = computed(() => {
    return _boundingBox.value !== null
      ? boundingBoxToString(_boundingBox.value)
      : ''
  })

  return {
    boundingBox,
    longitudeStepSize,
    latitudeStepSize,
    boundingBoxIsValid,
    boundingBoxString,
  }
}
