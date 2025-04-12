import type { ColourScale } from '@/stores/colourScales'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { computed, toValue } from 'vue'

export interface UseColourScalesReturn {
  currentScaleId: ShallowRef<string | undefined>
  currentScale: ShallowRef<ColourScale | undefined>
  currentScaleTitle: ShallowRef<string>
  currentScales: ShallowRef<ColourScale[]>
  currentScaleIsInitialRange: ShallowRef<boolean>
  resetCurrentScaleRange: () => void
}

export function useColourScales(
  currentIndex: MaybeRefOrGetter<number>,
  currentIds: MaybeRefOrGetter<string[]>,
  scales: MaybeRefOrGetter<Record<string, ColourScale>>,
  title?: MaybeRefOrGetter<string>,
): UseColourScalesReturn {
  const currentScaleId = computed<string | undefined>(() => {
    const _currentIndex = toValue(currentIndex)
    const _currentIds = toValue(currentIds)
    return _currentIds[_currentIndex]
  })

  const currentScale = computed(() => {
    const _scales = toValue(scales)
    if (!currentScaleId.value) return
    return _scales[currentScaleId.value]
  })

  const currentScales = computed(() => {
    const _scales = toValue(scales)
    const _currentIds = toValue(currentIds)
    return _currentIds.map((id) => _scales[id])
  })

  const currentScaleIsInitialRange = computed(() => {
    if (!currentScale.value) return false
    return (
      currentScale.value.range.min === currentScale.value.initialRange.min &&
      currentScale.value.range.max === currentScale.value.initialRange.max
    )
  })

  const currentScaleTitle = computed(() => {
    const unit = currentScale.value?.unit
    const unitString = unit ? ` [${unit}]` : ''
    return `${toValue(title)}${unitString}`
  })

  function resetCurrentScaleRange() {
    if (!currentScale.value) return
    currentScale.value.range = currentScale.value.initialRange
  }

  return {
    currentScaleId,
    currentScale,
    currentScaleTitle,
    currentScales,
    currentScaleIsInitialRange,
    resetCurrentScaleRange,
  }
}
