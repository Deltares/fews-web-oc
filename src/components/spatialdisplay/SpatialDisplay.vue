<template>
  <div
    class="spatial-display d-flex flex-column flex-grow-1 flex-shrink-1 h-100"
  >
    <MapComponent>
      <animated-mapbox-layer :layer="layerOptions"></animated-mapbox-layer>
      <DrawPolygonControl
        v-if="selectBbox"
        v-model="features"
        ref="drawControl"
        default-mode="draw_rectangle"
        :displayControlsDefault="false"
      />
      <div v-if="workflowId" class="workflows-container d-flex flex-row">
        <v-chip class="pl-0 pr-0 justify-center" width="400">
          <v-btn
            icon="mdi-cog-play"
            size="x-small"
            @click="workflowDialog = !workflowDialog"
          ></v-btn>
          <template v-if="selectBbox">
            <span class="ml-5 mr-5" width="400px">
              {{ bboxString }}
            </span>
            <v-btn size="small" rounded="xl" @click="hideMapTool">Apply</v-btn>
          </template>
        </v-chip>
        <v-chip
          class="workflows--running"
          v-if="activeWorkflowIds.length"
          color="success"
          variant="flat"
          size="x-small"
          >{{ activeWorkflowIds.length }}</v-chip
        >
      </div>
      <div class="colourbar-container">
        <ColourBar :colourMap="legend" :title="legendTitle" />
      </div>
      <ElevationSlider
        v-if="layerHasEleveation"
        v-model="currentElevation"
        :key="layerOptions?.name"
        :min-value="minElevation"
        :max-value="maxElevation"
        :unit="elevationUnit"
      ></ElevationSlider>
    </MapComponent>
    <DateTimeSlider
      v-model:selectedDate="currentTime"
      :dates="times ?? []"
      @update:doFollowNow="setCurrentTime"
      @update:selectedDate="updateTime"
      class="spatial-display__slider"
    />
    <v-dialog v-show="!selectBbox" width="500" v-model="workflowDialog">
      <v-card>
        <v-card-title>Workflow</v-card-title>
        <v-container>
          <v-row>
            <v-select
              v-model="currentWorkflowId"
              :items="[workflowId]"
              density="compact"
              variant="solo"
              label="workflow"
            ></v-select>
          </v-row>
          <v-form v-model="formIsValid">
            <v-row>
              <v-col>
                <v-text-field
                  readonly
                  variant="plain"
                  density="compact"
                  v-model="bboxString"
                  label="Bounding box"
                >
                  <template v-slot:append>
                    <v-icon @click="showMapTool">mdi-selection-drag</v-icon>
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-text-field
                  v-model.number="boundingBox[1]"
                  density="compact"
                  variant="plain"
                  type="number"
                  suffix="°N"
                  label="Lattitude min"
                  min="0"
                  :step="lattitudeStepSize"
                  hide-details
                  required
                />
              </v-col>
              <v-col>
                <v-text-field
                  v-model.number="boundingBox[3]"
                  density="compact"
                  variant="plain"
                  type="number"
                  suffix="°N"
                  label="max"
                  min="0"
                  :step="lattitudeStepSize"
                  hide-details
                  required
                />
              </v-col>
              <v-col>
                <v-text-field
                  v-model.number="lattitudeStepSize"
                  density="compact"
                  variant="plain"
                  type="number"
                  suffix="°N"
                  label="Δ"
                  min="0"
                  step="0.1"
                  hide-details
                  required
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-text-field
                  v-model.number="boundingBox[0]"
                  density="compact"
                  variant="plain"
                  type="number"
                  suffix="°E"
                  label="Longitude min"
                  min="0"
                  :step="longitudeStepSize"
                  hide-details
                  required
                />
              </v-col>
              <v-col>
                <v-text-field
                  v-model.number="boundingBox[2]"
                  density="compact"
                  variant="plain"
                  type="number"
                  suffix="°E"
                  label="max"
                  min="0"
                  :step="longitudeStepSize"
                  hide-details
                  required
                />
              </v-col>
              <v-col>
                <v-text-field
                  v-model.number="longitudeStepSize"
                  density="compact"
                  variant="plain"
                  type="number"
                  suffix="°E"
                  label="Δ"
                  min="0"
                  step="0.1"
                  hide-details
                  required
                />
              </v-col>
            </v-row>
          </v-form>
          <div class="d-flex flex-column">
            <v-btn
              color="success"
              class="mt-4"
              block
              :disabled="!formIsValid"
              @click="startWorkflow"
            >
              Start
            </v-btn>
          </div>
        </v-container>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import MapComponent from '@/components/map/MapComponent.vue'
import { ref, computed, onBeforeMount, watch } from 'vue'
import { BBox, Feature } from 'geojson'

import {
  convertBoundingBoxToLngLatBounds,
  useWmsLayer,
} from '@/services/useWms'
import { configManager } from '@/services/application-config'
import ColourBar from '@/components/wms/ColourBar.vue'
import AnimatedMapboxLayer, {
  MapboxLayerOptions,
} from '@/components/wms/AnimatedMapboxLayer.vue'
import ElevationSlider from '@/components/wms/ElevationSlider.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { DateController } from '@/lib/TimeControl/DateController.ts'
import debounce from 'lodash-es/debounce'
import { useUserSettingsStore } from '@/stores/userSettings'
import DrawPolygonControl from '../map/DrawPolygonControl.vue'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'

interface ElevationWithUnitSymbol {
  units?: string
  lowerValue?: number
  upperValue?: number
  unitSymbol: string
}

interface Props {
  layerName?: string
  workflowId?: string
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  workflowId: '',
})

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

const currentWorkflowId = ref('')
const workflowDialog = ref(false)
const formIsValid = ref(false)
const selectBbox = ref(false)
const activeWorkflowIds = ref<string[]>([])

const bboxString = computed(() => {
  return `${boundingBox.value[0]}°E ${boundingBox.value[1]}°N , ${boundingBox.value[2]}°E ${boundingBox.value[3]}°N`
})
const drawControl = ref<typeof DrawPolygonControl>()
const features = ref<Feature[]>([])

const longitudeStepSize = ref(0.1)
const lattitudeStepSize = ref(0.1)

let debouncedSetLayerOptions!: () => void

const legend = computed(() => {
  return legendGraphic.value?.legend
})
const layerHasEleveation = computed(() => {
  return selectedLayer.value?.elevation !== undefined
})

function showMapTool() {
  selectBbox.value = true
  workflowDialog.value = false
}

function hideMapTool() {
  selectBbox.value = false
  workflowDialog.value = true
}

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

function updateTime(date: Date): void {
  if (dateController.currentTime.getTime() === date.getTime()) return
  dateController.selectDate(date)
  currentTime.value = dateController.currentTime
  debouncedSetLayerOptions()
}

function startWorkflow() {
  console.log(
    `POST ${baseUrl}/regridder/${
      props.layerName
    }/${currentTime.value.toISOString()}/${bboxString.value}`,
  )
  activeWorkflowIds.value.push(currentWorkflowId.value)
  workflowDialog.value = false
}

const boundingBox = computed({
  set: (value: BBox): void => {
    features.value[0] = bboxPolygon<{}>(value)
  },
  get: (): BBox => {
    if (
      features.value.length > 0 &&
      features.value[0].geometry.type === 'Polygon'
    ) {
      const result = bbox(features.value[0])
      result[0] = roundToStep(result[0], longitudeStepSize.value)
      result[2] = roundToStep(result[2], longitudeStepSize.value)
      result[1] = roundToStep(result[1], lattitudeStepSize.value)
      result[3] = roundToStep(result[3], lattitudeStepSize.value)

      return result
    } else return [0, 0, 0, 0]
  },
})

function roundToStep(value: number, step: number): number {
  return parseFloat((Math.round(value / step) * step).toFixed(4))
}
</script>

<style scoped>
.workflows-container {
  position: absolute;
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  left: 10px;
  top: 10px;
}

.workflows--running {
  position: absolute;
  left: 18px;
  top: -8px;
}
.colourbar-container {
  position: absolute;
  pointer-events: none;
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  bottom: 80px;
}

.spatial-display {
  position: relative;
}

.spatial-display__slider {
  position: absolute;
  bottom: 5px;
  left: 5px;
  right: 5px;
  z-index: 5;
  border-radius: 5px;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.map-tool__input {
  width: 50px;
  height: 30px;
  margin: 0;
  padding: 0;
}
</style>
