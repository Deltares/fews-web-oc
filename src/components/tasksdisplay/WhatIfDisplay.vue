<template>
  <div class="d-flex w-100 h-100 justify-center overflow-y-auto">
    <div class="whatif-container w-100 d-flex flex-column gr-4 pa-4">
      <v-select
        v-model="selectedWhatIfTemplate"
        :items="whatIfTemplates"
        :loading="isLoadingTemplates"
        item-title="name"
        label="Select what-if scenario template"
        variant="outlined"
        density="compact"
        hide-details
        return-object
        class="flex-0-0"
      />
      <v-select
        v-if="selectedWhatIfTemplate"
        v-model="selectedWhatIfScenario"
        :items="whatIfScenarios"
        :loading="isLoadingScenarios"
        item-title="name"
        label="Select what-if scenario"
        variant="outlined"
        density="compact"
        hide-details
        return-object
        class="flex-0-0"
      />

      <template v-if="doShowConfiguration">
        <v-card flat border class="flex-0-0">
          <v-card-title>Scenario configuration</v-card-title>
          <v-card-text>
            <json-forms
              class="pt-2"
              :schema="jsonSchema"
              :data="selectedProperties"
              :renderers="Object.freeze(vuetifyRenderers)"
              :ajv="undefined"
              validation-mode="NoValidation"
              :config="jsonFormsConfig"
              @change="onPropertiesChange"
              :additional-errors="additionalErrors"
            />
          </v-card-text>
        </v-card>

        <div>
          <DateTimeField
            v-model="timeZero"
            date-label="T0 date"
            time-label="T0 time"
          />
        </div>

        <div>
          <v-textarea
            v-model="description"
            label="Task run description"
            density="compact"
            variant="outlined"
            no-resize
            hide-details
            rows="2"
          />
        </div>
      </template>
      <div class="d-flex flex-column gc-4 gr-1">
        <ExpectedWorkflowRuntime
          class="ps-0"
          :workflow-id="selectedWorkflow?.id ?? null"
        />
        <AvailableWorkflowServers
          class="ps-0 mb-2"
          :workflow-id="selectedWorkflow?.id ?? null"
        />
        <v-alert
          v-if="isSubmitted && !hasSubmitError"
          class="flex-0-0"
          type="success"
          density="compact"
        >
          Task submitted successfully.
        </v-alert>
        <v-alert
          v-if="isSubmitted && hasSubmitError"
          class="flex-0-0"
          type="error"
        >
          Failed to submit task: {{ submitErrorMessage }}
        </v-alert>
        <v-btn
          variant="flat"
          color="primary"
          :disabled="!canSubmit"
          @click="submit"
          max-width="300"
          class="my-2"
          :loading="isPosting"
        >
          Submit
        </v-btn>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import jsonFormsConfig from '@/assets/JsonFormsConfig.json'
import DateTimeField from '@/components/general/DateTimeField.vue'

import { vuetifyRenderers } from '@jsonforms/vue-vuetify'
import { computed, ref, watch, watchEffect } from 'vue'
import { ErrorObject } from 'ajv'

import { useWhatIfScenarios } from '@/services/useWhatIfScenarios'

import { JsonForms } from '@jsonforms/vue'
import ExpectedWorkflowRuntime from './ExpectedWorkflowRuntime.vue'
import AvailableWorkflowServers from './AvailableWorkflowServers.vue'
import type {
  PostWhatIfScenarioFilter,
  RunTaskFilter,
  WhatIfScenarioDescriptor,
  WhatIfTemplate,
} from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { useWhatIfTemplates } from '@/services/useWhatIfTemplate'
import {
  generateJsonSchema,
  getErrorsForProperties,
  getJsonDataFromProperties,
  ScenarioData,
} from '@/lib/whatif'
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import { postRunTask, postWhatIfScenario } from '@/lib/whatif/fetch'
import type { WorkflowItem } from '@/lib/workflows'

interface Props {
  workflows: WorkflowItem[]
}
const props = defineProps<Props>()

const selectedWhatIfTemplate = ref<WhatIfTemplate>()
const selectedWhatIfScenario = ref<WhatIfScenarioDescriptor>()
const selectedProperties = ref<ScenarioData>({})

const additionalErrors = ref<ErrorObject[]>([])

const isPosting = ref<boolean>(false)

const temporaryWhatIfScenarioName = 'Temporary'

// TODO: The userId is a random UUID now? Why don't we use the ID of the user
//       currently logged in if we have it?
const userId = ref<string>(crypto.randomUUID())
const timeZero = ref<Date>(new Date())
const description = ref<string>()

const selectedWorkflow = computed(() =>
  props.workflows.find(
    (wf) => wf.whatIfTemplateId === selectedWhatIfTemplate.value?.id,
  ),
)

const whatIfTemplateIds = computed(() =>
  props.workflows
    .map((wf) => wf.whatIfTemplateId)
    .filter((id) => id !== undefined),
)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { whatIfTemplates, isLoading: isLoadingTemplates } = useWhatIfTemplates(
  baseUrl,
  whatIfTemplateIds,
)
const { whatIfScenarios: allWhatIfScenarios, isLoading: isLoadingScenarios } =
  useWhatIfScenarios(baseUrl, () => selectedWhatIfTemplate.value?.id)
const whatIfScenarios = computed(() =>
  allWhatIfScenarios.value?.filter(
    (scenario) => scenario.name !== temporaryWhatIfScenarioName,
  ),
)

const jsonSchema = computed(() =>
  generateJsonSchema(selectedWhatIfTemplate.value?.properties),
)

watchEffect(() => {
  selectedProperties.value = getJsonDataFromProperties(
    selectedWhatIfScenario.value?.properties,
  )
})

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
  return hasSelectedWorkflow && hasAllProperties && hasNoErrors
})

const isSubmitted = ref<boolean>(false)
const hasSubmitError = ref<boolean>(false)
const submitErrorMessage = ref<string>('')

function onPropertiesChange(event: { data: ScenarioData }): void {
  const updatedProperties = event.data
  if (!updatedProperties) return
  selectedProperties.value = updatedProperties
}

watch(selectedProperties, (properties) => {
  additionalErrors.value = getErrorsForProperties(properties, jsonSchema.value)
})

async function submit(): Promise<void> {
  if (!selectedWorkflow.value) return
  if (!selectedWhatIfTemplate.value) return
  const whatIfTemplateId = selectedWhatIfTemplate.value.id
  const workflowId = selectedWorkflow.value.id
  const properties = selectedProperties.value as Record<string, string | number>

  const scenarioFilter: PostWhatIfScenarioFilter = {
    whatIfTemplateId,
    name: temporaryWhatIfScenarioName,
    properties,
  }

  isPosting.value = true
  const scenarioResult = await postWhatIfScenario(scenarioFilter)

  if (scenarioResult.status === 'success') {
    hasSubmitError.value = false
  } else {
    isSubmitted.value = true
    hasSubmitError.value = true
    submitErrorMessage.value = scenarioResult.error
    isPosting.value = false
    return
  }

  const timeZeroString = convertJSDateToFewsPiParameter(timeZero.value)

  const filter: RunTaskFilter = {
    workflowId,
    userId: userId.value,
    timeZero: timeZeroString,
    scenarioId: scenarioResult.data.id,
    description: description.value,
  }

  const result = await postRunTask(filter)
  isPosting.value = false

  isSubmitted.value = true
  if (result.status === 'success') {
    hasSubmitError.value = false
  } else {
    hasSubmitError.value = true
    submitErrorMessage.value = result.error
  }
}
</script>

<style scoped>
.whatif-container {
  max-width: 800px;
}
</style>
