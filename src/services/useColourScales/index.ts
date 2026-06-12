import type { ColourScale } from '@/stores/colourScales'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { computed, ref, toValue, watchEffect } from 'vue'

export interface UseColourScalesReturn {
  currentScaleIndex: ShallowRef<number | undefined>
  currentScale: ShallowRef<ColourScale | undefined>
  currentScaleTitle: ShallowRef<string>
  currentScales: ShallowRef<ColourScale[]>
  currentScaleIsInitialRange: ShallowRef<boolean>
  select: (index: number) => void
  resetCurrentScaleRange: () => void
}

export function useColourScales(
  currentIds: MaybeRefOrGetter<string[]>,
  allScales: MaybeRefOrGetter<Record<string, ColourScale>>,
  title?: MaybeRefOrGetter<string>,
): UseColourScalesReturn {
  const currentScaleIndex = ref<number | undefined>(0)
  const currentScale = ref<ColourScale>()
  const currentScales = ref<ColourScale[]>([])

  function select(index: number | undefined) {
    currentScaleIndex.value = index
  }

  watchEffect(() => {
    const _currentIds = toValue(currentIds)
    const _allScales = toValue(allScales)
    const newScales = _currentIds.map((id) => _allScales[id])
    if (
      currentScaleIndex.value !== undefined &&
      !_currentIds.includes(_currentIds[currentScaleIndex.value])
    ) {
      currentScaleIndex.value = 0
    }
    currentScales.value = newScales
    currentScale.value =
      currentScaleIndex.value === undefined
        ? undefined
        : _allScales[_currentIds[currentScaleIndex.value]]
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
    currentScaleIndex,
    currentScale,
    currentScaleTitle,
    currentScales,
    currentScaleIsInitialRange,
    select,
    resetCurrentScaleRange,
  }
}
