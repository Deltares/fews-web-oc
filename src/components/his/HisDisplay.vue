<template>
  <div class="his-container">
    <div class="his-data-selection">
      <HisDataSelection
        v-model:selectedLocationIds="selectedLocationIds"
        v-model:selectedParameters="selectedParameters"
        :locations="locations"
        :parameters="parameters"
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
      <HisCharts :display-config="displayConfig" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HisDataSelection from '@/components/his/HisDataSelection.vue'
import HisMap from '@/components/his/HisMap.vue'
import HisCharts from '@/components/his/HisCharts.vue'
import LocationsLayer from '../wms/LocationsLayer.vue'
import type {
  filterActionsFilter,
  TopologyNode,
} from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue'
import { useFilterLocations } from '@/services/useFilterLocations'
import { configManager } from '@/services/application-config'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { useTimeSeriesHeaders } from '@/services/useTimeSeries'
import { useDisplayConfigFilter, UseDisplayConfigOptions } from '@/services/useDisplayConfig'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filterId = computed(() => props.topologyNode?.filterIds?.[0])
const { locations, geojson } = useFilterLocations(baseUrl, () =>
  filterId.value ? [filterId.value] : [],
)
const { timeSeriesHeaders } = useTimeSeriesHeaders(baseUrl, filterId)

const selectedLocationIds = ref<string[]>([])
const selectedParameters = ref<string[]>([])

const parameters = computed(() => {
  const parameterQualifiersHeaders = timeSeriesHeaders.value.map(
    ({ parameterId, qualifierId }) => ({ parameterId, qualifierId }),
  )
  const uniqueHeaders = parameterQualifiersHeaders.filter(
    (value, index, self) =>
      index ===
      self.findIndex(
        (t) =>
          t.parameterId === value.parameterId &&
          JSON.stringify(t.qualifierId) === JSON.stringify(value.qualifierId),
      ),
  )
  return uniqueHeaders
})

const filter = computed(() => {
  if (!filterId.value) return
  const parameterIds = selectedParameters.value.map((id) => id.split('$')[0])
  const qualifierIds = selectedParameters.value.flatMap((id) =>
    id.split('$')[1].split(','),
  )
  const _fitler: filterActionsFilter & UseDisplayConfigOptions = {
    filterId: filterId.value,
    locationIds: selectedLocationIds.value.join(','),
    parameterIds: parameterIds.join(','),
    convertDatum: true,
    useDisplayUnits: true,
  }
  return _fitler
})

// Backwards 2 weeks forwards 1 week
const { displayConfig } = useDisplayConfigFilter(
  baseUrl,
  filter,
  () => {
    return new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  () => {
    return new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
  },
)

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
