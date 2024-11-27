<template>
  <v-dialog
    width="500"
    v-model="showDialog"
    persistent
    :fullscreen="mobile"
    :max-width="mobile ? undefined : '600'"
  >
    <v-card>
      <v-card-title>Workflow</v-card-title>
      <v-container class="pb-0">
        <v-col>
          <v-row>
            <v-select
              v-model="currentWorkflow"
              :items="workflowSelectItems"
              density="compact"
              variant="solo-filled"
              flat
              label="Workflow"
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
            />
            <v-btn
              icon="mdi-selection-drag"
              variant="tonal"
              density="comfortable"
              @click="showMapTool"
            />
          </v-row>
          <v-row v-if="isCoordinateInForm">
            <v-text-field
              v-model="coordinateString"
              readonly
              variant="plain"
              density="compact"
              label="Coordinate"
              class="mx-4"
            />
            <v-btn
              icon="mdi-map-marker-radius"
              variant="tonal"
              density="comfortable"
              @click="showCoordinateSelector"
            />
          </v-row>
        </v-col>
      </v-container>
      <v-container v-if="hasProperties" class="d-flex workflow-dialog__form">
        <json-forms
          :schema="formSchema"
          :uischema="formUISchema"
          :data="data"
          :renderers="Object.freeze(vuetifyRenderers)"
          :ajv="undefined"
          validation-mode="NoValidation"
          :config="JsonFormsConfig"
          @change="onFormChange"
        />
      </v-container>
      <v-container v-if="!isProcessDataTask">
        <DateTimeField
          v-model="timeZero"
          date-label="t0 date"
          time-label="t0 time"
        />
      </v-container>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="flat" color="primary" @click="startWorkflow">
          Submit
        </v-btn>
        <v-btn @click="closeDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
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
import { useAlertsStore } from '@/stores/alerts.ts'

import { generateDefaultUISchema, generateJsonSchema } from './workflowUtils'
import { useDisplay } from 'vuetify'
import { LngLat } from 'maplibre-gl'
import { coordinateToString } from '@/lib/workflows'
import { convertJSDateToFewsPiParameter } from '@/lib/date'

import DateTimeField from '@/components/general/DateTimeField.vue'

interface Props {
  secondaryWorkflows: SecondaryWorkflowGroupItem[] | null
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const { mobile } = useDisplay()

const currentWorkflow = ref<SecondaryWorkflowGroupItem | null>(null)
const showDialog = defineModel<boolean>('showDialog', { required: true })

const data = ref()
const userId = ref('')

const {
  boundingBox,
  longitudeStepSize,
  latitudeStepSize,
  boundingBoxIsValid,
  boundingBoxString,
} = useBoundingBox(1, 1)

const workflowsStore = useWorkflowsStore()
const alertStore = useAlertsStore()

onMounted(() => {
  userId.value = crypto.randomUUID()
})

const hasProperties = computed<boolean>(() => {
  const numProperties = currentWorkflow.value?.properties?.length ?? 0
  return numProperties > 0
})
const isProcessDataTask = computed<boolean>(() => {
  return data.value['GET_PROCESS_DATA']
})

const timeZero = ref(new Date())

// Update workflowId, startTime and endTime depending on properties.
watch(
  currentWorkflow,
  () =>
    (workflowsStore.workflowId =
      currentWorkflow.value?.secondaryWorkflowId ?? null),
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

function closeDialog() {
  showDialog.value = false
}

// Check whether the bounding box is defined in the form.
const isBoundingBoxInForm = computed(() => {
  const properties = Object.keys(data.value)
  return (
    properties.includes('xMin') &&
    properties.includes('yMin') &&
    properties.includes('xMax') &&
    properties.includes('yMax')
  )
})

const isCoordinateInForm = computed(() => {
  const properties = Object.keys(data.value)
  return properties.includes('latitude') && properties.includes('longitude')
})

const workflowSelectItems = computed(() => {
  return props.secondaryWorkflows?.map((workflow) => {
    const title =
      workflow.description !== ''
        ? workflow.description
        : workflow.secondaryWorkflowId
    return {
      title,
      value: workflow,
    }
  })
})

// If we get a new list of workflows, select the first one.
watch(
  () => props.secondaryWorkflows,
  () => {
    if (!props.secondaryWorkflows || props.secondaryWorkflows.length === 0) {
      currentWorkflow.value = null
    } else {
      currentWorkflow.value = props.secondaryWorkflows[0]
    }
  },
)

watch(data, () => {
  // Update the lat/lon step sizes when the appropriate fields are changed in
  // the form.
  const xCellSize = data.value.xCellSize
  const yCellSize = data.value.yCellSize
  if (typeof xCellSize === 'number' && xCellSize > 0) {
    longitudeStepSize.value = data.value.xCellSize
  }
  if (typeof yCellSize === 'number' && yCellSize > 0) {
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

  if (isCoordinateInForm.value) {
    workflowsStore.coordinate = new LngLat(
      +data.value.longitude,
      +data.value.latitude,
    )
  } else {
    workflowsStore.coordinate = null
    workflowsStore.isSelectingCoordinate = false
  }
})

// Update the form when the bounding box is changed (e.g. through clicking).
watch(boundingBox, () => {
  if (!isBoundingBoxInForm.value) return

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
  if (boundingBoxIsValid.value) {
    workflowsStore.boundingBox = boundingBox.value
  }
})

watch(
  () => workflowsStore.coordinate,
  () => {
    if (!isCoordinateInForm.value) return

    if (workflowsStore.coordinate === null) {
      data.value.latitude = undefined
      data.value.longitude = undefined
    } else {
      data.value.latitude = +workflowsStore.coordinate.lat.toFixed(2)
      data.value.longitude = +workflowsStore.coordinate.lng.toFixed(2)
    }
  },
)

const coordinateString = computed(() =>
  coordinateToString(workflowsStore.coordinate),
)

type FormValue = string | number | boolean | Date

watch(
  currentWorkflow,
  () => {
    const newData: Record<string, FormValue> = {}

    currentWorkflow.value?.properties?.forEach((property) => {
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

const formSchema = asyncComputed(async () => {
  if (!currentWorkflow.value) return undefined
  return getSchema(`${currentWorkflow.value.secondaryWorkflowId}.schema.json`)
})

const formUISchema = asyncComputed(async () => {
  if (!currentWorkflow.value) return undefined
  return getUISchema(
    `${currentWorkflow.value.secondaryWorkflowId}.ui-schema.json`,
  )
})

async function getUISchema(file: string) {
  try {
    const schema = await getFile(file)
    return schema.json()
  } catch (error) {
    const workflowProperties = currentWorkflow.value?.properties
    if (workflowProperties !== undefined)
      return generateDefaultUISchema(workflowProperties)
  }
}

async function getSchema(file: string) {
  try {
    const schema = await getFile(file)
    return schema.json()
  } catch (error) {
    const workflowProperties = currentWorkflow.value?.properties
    if (workflowProperties !== undefined)
      return generateJsonSchema(workflowProperties)
  }
}

async function getFile(file: string) {
  const url = getResourcesStaticUrl(file)
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`)
    }
    return response
  } catch (error) {
    throw new Error(`Failed to fetch ${url}`)
  }
}

function onFormChange(event: any) {
  if (event.error) {
    showErrorMessage(event.error)
    return
  }

  data.value = event.data
}

function showCoordinateSelector() {
  workflowsStore.isSelectingCoordinate = true
  showDialog.value = false

  watch(
    () => workflowsStore.isSelectingCoordinate,
    () => {
      if (workflowsStore.coordinate !== null) {
        showDialog.value = true
      }
    },
    { once: true },
  )
}

function showMapTool() {
  workflowsStore.isDrawingBoundingBox = true
  showDialog.value = false
  // Show the dialog again when the bounding box has been drawn.
  watch(
    () => workflowsStore.isDrawingBoundingBox,
    () => {
      // Only show the dialog if the bounding box is not null, which means the user finished
      // drawing. If it is null, it has been forcibly closed by the application (e.g. because we
      // navigated to a different node), so we should abandon the workflow (and hence the dialog)
      // altogether.
      if (workflowsStore.boundingBox !== null) {
        showDialog.value = true
      }
    },
    { once: true },
  )
}

function showErrorMessage(message: string) {
  alertStore.addAlert({
    id: `workflow-error-${userId.value}`,
    type: 'error',
    message,
    active: true,
  })
}

function showStartMessage(message: string) {
  alertStore.addAlert({
    id: `workflow-start-${userId.value}`,
    type: 'success',
    message,
    active: true,
  })
}

function showSuccessMessage(message: string) {
  alertStore.addAlert({
    id: `workflow-success-${userId.value}`,
    type: 'success',
    message,
    active: true,
  })
}

async function startWorkflow() {
  const workflowType = isProcessDataTask.value
    ? WorkflowType.ProcessData
    : WorkflowType.RunTask

  const fileName = data.value['FILE_NAME']

  const filter =
    workflowType === WorkflowType.ProcessData
      ? getProcessDataFilter()
      : getRunTaskFilter()

  let error = false
  try {
    if (workflowType === WorkflowType.ProcessData) {
      setTimeout(() => {
        if (error) return
        showStartMessage(
          'Task submitted successfully. Your file will be available for download shortly.',
        )
      }, 500)
    }

    closeDialog()
    await workflowsStore.startWorkflow(workflowType, filter, { fileName })

    if (workflowType === WorkflowType.ProcessData) {
      showSuccessMessage('File download completed')
    } else {
      showStartMessage(
        'Workflow submitted successfully. You can monitor the task progress using the System Monitor.',
      )
    }
  } catch (e) {
    error = true
    if (typeof e === 'string') {
      showErrorMessage(e)
    } else if (e instanceof Error) {
      showErrorMessage(e.message)
    }
  } finally {
    userId.value = crypto.randomUUID()
  }
}

function getRunTaskFilter(): PartialRunTaskFilter {
  const description = 'Test run'
  const timeZeroString = convertJSDateToFewsPiParameter(timeZero.value)
  return {
    userId: userId.value,
    description,
    timeZero: timeZeroString,
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

.workflow-dialog__form {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  position: relative;
}
</style>
