<template>
  <div class="panel">
    <div class="panel-scroll">
      <TimeSeriesChart
        v-for="(subplot, i) in subplots"
        :config="subplot"
        :series="series"
        :key="`${subplot.title}-${i}`"
        class="single"
      >
      </TimeSeriesChart>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TimeSeriesChart from '../charts/TimeSeriesChart.vue'
import type { DisplayConfig } from '../../lib/display/DisplayConfig.js'
import { useTimeSeries } from '../../services/useTimeSeries/index.ts'
import { configManager } from '../../services/application-config';

interface Props {
  config?: DisplayConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => {
    return {
      title: '',
      id: '',
      types: [],
      class: '',
      requests: [],
      subplots: [],
    }
  },
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { series } = useTimeSeries( baseUrl, () => props.config.requests)

const subplots = computed(() => {
  if (props.config) {
    return props.config.subplots
  } else {
    return []
  }
})
</script>

<style>
.panel {
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100%;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
}

.panel-scroll {
  display: flex;
  position: relative;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  height: 100%;
}

.single {
  width: 100%;
  flex: 1 1 50%;
  min-height: 400px;
}

.double {
  width: 100%;
  flex: 1 1 50%;
  min-height: 500px;
}

.panel-chart-container {
  display: block;
  height: 400px;
  width: 100%;
}
</style>
