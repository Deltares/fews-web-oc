<template>
  <div class="w-100 d-flex flex-column gr-4 pa-4">
    <div>
      <v-select
        v-model="selectedWhatIfTemplateId"
        :items="whatIfScenarios.templates.value"
        item-value="id"
        item-title="title"
        label="Select what-if scenario template"
        hide-details
      />
      <v-container v-if="workflow !== null">
        <v-row dense>
          <v-col cols="2">Workflow:</v-col>
          <v-col>{{ workflow.name }}</v-col>
        </v-row>
        <v-row v-if="workflow.description" dense>
          <v-col cols="2">Description:</v-col>
          <v-col>{{ workflow.description }}</v-col>
        </v-row>
      </v-container>
    </div>
    <v-card v-if="doShowConfiguration">
      <v-card-title>Scenario configuration</v-card-title>
      <v-card-text>
        <json-forms
          class="pt-2"
          :schema="whatIfScenarios.formSchemas.value?.properties"
          :uischema="whatIfScenarios.formSchemas.value?.ui"
          :data="selectedProperties"
          :renderers="Object.freeze(vuetifyRenderers)"
          :ajv="undefined"
          validation-mode="NoValidation"
          :config="jsonFormsConfig"
          @change="onPropertiesChange"
        />
      </v-card-text>
    </v-card>
    <v-card>
      <v-card-title>Run configuration</v-card-title>
      <v-card-text class="d-flex flex-column gr-2">
        <v-text-field
          v-model="whatIfScenarioName"
          label="What-if scenario name"
          hide-details
        />
        <v-text-field v-model="description" label="Description" hide-details />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <div class="d-flex flex-row gc-4 mr-2">
          <ExpectedWorkflowRuntime :workflow-id="workflowId" />
          <AvailableWorkflowServers :workflow-id="workflowId" />
        </div>
        <v-btn
          variant="flat"
          color="primary"
          :disabled="!canSubmit"
          @click="submit"
        >
          Submit
        </v-btn>
      </v-card-actions>
    </v-card>
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

import { vuetifyRenderers } from '@jsonforms/vue-vuetify'
import { computed, ref } from 'vue'

import {
  SubmitStatus,
  useWhatIfScenarios,
  WhatIfProperties,
} from '@/services/useWhatIfScenarios'

import { JsonForms } from '@jsonforms/vue'
import ExpectedWorkflowRuntime from './ExpectedWorkflowRuntime.vue'
import AvailableWorkflowServers from './AvailableWorkflowServers.vue'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'

const availableWorkflowsStore = useAvailableWorkflowsStore()

interface Props {
  nodeId: string
}
const props = defineProps<Props>()

const selectedWhatIfTemplateId = ref<string | null>(null)
const whatIfScenarios = useWhatIfScenarios(
  () => props.nodeId,
  availableWorkflowsStore.whatIfTemplateIds,
  selectedWhatIfTemplateId,
)

const workflow = computed(() =>
  selectedWhatIfTemplateId.value === null
    ? null
    : availableWorkflowsStore.byWhatIfTemplateId(
        selectedWhatIfTemplateId.value,
      ),
)
const workflowId = computed(() => workflow.value?.id ?? null)

const whatIfScenarioName = ref<string>('')
const description = ref<string>('')

const doShowConfiguration = computed<boolean>(() => workflowId.value !== null)

const hasAllRequiredProperties = computed<boolean>(() => {
  const propertiesSchema = whatIfScenarios.formSchemas.value?.properties
  if (!propertiesSchema) return false
  const requiredProperties = propertiesSchema.required ?? []
  return requiredProperties.every(
    (property) => property in selectedProperties.value,
  )
})
const canSubmit = computed<boolean>(() => {
  const hasSelectedWorkflow = workflowId.value !== null
  const hasAllProperties = hasAllRequiredProperties.value
  const hasScenarioName = whatIfScenarioName.value.trim() !== ''
  return hasSelectedWorkflow && hasAllProperties && hasScenarioName
})

const isSubmitted = ref<boolean>(false)
const hasSubmitError = ref<boolean>(false)
const submitErrorMessage = ref<string>('')
// FIXME: why does json-forms not support v-model? :-(
const selectedProperties = ref<WhatIfProperties>({})
function onPropertiesChange(event: { data?: WhatIfProperties }): void {
  const updatedProperties = event.data
  if (!updatedProperties) return
  selectedProperties.value = updatedProperties
}

async function submit(): Promise<void> {
  const result = await whatIfScenarios.submit(selectedProperties.value)

  isSubmitted.value = true
  if (result.status === SubmitStatus.Success) {
    hasSubmitError.value = false
  } else {
    hasSubmitError.value = true
    submitErrorMessage.value = result.error
  }
}
</script>
