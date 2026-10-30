import type { Ensemble, Layer } from '@deltares/fews-wms-requests'
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

import { type EnsembleSelection, sortEnsembleMemberIds } from '@/lib/ensemble'

export function useWmsEnsembles(
  layerCapabilities: MaybeRefOrGetter<Layer | undefined>,
) {
  const ensembles = computed<Ensemble[]>(() => {
    const unsorted = toValue(layerCapabilities)?.ensembles
    if (unsorted === undefined) return []

    // For each ensemble, sort its members. This is a workaround for the weird
    // sorting of numeric ensembleMemberIds, which are sorted in alphabetical
    // order. This causes e.g. 2 to appear after 10, which looks a bit weird in
    // selection menus.
    return unsorted.map((ensemble) => {
      return {
        ensembleId: ensemble.ensembleId,
        ensembleMemberIds: sortEnsembleMemberIds(ensemble.ensembleMemberIds),
      }
    })
  })

  const selection = ref<EnsembleSelection | null>(null)
  // If the ensembles change, reinitialise the selection if necessary.
  watch(
    ensembles,
    () => {
      const hasExistingSelection = ensembles.value.some(
        (ensemble) =>
          ensemble.ensembleId === selection.value?.ensembleId &&
          ensemble.ensembleMemberIds.includes(
            selection.value?.ensembleMemberId,
          ),
      )
      if (!hasExistingSelection) {
        selection.value = initialiseEnsembleSelection()
      }
    },
    { immediate: true },
  )

  const hasEnsembles = computed<boolean>(() => ensembles.value.length > 0)

  function initialiseEnsembleSelection(): EnsembleSelection | null {
    const firstEnsemble = ensembles.value[0]
    const firstMemberId = firstEnsemble?.ensembleMemberIds[0]
    if (firstEnsemble === undefined || firstMemberId === undefined) return null
    return {
      ensembleId: firstEnsemble.ensembleId,
      ensembleMemberId: firstMemberId,
    }
  }

  return { ensembles, selection, hasEnsembles }
}
