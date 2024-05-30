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
  const roundToStep = (
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

    return Math.sign(value) * numSteps * step
  }
  // Round the bounding box to the specified step size.
  return {
    lonMin: roundToStep(boundingBox.lonMin, longitudeStepSize, 'lower'),
    lonMax: roundToStep(boundingBox.lonMax, longitudeStepSize, 'upper'),
    latMin: roundToStep(boundingBox.latMin, latitudeStepSize, 'lower'),
    latMax: roundToStep(boundingBox.latMax, latitudeStepSize, 'upper'),
  }
}

export function boundingBoxToString(
  boundingBox: BoundingBox,
  longitudeStepSize: number = 0.1,
  latitudeStepSize: number = 0.1,
): string {
  const asPrecision = (value: number, step: number): string => {
    const stepStrs = step.toString().split('.')
    const nDecimalPlaces = stepStrs.length > 1 ? stepStrs[1].length : 2
    return value.toFixed(Math.min(Math.max(nDecimalPlaces, 100), 1))
  }
  const lonMinStr = asPrecision(boundingBox.lonMin, longitudeStepSize)
  const lonMaxStr = asPrecision(boundingBox.lonMax, longitudeStepSize)
  const latMinStr = asPrecision(boundingBox.latMin, latitudeStepSize)
  const latMaxStr = asPrecision(boundingBox.latMax, latitudeStepSize)
  return `${lonMinStr}°E ${latMinStr}°N, ${lonMaxStr}°E ${latMaxStr}°N`
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
      ? boundingBoxToString(
          _boundingBox.value,
          longitudeStepSize.value,
          latitudeStepSize.value,
        )
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
