import type { Overlay as FewsPiOverlay } from '@deltares/fews-pi-requests'
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

export interface Overlay extends FewsPiOverlay {
  opacity: number
}

export function useOverlays(
  overlaySettings: MaybeRefOrGetter<FewsPiOverlay[]>,
) {
  const overlays = ref<Overlay[]>([])
  const hasOverlays = ref(false)

  watch(
    () => toValue(overlaySettings),
    (newOverlays, oldOverlays) => {
      if (JSON.stringify(newOverlays) === JSON.stringify(oldOverlays)) return

      const gridLayer: FewsPiOverlay = { type: 'gridLayer' }

      // Ensure that the grid layer is always included in the overlays
      const newOverlaysWithGrid = newOverlays.find(isFewsPiGridLayer)
        ? newOverlays
        : [gridLayer, ...newOverlays]
      hasOverlays.value = newOverlays.some(
        (overlay) => overlay.type === 'overLay',
      )
      overlays.value = newOverlaysWithGrid.map(convertFewsPiOverlayToOverlay)
    },
    { immediate: true },
  )

  const visibleOverlays = computed(() =>
    overlays.value.filter((overlay) => overlay.visible),
  )

  return {
    overlays,
    hasOverlays,
    visibleOverlays,
  }
}

function convertFewsPiOverlayToOverlay(overlay: FewsPiOverlay): Overlay {
  if (overlay.type === 'gridLayer') {
    return {
      ...overlay,
      visible: true,
      opacity: 1,
    }
  }

  return {
    ...overlay,
    opacity: 1,
  }
}

function isFewsPiGridLayer(overlay: FewsPiOverlay): boolean {
  return overlay.type === 'gridLayer'
}
