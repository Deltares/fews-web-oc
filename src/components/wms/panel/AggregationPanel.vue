<template>
  <v-list-item prepend-icon="mdi-clock-end" class="pb-0">
    <div>Show accumulated data</div>
    <template v-slot:append>
      <v-switch
        v-model="active"
        color="primary"
        density="compact"
        hide-details
      ></v-switch>
    </template>
  </v-list-item>
  <v-list-item v-if="active" class="pt-0">
    <template v-slot:prepend>
      <v-icon></v-icon>
    </template>
    <v-list-item-action>
      <v-btn-toggle
        v-model="modelValue"
        density="compact"
        variant="outlined"
        divided
      >
        <v-tooltip v-for="item in items" :key="item.id" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              :value="item.id"
              class="tab text-none px-1"
              size="small"
              :text="item.shortLabel"
              :icon="item.icon"
              min-width="35px"
            >
            </v-btn>
          </template>
          <strong>{{ item.type }} {{ item.id }}</strong>
          <p>{{ toDateRangeString(item.startDate, item.endDate) }}</p>
        </v-tooltip>
      </v-btn-toggle>
    </v-list-item-action>
    <v-list-item-subtitle class="pt-1">{{
      toDateRangeString(
        selectedAggregation?.startDate,
        selectedAggregation?.endDate,
      )
    }}</v-list-item-subtitle>
  </v-list-item>
</template>

<script setup lang="ts">
import type { AggregationItem } from '@/lib/aggregation'
import { toDateRangeString } from '@/lib/date'
import { computed } from 'vue'

interface Props {
  items: AggregationItem[]
}
const { items } = defineProps<Props>()

const modelValue = defineModel<string | null>('modelValue', { required: true })
const active = defineModel<boolean>('active', { required: true })

const selectedAggregation = computed(() => {
  return items.find((item) => item.id === modelValue.value)
})
</script>
