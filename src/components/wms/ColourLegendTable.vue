<template>
  <div class="legend-grid" :class="{ horizontal }">
    <div v-for="item in colourMap" :key="item.label" class="legend-item">
      <div class="box" :style="{ backgroundColor: item.color }" />
      <div v-if="!hideLabels" class="legend-label">{{ item.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColourMap } from '@deltares/fews-wms-requests'

interface Props {
  colourMap: ColourMap
  horizontal?: boolean
  hideLabels?: boolean
}

defineProps<Props>()
</script>

<style scoped>
.box {
  height: 20px;
  width: 20px;
  border: 1px solid black;
}

.legend-label {
  font-size: 0.825em;
}

.legend-grid {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 4px;
}

.legend-grid.horizontal {
  flex-direction: row;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
