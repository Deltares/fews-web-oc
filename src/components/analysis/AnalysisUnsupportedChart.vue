<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs">
    <v-card-text>
      <v-alert class="mx-5"> Unsupported chart type: {{ chart.type }} </v-alert>
    </v-card-text>
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import { Chart } from '@/lib/analysis'

interface Props {
  chart: Chart
}
defineProps<Props>()
</script>
