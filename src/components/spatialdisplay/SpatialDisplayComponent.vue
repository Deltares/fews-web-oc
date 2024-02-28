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
    <div class="colourbar-container" v-if="legend">
      <ColourBar
        :colourMap="legend"
        :title="legendTitle"
        v-model:range="colorScaleRange"
        v-if="colorScaleRange"
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
        :colourScales="colourScales"
        :completelyMissing="props.layerCapabilities?.completelyMissing ?? false"
        :firstValueTime="
          new Date(props.layerCapabilities?.firstValueTime ?? '')
        "
        :lastValueTime="new Date(props.layerCapabilities?.lastValueTime ?? '')"
        :colorScaleRange="colorScaleRange"
        :canUseStreamlines="canUseStreamlines"
        @color-scale-range-change="updateColorScaleRange"
        v-model:color-scale-index="colorScaleIndex"
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

import { ref, computed, onBeforeMount, watch } from 'vue'
import {
  convertBoundingBoxToLngLatBounds,
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
import type { Layer } from '@deltares/fews-wms-requests'
import { LayerKind } from '@/lib/streamlines'
import { Style } from '@deltares/fews-wms-requests'
import { ColourMap } from '@deltares/fews-web-oc-charts'

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
  initialRange?: Range
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
const colorScaleIndex = ref<number>(0)

const colorScaleRange = ref<Range>()
const colorScaleRangeString = computed(() => {
  if (!colorScaleRange.value) return
  if (colorScaleRange.value.min === undefined) return
  if (colorScaleRange.value.max === undefined) return
  return `${colorScaleRange.value.min},${colorScaleRange.value.max}`
})
const updateColorScaleRange = (range: Range) => {
  colorScaleRange.value = range
}

const legendLayerName = ref(props.layerName)
const settings = useUserSettingsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const showLayer = ref<boolean>(true)
const layerKind = ref(LayerKind.Static)

const colourScales = ref<StyleColourMap[]>()
const legend = ref<ColourMap>()
const usedStyle = ref<Style>()
const legendTitle = ref<string>()

watch(
  () => props.layerCapabilities?.styles,
  () => {
    const styles = props.layerCapabilities?.styles
    if (styles === undefined) return

    legendLayerName.value = props.layerName

    colourScales.value = styles.map((style, i) => {
      const legendGraphic = useWmsLegend(
        baseUrl,
        legendLayerName,
        () => settings.useDisplayUnits,
        () => {
          if (colorScaleIndex.value === i) {
            return colorScaleRangeString.value
          }
        },
        style,
      )

      const colourScale: StyleColourMap = {
        style: style,
        colourMap: legendGraphic.value?.legend,
        title: getLegendTitle(legendGraphic),
      }

      watch(legendGraphic, (newLegend, oldLegend) => {
        colourScale.colourMap = newLegend?.legend
        colourScale.title = getLegendTitle(legendGraphic)
        const isInitialGetLegend = oldLegend === undefined
        if (isInitialGetLegend && newLegend?.legend) {
          colourScale.initialRange = legendToRange(newLegend.legend)
        }

        refreshCurrentColourScale()

        if (legend.value !== undefined) {
          colorScaleRange.value = legendToRange(legend.value)
        }
      })

      watch(colorScaleIndex, () => {
        refreshCurrentColourScale()

        if (colorScaleIndex.value === i) {
          colorScaleRange.value = colourScale.initialRange
        }
      })

      return colourScale
    })

    colorScaleIndex.value = 0
  },
  { immediate: true },
)

function legendToRange(legend: ColourMap): Range {
  return {
    min: legend[0].lowerValue,
    max: legend[legend.length - 1].lowerValue,
  }
}

function refreshCurrentColourScale() {
  const currentColourScale = colourScales.value?.[colorScaleIndex.value]
  legend.value = currentColourScale?.colourMap
  usedStyle.value = currentColourScale?.style
  legendTitle.value = currentColourScale?.title
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
    colorScaleRange.value = undefined
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

watch(colorScaleRange, () => {
  setLayerOptions()
})

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
    layerOptions.value.colorScaleRange = colorScaleRangeString.value
    layerOptions.value.style = usedStyle.value?.name
  } else {
    layerOptions.value = undefined
  }
}

function getLegendTitle(
  legendGraphic: ReturnType<typeof useWmsLegend>,
): string {
  if (!props.layerCapabilities) return ''
  const unitString = legendGraphic.value?.unit
    ? ` [${legendGraphic.value?.unit}]`
    : ''
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
