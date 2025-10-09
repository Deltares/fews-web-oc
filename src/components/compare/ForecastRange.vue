<template>
  <div class="forecast-range">
    <div class="forecast-range__track v-progress-linear__background"></div>
    <div
      v-if="startForecastTime"
      class="forecast-range__indicator bg-secondary"
      :style="hindcastStyle"
    ></div>
    <div
      v-if="endForecastTime"
      class="forecast-range__indicator bg-primary"
      :style="forecastStyle"
    ></div>
    <div class="forecast-range__now" :style="nowStyle"></div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  startTime: Date
  endTime: Date
  timeZero: Date
  startForecastTime: Date
  endForecastTime: Date
  details?: string
}

const { startTime, endTime, startForecastTime, endForecastTime, timeZero } =
  defineProps<Props>()

const forecastStyle = computed(() => ({
  color: 'white',
  left: `${(((timeZero?.getTime() ?? endTime.getTime()) - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100}%`,
  width: `${(((endForecastTime?.getTime() ?? endTime.getTime()) - (timeZero?.getTime() ?? endTime.getTime())) / (endTime.getTime() - startTime.getTime())) * 100}%`,
}))

const hindcastStyle = computed(() => ({
  color: 'white',
  left: `${(((startForecastTime?.getTime() ?? endTime.getTime()) - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100}%`,
  width: `${(((timeZero?.getTime() ?? endTime.getTime()) - (startForecastTime?.getTime() ?? endTime.getTime())) / (endTime.getTime() - startTime.getTime())) * 100}%`,
}))

const nowStyle = computed(() => ({
  backgroundColor: 'currentColor',
  left: `${(((new Date().getTime() ?? endTime.getTime()) - startTime.getTime()) / (endTime.getTime() - startTime.getTime())) * 100}%`,
  width: '2px',
}))
</script>

<style scoped>
.forecast-range {
  position: relative;
  width: 100%;
  height: 6px;
}

.forecast-range__track {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.forecast-range__indicator {
  position: absolute;
  top: 0;
  height: 100%;
  display: inline-block;
}

.forecast-range__now {
  position: absolute;
  top: -2px;
  height: calc(100% + 2px);
  display: inline-block;
}
</style>
