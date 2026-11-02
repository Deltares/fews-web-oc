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
    <template #hint>
      <strong>{{ toLabel(selection?.ensembleId ?? '') }}</strong>
      <div>{{ t('ensembles.membersRange', { range: memberRange }) }}</div>
      <div class="d-flex flex-column ga-1 pt-2">
        <KeyboardHint
          :keys="['←', '→']"
          :label="t('ensembles.previousNextMember')"
        />
        <KeyboardHint
          :keys="['↑', '↓']"
          :label="t('ensembles.previousNextRow')"
        />
      </div>
    </template>
  </InformationPanelExtension>
</template>

<script setup lang="ts">
import { Ensemble } from '@deltares/fews-wms-requests'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { EnsembleSelection } from '@/lib/ensemble'
import { toLabel } from '@/lib/utils/toLabel'

import KeyboardHint from '@/components/general/KeyboardHint.vue'

import InformationPanelExtension from './InformationPanelExtension.vue'

interface Props {
  ensembles: Ensemble[]
}
const props = defineProps<Props>()

const { t } = useI18n()

const selection = defineModel<EnsembleSelection | null>({ required: true })

const ensembleMemberIds = computed<string[]>(() => {
  const selectedEnsembleId = selection.value?.ensembleId
  if (selectedEnsembleId === undefined) return []
  const ensemble = props.ensembles.find(
    (ensemble) => ensemble.ensembleId === selectedEnsembleId,
  )
  return ensemble?.ensembleMemberIds ?? []
})

const memberRange = computed(() => {
  const firstMemberId = ensembleMemberIds.value[0] ?? ''
  const lastMemberId = ensembleMemberIds.value.at(-1) ?? ''
  return `${firstMemberId}–${lastMemberId}`
})

// Show the member with a "#" prefix when collapsed, e.g. "#5".
const collapsedText = computed(() => {
  const memberId = selection.value?.ensembleMemberId
  return memberId === undefined ? undefined : `#${memberId}`
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
