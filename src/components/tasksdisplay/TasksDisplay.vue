<template>
  <div class="w-75 mx-auto d-flex flex-column gr-4 pa-4">
    <v-select
      v-model="selectedWhatIfTemplate"
      :items="whatIfTemplates"
      item-title="name"
      label="Select what-if scenario template"
      hide-details
      return-object
      class="flex-0-0"
    />
    <v-select
      v-model="selectedWhatIfScenario"
      :items="whatIfScenarios"
      item-title="name"
      label="Select what-if scenario template"
      hide-details
      return-object
      class="flex-0-0"
    />
    <v-card flat border v-if="doShowConfiguration">
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
    <v-spacer />
    <div class="d-flex flex-row gc-4 mr-2">
      <ExpectedWorkflowRuntime :workflow-id="selectedWorkflow?.id ?? null" />
      <AvailableWorkflowServers :workflow-id="selectedWorkflow?.id ?? null" />
      <v-container class="px-0">
        <DateTimeField
          v-model="timeZero"
          date-label="T0 date"
          time-label="T0 time"
        />
      </v-container>
    </div>
    <v-btn
      variant="flat"
      color="primary"
      :disabled="!canSubmit"
      @click="submit"
    >
      Submit
    </v-btn>
    <v-alert
      v-if="isSubmitted && !hasSubmitError"
      class="flex-0-0"
      type="success"
    >
      Task submitted successfully.
    </v-alert>
    <v-alert v-if="isSubmitted && hasSubmitError" class="flex-0-0" type="error">
      Failed to submit task: {{ submitErrorMessage }}
    </v-alert>
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
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import type {
  PostWhatIfScenarioFilter,
  RunTaskFilter,
  TopologyNode,
  WhatIfScenarioDescriptor,
  WhatIfTemplate,
} from '@deltares/fews-pi-requests'
import { WorkflowItem } from '@/lib/workflows'
import { getWorkflowIdsForNode } from '@/lib/workflows/tasks'
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

const availableWorkflowsStore = useAvailableWorkflowsStore()

interface Props {
  topologyNode?: TopologyNode
}
const props = defineProps<Props>()

const selectedWhatIfTemplate = ref<WhatIfTemplate>()
const selectedWhatIfScenario = ref<WhatIfScenarioDescriptor>()
const selectedProperties = ref<ScenarioData>({})

const additionalErrors = ref<ErrorObject[]>([])

// TODO: The userId is a random UUID now? Why don't we use the ID of the user
//       currently logged in if we have it?
const userId = ref<string>(crypto.randomUUID())
const timeZero = ref<Date>(new Date())

const workflowIds = computed<string[]>(() =>
  props.topologyNode ? getWorkflowIdsForNode(props.topologyNode) : [],
)

const whatIfWorkflows = computed<WorkflowItem[]>(() =>
  workflowIds.value
    .map((id) => availableWorkflowsStore.byId(id))
    .filter((wf) => wf.whatIfTemplateId !== undefined),
)

const selectedWorkflow = computed(() =>
  whatIfWorkflows.value.find(
    (wf) => wf.whatIfTemplateId === selectedWhatIfTemplate.value?.id,
  ),
)

const whatIfTemplateIds = computed(() =>
  whatIfWorkflows.value
    .map((wf) => wf.whatIfTemplateId)
    .filter((id) => id !== undefined),
)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { whatIfTemplates } = useWhatIfTemplates(baseUrl, whatIfTemplateIds)
const { whatIfScenarios } = useWhatIfScenarios(
  baseUrl,
  () => selectedWhatIfTemplate.value?.id,
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
    name: 'Temporary',
    properties,
  }
  const scenarioResult = await postWhatIfScenario(scenarioFilter)

  if (scenarioResult.status === 'success') {
    hasSubmitError.value = false
  } else {
    isSubmitted.value = true
    hasSubmitError.value = true
    submitErrorMessage.value = scenarioResult.error
    return
  }

  const timeZeroString = convertJSDateToFewsPiParameter(timeZero.value)

  const filter: RunTaskFilter = {
    workflowId,
    userId: userId.value,
    timeZero: timeZeroString,
    scenarioId: scenarioResult.data.id,
  }

  const result = await postRunTask(filter)

  isSubmitted.value = true
  if (result.status === 'success') {
    hasSubmitError.value = false
  } else {
    hasSubmitError.value = true
    submitErrorMessage.value = result.error
  }
}
</script>
