<template>
  <InformationPanelExtension
    v-model="selectedAggregationLabel"
    :items="extensionItems"
    value-key="id"
    text-key="shortLabel"
    icon-key="icon"
    active-prepend-icon="mdi-clock-end"
  >
    <template #tooltip="{ item }">
      <strong>{{ item.type }} {{ item.id }}</strong>
      <div>{{ toDateRangeString(item.startDate, item.endDate) }}</div>
    </template>
  </InformationPanelExtension>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { type AggregationItem } from '@/lib/aggregation'
import { toDateRangeString } from '@/lib/date'

import InformationPanelExtension from './InformationPanelExtension.vue'

interface Props {
  aggregations: AggregationItem[]
}
const props = defineProps<Props>()

const selectedAggregationLabel = defineModel<string | null>(
  'selectedAggregationLabel',
  { required: true },
)

const extensionItems = computed(() =>
  props.aggregations.map((aggregation) => ({
    ...aggregation,
    isActive: aggregation.id === selectedAggregationLabel.value,
  })),
)
</script>
