<template>
  <div class="vertical-legend">
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
.vertical-legend {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  text-shadow:
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 2px,
    rgb(var(--v-theme-background)) 0px 0px 3px,
    rgb(var(--v-theme-background)) 0px 0px 4px,
    rgb(var(--v-theme-background)) 0px 0px 5px,
    rgb(var(--v-theme-background)) 0px 0px 6px;
}
</style>
