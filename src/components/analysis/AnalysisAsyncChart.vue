<template>
  <AnalysisChartCard :chart="chart" border loading v-bind="$attrs">
    <v-card-text class="chart-with-chips">
      Async chart rendering is not implemented yet.
    </v-card-text>
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import type { AsyncChart } from '@/lib/analysis'

interface Props {
  chart: AsyncChart
}
defineProps<Props>()
</script>

<style scoped>
.chart-with-chips {
  display: flex;
  position: relative;
  flex-direction: column;
  flex: 1 1 80%;
  max-height: max(50%, 400px);
  width: 100%;
}
</style>
