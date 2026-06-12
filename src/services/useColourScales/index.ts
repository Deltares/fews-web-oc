import type { ColourScale } from '@/stores/colourScales'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { computed, ref, toValue, watchEffect } from 'vue'

export interface UseColourScalesReturn {
  currentScale: ShallowRef<ColourScale | undefined>
  currentScaleTitle: ShallowRef<string>
  currentScales: ShallowRef<ColourScale[]>
  currentScaleIsInitialRange: ShallowRef<boolean>
}

export function useColourScales(
  currentIds: MaybeRefOrGetter<string[]>,
  scales: MaybeRefOrGetter<Record<string, ColourScale>>,
  title?: MaybeRefOrGetter<string>,
): UseColourScalesReturn {
  const currentScale = ref<ColourScale | undefined>(undefined)
  const currentScales = ref<ColourScale[]>([])

  watchEffect(() => {
    const _currentIds = toValue(currentIds)
    const _scales = toValue(scales)
    const updatedScales = _currentIds.map((id) => _scales[id])
    const currentId = currentScale.value?.id
    if (currentId && _currentIds.includes(currentId)) {
      currentScale.value = _scales[currentId]
    } else {
      currentScale.value = updatedScales[0]
    }
    currentScales.value = updatedScales
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

  return {
    currentScale,
    currentScaleTitle,
    currentScales,
    currentScaleIsInitialRange,
  }
}
