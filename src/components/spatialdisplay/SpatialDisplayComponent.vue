<template>
  <MapComponent>
    <AnimatedMapboxLayer
      v-if="layerKind === LayerKind.Static && showLayer"
      :layer="layerOptions"
      @doubleclick="onCoordinateClick"
    />
    <AnimatedStreamlineMapboxLayer
      v-if="layerKind === LayerKind.Streamline && showLayer"
      :layerOptions="layerOptions"
      :streamlineOptions="layerCapabilities?.animatedVectors"
      @doubleclick="onCoordinateClick"
    />
    <div class="colourbar-container" v-if="colourScalesStore.currentScale">
      <ColourBar
        :colourMap="colourScalesStore.currentScale.colourMap"
        :title="colourScalesStore.currentScale.title"
        v-model:range="colourScalesStore.currentScale.range"
      />
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
    <v-chip-group class="control-container">
      <LocationsLayerComponent
        v-if="filterIds"
        :filterIds="filterIds"
        :locationId="props.locationId"
        @changeLocationId="onLocationChange"
      />
      <InformationPanel
        :layerTitle="props.layerCapabilities?.title"
        :currentTime="currentTime"
        :forecastTime="forecastTime"
        :completelyMissing="props.layerCapabilities?.completelyMissing ?? false"
        :firstValueTime="
          new Date(props.layerCapabilities?.firstValueTime ?? '')
        "
        :lastValueTime="new Date(props.layerCapabilities?.lastValueTime ?? '')"
        :canUseStreamlines="canUseStreamlines"
        v-model:layer-kind="layerKind"
        v-model:show-layer="showLayer"
      />
    </v-chip-group>
    <SelectedCoordinateLayer
      :longitude="props.longitude"
      :latitude="props.latitude"
    />
  </MapComponent>
  <DateTimeSlider
    v-if="times && times.length > 0"
    v-model:selectedDate="currentTime"
    :dates="times"
    @update:doFollowNow="setCurrentTime"
    @update:selectedDate="updateTime"
    class="spatial-display__slider"
  />
</template>

<script setup lang="ts">
import MapComponent from '@/components/map/MapComponent.vue'
import AnimatedStreamlineMapboxLayer from '@/components/wms/AnimatedStreamlineMapboxLayer.vue'

import { ref, computed, onBeforeMount, watch, reactive } from 'vue'
import {
  convertBoundingBoxToLngLatBounds,
  fetchWmsLegend,
  useWmsLegend,
} from '@/services/useWms'
import ColourBar from '@/components/wms/ColourBar.vue'
import AnimatedMapboxLayer, {
  MapboxLayerOptions,
} from '@/components/wms/AnimatedMapboxLayer.vue'
import LocationsLayerComponent from '@/components/wms/LocationsLayerComponent.vue'
import InformationPanel from '../wms/InformationPanel.vue'
import SelectedCoordinateLayer from '@/components/wms/SelectedCoordinateLayer.vue'
import ElevationSlider from '@/components/wms/ElevationSlider.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { DateController } from '@/lib/TimeControl/DateController.ts'
import debounce from 'lodash-es/debounce'
import { useUserSettingsStore } from '@/stores/userSettings'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'mapbox-gl'
import { configManager } from '@/services/application-config'
import type {
  GetLegendGraphicResponse,
  Layer,
} from '@deltares/fews-wms-requests'
import { LayerKind } from '@/lib/streamlines'
import { Style } from '@deltares/fews-wms-requests'
import { ColourMap } from '@deltares/fews-web-oc-charts'
import { Range, useColourScalesStore } from '@/stores/colourScales'

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
  filterIds?: string[]
  latitude?: string
  longitude?: string
  currentTime?: Date
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
})

const emit = defineEmits([
  'changeLocationId',
  'coordinateClick',
  'update:elevation',
  'update:currentTime',
])

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
const forecastTime = ref<Date>()
const layerOptions = ref<MapboxLayerOptions>()
let debouncedSetLayerOptions!: () => void

const legendLayerName = ref(props.layerName)
const settings = useUserSettingsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const showLayer = ref<boolean>(true)
const layerKind = ref(LayerKind.Static)

const colourScalesStore = useColourScalesStore()

watch(
  () => props.layerCapabilities?.styles,
  () => {
    const styles = props.layerCapabilities?.styles
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
          title: getLegendTitle(initialLegendGraphic),
          style: style,
          colourMap: legend,
          range: legendToRange(legend),
          initialRange: legendToRange(legend),
        })
        colourScalesStore.scales[styleId] = newColourScale

        const newLegendGraphic = useWmsLegend(
          baseUrl,
          legendLayerName,
          () => settings.useDisplayUnits,
          () => rangeToString(newColourScale.range),
          style,
        )

        watch(newLegendGraphic, () => {
          if (newLegendGraphic.value?.legend === undefined) return
          colourScalesStore.scales[styleId].colourMap =
            newLegendGraphic.value.legend
        })
      }
    })
  },
  { immediate: true },
)

function styleToId(style: Style) {
  return style.name ?? style.title
}

function rangeToString(range: Range): string {
  return `${range.min},${range.max}`
}

function legendToRange(legend: ColourMap): Range {
  return {
    min: legend[0].lowerValue,
    max: legend[legend.length - 1].lowerValue,
  }
}

const canUseStreamlines = computed(
  () => props.layerCapabilities?.animatedVectors !== undefined,
)
watch(canUseStreamlines, (canUse) => {
  // Fall back to static layer if streamlines are not available.
  if (!canUse) layerKind.value = LayerKind.Static
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
  () => colourScalesStore.currentScale?.range,
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
    }
  } else {
    layerOptions.value = undefined
  }
}

function getLegendTitle(legendGraphic: GetLegendGraphicResponse): string {
  if (!props.layerCapabilities) return ''
  const unitString = legendGraphic.unit ? ` [${legendGraphic.unit}]` : ''
  return `${props.layerCapabilities.title}${unitString}`
}

function onLocationChange(locationId: string | null): void {
  emit('changeLocationId', locationId)
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

.control-container {
  position: absolute;
  top: 8px;
  left: 10px;
}
</style>
