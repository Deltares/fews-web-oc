<template>
  <v-btn-toggle
    v-if="aggregations.length > 0"
    v-model="selectedAggregationLabel"
    density="compact"
    variant="flat"
    mandatory
    class="overflow-visible"
  >
    <v-tooltip v-for="item in aggregations" :key="item.id" location="top">
      <template #activator="{ props: tooltipProps }">
        <AggregationButton
          :item="item"
          :selectedAggregationLabel="selectedAggregationLabel"
          :tooltipProps="tooltipProps"
        />
      </template>
      <strong>{{ item.type }} {{ item.id }}</strong>
      <p>{{ toDateRangeString(item.startDate, item.endDate) }}</p>
    </v-tooltip>
  </v-btn-toggle>
</template>

<script setup lang="ts">
import AggregationButton from '@/components/wms/panel/AggregationButton.vue'
import type { AggregationItem } from '@/lib/aggregation'
import { toDateRangeString } from '@/lib/date'

interface Props {
  aggregations: AggregationItem[]
}
defineProps<Props>()

const selectedAggregationLabel = defineModel<string | null>(
  'selectedAggregationLabel',
  { required: true },
)
</script>
