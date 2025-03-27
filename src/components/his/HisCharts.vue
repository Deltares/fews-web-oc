<template>
  <div class="pt-2 h-100 w-100">
    <TimeSeriesComponent
      :config="displayConfig ?? undefined"
      :displayType="DisplayType.TimeSeriesChart"
      :settings="settings.charts"
    />
  </div>
</template>

<script setup lang="ts">
import TimeSeriesComponent from '@/components/timeseries/TimeSeriesComponent.vue'
import { DisplayConfig, DisplayType } from '@/lib/display/DisplayConfig'
import { type ComponentSettings } from '@/lib/topology/componentSettings'

interface Props {
  displayConfig: DisplayConfig | null
  settings: ComponentSettings
}

defineProps<Props>()
</script>
