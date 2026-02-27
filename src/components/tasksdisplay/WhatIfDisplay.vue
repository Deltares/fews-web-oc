<template>
  <div class="d-flex w-100 h-100 flex-column overflow-y-hidden">
    <v-form
      class="whatif-container w-100 d-flex flex-column overflow-y-auto gr-4 pa-4"
      @submit.prevent
    >
      <div v-if="whatIfTemplates.length === 1">
        {{ whatIfTemplates[0].name }}
      </div>
      <v-select
        v-else
        v-model="selectedWhatIfTemplate"
        :items="whatIfTemplates"
        :loading="availableWhatIfTemplatesStore.isLoading"
        item-title="name"
        label="Select what-if scenario template"
        variant="solo-filled"
        flat
        density="compact"
        hide-details
        return-object
        class="flex-0-0"
      />

      <WhatIfScenarioSelect
        v-if="!hideScenarioSelect"
        v-model="selectedWhatIfScenario"
        :whatIfTemplateId="selectedWhatIfTemplate?.id"
        :temporaryWhatIfScenarioName
      />

      <template v-if="doShowConfiguration">
        <v-card flat border class="flex-0-0">
          <div class="px-4 pt-2">{{ configurationTitle }}</div>
          <v-card-text>
            <div v-if="isBoundingBoxInForm" class="d-flex align-center">
              <v-text-field
                v-model="boundingBoxString"
                readonly
                variant="plain"
                label="Bounding box"
              />
              <v-btn
                icon="mdi-selection-drag"
                variant="tonal"
                density="comfortable"
                aria-label="Draw bounding box on map"
                :active="workflowsStore.isDrawingBoundingBox"
                @click="
                  workflowsStore.isDrawingBoundingBox =
                    !workflowsStore.isDrawingBoundingBox
                "
              />
            </div>
            <div v-if="isCoordinateInForm" class="d-flex">
              <v-text-field
                v-model="coordinateString"
                readonly
                variant="plain"
                density="compact"
                label="Coordinate"
              />
              <v-btn
                icon="mdi-map-marker-radius"
                variant="tonal"
                density="comfortable"
                aria-label="Select coordinate on map"
                :active="workflowsStore.isSelectingCoordinate"
                @click="
                  workflowsStore.isSelectingCoordinate =
                    !workflowsStore.isSelectingCoordinate
                "
              />
            </div>
            <json-forms
              :schema="jsonSchema"
              :uischema="uiSchema"
              :data="selectedProperties"
              :renderers="formRenderers"
              :ajv="undefined"
              validation-mode="NoValidation"
              :config="jsonFormsConfig"
              @change="onPropertiesChange"
              :additional-errors="additionalErrors"
            />
          </v-card-text>
        </v-card>

        <WhatIfTimeZeroSelect
          v-model="timeZero"
          :workflowId="selectedWorkflow?.id"
          :hidden="hideTimeZeroSelect || hideT0Property"
        />

        <div v-if="!hideDescription">
          <v-textarea
            v-model="description"
            label="Task run description"
            density="compact"
            variant="outlined"
            hide-details
            rows="2"
          />
        </div>
      </template>
      <div class="d-flex flex-column gc-4 gr-1">
        <ExpectedWorkflowRuntime class="ps-0" :workflow="selectedWorkflow" />
        <AvailableWorkflowServers
          class="ps-0 mb-2"
          :workflow="selectedWorkflow"
        />
      </div>
    </v-form>
    <v-btn
      variant="flat"
      color="primary"
      class="my-2 sticky-bottom mx-4"
      :disabled="!canSubmit"
      @click="submit"
      :loading="isPosting"
    >
      Submit
    </v-btn>
  </div>
</template>
<script setup lang="ts">
import CustomDateTimeControl from './customFormRenderers/CustomDateTimeControl.vue'
import jsonFormsConfig from '@/assets/JsonFormsConfig.json'
import WhatIfScenarioSelect from './WhatIfScenarioSelect.vue'
import WhatIfTimeZeroSelect from './WhatIfTimeZeroSelect.vue'

import { isDateTimeControl, rankWith } from '@jsonforms/core'
import { vuetifyRenderers } from '@jsonforms/vue-vuetify'
import { computed, ref, watch, watchEffect } from 'vue'
import { ErrorObject } from 'ajv'

import { JsonForms } from '@jsonforms/vue'
import ExpectedWorkflowRuntime from './ExpectedWorkflowRuntime.vue'
import AvailableWorkflowServers from './AvailableWorkflowServers.vue'
import type {
  PostWhatIfScenarioFilter,
  RunTaskFilter,
  WhatIfScenarioDescriptor,
  WhatIfTemplate,
} from '@deltares/fews-pi-requests'
import {
  convertPropertiesToFewsPi,
  getErrorsForProperties,
  getJsonDataFromProperties,
  ScenarioData,
} from '@/lib/whatif'
import { postWhatIfScenario } from '@/lib/whatif/fetch'
import type { WorkflowItem } from '@/lib/workflows'
import { refreshTaskRuns } from '@/services/useTasksRuns'
import { useAvailableWhatIfTemplatesStore } from '@/stores/availableWhatIfTemplates'
import { uid } from '@/lib/utils/uid'
import { useAlertsStore } from '@/stores/alerts'
import { useWorkflowsStore, WorkflowType } from '@/stores/workflows'
import { useWorkflowBoundingBox } from '@/services/useWorkflowBoundingBox'
import { useWhatIfTemplateSchemas } from '@/services/useWhatIfTemplateSchemas'

interface Props {
  workflows: WorkflowItem[]
  configurationTitle?: string
  hideScenarioSelect?: boolean
  hideTimeZeroSelect?: boolean
  hideDescription?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  configurationTitle: 'Scenario configuration',
})

interface Emits {
  postTask: [taskId: string | undefined]
}
const emit = defineEmits<Emits>()

const availableWhatIfTemplatesStore = useAvailableWhatIfTemplatesStore()
const alertStore = useAlertsStore()
const workflowsStore = useWorkflowsStore()

const selectedWhatIfTemplate = ref<WhatIfTemplate>()
const selectedWhatIfScenario = ref<WhatIfScenarioDescriptor>()
const selectedProperties = ref<ScenarioData>({})
watch(
  selectedProperties,
  () => console.log('properties changed', selectedProperties.value),
  { immediate: true },
)

watch(selectedWhatIfTemplate, () => (selectedWhatIfScenario.value = undefined))

const additionalErrors = ref<ErrorObject[]>([])

const isPosting = ref<boolean>(false)

const temporaryWhatIfScenarioName = 'Temporary'

const timeZero = ref<string>()
const description = ref<string>()

const selectedWorkflow = computed(() =>
  props.workflows.find(
    (wf) => wf.whatIfTemplateId === selectedWhatIfTemplate.value?.id,
  ),
)

// We override all date/time controls with our own, to make sure they are
// consistent with each other.
const customDateTimeTester = rankWith(3, isDateTimeControl)
const formRenderers = Object.freeze([
  { tester: customDateTimeTester, renderer: CustomDateTimeControl },
  ...vuetifyRenderers,
])

const whatIfTemplates = computed(() =>
  props.workflows
    .map((wf) => wf.whatIfTemplateId)
    .map(availableWhatIfTemplatesStore.byId)
    .filter((wt) => wt !== undefined),
)
watch(
  whatIfTemplates,
  (templates) => {
    selectedWhatIfTemplate.value = templates[0]
    if (!selectedWhatIfTemplate.value) return
    selectedWhatIfTemplate.value.properties = [
      {
        id: 'mass_total_kg',
        name: 'Total mass [kilogram]',
        type: 'integer',
        defaultValue: 30,
        maxValue: 500,
        minValue: 1,
      },
      {
        id: 'spill.startTime',
        name: 'Start of spill',
        type: 'dateTime',
        defaultValue: '2025-03-14T10:00:00Z',
        relativeViewPeriod: {
          unit: 'day',
          start: '-9',
          end: '1',
        },
        cardinalTimeStep: {
          timeZone: 'GMT',
          unit: 'hour',
          multiplier: 1,
        },
      },
      {
        id: 'spill.endTime',
        name: 'End of spill',
        type: 'dateTime',
        defaultValue: '2025-03-14T10:00:00Z',
      },
      // {
      //   id: 'DateTimeAsDurationRelativeToStartOfSpill',
      //   name: 'Spill duration',
      //   type: 'dateTime',
      //   defaultValue: '2025-03-14T10:00:00Z',
      //   relativeViewPeriod: {
      //     unit: 'day',
      //     start: '0',
      //     end: '2',
      //   },
      //   cardinalTimeStep: {
      //     timeZone: 'GMT',
      //     unit: 'hour',
      //     multiplier: 1,
      //   },
      // },
      // {
      //   id: 'DurationAsDateTimeRelativeToStartOfSpill',
      //   name: 'End date',
      //   type: 'integer',
      //   defaultValue: 0,
      //   maxValue: 86400,
      //   minValue: 0,
      // },
      // {
      //   id: 'hideT0',
      //   name: 'hideT0',
      //   type: 'boolean',
      //   defaultValue: true,
      // },
    ]
  },
  { immediate: true },
)

const { jsonSchema, uiSchema } = useWhatIfTemplateSchemas(
  selectedWhatIfTemplate,
)

watchEffect(() => {
  selectedProperties.value = getJsonDataFromProperties(
    selectedWhatIfTemplate.value?.properties,
    selectedWhatIfScenario.value?.properties,
  )
})

const hideT0Property = computed(() => {
  return (
    selectedWhatIfTemplate.value?.properties?.some(
      (p) =>
        p.id === 'hideT0' && p.type === 'boolean' && p.defaultValue === true,
    ) ?? false
  )
})

const {
  getProcessDataFilter,
  boundingBoxString,
  coordinateString,
  isBoundingBoxInForm,
  isCoordinateInForm,
} = useWorkflowBoundingBox(selectedProperties)

const doShowConfiguration = computed<boolean>(
  () => selectedWorkflow.value !== undefined,
)

const hasAllRequiredProperties = computed<boolean>(() => {
  if (!jsonSchema.value) return false

  const requiredProperties = jsonSchema.value.required ?? []
  return requiredProperties.every(
    (property) => property in selectedProperties.value,
  )
})

const canSubmit = computed<boolean>(() => {
  const hasSelectedWorkflow = selectedWorkflow.value !== undefined
  const hasAllProperties = hasAllRequiredProperties.value
  const hasNoErrors = additionalErrors.value.length === 0
  const validTimeZero = timeZero.value !== undefined
  return hasSelectedWorkflow && hasAllProperties && hasNoErrors && validTimeZero
})

function onPropertiesChange(event: { data: ScenarioData }): void {
  const updatedProperties = event.data
  if (!updatedProperties) return
  selectedProperties.value = updatedProperties
}

watch(selectedProperties, (properties) => {
  additionalErrors.value = getErrorsForProperties(properties, jsonSchema.value)
})

const isProcessDataTask = computed<boolean>(
  () =>
    selectedWhatIfTemplate.value?.properties?.some(
      (p) =>
        p.id === 'GET_PROCESS_DATA' &&
        p.type === 'string' &&
        p.defaultValue === 'true',
    ) ?? false,
)

async function submit() {
  if (!selectedWorkflow.value) {
    showErrorMessage('No workflow selected')
    return
  }
  if (!selectedWhatIfTemplate.value) {
    showErrorMessage('No what-if template selected')
    return
  }
  const workflowId = selectedWorkflow.value.id
  const whatIfTemplateId = selectedWhatIfTemplate.value.id
  const properties = convertPropertiesToFewsPi(
    selectedProperties.value,
    selectedWhatIfTemplate.value.properties,
  )

  const scenarioFilter: PostWhatIfScenarioFilter = {
    whatIfTemplateId,
    name: temporaryWhatIfScenarioName,
    properties,
  }

  isPosting.value = true
  const scenarioResult = await postWhatIfScenario(scenarioFilter)

  if (scenarioResult.status === 'error') {
    isPosting.value = false
    showErrorMessage(scenarioResult.error)
    return
  }

  const workflowType = isProcessDataTask.value
    ? WorkflowType.ProcessData
    : WorkflowType.RunTask

  const fileName = selectedProperties.value['FILE_NAME'] as string

  const filter =
    workflowType === WorkflowType.ProcessData
      ? getProcessDataFilter(workflowId)
      : getRunTaskFilter(workflowId, scenarioResult.data.id)

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

    const result = await workflowsStore.startWorkflow(workflowType, filter, {
      fileName,
    })

    emit('postTask', result)

    if (workflowType === WorkflowType.ProcessData) {
      showSuccessMessage('File download completed')
    } else {
      showStartMessage(
        'Workflow submitted successfully. You can monitor the task progress using the Task Overview.',
      )

      setTimeout(() => {
        refreshTaskRuns()
      }, 1500)
    }
  } catch (e) {
    error = true
    if (typeof e === 'string') {
      showErrorMessage(e)
    } else if (e instanceof Error) {
      showErrorMessage(e.message)
    }
  } finally {
    isPosting.value = false
  }
}

function getRunTaskFilter(
  workflowId: string,
  scenarioId: string,
): RunTaskFilter {
  return {
    workflowId,
    timeZero: timeZero.value,
    scenarioId,
    description: description.value,
  }
}

function showMessage(message: string, type: 'error' | 'success'): void {
  // Generate a new unique ID for each alert.
  const id = uid()
  alertStore.addAlert({
    id,
    type,
    message,
  })
}

function showErrorMessage(message: string) {
  showMessage(message, 'error')
}

function showStartMessage(message: string) {
  showMessage(message, 'success')
}

function showSuccessMessage(message: string) {
  showMessage(message, 'success')
}
</script>

<style scoped>
.whatif-container {
  max-width: 800px;
}

.datetime-field :deep(.v-field) {
  padding-right: 0;
}

.sticky-bottom {
  position: sticky;
  bottom: 0;
  z-index: 1;
  background: inherit;
}
</style>
