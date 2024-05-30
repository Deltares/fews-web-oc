<template>
  <MapComponent>
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
    <div class="colourbar-container" v-if="colourScalesStore.currentScale">
      <ColourLegend
        v-if="!colourScalesStore.currentScale.useGradients"
        :colourMap="colourScalesStore.currentScale.colourMap"
        :title="colourScalesStore.currentScale.title"
      />
      <ColourBar
        v-else
        :colourMap="colourScalesStore.currentScale.colourMap"
        :title="colourScalesStore.currentScale.title"
        :useGradients="colourScalesStore.currentScale.useGradients"
        v-model:range="colourScalesStore.currentScale.range"
      />
    </div>
    <SelectedCoordinateLayer :geoJson="selectedCoordinateGeoJson" />
    <LocationsLayer
      v-if="showLocationsLayer && hasLocations"
      :locationsGeoJson="geojson"
      :selectedLocationId="props.locationId"
      @click="onLocationClick"
    />
  </MapComponent>
  <div class="mapcomponent__controls-container">
    <v-chip-group class="px-2">
      <BoundingBoxControl
        v-model:active="workflowsStore.isDrawingBoundingBox"
        v-model:boundingBox="workflowsStore.boundingBox"
        @finish="workflowsStore.isDrawingBoundingBox = false"
        v-if="workflowsStore.isDrawingBoundingBox"
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
        />
        <LocationsSearchControl
          v-model:showLocations="showLocationsLayer"
          width="50vw"
          max-width="250"
          :locations="locations"
          :selectedLocationId="props.locationId"
          @changeLocationId="onLocationChange"
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
  />
</template>

<script setup lang="ts">
import MapComponent from '@/components/map/MapComponent.vue'
import AnimatedStreamlineRasterLayer from '@/components/wms/AnimatedStreamlineRasterLayer.vue'

import { ref, computed, onBeforeMount, reactive, watch, watchEffect } from 'vue'
import {
  convertBoundingBoxToLngLatBounds,
  fetchWmsLegend,
  useWmsLegend,
} from '@/services/useWms'
import ColourBar from '@/components/wms/ColourBar.vue'
import AnimatedRasterLayer, {
  AnimatedRasterLayerOptions,
} from '@/components/wms/AnimatedRasterLayer.vue'
import LocationsSearchControl from '@/components/wms/LocationsSearchControl.vue'
import LocationsLayer from '@/components/wms/LocationsLayer.vue'
import SelectedCoordinateLayer from '@/components/wms/SelectedCoordinateLayer.vue'
import InformationPanel from '../wms/InformationPanel.vue'
import ElevationSlider from '@/components/wms/ElevationSlider.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import BoundingBoxControl from '@/components/map/BoundingBoxControl.vue'
import { DateController } from '@/lib/TimeControl/DateController.ts'
import debounce from 'lodash-es/debounce'
import { useUserSettingsStore } from '@/stores/userSettings'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { configManager } from '@/services/application-config'
import type { Layer, Style } from '@deltares/fews-wms-requests'
import { LayerKind } from '@/lib/streamlines'
import { pointToGeoJson } from '@/lib/topology/coordinates'
import { useColourScalesStore } from '@/stores/colourScales'
import { useDisplay } from 'vuetify'
import { useFilterLocations } from '@/services/useFilterLocations'
import ColourLegend from '@/components/wms/ColourLegend.vue'
import {
  getLegendTitle,
  legendToRange,
  rangeToString,
  styleToId,
} from '@/lib/legend'
import { useWorkflowsStore } from '@/stores/workflows'

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
  locationId?: string
  filterIds: string[]
  latitude?: string
  longitude?: string
  currentTime?: Date
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

const legendLayerName = ref(props.layerName)
const legendLayerStyles = ref<Style[]>()
const settings = useUserSettingsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const showLayer = ref<boolean>(true)
const layerKind = ref(LayerKind.Static)

const colourScalesStore = useColourScalesStore()
const workflowsStore = useWorkflowsStore()

const showLocationsLayer = ref<boolean>(true)

const { locations, geojson } = useFilterLocations(
  baseUrl,
  () => props.filterIds,
)

// Set the start and end time for the workflow based on the WMS layer capabilities.
watchEffect(() => {
  workflowsStore.startTime = props.layerCapabilities?.firstValueTime ?? ''
  workflowsStore.endTime = props.layerCapabilities?.lastValueTime ?? ''
})

watch(
  legendLayerStyles,
  () => {
    const styles = legendLayerStyles.value
    if (styles === undefined) {
      colourScalesStore.currentIds = []
      colourScalesStore.currentIndex = 0
      return
    }

    legendLayerName.value = props.layerName
    colourScalesStore.currentIds = styles.map(styleToId)
    colourScalesStore.currentIndex = 0

    styles.forEach(async (style) => {
      const styleId = styleToId(style)

      if (!(styleId in colourScalesStore.scales)) {
        const initialLegendGraphic = await fetchWmsLegend(
          baseUrl,
          legendLayerName.value,
          settings.useDisplayUnits,
          undefined,
          style,
        )

        const legend = initialLegendGraphic.legend
        const newColourScale = reactive({
          title: getLegendTitle(
            props.layerCapabilities?.title ?? '',
            initialLegendGraphic,
          ),
          style: style,
          colourMap: legend,
          range: legendToRange(legend),
          initialRange: legendToRange(legend),
          // @ts-expect-error: remove once fews-wms-requests is updated
          useGradients: !legend.some((entry) => entry.colorSmoothing === false),
        })
        colourScalesStore.scales[styleId] = newColourScale

        const newLegendGraphic = useWmsLegend(
          baseUrl,
          legendLayerName,
          () => settings.useDisplayUnits,
          () => rangeToString(newColourScale.range),
          style,
          () => props.layerCapabilities?.styles ?? [],
        )

        watch(newLegendGraphic, () => {
          if (newLegendGraphic.value?.legend === undefined) return
          colourScalesStore.scales[styleId].title = getLegendTitle(
            props.layerCapabilities?.title ?? '',
            newLegendGraphic.value,
          )
          colourScalesStore.scales[styleId].colourMap =
            newLegendGraphic.value.legend
        })
      }
    })
  },
  { immediate: true },
)

const selectedCoordinateGeoJson = computed(() => {
  if (props.latitude === undefined || props.longitude === undefined) return

  return pointToGeoJson(+props.latitude, +props.longitude)
})

const hasLocations = computed(() => {
  return locations.value?.length
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

watch(canUseStreamlines, (canUse) => {
  // Fall back to static layer if streamlines are not available.
  if (!canUse) layerKind.value = LayerKind.Static
})

const offsetBottomControls = computed(() => {
  return props.times?.length ? '40px' : '0px'
})

const layerHasElevation = computed(() => {
  return props.layerCapabilities?.elevation !== undefined
})

watch(
  () => props.layerCapabilities,
  (layer) => {
    if (layer?.keywordList !== undefined) {
      forecastTime.value =
        new Date(layer?.keywordList[0].forecastTime as string) ?? null
    }
    legendLayerName.value = props.layerName
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
  [() => colourScalesStore.currentScale?.range, () => settings.useDisplayUnits],
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
      colorScaleRange: colourScalesStore.currentScale?.range
        ? rangeToString(colourScalesStore.currentScale?.range)
        : undefined,
      style: colourScalesStore.currentScale?.style.name,
      useDisplayUnits: settings.useDisplayUnits,
    }
  } else {
    layerOptions.value = undefined
  }
}

function onCoordinateClick(
  event: MapLayerMouseEvent | MapLayerTouchEvent,
): void {
  emit('coordinateClick', event)
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
}

:deep(.maplibregl-ctrl-bottom-right),
:deep(.maplibregl-ctrl-bottom-left) {
  bottom: v-bind('offsetBottomControls');
}
</style>
