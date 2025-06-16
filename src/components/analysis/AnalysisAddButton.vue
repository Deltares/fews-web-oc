<template>
  <v-btn
    v-bind="props"
    variant="flat"
    :disabled="disabled"
    prepend-icon="mdi-plus"
    :text="newChartTitle"
    :color="disabled ? undefined : 'primary'"
    :loading="loading"
    class="mr-2"
    @click="emit('addToChart')"
  />

  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="flat"
        :disabled="disabled"
        prepend-icon="mdi-playlist-plus"
        text="Add to chart"
        :color="disabled ? undefined : 'primary'"
        :loading="loading"
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
import { Chart } from '@/lib/analysis'
import { computed } from 'vue'

interface Props {
  charts: Chart[]
  disabled?: boolean
  loading?: boolean
  newChartTitle?: string
}
const props = withDefaults(defineProps<Props>(), {
  newChartTitle: 'Create new chart',
})

interface Emits {
  addToChart: [chart?: Chart]
}
const emit = defineEmits<Emits>()

const filterCharts = computed(() =>
  props.charts.filter((chart) => chart.type === 'filter'),
)
</script>
