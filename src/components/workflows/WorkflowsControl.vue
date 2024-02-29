<template>
  <DrawPolygonControl
    v-if="selectBbox"
    v-model="features"
    ref="drawControl"
    defaultMode="draw_polygon"
    :displayControlsDefault="false"
  />
  <div v-if="workflowId" class="workflows__container d-flex flex-row">
    <v-chip pill class="workflows__chip pl-0 pr-0 justify-center" width="400">
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { configManager } from '@/services/application-config'
import type { BBox, Feature } from 'geojson'
import DrawPolygonControl from '@/components/map/DrawPolygonControl.vue'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'

interface Props {
  layerName?: string
  workflowId?: string
  currentTime?: Date
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
  workflowId: '',
})

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

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

function showMapTool() {
  selectBbox.value = true
  workflowDialog.value = false
}

function hideMapTool() {
  selectBbox.value = false
  workflowDialog.value = true
}

function startWorkflow() {
  console.log(
    `POST ${baseUrl}/regridder/${
      props.layerName
    }/${props.currentTime?.toISOString()}/${bboxString.value}`,
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
.workflows__container {
  position: absolute;
  font-size: 0.825em;
  z-index: 1000;
  left: 10px;
  top: 10px;
}

.workflows__chip {
  background-color: rgba(var(--v-theme-surface), 0.8);
}

.workflows--running {
  position: absolute;
  left: 18px;
  top: -8px;
}

.map-tool__input {
  width: 50px;
  height: 30px;
  margin: 0;
  padding: 0;
}
</style>
