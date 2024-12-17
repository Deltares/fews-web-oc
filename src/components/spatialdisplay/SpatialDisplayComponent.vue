<template>
  <MapComponent :bounds="bounds">
    <AnimatedRasterLayer
      v-if="layerKind === LayerKind.Static && showLayer && layerOptions"
      v-model:isLoading="isLoading"
      :layer="layerOptions"
      @doubleclick="onCoordinateClick"
    />
    <AnimatedStreamlineRasterLayer
      v-if="layerKind === LayerKind.Streamline && showLayer && layerOptions"
      v-model:isLoading="isLoading"
      :layerOptions="layerOptions"
      :streamlineOptions="layerCapabilities?.animatedVectors"
      @doubleclick="onCoordinateClick"
    />
    <div class="colourbar-container" v-if="currentColourScale">
      <ColourLegend
        v-if="!currentColourScale.useGradients"
        :colourMap="currentColourScale.colourMap"
        :title="currentColourScale.title"
      />
      <ColourBar
        v-else
        :colourMap="currentColourScale.colourMap"
        :title="currentColourScale.title"
        :useGradients="currentColourScale.useGradients"
        v-model:range="currentColourScale.range"
      />
    </div>
    <SelectedCoordinateLayer
      :coordinate="selectedCoordinate"
      @coordinate-moved="onCoordinateMoved"
    />
    <LocationsLayer
      v-if="showLocationsLayer && hasLocations"
      :locationsGeoJson="geojson"
      :selectedLocationId="props.locationId"
      @click="onLocationClick"
    />
    <CoordinateSelectorLayer
      v-if="workflowsStore.isSelectingCoordinate"
      v-model:coordinate="workflowsStore.coordinate"
    />
  </MapComponent>
  <div class="mapcomponent__controls-container">
    <v-chip-group class="control-group" selected-class="no-class">
      <BoundingBoxControl
        v-model:active="workflowsStore.isDrawingBoundingBox"
        v-model:boundingBox="workflowsStore.boundingBox"
        @finish="workflowsStore.showDialog = true"
        v-if="workflowsStore.isDrawingBoundingBox"
      />
      <CoordinateSelectorControl
        v-if="workflowsStore.isSelectingCoordinate"
        v-model:active="workflowsStore.isSelectingCoordinate"
        @finish="workflowsStore.showDialog = true"
        :coordinate="workflowsStore.coordinate"
      />
      <template v-else>
        <InformationPanel
          v-if="layerOptions"
          :layerTitle="props.layerCapabilities?.title"
          :isLoading="isLoading"
          :currentTime="currentTime"
          :forecastTime="forecastTime"
          :completelyMissing="
            props.layerCapabilities?.completelyMissing ?? false
          "
          :firstValueTime="
            new Date(props.layerCapabilities?.firstValueTime ?? '')
          "
          :lastValueTime="
            new Date(props.layerCapabilities?.lastValueTime ?? '')
          "
          :canUseStreamlines="canUseStreamlines"
          v-model:layer-kind="layerKind"
          v-model:show-layer="showLayer"
          :currentColourScaleIds="currentColourScaleIds"
          @update:current-colour-scale="currentColourScale = $event"
        />
        <LocationsSearchControl
          v-if="showLocationSearchControl"
          v-model:showLocations="showLocationsLayer"
          width="50vw"
          max-width="250"
          :locations="locations"
          :selectedLocationId="props.locationId"
          @changeLocationId="onLocationChange"
        />
        <OverlayControl
          :settings="settings"
          v-model:selectedOverlays="selectedOverlays"
        />
      </template>
    </v-chip-group>
  </div>
  <ElevationSlider
    v-if="layerHasElevation"
    v-model="currentElevation"
    :key="layerOptions?.name"
    :min-value="minElevation"
    :max-value="maxElevation"
    :ticks="elevationTicks"
    :unit="elevationUnit"
  />
  <DateTimeSlider
    v-if="times && times.length > 0"
    v-model:selectedDate="currentTime"
    :dates="times"
    @update:doFollowNow="setCurrentTime"
    @update:selectedDate="updateTime"
    class="spatial-display__slider"
    :hide-speed-controls="mobile"
  >
    <template #below-track>
      <DateTimeSliderValues
        :values="maxValuesTimeSeries ?? []"
        :colour-scale="currentColourScale ?? null"
        height="6px"
        class="mb-1"
        style="margin-top: -7px"
      />
    </template>
  </DateTimeSlider>
</template>

<script setup lang="ts">
import DateTimeSliderValues from '@/components/general/DateTimeSliderValues.vue'
import MapComponent from '@/components/map/MapComponent.vue'
import AnimatedStreamlineRasterLayer from '@/components/wms/AnimatedStreamlineRasterLayer.vue'

import { ref, computed, onBeforeMount, watch, watchEffect } from 'vue'
import { convertBoundingBoxToLngLatBounds } from '@/services/useWms'
import ColourBar from '@/components/wms/ColourBar.vue'
import AnimatedRasterLayer, {
  AnimatedRasterLayerOptions,
} from '@/components/wms/AnimatedRasterLayer.vue'
import LocationsSearchControl from '@/components/wms/LocationsSearchControl.vue'
import LocationsLayer from '@/components/wms/LocationsLayer.vue'
import SelectedCoordinateLayer from '@/components/wms/SelectedCoordinateLayer.vue'
import InformationPanel from '@/components/wms/InformationPanel.vue'
import OverlayControl from '@/components/wms/OverlayControl.vue'
import ElevationSlider from '@/components/wms/ElevationSlider.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import BoundingBoxControl from '@/components/map/BoundingBoxControl.vue'
import { DateController } from '@/lib/TimeControl/DateController.ts'
import debounce from 'lodash-es/debounce'
import { useUserSettingsStore } from '@/stores/userSettings'
import {
  LngLat,
  type LngLatBounds,
  type MapLayerMouseEvent,
  type MapLayerTouchEvent,
} from 'maplibre-gl'
import type { Layer, Style } from '@deltares/fews-wms-requests'
import type { Location } from '@deltares/fews-pi-requests'
import { LayerKind } from '@/lib/streamlines'
import { ColourScale, useColourScalesStore } from '@/stores/colourScales'
import { useDisplay } from 'vuetify'
import ColourLegend from '@/components/wms/ColourLegend.vue'
import { rangeToString, styleToId } from '@/lib/legend'
import { useWorkflowsStore } from '@/stores/workflows'
import { TimeSeriesData } from '@/lib/timeseries/types/SeriesData'
import CoordinateSelectorLayer from '@/components/wms/CoordinateSelectorLayer.vue'
import CoordinateSelectorControl from '@/components/map/CoordinateSelectorControl.vue'
import { FeatureCollection, Geometry } from 'geojson'
import type { MapSettings, OverlayLocation } from '@/lib/topology/componentSettings'

interface ElevationWithUnitSymbol {
  units?: string
  lowerValue?: number
  upperValue?: number
  unitSymbol: string
}

interface Props {
  layerName?: string
  times?: Date[]
  layerCapabilities?: Layer
  elevation?: number
  locations?: Location[]
  geojson: FeatureCollection<Geometry, Location>
  locationId?: string
  latitude?: string
  longitude?: string
  currentTime?: Date
  maxValuesTimeSeries?: TimeSeriesData[]
  settings?: MapSettings
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  filterIds: () => [],
})

const emit = defineEmits([
  'changeLocationId',
  'coordinateClick',
  'update:elevation',
  'update:currentTime',
])

const { mobile } = useDisplay()

onBeforeMount(() => {
  debouncedSetLayerOptions = debounce(setLayerOptions, 240, {
    leading: true,
    trailing: true,
  })
})

const dateController = new DateController([])

const currentElevation = ref<number>(0)
const minElevation = ref<number>(-Infinity)
const maxElevation = ref<number>(Infinity)
const elevationTicks = ref<number[]>()
const elevationUnit = ref('')

const currentTime = ref<Date>(new Date())
const layerOptions = ref<AnimatedRasterLayerOptions>()
const forecastTime = ref<Date>()
const isLoading = ref(false)
let debouncedSetLayerOptions!: () => void

const legendLayerStyles = ref<Style[]>()
const userSettings = useUserSettingsStore()

const showLayer = ref<boolean>(true)
const layerKind = ref(LayerKind.Static)

const colourScalesStore = useColourScalesStore()
const currentColourScale = ref<ColourScale>()
const currentColourScaleIds = ref<string[]>([])

const workflowsStore = useWorkflowsStore()
const userSettingsStore = useUserSettingsStore()

const showLocationsLayer = ref<boolean>(true)

// Set the start and end time for the workflow based on the WMS layer capabilities.
watchEffect(() => {
  workflowsStore.startTime = props.layerCapabilities?.firstValueTime ?? ''
  workflowsStore.endTime = props.layerCapabilities?.lastValueTime ?? ''
})

watch(
  legendLayerStyles,
  (styles) => {
    if (styles === undefined) {
      currentColourScaleIds.value = []
      return
    }

    currentColourScaleIds.value = styles.map(styleToId)

    addScalesForStyles(styles)
  },
  { immediate: true },
)

watch(
  () => userSettings.useDisplayUnits,
  () => {
    colourScalesStore.clearScales()
    addScalesForStyles(legendLayerStyles.value ?? [])
  },
)

function addScalesForStyles(styles: Style[]): void {
  styles.forEach((style) => {
    colourScalesStore.addScale(
      style,
      props.layerName,
      () => props.layerCapabilities?.title,
      userSettings.useDisplayUnits,
      () => props.layerCapabilities?.styles ?? [],
    )
  })
}

const selectedCoordinate = computed(() => {
  if (props.latitude === undefined || props.longitude === undefined) return

  return new LngLat(+props.longitude, +props.latitude)
})

const hasLocations = computed(() => {
  return props.locations?.length
})

function onLocationClick(event: MapLayerMouseEvent | MapLayerTouchEvent): void {
  if (!event.features) return
  const locationId: string | undefined =
    event.features[0].properties?.locationId
  if (locationId) onLocationChange(locationId)
}

function onLocationChange(locationId: string | null): void {
  emit('changeLocationId', locationId)
}

const canUseStreamlines = computed(
  () => props.layerCapabilities?.animatedVectors !== undefined,
)

// When the layer changes, select a default layer type (static or animated).
watch(
  () => props.layerCapabilities,
  () => (layerKind.value = getDefaultLayerKind()),
  { immediate: true },
)
function getDefaultLayerKind() {
  // If we cannot use streamlines, always use static.
  if (!canUseStreamlines.value) {
    return LayerKind.Static
  }
  if (userSettingsStore.preferredLayerKind !== null) {
    // If we have a preference, use that.
    return userSettingsStore.preferredLayerKind
  }
  // Otherwise, use streamlines.
  return LayerKind.Streamline
}

const offsetBottomControls = computed(() => {
  return props.times?.length ? '60px' : '0px'
})

const layerHasElevation = computed(() => {
  return props.layerCapabilities?.elevation !== undefined
})

const showLocationSearchControl = computed(() => {
  return !(props.settings?.locationSearchEnabled === false)
})

const selectedOverlays = ref<OverlayLocation[]>([])

watch(
  () => props.layerCapabilities,
  (layer) => {
    const _forecastTime = layer?.keywordList?.[0].forecastTime
    forecastTime.value = _forecastTime ? new Date(_forecastTime) : undefined

    legendLayerStyles.value = props.layerCapabilities?.styles
    if (legendLayerStyles.value === undefined && props.layerName) {
      legendLayerStyles.value = [
        {
          title: props.layerName,
        },
      ]
    }

    if (layer?.elevation) {
      const max = layer.elevation.upperValue ?? 0
      const min = layer.elevation.lowerValue ?? 0
      if (currentElevation.value > max) currentElevation.value = max
      if (currentElevation.value < min) currentElevation.value = min
      minElevation.value = min
      maxElevation.value = max
      elevationUnit.value =
        (layer.elevation as ElevationWithUnitSymbol).unitSymbol ?? ''
      elevationTicks.value = layer.elevation.irregularTicks
    }
  },
  { immediate: true, deep: true },
)

watch(currentElevation, () => {
  setLayerOptions()
  emit('update:elevation', currentElevation.value)
})

watch(
  [() => currentColourScale.value?.range, () => userSettings.useDisplayUnits],
  () => {
    setLayerOptions()
  },
  { deep: true },
)

watch(
  () => props.times,
  () => {
    if (props.times) {
      dateController.dates = props.times
      dateController.selectDate(currentTime.value)
      currentTime.value = dateController.currentTime
    }
    setLayerOptions()
  },
  { immediate: true, deep: true },
)

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

watch(currentTime, () => {
  emit('update:currentTime', currentTime.value)
})

function setLayerOptions(): void {
  if (props.layerName) {
    layerOptions.value = {
      name: props.layerName,
      time: currentTime.value,
      bbox: props.layerCapabilities?.boundingBox
        ? convertBoundingBoxToLngLatBounds(props.layerCapabilities.boundingBox)
        : undefined,
      elevation: currentElevation.value,
      colorScaleRange: currentColourScale.value?.range
        ? rangeToString(currentColourScale.value?.range)
        : undefined,
      style: currentColourScale.value?.style.name,
      useDisplayUnits: userSettings.useDisplayUnits,
    }
  } else {
    layerOptions.value = undefined
  }
}

const bounds = ref<LngLatBounds>()
watch(
  () => layerOptions.value?.bbox,
  (layerBounds) => {
    if (!layerBounds) return

    const boundsChanged = bounds.value?.toString() !== layerBounds.toString()
    if (boundsChanged) {
      bounds.value = layerBounds
    }
  },
  { immediate: true },
)

function onCoordinateClick(
  event: MapLayerMouseEvent | MapLayerTouchEvent,
): void {
  if (workflowsStore.isSelectingCoordinate) {
    workflowsStore.coordinate = event.lngLat
    return
  }

  emit(
    'coordinateClick',
    +event.lngLat.lat.toFixed(3),
    +event.lngLat.lng.toFixed(3),
  )
}

function onCoordinateMoved(lat: number, lng: number): void {
  emit('coordinateClick', +lat.toFixed(3), +lng.toFixed(3))
}
</script>

<style scoped>
.colourbar-container {
  position: absolute;
  z-index: 1000;
  bottom: 65px;
  left: 5px;
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

.mapcomponent__controls-container {
  position: absolute;
  max-width: 100%;
  z-index: 3;
}

.mapcomponent__controls-container :deep(.v-slide-group__content) {
  padding: 0 8px;
}
</style>

<style>
.maplibregl-ctrl-bottom-right,
.maplibregl-ctrl-bottom-left {
  bottom: v-bind('offsetBottomControls') !important;
}
</style>
