<template>
  <v-list-item prepend-icon="mdi-file-table-box-multiple" class="pb-0">
    <v-row class="align-center mb-2" no-gutters>
      <v-col cols="4">{{ t('ensembles.ensemble') }}: </v-col>
      <v-col cols="8">
        <v-select
          v-model="selectedEnsembleId"
          :items="selectableEnsembles"
          item-value="ensembleId"
          item-title="ensembleId"
          density="compact"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row class="align-center" no-gutters>
      <v-col cols="4">{{ t('ensembles.member') }}: </v-col>
      <v-col cols="8">
        <v-select
          v-model="selectedEnsembleMemberId"
          :items="ensembleMemberIds"
          density="compact"
          hide-details
        />
      </v-col>
    </v-row>
  </v-list-item>
</template>

<script setup lang="ts">
import type { Ensemble } from '@deltares/fews-wms-requests'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { EnsembleSelection } from '@/lib/ensemble'

const { t } = useI18n()

interface Props {
  ensembles: Ensemble[]
}
const props = defineProps<Props>()

const selection = defineModel<EnsembleSelection | null>({ required: true })

const selectedEnsembleId = ref<string | null>(null)
const selectedEnsembleMemberId = ref<string | null>(null)

// Ensembles without members cannot be selected.
const selectableEnsembles = computed(() =>
  props.ensembles.filter((ensemble) => ensemble.ensembleMemberIds.length > 0),
)

const selectedEnsemble = computed<Ensemble | null>(() => {
  if (selectedEnsembleId.value === null) return null
  const ensemble = props.ensembles.find(
    (ensemble) => ensemble.ensembleId === selectedEnsembleId.value,
  )
  return ensemble ?? null
})

const ensembleMemberIds = computed(() => {
  return selectedEnsemble.value?.ensembleMemberIds ?? []
})

// Only update the model value when the selection has actually changed, to
// avoid triggering watchers (and layer reloads) on the model with an identical
// selection.
function updateSelection(ensembleId: string, ensembleMemberId: string) {
  if (
    selection.value?.ensembleId === ensembleId &&
    selection.value?.ensembleMemberId === ensembleMemberId
  ) {
    return
  }
  selection.value = { ensembleId, ensembleMemberId }
}

// Update the model value based on the select fields and vice versa.
watch(selectedEnsembleId, (newSelectedEnsembleId) => {
  if (newSelectedEnsembleId === null) return

  const firstEnsembleMemberId = ensembleMemberIds.value[0]
  if (firstEnsembleMemberId === undefined) {
    // This ensemble has no members, so it cannot be selected; revert the
    // select field to the ensemble that is actually selected.
    selectedEnsembleId.value = selection.value?.ensembleId ?? null
    return
  }

  // Check whether our current ensemble member ID exists in this ensemble, in
  // that case, preserve it.
  const oldMemberId = selectedEnsembleMemberId.value
  const hasOldMemberId =
    oldMemberId !== null && ensembleMemberIds.value.includes(oldMemberId)
  const newSelectedEnsembleMemberId = hasOldMemberId
    ? oldMemberId
    : firstEnsembleMemberId
  updateSelection(newSelectedEnsembleId, newSelectedEnsembleMemberId)
})
watch(selectedEnsembleMemberId, (newSelectedEnsembleMemberId) => {
  if (
    selectedEnsembleId.value === null ||
    newSelectedEnsembleMemberId === null
  ) {
    return
  }
  updateSelection(selectedEnsembleId.value, newSelectedEnsembleMemberId)
})

watch(
  selection,
  (newSelection) => {
    // Don't change the selected values if our new selection is null, it is e.g.
    // an incomplete selection while we are choosing member ID having selected
    // ensemble ID.
    if (newSelection === null) return

    if (newSelection.ensembleId !== selectedEnsembleId.value) {
      selectedEnsembleId.value = newSelection.ensembleId
    }
    if (newSelection.ensembleMemberId !== selectedEnsembleMemberId.value) {
      selectedEnsembleMemberId.value = newSelection.ensembleMemberId
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.select-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  column-gap: 8px;
}
</style>
