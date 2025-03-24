<template>
  <div class="his-container">
    <div class="his-data-selection">
      <HisDataSelection
        v-model:selectedLocationIds="selectedLocationIds"
        :locations="locations"
      />
    </div>
    <div class="his-map">
      <HisMap :boundingBox="topologyNode?.boundingBox">
        <LocationsLayer
          v-if="geojson.features.length"
          :locations-geo-json="geojson"
          :selected-location-ids="selectedLocationIds"
          @click="onLocationClick"
        />
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
import HisCharts from '@/components/his/HisCharts.vue'
import LocationsLayer from '../wms/LocationsLayer.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue'
import { useFilterLocations } from '@/services/useFilterLocations'
import { configManager } from '@/services/application-config'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const selectedLocationIds = ref<string[]>([])

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filterIds = computed(() => props.topologyNode?.filterIds ?? [])
const { locations, geojson } = useFilterLocations(baseUrl, filterIds)

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (!event.features) return
  const locationId = event.features[0].properties?.locationId
  if (!locationId) return

  // Toggle location id in array
  selectedLocationIds.value = selectedLocationIds.value.includes(locationId)
    ? selectedLocationIds.value.filter((id) => id !== locationId)
    : [...selectedLocationIds.value, locationId]
}
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
