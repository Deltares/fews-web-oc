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
      <v-card-text>
        <v-select
          v-model="currentWorkflow"
          :items="workflowSelectItems"
          density="compact"
          variant="solo-filled"
          flat
          label="Workflow"
          mandatory
        />
        <div v-if="isBoundingBoxInForm" class="d-flex">
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
        </div>
        <div v-if="isCoordinateInForm" class="d-flex">
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
        </div>
        <json-forms
          v-if="hasProperties"
          class="form-container"
          :schema="formSchema"
          :uischema="formUISchema"
          :data="data"
          :renderers="Object.freeze(vuetifyRenderers)"
          :ajv="undefined"
          validation-mode="NoValidation"
          :config="JsonFormsConfig"
          @change="onFormChange"
        />
        <DateTimeField
          v-if="!isProcessDataTask"
          v-model="timeZero"
          date-label="t0 date"
          time-label="t0 time"
        />
        <v-text-field
          v-model="description"
          label="Task run description"
          hide-details
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text="Submit"
          variant="flat"
          color="primary"
          @click="startWorkflow"
        />
        <v-btn text="Close" @click="closeDialog" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { JsonForms } from '@jsonforms/vue'
import { vuetifyRenderers } from '@jsonforms/vue-vuetify'
import {
  SecondaryWorkflowGroupItem,
  SecondaryWorkflowProperties,
} from '@deltares/fews-pi-requests'
import JsonFormsConfig from '@/assets/JsonFormsConfig.json'
import { useBoundingBox } from '@/services/useBoundingBox'

import {
  PartialProcessDataFilter,
  PartialRunTaskFilter,
  WorkflowType,
  useWorkflowsStore,
} from '@/stores/workflows'
import { useAlertsStore } from '@/stores/alerts.ts'

import { useDisplay } from 'vuetify'
import { LngLat } from 'maplibre-gl'
import {
  coordinateToString,
  isBoundingBoxInFormData,
  isCoordinateInFormData,
  WorkflowFormData,
} from '@/lib/workflows'
import { convertJSDateToFewsPiParameter } from '@/lib/date'

import DateTimeField from '@/components/general/DateTimeField.vue'
import { useWorkflowFormSchemas } from '@/services/useWorkflowFormSchemas'

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

const data = ref<WorkflowFormData>({})
const description = ref('')
const userId = ref('')

const {
  boundingBox,
  longitudeStepSize,
  latitudeStepSize,
  boundingBoxIsValid,
  boundingBoxString,
} = useBoundingBox(1, 1)
const { formSchema, formUISchema } = useWorkflowFormSchemas(currentWorkflow)

const workflowsStore = useWorkflowsStore()
const alertStore = useAlertsStore()

onMounted(() => {
  userId.value = crypto.randomUUID()
})

const hasProperties = computed<boolean>(() => {
  const numProperties = currentWorkflow.value?.properties?.length ?? 0
  return numProperties > 0
})
const isProcessDataTask = computed<boolean>(
  () => data.value['GET_PROCESS_DATA'] !== undefined,
)

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
const isBoundingBoxInForm = computed(() => isBoundingBoxInFormData(data.value))
const isCoordinateInForm = computed(() => isCoordinateInFormData(data.value))

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
  { immediate: true },
)

watch(data, () => {
  // Update the lat/lon step sizes when the appropriate fields are changed in
  // the form.
  const xCellSize = data.value.xCellSize
  const yCellSize = data.value.yCellSize
  if (typeof xCellSize === 'number' && xCellSize > 0) {
    longitudeStepSize.value = xCellSize
  }
  if (typeof yCellSize === 'number' && yCellSize > 0) {
    latitudeStepSize.value = yCellSize
  }

  if (isBoundingBoxInForm.value) {
    boundingBox.value = {
      lonMin: data.value.xMin as number,
      latMin: data.value.yMin as number,
      lonMax: data.value.xMax as number,
      latMax: data.value.yMax as number,
    }
  } else {
    boundingBox.value = null
  }

  if (isCoordinateInForm.value) {
    workflowsStore.coordinate = new LngLat(
      +(data.value.longitude as number | string),
      +(data.value.latitude as number | string),
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
  })
}

function showStartMessage(message: string) {
  alertStore.addAlert({
    id: `workflow-start-${userId.value}`,
    type: 'success',
    message,
  })
}

function showSuccessMessage(message: string) {
  alertStore.addAlert({
    id: `workflow-success-${userId.value}`,
    type: 'success',
    message,
  })
}

async function startWorkflow() {
  const workflowType = isProcessDataTask.value
    ? WorkflowType.ProcessData
    : WorkflowType.RunTask

  const fileName = data.value['FILE_NAME'] as string

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
  // TODO: The userId is a random UUID now? Why don't we use the ID of the user
  //       currently logged in if we have it?
  const timeZeroString = convertJSDateToFewsPiParameter(timeZero.value)
  return {
    userId: userId.value,
    description: description.value,
    timeZero: timeZeroString,
    properties: data.value as Record<string, string | number>,
  }
}

function getProcessDataFilter(): PartialProcessDataFilter {
  if (!boundingBoxIsValid.value) {
    throw new Error('Bounding box is invalid')
  }
  return {
    xMin: data.value.xMin as number,
    yMin: data.value.yMin as number,
    xMax: data.value.xMax as number,
    yMax: data.value.yMax as number,
    xCellSize: data.value.xCellSize as number,
    yCellSize: data.value.yCellSize as number,
  }
}
</script>

<style scoped>
.form-container {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
  /* json-forms' Vuetify renderer is weird and does not respect its container
     size, so always hide the horizontal scrollbar. */
  overflow-x: hidden;
  /* json-forms defines its container to have 0 padding with !important, so
  override this for 2 reasons:
     - Part of the label of text fields is cut off, so force the main json-forms
       container to have some padding to prevent this. */
  padding-top: 5px !important;
  /* - We always get a vertical scrollbar even if it is not necessary, so give
       the contents of the form some extra vertical space in the form of
       padding. */
  padding-bottom: 20px !important;
}
</style>
