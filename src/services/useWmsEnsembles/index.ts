import { sortEnsembleMemberIds } from '@/lib/ensemble'
import type { Ensemble, Layer } from '@deltares/fews-wms-requests'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

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

  return { ensembles }
}
