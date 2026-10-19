<template>
  <v-list-item prepend-icon="mdi-file-table-box-multiple" class="pb-0">
    <v-row class="align-center mb-2" no-gutters>
      <v-col cols="4">{{ t('ensembles.ensemble') }}: </v-col>
      <v-col cols="8">
        <v-select
          v-model="selectedEnsembleId"
          :items="ensembleItems"
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
          :items="sortedEnsembleMemberIds"
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

import { sortEnsembleMemberIds, type EnsembleSelection } from '@/lib/ensemble'

const { t } = useI18n()

interface Props {
  ensembles: Ensemble[]
}
const props = defineProps<Props>()

const selection = defineModel<EnsembleSelection | null>({ required: true })

const selectedEnsembleId = ref<string | null>(null)
const selectedEnsembleMemberId = ref<string | null>(null)

const selectedEnsemble = computed<Ensemble | null>(() => {
  if (selectedEnsembleId.value === null) return null
  const ensemble = props.ensembles.find(
    (ensemble) => ensemble.ensembleId === selectedEnsembleId.value,
  )
  return ensemble ?? null
})

const ensembleItems = computed(() =>
  props.ensembles.map((ensemble) => ({
    value: ensemble.ensembleId,
    // TODO: get ensemble name from ensembles endpoint?
    title: ensemble.ensembleId,
  })),
)
const sortedEnsembleMemberIds = computed(() => {
  if (selectedEnsemble.value === null) return []
  return sortEnsembleMemberIds(selectedEnsemble.value.ensembleMemberIds)
})

// Update the model value based on the select fields and vice versa.
watch(
  [selectedEnsembleId, selectedEnsembleMemberId],
  ([newSelectedEnsembleId, newSelectedEnsembleMemberId]) => {
    if (newSelectedEnsembleId === null || newSelectedEnsembleMemberId === null)
      return
    selection.value = {
      ensembleId: newSelectedEnsembleId,
      ensembleMemberId: newSelectedEnsembleMemberId,
    }
  },
)
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
