<template>
  <v-list-item prepend-icon="mdi-sigma">
    <v-list-item-title>Show accumulated data</v-list-item-title>
    <template v-slot:append>
      <v-switch
        v-model="doShowAggregated"
        color="primary"
        density="compact"
        hide-details
      ></v-switch>
    </template>
    <v-list-item-content> </v-list-item-content>
  </v-list-item>
  <v-list-item v-if="doShowAggregated">
    <template v-slot:prepend>
      <v-icon></v-icon>
    </template>
    <v-list-item-action>
      <v-select
        v-model="selectedAggregationLabel"
        label="Accumulation period"
        :items="aggregationLabels"
        density="compact"
        variant="solo-filled"
        flat
        hide-details
      />
    </v-list-item-action>
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
