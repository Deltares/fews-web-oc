<template>
  <MapComponent>
    <AnimatedRasterLayer
      v-if="layerKind === LayerKind.Static && showLayer"
      :layer="layerOptions"
      @doubleclick="onCoordinateClick"
    />
    <AnimatedStreamlineRasterLayer
      v-if="layerKind === LayerKind.Streamline && showLayer"
      :layerOptions="layerOptions"
      :streamlineOptions="layerCapabilities?.animatedVectors"
      @doubleclick="onCoordinateClick"
    />
    <div class="colourbar-container" v-if="currentColourScale">
      <ColourBar
        :colourMap="currentColourScale.colourMap"
        :title="currentColourScale.title"
        v-model:range="currentColourScale.range"
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
    <SelectedCoordinateLayer :geoJson="selectedCoordinateGeoJson" />
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
        :colourScales="currentColourScales"
        :completelyMissing="props.layerCapabilities?.completelyMissing ?? false"
        :firstValueTime="
          new Date(props.layerCapabilities?.firstValueTime ?? '')
        "
        :lastValueTime="new Date(props.layerCapabilities?.lastValueTime ?? '')"
        :colorScaleRange="currentColourScale?.range"
        :canUseStreamlines="canUseStreamlines"
        @color-scale-range-change="updateColorScaleRange"
        v-model:color-scale-index="colourScaleIdIndex"
        v-model:layer-kind="layerKind"
        v-model:show-layer="showLayer"
      />
    </v-chip-group>
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
import AnimatedStreamlineRasterLayer from '@/components/wms/AnimatedStreamlineRasterLayer.vue'

import { ref, computed, onBeforeMount, reactive, watch } from 'vue'
import {
  convertBoundingBoxToLngLatBounds,
  fetchWmsLegend,
  useWmsLegend,
} from '@/services/useWms'
import ColourBar from '@/components/wms/ColourBar.vue'
import AnimatedRasterLayer, {
  AnimatedRasterLayerOptions,
} from '@/components/wms/AnimatedRasterLayer.vue'
import LocationsLayerComponent from '@/components/wms/LocationsLayerComponent.vue'
import SelectedCoordinateLayer from '@/components/wms/SelectedCoordinateLayer.vue'
import InformationPanel from '../wms/InformationPanel.vue'
import ElevationSlider from '@/components/wms/ElevationSlider.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { DateController } from '@/lib/TimeControl/DateController.ts'
import debounce from 'lodash-es/debounce'
import { useUserSettingsStore } from '@/stores/userSettings'
import type { MapLayerMouseEvent, MapLayerTouchEvent } from 'maplibre-gl'
import { configManager } from '@/services/application-config'
import type {
  GetLegendGraphicResponse,
  Layer,
} from '@deltares/fews-wms-requests'
import { LayerKind } from '@/lib/streamlines'
import { Style } from '@deltares/fews-wms-requests'
import { ColourMap } from '@deltares/fews-web-oc-charts'
import { pointToGeoJson } from '@/lib/topology/coordinates'

interface ElevationWithUnitSymbol {
  units?: string
  lowerValue?: number
  upperValue?: number
  unitSymbol: string
}

interface Range {
  min: number
  max: number
}

export interface StyleColourMap {
  style: Style
  colourMap: ColourMap | undefined
  title: string
  range?: Range
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
const layerOptions = ref<AnimatedRasterLayerOptions>()
const forecastTime = ref<Date>()
let debouncedSetLayerOptions!: () => void

const legendLayerName = ref(props.layerName)
const settings = useUserSettingsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const showLayer = ref<boolean>(true)
const layerKind = ref(LayerKind.Static)

export interface ColourScale {
  title: string
  style: Style
  range: Range
  colourMap: ColourMap
}

const currentColourScaleIds = ref<string[]>([])
const colourScaleIdIndex = ref<number>(0)
const currentColourScaleId = computed(() => {
  return currentColourScaleIds.value[colourScaleIdIndex.value]
})
const colourScales: Record<string, ColourScale> = reactive({})
const currentColourScale = computed(() => {
  if (!currentColourScaleId.value) return
  return colourScales[currentColourScaleId.value]
})
function updateColorScaleRange(range: Range) {
  if (!currentColourScale.value) return
  currentColourScale.value.range = range
}
const currentColourScales = computed(() =>
  currentColourScaleIds.value.map((id) => colourScales[id]),
)

watch(
  () => props.layerCapabilities?.styles,
  () => {
    const styles = props.layerCapabilities?.styles
    if (styles === undefined) return

    legendLayerName.value = props.layerName
    currentColourScaleIds.value = styles.map(styleToId)
    colourScaleIdIndex.value = 0

    styles.forEach(async (style) => {
      const styleId = styleToId(style)

      if (!(styleId in colourScales)) {
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
        })
        colourScales[styleId] = newColourScale

        const newLegendGraphic = useWmsLegend(
          baseUrl,
          legendLayerName,
          () => settings.useDisplayUnits,
          () => rangeToString(newColourScale.range),
          style,
        )

        watch(newLegendGraphic, () => {
          if (newLegendGraphic.value?.legend === undefined) return
          colourScales[styleId].colourMap = newLegendGraphic.value.legend
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
  () => currentColourScale.value?.range,
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
    }
    layerOptions.value.elevation = currentElevation.value
    layerOptions.value.colorScaleRange = currentColourScale.value
      ? rangeToString(currentColourScale.value.range)
      : undefined
    layerOptions.value.style = currentColourScale.value?.style.name
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
