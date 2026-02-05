<template>
  <v-btn
    v-bind="tooltipProps"
    :value="item.id"
    class="information-panel__tab text-none"
    size="small"
    :class="{ active }"
    :prepend-icon="data.prependIcon"
    :icon="data.icon"
    :append-icon="data.appendIcon"
    :text="data.text"
    min-width="35px"
  />
</template>

<script setup lang="ts">
import type { AggregationItem } from '@/lib/aggregation'
import { computed } from 'vue'

interface Props {
  item: AggregationItem
  selectedAggregationLabel: string | null
  tooltipProps: Record<string, unknown>
}

const props = defineProps<Props>()

const active = computed(() => {
  return props.item.id === props.selectedAggregationLabel
})

const data = computed(() => {
  const isActive = active.value
  const hasShortLabel = props.item.shortLabel !== ''
  const hasIcon = !!props.item.icon

  if (isActive) {
    return {
      prependIcon: 'mdi-clock-end',
      appendIcon: props.item.icon,
      text: props.item.shortLabel,
    }
  } else if (hasIcon && !hasShortLabel) {
    // Use icon instead of append icon when no short label
    return {
      icon: props.item.icon,
    }
  } else {
    return {
      appendIcon: props.item.icon,
      text: props.item.shortLabel,
    }
  }
})
</script>

<style scoped>
.information-panel__tab {
  padding: 5px 10px;
  background-color: rgba(var(--v-theme-surface), 0.8);
  cursor: pointer;
  display: none; /* hidden */
}

.information-panel__tab.active {
  border-radius: 3px;
  display: inherit; /* visible */
}
</style>
