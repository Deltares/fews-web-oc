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
    //
    // Member IDs are also deduplicated: for layers with multiple parameters
    // (e.g. a raster with animated vectors), FEWS lists each member once per
    // parameter.
    return unsorted.map((ensemble) => {
      return {
        ensembleId: ensemble.ensembleId,
        ensembleMemberIds: sortEnsembleMemberIds([
          ...new Set(ensemble.ensembleMemberIds),
        ]),
      }
    })
  })

  // Only allow selecting an ensemble member if there is something to choose,
  // i.e. not for a single ensemble with a single member.
  const canSelectEnsemble = computed<boolean>(() => {
    const numMembers = ensembles.value.reduce(
      (total, ensemble) => total + ensemble.ensembleMemberIds.length,
      0,
    )
    return numMembers > 1
  })

  const selection = ref<EnsembleSelection | null>(null)

  // Remember the selected member per ensemble, so the selection is restored
  // after switching to and from e.g. a deterministic layer. Ordered from least
  // to most recently selected.
  const rememberedMemberIds = new Map<string, string>()
  watch(
    selection,
    (newSelection) => {
      // Selections without a choice, e.g. of a deterministic layer, should not
      // replace the member chosen for an ensemble.
      if (newSelection === null || !canSelectEnsemble.value) return
      rememberedMemberIds.delete(newSelection.ensembleId)
      rememberedMemberIds.set(
        newSelection.ensembleId,
        newSelection.ensembleMemberId,
      )
    },
    { flush: 'sync' },
  )

  // If the ensembles change, reinitialise the selection if necessary.
  watch(
    ensembles,
    () => {
      if (!isValidSelection(selection.value)) {
        selection.value =
          findRememberedSelection() ?? initialiseEnsembleSelection()
      }
    },
    { immediate: true },
  )

  function isValidSelection(
    candidate: EnsembleSelection | null,
  ): candidate is EnsembleSelection {
    return ensembles.value.some(
      (ensemble) =>
        ensemble.ensembleId === candidate?.ensembleId &&
        ensemble.ensembleMemberIds.includes(candidate.ensembleMemberId),
    )
  }

  function findRememberedSelection(): EnsembleSelection | null {
    const remembered = [...rememberedMemberIds].reverse()
    for (const [ensembleId, ensembleMemberId] of remembered) {
      const candidate = { ensembleId, ensembleMemberId }
      if (isValidSelection(candidate)) return candidate
    }
    return null
  }

  function initialiseEnsembleSelection(): EnsembleSelection | null {
    const firstEnsemble = ensembles.value[0]
    const firstMemberId = firstEnsemble?.ensembleMemberIds[0]
    if (firstEnsemble === undefined || firstMemberId === undefined) return null
    return {
      ensembleId: firstEnsemble.ensembleId,
      ensembleMemberId: firstMemberId,
    }
  }

  return { ensembles, selection, canSelectEnsemble }
}
