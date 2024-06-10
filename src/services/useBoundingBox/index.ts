import { computed, ref } from 'vue'
import { roundToStep } from '@/lib/utils/math'

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
  const round = (
    value: number,
    step: number,
    rounding: 'lower' | 'upper',
  ): number => {
    // For positive values, we floor the lower bound and ceil the upper bound.
    // For negative values, we ceil the absolute value of the lower bound, and
    // floor the absolute value of the upper bound.
    const doFloor = value < 0 ? rounding === 'upper' : rounding === 'lower'
    const absValue = Math.abs(value)
    const numSteps = doFloor
      ? Math.floor(absValue / step)
      : Math.ceil(absValue / step)

    const result = Math.sign(value) * numSteps * step
    return roundToStep(result, step)
  }
  // Round the bounding box to the specified step size.
  return {
    lonMin: round(boundingBox.lonMin, longitudeStepSize, 'lower'),
    lonMax: round(boundingBox.lonMax, longitudeStepSize, 'upper'),
    latMin: round(boundingBox.latMin, latitudeStepSize, 'lower'),
    latMax: round(boundingBox.latMax, latitudeStepSize, 'upper'),
  }
}

export function boundingBoxToString(boundingBox: BoundingBox): string {
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
