import type { Overlay } from '@deltares/fews-pi-requests'
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

export function useOverlays(overlaySettings: MaybeRefOrGetter<Overlay[]>) {
  const selectedOverlayIds = ref<string[]>([])
  const overlays = ref<Overlay[]>([])

  watch(
    () => toValue(overlaySettings),
    (newOverlays, oldOverlays) => {
      if (JSON.stringify(newOverlays) === JSON.stringify(oldOverlays)) return

      overlays.value = newOverlays.map((overlay) => ({
        id: overlay.id,
        type: overlay.type,
        visible: overlay.visible,
        opacity: 1,
      }))
      selectedOverlayIds.value = newOverlays
        .filter((overlay) => overlay.type === 'overLay' && overlay.visible)
        .map((overlay) => overlay.id)
        .filter((id) => id !== undefined)
    },
    { immediate: true },
  )
  const selectedOverlays = computed(() => {
    return overlays.value.filter(
      (overlay) => overlay.id && selectedOverlayIds.value.includes(overlay.id),
    )
  })

  return {
    selectedOverlayIds,
    selectedOverlays,
    overlays,
  }
}
