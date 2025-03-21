<template>
  <div class="his-container">
    <div class="his-data-selection">
      <HisDataSelection />
    </div>
    <div class="his-map">
      <HisMap :boundingBox="topologyNode?.boundingBox">
        <HisLocationsLayer :selectedLocationId />
      </HisMap>
    </div>
    <div class="his-charts">
      <HisCharts :topologyNodeId="topologyNode?.id" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HisDataSelection from '@/components/his/HisDataSelection.vue'
import HisMap from '@/components/his/HisMap.vue'
import HisLocationsLayer from '@/components/his/HisLocationsLayer.vue'
import HisCharts from '@/components/his/HisCharts.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { ref } from 'vue'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()

const selectedLocationId = ref<string | null>(null)
</script>

<style scoped>
.his-container {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-template-areas:
    'his-data-selection his-charts'
    'his-map his-charts';
}

.his-container > * {
  overflow: auto;
}

.his-data-selection {
  grid-area: his-data-selection;
}

.his-map {
  grid-area: his-map;
}

.his-charts {
  grid-area: his-charts;
}

@media (max-width: 600px) {
  .his-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
      'his-data-selection'
      'his-map'
      'his-charts';
  }
}
</style>
