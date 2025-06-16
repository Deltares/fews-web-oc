<template>
  <AnalysisAddButton
    :disabled="numberOfNewCharts === 0"
    text="Create new charts"
    :loading="loadingNewCharts"
    class="mr-2"
    @click="emit('addToChart')"
  />

  <v-menu>
    <template #activator="{ props }">
      <AnalysisAddButton
        v-bind="props"
        :disabled="!filterCharts.length"
        title="Add to chart"
        :loading="loadingAddToChart"
        icon="mdi-playlist-plus"
      />
    </template>
    <v-list>
      <v-list-item
        v-for="chart in filterCharts"
        :key="chart.id"
        :title="chart.title"
        prepend-icon="mdi-chart-bar"
        density="compact"
        @click="emit('addToChart', chart)"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import AnalysisAddButton from './AnalysisAddButton.vue'
import { canAddFilterToChart, Chart } from '@/lib/analysis'
import type { filterActionsFilter } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  charts: Chart[]
  filters: filterActionsFilter[]
  loadingNewCharts?: boolean
  loadingAddToChart?: boolean
}
const props = defineProps<Props>()

interface Emits {
  addToChart: [chart?: Chart]
}
const emit = defineEmits<Emits>()

const filterCharts = computed(() => {
  if (props.filters.length === 0) return []

  return props.charts.filter(
    (chart) =>
      chart.type === 'filter' &&
      props.filters.every((filter) => canAddFilterToChart(chart, filter)),
  )
})

const numberOfNewCharts = computed(() => props.filters.length)
</script>
