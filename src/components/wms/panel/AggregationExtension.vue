<template>
  <v-hover>
    <template #default="{ isHovering, props }">
      <v-btn-toggle
        v-if="aggregations.length > 0"
        v-bind="props"
        v-model="selectedAggregationLabel"
        density="compact"
        variant="flat"
        mandatory
        class="overflow-visible"
      >
        <v-tooltip v-for="item in aggregations" :key="item.id" location="top">
          <template #activator="{ props: tooltipProps }">
            <AggregationButton
              v-if="isActive(item) || isHovering"
              :item="item"
              :isActive="isActive(item)"
              :tooltipProps="tooltipProps"
            />
          </template>
          <strong>{{ item.type }} {{ item.id }}</strong>
          <div>{{ toDateRangeString(item.startDate, item.endDate) }}</div>
        </v-tooltip>
      </v-btn-toggle>
    </template>
  </v-hover>
</template>

<script setup lang="ts">
import type { AggregationItem } from '@/lib/aggregation'
import { toDateRangeString } from '@/lib/date'

import AggregationButton from '@/components/wms/panel/AggregationButton.vue'

interface Props {
  aggregations: AggregationItem[]
}
defineProps<Props>()

const selectedAggregationLabel = defineModel<string | null>(
  'selectedAggregationLabel',
  { required: true },
)

function isActive(item: AggregationItem): boolean {
  return item.id === selectedAggregationLabel.value
}
</script>
