<template>
  <div class="d-flex flex-column flex-grow-1 flex-shrink-1 h-100">
    <MapComponent>
      <animated-mapbox-layer :layer="layerOptions" />
    </MapComponent>
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
import { ref, computed, onBeforeMount, watch } from 'vue'
import {
  convertBoundingBoxToLngLatBounds,
  useWmsLayer,
} from '@/services/useWms'
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
  type Location,
  TopologyNode,
} from '@deltares/fews-pi-requests'
import { fetchLocationsAsGeoJson } from '@/lib/topology'

interface Props {
  node: TopologyNode
}

const props = withDefaults(defineProps<Props>(), {
  node: undefined,
})

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
  () => props.node.id,
)

const currentTime = ref<Date>(new Date())
const layerOptions = ref<MapboxLayerOptions>()
let debouncedSetLayerOptions!: () => void

const legend = computed(() => {
  return legendGraphic.value?.legend
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
  if (props.node.id) {
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
.colourbar {
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  position: absolute;
  bottom: 80px;
}
</style>
