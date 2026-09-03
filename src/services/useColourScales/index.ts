import type { ColourScale } from '@/stores/colourScales'
import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { ref, toValue, watchEffect } from 'vue'

export interface UseColourScalesReturn {
  currentScale: ShallowRef<ColourScale | undefined>
  currentScales: ShallowRef<ColourScale[]>
}

export function useColourScales(
  currentIds: MaybeRefOrGetter<string[]>,
  scales: MaybeRefOrGetter<Record<string, ColourScale>>,
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

  return {
    currentScale,
    currentScales,
  }
}
