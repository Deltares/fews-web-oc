<template>
  <DrawPolygonControl v-if="selectBbox" v-model="features" />

  <v-chip pill label class="outer-chip chip justify-center overflow-visible">
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
    <template v-if="selectBbox">
      <span class="mx-4 text-medium-emphasis" width="400px">
        {{ bboxString }}
      </span>
      <v-btn
        @click="hideMapTool"
        density="compact"
        variant="tonal"
        class="px-0 text-medium-emphasis"
      >
        Apply
      </v-btn>
    </template>
  </v-chip>

  <v-dialog v-show="!selectBbox" width="500" v-model="workflowDialog">
    <v-card>
      <v-card-title>Workflow</v-card-title>
      <v-container>
        <v-col>
          <v-row>
            <v-select
              v-model="currentWorkflow"
              :items="secondaryWorkflows"
              item-title="description"
              density="compact"
              variant="solo-filled"
              flat
              label="Workflow"
              return-object
              mandatory
            ></v-select>
          </v-row>
          <v-row v-if="hasBoundingBox">
            <v-text-field
              v-model="bboxString"
              readonly
              variant="plain"
              density="compact"
              label="Bounding box"
              class="mx-4"
            >
              <template v-slot:append>
                <v-icon @click="showMapTool">mdi-selection-drag</v-icon>
              </template>
            </v-text-field>
          </v-row>
        </v-col>
        <json-forms
          :schema="formSchema"
          :uischema="formUISchema"
          :data="data"
          :renderers="vuetifyRenderers"
          :ajv="undefined"
          validation-mode="NoValidation"
          :config="JsonFormsConfig"
          @change="onFormChange"
        />
        <div class="d-flex flex-column">
          <v-btn color="success" class="mt-4" block @click="startWorkflow">
            Start
          </v-btn>
        </div>
      </v-container>
    </v-card>
  </v-dialog>

  <!-- Error Dialog -->
  <v-dialog v-model="errorDialog" max-width="500">
    <v-card prepend-icon="mdi-alert" title="Error" :text="errorMessage">
      <v-card-actions>
        <v-spacer />
        <v-btn color="error" @click="errorDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { JsonForms } from '@jsonforms/vue'
import { vuetifyRenderers } from '@jsonforms/vue-vuetify'
import { configManager } from '@/services/application-config'
import DrawPolygonControl from '@/components/map/DrawPolygonControl.vue'
import bbox from '@turf/bbox'
import bboxPolygon from '@turf/bbox-polygon'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import {
  PiWebserviceProvider,
  ProcessDataFilter,
  RunTaskFilter,
  SecondaryWorkflowGroupItem,
  SecondaryWorkflowProperties,
} from '@deltares/fews-pi-requests'
import { GeoJSONStoreFeatures } from 'terra-draw'
import { asyncComputed } from '@vueuse/core'
import JsonFormsConfig from '@/assets/JsonFormsConfig.json'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { downloadFileWithXhr } from '@/lib/download'

interface Props {
  secondaryWorkflows: SecondaryWorkflowGroupItem[]
  startTime?: string
  endTime?: string
}

const props = defineProps<Props>()

const currentWorkflow = ref<SecondaryWorkflowGroupItem>(
  props.secondaryWorkflows[0],
)
const workflowDialog = ref(false)
const selectBbox = ref(false)
const activeWorkflowIds = ref<string[]>([])
const errorDialog = ref(false)
const errorMessage = ref<string>()
const data = ref()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const webServiceProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

type FormValue = string | number | boolean | Date

watch(
  currentWorkflow,
  () => {
    const newData: Record<string, FormValue> = {}

    currentWorkflow.value.properties?.forEach((property) => {
      if (property.value === undefined) return
      newData[property.key] = toValue(property.type, property.value)
    })

    data.value = newData
  },
  { immediate: true },
)

function toValue(
  type: SecondaryWorkflowProperties['type'],
  value: string,
): FormValue {
  switch (type) {
    case 'string':
      return value
    case 'float':
      return parseFloat(value)
    case 'bool':
      return value === 'true'
    case 'double':
      return parseFloat(value)
    case 'int':
      return parseInt(value)
    case 'dateTime':
      return new Date(value)
  }
}

const hasBoundingBox = computed(
  () =>
    data.value.xMin !== undefined &&
    data.value.yMin !== undefined &&
    data.value.xMax !== undefined &&
    data.value.yMax !== undefined &&
    data.value.xCellSize !== undefined &&
    data.value.yCellSize !== undefined,
)

const boundingBox = computed<[number, number, number, number]>({
  get() {
    return [
      data.value.xMin ?? 0,
      data.value.yMin ?? 0,
      data.value.xMax ?? 0,
      data.value.yMax ?? 0,
    ]
  },
  set(newValue) {
    data.value.xMin = newValue[0]
    data.value.yMin = newValue[1]
    data.value.xMax = newValue[2]
    data.value.yMax = newValue[3]
  },
})

const longitudeStepSize = computed(() => data.value.xCellSize ?? 0.1)
const lattitudeStepSize = computed(() => data.value.yCellSize ?? 0.1)

const bboxString = computed(() => {
  return `${boundingBox.value[0]}°E ${boundingBox.value[1]}°N , ${boundingBox.value[2]}°E ${boundingBox.value[3]}°N`
})
const features = ref<GeoJSONStoreFeatures[]>([])

const formSchema = asyncComputed(
  async () =>
    await getJson(`${currentWorkflow.value.secondaryWorkflowId}.schema.json`),
)
const formUISchema = asyncComputed(
  async () =>
    await getJson(
      `${currentWorkflow.value.secondaryWorkflowId}.ui-schema.json`,
    ),
)

async function getJson(file: string) {
  const url = getResourcesStaticUrl(file)
  const data = await fetch(url)
  return data.json()
}

function onFormChange(event: any) {
  if (event.error) {
    showErrorMessage(event.error)
    return
  }

  data.value = event.data
}

function showMapTool() {
  selectBbox.value = true
  workflowDialog.value = false
}

function hideMapTool() {
  selectBbox.value = false
  workflowDialog.value = true
}

function bboxIsValid() {
  // Invalid when along x or y, min > max
  if (
    boundingBox.value[0] > boundingBox.value[2] ||
    boundingBox.value[1] > boundingBox.value[3]
  ) {
    return false
  }

  return boundingBox.value.every((v) => !isNaN(v))
}

function showErrorMessage(message: string) {
  errorMessage.value = message
  errorDialog.value = true
}

function startWorkflow() {
  const promise = data.value['GET_PROCESS_DATA'] ? processData() : runTask()

  activeWorkflowIds.value.push(currentWorkflow.value.secondaryWorkflowId)
  // Remove workflow once promise has resolved
  promise.then(() => {
    activeWorkflowIds.value = activeWorkflowIds.value.filter(
      (id) => id !== currentWorkflow.value.secondaryWorkflowId,
    )
  })

  workflowDialog.value = false
}

async function runTask() {
  // TODO: properly set userId and description
  const userId = '1598'
  const description = 'Test run'

  const filter: RunTaskFilter = {
    workflowId: currentWorkflow.value.secondaryWorkflowId,
    startTime: props.startTime ?? '',
    endTime: props.endTime ?? '',
    userId,
    description,
    properties: data.value,
  }
  const body = ''

  try {
    await webServiceProvider.postRunTask(filter, body)
  } catch (error) {
    showErrorMessage('Could not start task')
    console.error(error)
  }
}

async function processData() {
  if (!bboxIsValid()) {
    showErrorMessage('Bounding box is invalid')
    return
  }

  const filter: ProcessDataFilter = {
    workflowId: currentWorkflow.value.secondaryWorkflowId,
    xMin: data.value.xMin,
    yMin: data.value.yMin,
    xMax: data.value.xMax,
    yMax: data.value.yMax,
    xCellSize: data.value.xCellSize,
    yCellSize: data.value.yCellSize,
    startTime: props.startTime ?? '',
    endTime: props.endTime ?? '',
  }

  const url = webServiceProvider.processDataUrl(filter)
  await downloadFileWithXhr(url.toString()).catch(({ statusText }) => {
    showErrorMessage(statusText)
  })
}

watch(boundingBox, updateFeature, { deep: true })
function updateFeature() {
  if (!bboxIsValid()) return

  const feature = bboxPolygon(boundingBox.value)
  delete feature.bbox

  if (features.value.length > 0) {
    features.value[0].geometry = feature.geometry
  } else {
    features.value.push(feature as GeoJSONStoreFeatures)
  }
}

watch(features, () => {
  const type = features.value?.[0]?.geometry.type

  if (type === 'Polygon') {
    const newBbox = bbox(features.value[0])

    const roundedBbox: [number, number, number, number] = [
      roundToStep(newBbox[0], longitudeStepSize.value),
      roundToStep(newBbox[1], lattitudeStepSize.value),
      roundToStep(newBbox[2], longitudeStepSize.value),
      roundToStep(newBbox[3], lattitudeStepSize.value),
    ]

    // Prevent the bbox from becoming a point or line in the x direction
    if (Math.abs(roundedBbox[0] - roundedBbox[2]) < longitudeStepSize.value) {
      roundedBbox[2] = roundToStep(
        roundedBbox[0] + longitudeStepSize.value,
        longitudeStepSize.value,
      )
    }

    // Prevent the bbox from becoming a point or line in the y direction
    if (Math.abs(roundedBbox[1] - roundedBbox[3]) < lattitudeStepSize.value) {
      roundedBbox[3] = roundToStep(
        roundedBbox[1] + lattitudeStepSize.value,
        lattitudeStepSize.value,
      )
    }

    boundingBox.value = roundedBbox
    // Due to rounding the above set can be equal to the previous value
    //  however we still want to update the feature
    updateFeature()
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
