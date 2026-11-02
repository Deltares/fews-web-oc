<template>
  <InformationPanelExtension
    v-model="selectedEnsembleMemberId"
    :items="extensionItems"
    value-key="value"
    text-key="value"
    active-prepend-icon="mdi-source-fork"
    :collapsed-text="collapsedText"
    :columns="10"
  >
    <template #tooltip="{ item }">
      <strong>{{ toLabel(selection?.ensembleId ?? '') }}</strong>
      <div>{{ item.value }}</div>
    </template>
  </InformationPanelExtension>
</template>

<script setup lang="ts">
import { Ensemble } from '@deltares/fews-wms-requests'
import { computed } from 'vue'

import { EnsembleSelection } from '@/lib/ensemble'
import { toLabel } from '@/lib/utils/toLabel'

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

// Show the member with the range of members when collapsed, e.g. "#5 (0–19)".
const collapsedText = computed(() => {
  const memberId = selection.value?.ensembleMemberId
  const firstMemberId = ensembleMemberIds.value[0]
  const lastMemberId = ensembleMemberIds.value.at(-1)
  if (memberId === undefined || firstMemberId === undefined) return undefined
  return `#${memberId} (${firstMemberId}–${lastMemberId})`
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
