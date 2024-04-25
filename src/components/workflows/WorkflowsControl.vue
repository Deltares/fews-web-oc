<template>
  <v-chip pill label class="outer-chip chip justify-center overflow-visible">
    <v-badge
      :model-value="workflowsStore.hasActiveWorkflows"
      :content="workflowsStore.numberOfActiveWorkflows"
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
import { ref, computed, watch, nextTick } from 'vue'
import { JsonForms } from '@jsonforms/vue'
import { vuetifyRenderers } from '@jsonforms/vue-vuetify'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import {
  SecondaryWorkflowGroupItem,
  SecondaryWorkflowProperties,
} from '@deltares/fews-pi-requests'
import { asyncComputed } from '@vueuse/core'
import JsonFormsConfig from '@/assets/JsonFormsConfig.json'
import { useBoundingBox } from '@/services/useBoundingBox'

import {
  PartialProcessDataFilter,
  PartialRunTaskFilter,
  WorkflowType,
  useWorkflowsStore,
} from '@/stores/workflows'

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
const errorDialog = ref(false)
const errorMessage = ref<string>()
const data = ref()

const {
  boundingBox,
  longitudeStepSize,
  latitudeStepSize,
  boundingBoxIsValid,
  boundingBoxString,
} = useBoundingBox(1, 1)

const workflowsStore = useWorkflowsStore()
// Update workflowId, startTime and endTime depending on properties.
watch(
  currentWorkflow,
  () => (workflowsStore.workflowId = currentWorkflow.value.secondaryWorkflowId),
  { immediate: true },
)
watch(
  () => props.startTime,
  () => (workflowsStore.startTime = props.startTime ?? ''),
  { immediate: true },
)
watch(
  () => props.endTime,
  () => (workflowsStore.endTime = props.endTime ?? ''),
  { immediate: true },
)

let isRounding = false
watch(
  () => workflowsStore.boundingBox,
  () => {
    // Make sure that we do not introduce an infinite watch loop. We only want
    // to set the bounding box in the store once when the bounding box is
    // changed from the outside (e.g. when drawing), to make sure it is rounded
    // properly.
    if (isRounding) return
    isRounding = true

    boundingBox.value = workflowsStore.boundingBox
    // Assigning the bounding box will round its values appropriately, so we
    // assign the rounded bounding box back.
    workflowsStore.boundingBox = boundingBox.value

    // We are done rounding at the next tick, when all watchers have finished.
    nextTick(() => (isRounding = false))
  },
)

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
    boundingBox.value = {
      lonMin: data.value.xMin,
      latMin: data.value.yMin,
      lonMax: data.value.xMax,
      latMax: data.value.yMax,
    }
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
    data.value.xMin = boundingBox.value.lonMin
    data.value.yMin = boundingBox.value.latMin
    data.value.xMax = boundingBox.value.lonMax
    data.value.yMax = boundingBox.value.latMax
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
  workflowsStore.isDrawingBoundingBox = true
  workflowDialog.value = false
  // Show the dialog again when the bounding box has been drawn.
  watch(
    () => workflowsStore.isDrawingBoundingBox,
    () => (workflowDialog.value = true),
    { once: true },
  )
}

function showErrorMessage(message: string) {
  errorMessage.value = message
  errorDialog.value = true
}

async function startWorkflow() {
  const workflowType = data.value['GET_PROCESS_DATA']
    ? WorkflowType.ProcessData
    : WorkflowType.RunTask

  try {
    const filter =
      workflowType === WorkflowType.ProcessData
        ? getProcessDataFilter()
        : getRunTaskFilter()

    await workflowsStore.startWorkflow(workflowType, filter)
  } catch (error) {
    showErrorMessage((error as Error).message)
  }

  workflowDialog.value = false
}

function getRunTaskFilter(): PartialRunTaskFilter {
  // TODO: properly set userId and description
  const userId = '1598'
  const description = 'Test run'
  return {
    userId,
    description,
    properties: data.value,
  }
}

function getProcessDataFilter(): PartialProcessDataFilter {
  if (!boundingBoxIsValid.value) {
    throw new Error('Bounding box is invalid')
  }
  return {
    xMin: data.value.xMin,
    yMin: data.value.yMin,
    xMax: data.value.xMax,
    yMax: data.value.yMax,
    xCellSize: data.value.xCellSize,
    yCellSize: data.value.yCellSize,
  }
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
