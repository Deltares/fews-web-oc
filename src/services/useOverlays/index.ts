import type { Overlay } from '@deltares/fews-pi-requests'
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

export function useOverlays(overlays: MaybeRefOrGetter<Overlay[]>) {
  const selectedOverlayIds = ref<string[]>([])

  watch(
    () => toValue(overlays),
    (newOverlays, oldOverlays) => {
      if (JSON.stringify(newOverlays) === JSON.stringify(oldOverlays)) return

      selectedOverlayIds.value = newOverlays
        .filter((overlay) => overlay.type === 'overLay' && overlay.visible)
        .map((overlay) => overlay.id)
        .filter((id) => id !== undefined)
    },
    { immediate: true },
  )
  const selectedOverlays = computed(() => {
    return toValue(overlays).filter(
      (overlay) => overlay.id && selectedOverlayIds.value.includes(overlay.id),
    )
  })

  return {
    selectedOverlayIds,
    selectedOverlays,
  }
}
