<template>
  <MapComponent>
    <animated-mapbox-layer :layer="layerOptions"> </animated-mapbox-layer>
    <div class="colourbar-container">
      <ColourBar :colourMap="legend" :title="legendTitle" />
    </div>
    <ElevationSlider
      v-if="layerHasElevation"
      v-model="currentElevation"
      :key="layerOptions?.name"
      :min-value="minElevation"
      :max-value="maxElevation"
      :unit="elevationUnit"
    ></ElevationSlider>
    <LocationsLayer
      v-if="filterIds"
      :filterIds="filterIds"
      :locationId="props.locationId"
      @click="onLocationClick"
    />
  </MapComponent>
  <DateTimeSlider
    v-model:selectedDate="currentTime"
    :dates="times ?? []"
    @update:doFollowNow="setCurrentTime"
    @update:selectedDate="updateTime"
    class="spatial-display__slider"
  />
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
import LocationsLayer from '@/components/wms/LocationsLayer.vue'
import ElevationSlider from '@/components/wms/ElevationSlider.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { DateController } from '@/lib/TimeControl/DateController.ts'
import debounce from 'lodash-es/debounce'
import { useUserSettingsStore } from '@/stores/userSettings'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'mapbox-gl'

interface ElevationWithUnitSymbol {
  units?: string
  lowerValue?: number
  upperValue?: number
  unitSymbol: string
}

interface Props {
  layerName?: string
  locationId?: string
  filterIds?: string
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
})

const emit = defineEmits(['location-click'])

onBeforeMount(() => {
  debouncedSetLayerOptions = debounce(setLayerOptions, 500, {
    leading: true,
    trailing: true,
  })
})

const settings = useUserSettingsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const dateController = new DateController([])

const { selectedLayer, legendGraphic, times } = useWmsLayer(
  baseUrl,
  () => props.layerName,
  () => settings.useDisplayUnits,
)

const currentElevation = ref<number>(0)
const minElevation = ref<number>(-Infinity)
const maxElevation = ref<number>(Infinity)
const elevationUnit = ref('')

const currentTime = ref<Date>(new Date())
const layerOptions = ref<MapboxLayerOptions>()
let debouncedSetLayerOptions!: () => void

const legend = computed(() => {
  return legendGraphic.value?.legend
})
const layerHasElevation = computed(() => {
  return selectedLayer.value?.elevation !== undefined
})

watch(
  selectedLayer,
  (layer) => {
    if (layer?.elevation) {
      const max = layer.elevation.upperValue ?? 0
      const min = layer.elevation.lowerValue ?? 0
      if (currentElevation.value > max) currentElevation.value = max
      if (currentElevation.value < min) currentElevation.value = min
      minElevation.value = min
      maxElevation.value = max
      elevationUnit.value =
        (layer.elevation as ElevationWithUnitSymbol).unitSymbol ?? ''
    }
  },
  { immediate: true },
)

watch(currentElevation, () => {
  setLayerOptions()
})

const legendTitle = computed(() => {
  if (!selectedLayer.value) return ''
  const unitString = legendGraphic.value?.unit
    ? ` [${legendGraphic.value?.unit}]`
    : ''
  return `${selectedLayer.value?.title}${unitString}`
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

function updateTime(date: Date): void {
  if (dateController.currentTime.getTime() === date.getTime()) return
  dateController.selectDate(date)
  currentTime.value = dateController.currentTime
  debouncedSetLayerOptions()
}

function setLayerOptions(): void {
  if (props.layerName) {
    layerOptions.value = {
      name: props.layerName,
      time: currentTime.value,
      bbox: selectedLayer.value?.boundingBox
        ? convertBoundingBoxToLngLatBounds(selectedLayer.value.boundingBox)
        : undefined,
    }
    layerOptions.value.elevation = currentElevation.value
  }
}

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  emit('location-click', event)
}
</script>

<style scoped>
.colourbar-container {
  position: absolute;
  pointer-events: none;
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  bottom: 60px;
}

.spatial-display {
  position: relative;
}

.spatial-display__slider {
  position: absolute;
  bottom: 5px;
  left: 5px;
  right: 5px;
  z-index: 1000;
  border-radius: 5px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
