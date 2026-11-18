<template>
  <div class="map__colour-legend">
    <p class="my-1">{{ title }}</p>
    <ColourLegendTable :colourMap="colourMap" />
  </div>
</template>

<script setup lang="ts">
import type { ColourMap } from '@deltares/fews-wms-requests'
import ColourLegendTable from '@/components/wms/ColourLegendTable.vue'
import { useMapIsDark } from '@/services/useMapIsDark'
import { computed } from 'vue'

interface Props {
  title: string
  colourMap: ColourMap
}

defineProps<Props>()

const isDark = useMapIsDark()
const textColor = computed(() => (isDark.value ? '#fff' : '#000'))
const shadowRgb = computed(() => (isDark.value ? '0, 0, 0' : '255, 255, 255'))
</script>

<style scoped>
.map__colour-legend {
  pointer-events: auto;
  color: v-bind('textColor');
  text-rendering: optimizeLegibility;
  text-shadow:
    -1px 0 1px rgba(v-bind('shadowRgb'), 0.6),
    1px 0 1px rgba(v-bind('shadowRgb'), 0.6),
    0 1px 1px rgba(v-bind('shadowRgb'), 0.6),
    0 -1px 1px rgba(v-bind('shadowRgb'), 0.6);
  padding-bottom: 4px;
}
</style>
