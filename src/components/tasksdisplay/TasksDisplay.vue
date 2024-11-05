<template>
  <v-stepper v-model="currentStep" class="w-100" :items="steps">
    <template #item.1>
      <div class="d-flex flex-column">
        <v-select
          v-model="selectedWhatIfTemplateId"
          :items="whatIfScenarios.templates.value"
          item-value="id"
          item-title="title"
          label="Select what-if scenario template"
          hide-details
        />
        <ExpectedWorkflowRuntime :workflow-id="workflowId" />
        <AvailableWorkflowServers :workflow-id="workflowId" />
        <v-text-field v-model="description" label="Description" />
      </div>
    </template>
    <template #item.2>
      <json-forms
        :schema="whatIfScenarios.formSchemas.value?.properties"
        :uischema="whatIfScenarios.formSchemas.value?.ui"
        :data="selectedProperties"
        :renderers="Object.freeze(vuetifyRenderers)"
        :ajv="undefined"
        validation-mode="NoValidation"
        :config="jsonFormsConfig"
        @change="onPropertiesChange"
      />
    </template>
    <template #item.3>
      <WhatIfPropertiesSummary
        :properties="selectedProperties"
        :form-schemas="whatIfScenarios.formSchemas.value"
      />
    </template>
    <template #actions="{ prev, next }">
      <div class="d-flex px-6">
        <v-btn @click="prev">Previous</v-btn>
        <v-spacer />
        <v-btn @click="next" :disabled="!canContinue" :color="nextButtonColor">
          {{ nextButtonLabel }}
        </v-btn>
      </div>
    </template>
  </v-stepper>
</template>
<script setup lang="ts">
import jsonFormsConfig from '@/assets/JsonFormsConfig.json'

import { vuetifyRenderers } from '@jsonforms/vue-vuetify'
import { computed, ref } from 'vue'

import {
  useWhatIfScenarios,
  WhatIfProperties,
} from '@/services/useWhatIfScenarios'

import { JsonForms } from '@jsonforms/vue'
import ExpectedWorkflowRuntime from './ExpectedWorkflowRuntime.vue'
import AvailableWorkflowServers from './AvailableWorkflowServers.vue'
import WhatIfPropertiesSummary from './WhatIfPropertiesSummary.vue'

interface Props {
  nodeId: string
}
const props = defineProps<Props>()

const steps = ['Select task', 'Configure task', 'Submit task']

const selectedWhatIfTemplateId = ref<string | null>(null)
const whatIfScenarios = useWhatIfScenarios(
  () => props.nodeId,
  selectedWhatIfTemplateId,
)

const currentStep = ref<number>(1)
const isLastStep = computed<boolean>(() => currentStep.value === 3)
const nextButtonLabel = computed<string>(() =>
  isLastStep.value ? 'Submit' : 'Next',
)
const nextButtonColor = computed<string | undefined>(() =>
  isLastStep.value ? 'primary' : undefined,
)

const workflowId = computed(
  () => whatIfScenarios.selectedTemplate.value?.workflowId ?? null,
)

const description = ref<string>('')

// FIXME: why does json-forms not support v-model? :-(
const selectedProperties = ref<WhatIfProperties>({})
function onPropertiesChange(event: { data?: WhatIfProperties }): void {
  const updatedProperties = event.data
  if (!updatedProperties) return
  selectedProperties.value = updatedProperties
}

const canContinue = computed<boolean>(() => {
  if (currentStep.value === 1) {
    // We should have selected a what-if template.
    return selectedWhatIfTemplateId.value !== null
  } else if (currentStep.value === 2) {
    // All required properties should have been filled in.
    return hasAllRequiredProperties.value
  } else {
    return true
  }
})

const hasAllRequiredProperties = computed<boolean>(() => {
  const propertiesSchema = whatIfScenarios.formSchemas.value?.properties
  if (!propertiesSchema) return false
  const requiredProperties = propertiesSchema.required ?? []
  return requiredProperties.every(
    (property) => property in selectedProperties.value,
  )
})
</script>
