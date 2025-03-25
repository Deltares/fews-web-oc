<template>
  <TimeSeriesWindowComponent
    :displayConfig="displayConfig"
    :settings="settings.charts"
  />
</template>

<script setup lang="ts">
import TimeSeriesWindowComponent from '@/components/timeseries/TimeSeriesWindowComponent.vue'
import { DisplayConfig } from '@/lib/display/DisplayConfig';
import { getDefaultSettings, type ComponentSettings } from '@/lib/topology/componentSettings';

interface Props {
  displayConfig: DisplayConfig | null
  settings?: ComponentSettings
}

withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})
</script>
