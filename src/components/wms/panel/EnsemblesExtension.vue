<template>
  <InformationPanelExtension
    v-model="selectedEnsembleMemberId"
    :items="extensionItems"
    value-key="value"
    text-key="value"
    active-prepend-icon="mdi-file-table-box-multiple"
  >
    <template #tooltip="{ item }">
      <strong>{{ selection?.ensembleId }}</strong>
      <div>{{ item.value }}</div>
    </template>
  </InformationPanelExtension>
</template>

<script setup lang="ts">
import { Ensemble } from '@deltares/fews-wms-requests'
import { computed } from 'vue'

import { EnsembleSelection } from '@/lib/ensemble'

import InformationPanelExtension from './InformationPanelExtension.vue'

interface Props {
  ensembles: Ensemble[]
}
const props = defineProps<Props>()

const selection = defineModel<EnsembleSelection | null>({ required: true })

const ensembleMemberIds = computed<string[]>(() => {
  const selectedEnsembleId = selection.value?.ensembleId
  if (selectedEnsembleId === undefined) return []
  const ensemble = props.ensembles.find(
    (ensemble) => ensemble.ensembleId === selectedEnsembleId,
  )
  return ensemble?.ensembleMemberIds ?? []
})

const extensionItems = computed(() =>
  ensembleMemberIds.value.map((ensembleMemberId) => ({
    value: ensembleMemberId,
    text: ensembleMemberId,
    icon: undefined,
    isActive: ensembleMemberId === selection.value?.ensembleMemberId,
  })),
)

const selectedEnsembleMemberId = computed<string | null>({
  get: () => selection.value?.ensembleMemberId ?? null,
  set: (newEnsembleMemberId: string | null) => {
    if (selection.value === null) return
    if (newEnsembleMemberId === null) {
      selection.value = null
      return
    }
    selection.value = {
      ensembleId: selection.value.ensembleId,
      ensembleMemberId: newEnsembleMemberId,
    }
  },
})
</script>
