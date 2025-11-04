<template>
  <v-list-item prepend-icon="mdi-sigma" class="pe-1">
    <v-checkbox
      v-model="doShowAggregated"
      label="Show accumulated data"
      density="compact"
      hide-details
    />
    <v-select
      v-model="selectedAggregationLabel"
      label="Accumulation period"
      :items="aggregationLabels"
      hide-details
    />
  </v-list-item>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Props {
  aggregationLabels: string[]
}
const props = defineProps<Props>()
const doShowAggregated = defineModel<boolean>('doShowAggregated', {
  required: true,
})
const selectedAggregationLabel = defineModel<string | null>(
  'selectedAggregationLabel',
  { required: true },
)

watch(
  () => props.aggregationLabels,
  (newLabels) => {
    if (
      selectedAggregationLabel.value === null ||
      !newLabels.includes(selectedAggregationLabel.value)
    ) {
      selectedAggregationLabel.value = newLabels[0] ?? null
    }
  },
  { immediate: true },
)
</script>
