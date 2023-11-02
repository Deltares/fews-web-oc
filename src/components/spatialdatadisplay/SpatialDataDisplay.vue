<template>
  <div class="d-flex flex-column flex-grow-1 flex-shrink-1 h-100">
    <MapComponent>
      <AnimatedMapboxLayer :layer="layerOptions" />
      <MapboxLayer
        :key="locationsLayerId"
        id="locations-layer"
        :options="locationsLayerOptions"
      />
    </MapComponent>
    <div class="control-container">
      <LocationsLayerSearchControl
        :showLocations.sync="showLocationsLayer"
        :locationId.sync="selectedLocationId"
        :locationsGeoJson="locationsGeoJson"
      />
    </div>
    <div class="colourbar">
      <ColourBar :colourMap="legend" />
    </div>
    <DateTimeSlider
      v-model:selectedDate="currentTime"
      :dates="times ?? []"
      @update:doFollowNow="setCurrentTime"
      @update:selectedDate="updateTime"
    />
  </div>
</template>

<script setup lang="ts">
import MapComponent from '@/components/map/MapComponent.vue'
import LocationsLayerSearchControl from './LocationsLayerSearchControl.vue'
import { ref, computed, onBeforeMount, watch, watchEffect } from 'vue'
import {
  convertBoundingBoxToLngLatBounds,
  useWmsLayer,
} from '@/services/useWms'
import { MapboxLayer } from '@studiometa/vue-mapbox-gl'
import { configManager } from '@/services/application-config'
import ColourBar from '@/components/wms/ColourBar.vue'
import AnimatedMapboxLayer, {
  MapboxLayerOptions,
} from '@/components/wms/AnimatedMapboxLayer.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { DateController } from '@/lib/TimeControl/DateController.ts'
import debounce from 'lodash-es/debounce'
import {
  PiWebserviceProvider,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { fetchLocationsAsGeoJson } from '@/lib/topology'
import { Location } from '@deltares/fews-pi-requests'
import { FeatureCollection, Geometry } from 'geojson'
import useLocationsLayer from '@/services/useLocationsLayer'

interface Props {
  node?: TopologyNode
}

const props = defineProps<Props>()

onBeforeMount(() => {
  debouncedSetLayerOptions = debounce(setLayerOptions, 500, {
    leading: true,
    trailing: true,
  })
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const piProvider = new PiWebserviceProvider(baseUrl)
const dateController = new DateController([])

const { selectedLayer, legendGraphic, times } = useWmsLayer(
  baseUrl,
  () => props.node?.id ?? '',
)

const currentTime = ref<Date>(new Date())
const layerOptions = ref<MapboxLayerOptions>()
let debouncedSetLayerOptions!: () => void

const legend = computed(() => {
  return legendGraphic.value?.legend
})

const showLocationsLayer = ref<boolean>(true)
const selectedLocationId = ref<string>('')

const locationsGeoJson = ref<FeatureCollection<Geometry, Location>>({
  type: 'FeatureCollection',
  features: [],
})
const { locationsLayerOptions } = useLocationsLayer(locationsGeoJson)

const locationsLayerId = ref<string>('')

watchEffect(async () => {
  if (!props.node?.filterIds) return
  locationsGeoJson.value = await fetchLocationsAsGeoJson(
    piProvider,
    props.node.filterIds,
  )
})

watch(selectedLayer, () => {
  locationsLayerId.value = `locations-layer-${selectedLayer.value?.name ?? ''}`
})

watch(times, () => {
  const timesValue = times.value
  if (timesValue) {
    times.value = timesValue
    dateController.dates = timesValue
    dateController.selectDate(currentTime.value)
    currentTime.value = dateController.currentTime
  }
  setLayerOptions()
})

function setCurrentTime(enabled: boolean): void {
  if (enabled) {
    dateController.selectDate(new Date())
    currentTime.value = dateController.currentTime
    setLayerOptions()
  }
}

function setLayerOptions(): void {
  if (props.node?.id) {
    layerOptions.value = {
      name: props.node.id,
      time: currentTime.value,
      bbox: selectedLayer.value?.boundingBox
        ? convertBoundingBoxToLngLatBounds(selectedLayer.value.boundingBox)
        : undefined,
    }
  }
}

function updateTime(date: Date): void {
  if (dateController.currentTime.getTime() === date.getTime()) return
  dateController.selectDate(date)
  currentTime.value = dateController.currentTime
  debouncedSetLayerOptions()
}
</script>

<style scoped>
.control-container {
  font-size: 0.825em;
  width: 80%;
  z-index: 120;
  position: absolute;
  display: flex;
  padding: 10px 5px;
}

.colourbar {
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  position: absolute;
  bottom: 90px;
}
</style>
