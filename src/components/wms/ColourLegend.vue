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
    black 0px 0px 2px,
    black 0px 0px 4px,
    black 0px 0px 6px;
}
</style>
