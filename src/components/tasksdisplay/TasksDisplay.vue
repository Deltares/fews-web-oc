<template>
  <div class="w-75 mx-auto d-flex flex-column gr-4 pa-4">
    <v-select
      v-model="selectedWorkflow"
      :items="whatIfWorkflows"
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
    <v-spacer />
    <div class="d-flex flex-row gc-4 mr-2">
      <ExpectedWorkflowRuntime :workflow-id="selectedWorkflow?.id ?? null" />
      <AvailableWorkflowServers :workflow-id="selectedWorkflow?.id ?? null" />
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
import { TopologyNode } from '@deltares/fews-pi-requests'
import { WorkflowItem } from '@/lib/workflows'
import { getWorkflowIdsForNode } from '@/lib/workflows/tasks'

const availableWorkflowsStore = useAvailableWorkflowsStore()

interface Props {
  nodeId?: string | string[]
  topologyNode?: TopologyNode
}
const props = defineProps<Props>()

const nodeId = computed(() => {
  if (Array.isArray(props.nodeId)) {
    return props.nodeId[props.nodeId.length - 1]
  }
  return props.nodeId ?? ''
})

const workflowIds = computed<string[]>(() =>
  props.topologyNode ? getWorkflowIdsForNode(props.topologyNode) : [],
)
const workflows = computed<WorkflowItem[]>(() =>
  workflowIds.value.map((id) => availableWorkflowsStore.byId(id)),
)

const selectedWorkflow = ref<WorkflowItem>()
const whatIfWorkflows = computed(() =>
  workflows.value.filter((wf) => wf.whatIfTemplateId !== undefined),
)
const whatIfScenarios = useWhatIfScenarios(
  nodeId,
  availableWorkflowsStore.whatIfTemplateIds,
  () => selectedWorkflow.value?.whatIfTemplateId ?? null,
)

const whatIfScenarioName = ref<string>('')

const doShowConfiguration = computed<boolean>(
  () => selectedWorkflow.value !== undefined,
)

const hasAllRequiredProperties = computed<boolean>(() => {
  const propertiesSchema = whatIfScenarios.formSchemas.value?.properties
  if (!propertiesSchema) return false
  const requiredProperties = propertiesSchema.required ?? []
  return requiredProperties.every(
    (property) => property in selectedProperties.value,
  )
})
const canSubmit = computed<boolean>(() => {
  const hasSelectedWorkflow = selectedWorkflow.value !== undefined
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
