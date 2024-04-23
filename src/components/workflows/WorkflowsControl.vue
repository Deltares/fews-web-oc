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
        {{ boundingBoxString }}
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
          <v-row v-if="isBoundingBoxInForm">
            <v-text-field
              v-model="boundingBoxString"
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
import { getResourcesStaticUrl } from '@/lib/fews-config'
import {
  PiWebserviceProvider,
  ProcessDataFilter,
  RunTaskFilter,
  SecondaryWorkflowGroupItem,
  SecondaryWorkflowProperties,
} from '@deltares/fews-pi-requests'
import { asyncComputed } from '@vueuse/core'
import JsonFormsConfig from '@/assets/JsonFormsConfig.json'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { downloadFileWithXhr } from '@/lib/download'
import { useBoundingBox } from '@/services/useBoundingBox'

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

const {
  boundingBox,
  features,
  longitudeStepSize,
  latitudeStepSize,
  boundingBoxIsValid,
  boundingBoxString,
} = useBoundingBox(1, 1)

// Check whether the bounding box is defined in the form.
const isBoundingBoxInForm = computed(
  () =>
    data.value.xMin !== undefined &&
    data.value.yMin !== undefined &&
    data.value.xMax !== undefined &&
    data.value.yMax !== undefined,
)

watch(data, () => {
  // Update the lat/lon step sizes when the appropriate fields are changed in
  // the form.
  const xCellSize = data.value.xCellSize
  const yCellSize = data.value.yCellSize
  if (typeof xCellSize === 'number') {
    longitudeStepSize.value = data.value.xCellSize
  }
  if (typeof yCellSize === 'number') {
    latitudeStepSize.value = data.value.yCellSize
  }

  if (isBoundingBoxInForm.value) {
    boundingBox.value = [
      data.value.xMin,
      data.value.yMin,
      data.value.xMax,
      data.value.yMax,
    ]
  } else {
    boundingBox.value = null
  }
})

// Update the form when the bounding box is changed (e.g. through clicking).
watch(boundingBox, () => {
  if (boundingBox.value === null) {
    data.value.xMin = undefined
    data.value.yMin = undefined
    data.value.xMax = undefined
    data.value.yMax = undefined
  } else {
    data.value.xMin = boundingBox.value[0]
    data.value.yMin = boundingBox.value[1]
    data.value.xMax = boundingBox.value[2]
    data.value.yMax = boundingBox.value[3]
  }
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
  if (!boundingBoxIsValid.value) {
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
