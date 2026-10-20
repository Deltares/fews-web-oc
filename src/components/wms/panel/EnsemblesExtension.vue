<template>
  <v-btn-toggle>
    <v-btn
      v-for="ensembleMemberId in ensembleMemberIds"
      :key="ensembleMemberId"
      :text="ensembleMemberId"
    />
  </v-btn-toggle>
</template>

<script setup lang="ts">
import { EnsembleSelection } from '@/lib/ensemble'
import { Ensemble } from '@deltares/fews-wms-requests'
import { computed } from 'vue'

interface Props {
  ensembles: Ensemble[]
}
const props = defineProps<Props>()

const selection = defineModel<EnsembleSelection | null>({ required: true })

const selectedEnsemble = computed<Ensemble | null>(() => {
  if (selection.value === null) return null
  return (
    props.ensembles.find(
      (ensemble) => ensemble.ensembleId === selection.value?.ensembleId,
    ) ?? null
  )
})
const ensembleMemberIds = computed<string[]>(
  () => selectedEnsemble.value?.ensembleMemberIds ?? [],
)
</script>
