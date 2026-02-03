<template>
  <div class="map__colour-legend">
    <p>{{ title }}</p>
    <ColourLegendTable :colourMap="colourMap" />
  </div>
</template>

<script setup lang="ts">
import type { ColourMap } from '@deltares/fews-wms-requests'
import ColourLegendTable from '@/components/wms/ColourLegendTable.vue'

interface Props {
  title: string
  colourMap: ColourMap
}

defineProps<Props>()
</script>

<style scoped>
.map__colour-legend {
  color: white;
  text-rendering: optimizeLegibility;
  text-shadow:
    -1px 0 1px rgba(0, 0, 0, 0.6),
    1px 0 1px rgba(0, 0, 0, 0.6),
    0 1px 1px rgba(0, 0, 0, 0.6),
    0 -1px 1px rgba(0, 0, 0, 0.6);
  padding-bottom: 4px;
}
</style>
