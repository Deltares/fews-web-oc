<template>
  <DrawPolygonControl v-if="selectBbox" v-model="features" />

  <v-chip
    pill
    label
    class="outer-chip chip px-0 justify-center overflow-visible"
  >
    <v-chip class="chip overflow-visible mx-0" pill label>
      <v-badge
        :model-value="activeWorkflowIds.length > 0"
        :content="activeWorkflowIds.length"
        color="success"
      >
        <v-btn
          icon="mdi-cog-play"
          @click="workflowDialog = !workflowDialog"
          density="compact"
          variant="plain"
        />
      </v-badge>
    </v-chip>
    <template v-if="selectBbox">
      <span class="mx-5" width="400px">
        {{ bboxString }}
      </span>
      <v-chip class="chip mx-0" pill label>
        <v-btn
          @click="hideMapTool"
          density="compact"
          variant="plain"
          class="px-0"
        >
          Apply
        </v-btn>
      </v-chip>
    </template>
  </v-chip>

  <v-dialog v-show="!selectBbox" width="500" v-model="workflowDialog">
    <v-card>
      <v-card-title>Workflow</v-card-title>
      <v-container>
        <v-row>
          <v-select
            v-model="currentWorkflow"
            :items="secondaryWorkflows"
            item-title="secondaryWorkflowId"
            density="compact"
            variant="solo"
            label="workflow"
            mandatory
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
import { ref, computed, watch } from 'vue'
import { configManager } from '@/services/application-config'
import type { BBox, Feature } from 'geojson'
import DrawPolygonControl from '@/components/map/DrawPolygonControl.vue'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import { SecondaryWorkflowGroupItem } from '@deltares/fews-pi-requests'

interface Props {
  layerName?: string
  secondaryWorkflows: SecondaryWorkflowGroupItem[]
  currentTime?: Date
}

const props = withDefaults(defineProps<Props>(), {
  layerName: '',
})

const currentWorkflow = ref<SecondaryWorkflowGroupItem>(
  props.secondaryWorkflows[0],
)
const workflowDialog = ref(false)
const formIsValid = ref(false)
const selectBbox = ref(false)
const activeWorkflowIds = ref<string[]>([])

const bboxString = computed(() => {
  return `${boundingBox.value[0]}°E ${boundingBox.value[1]}°N , ${boundingBox.value[2]}°E ${boundingBox.value[3]}°N`
})
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
    `POST ${baseUrl}regridder/${
      props.layerName
    }/${props.currentTime?.toISOString()}/${bboxString.value}`,
  )

  activeWorkflowIds.value.push(currentWorkflow.value.secondaryWorkflowId)
  setTimeout(() => {
    activeWorkflowIds.value = activeWorkflowIds.value.filter(
      (id) => id !== currentWorkflow.value.secondaryWorkflowId,
    )
  }, 5000)
  workflowDialog.value = false
}

const boundingBox = ref<BBox>([0, 0, 0, 0])
watch(boundingBox, () => {
  features.value = [bboxPolygon(boundingBox.value)]
})
watch(features, () => {
  if (
    features.value.length > 0 &&
    features.value[0].geometry.type === 'Polygon'
  ) {
    const result = bbox(features.value[0])
    result[0] = roundToStep(result[0], longitudeStepSize.value)
    result[2] = roundToStep(result[2], longitudeStepSize.value)
    result[1] = roundToStep(result[1], lattitudeStepSize.value)
    result[3] = roundToStep(result[3], lattitudeStepSize.value)

    boundingBox.value = result
  } else {
    boundingBox.value = [0, 0, 0, 0]
  }
})

function roundToStep(value: number, step: number): number {
  return parseFloat((Math.round(value / step) * step).toFixed(4))
}
</script>

<style scoped>
.overflow-visible {
  overflow: visible;
}

.chip {
  font-size: 0.825em;
  z-index: 1000;
  backdrop-filter: blur(5px);
  background-color: rgba(var(--v-theme-surface), 0.8);
}

.outer-chip {
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
