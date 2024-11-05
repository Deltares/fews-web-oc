<template>
  <div class="w-100 h-100 pa-4 d-flex flex-column gr-2">
    <v-stepper v-model="currentStep" class="w-100" :items="steps">
      <template #item.1>
        <div class="d-flex flex-column gr-4 mx-2">
          <v-select
            v-model="selectedWhatIfTemplateId"
            :items="whatIfScenarios.templates.value"
            item-value="id"
            item-title="title"
            label="Select what-if scenario template"
            hide-details
          />
          <v-card>
            <v-card-text>
              <v-text-field
                v-model="description"
                label="Description"
                hide-details
              />
              <v-checkbox
                v-model="doApproveImmediately"
                label="Approve immediately"
                hide-details
              />
            </v-card-text>
          </v-card>
          <div class="d-flex flex-column align-end">
            <ExpectedWorkflowRuntime :workflow-id="workflowId" />
            <AvailableWorkflowServers :workflow-id="workflowId" />
          </div>
        </div>
      </template>
      <template #item.2>
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
      </template>
      <template #item.3>
        <WhatIfPropertiesSummary
          :properties="selectedProperties"
          :form-schemas="whatIfScenarios.formSchemas.value"
        />
      </template>
      <template #actions="{ prev, next }">
        <div class="d-flex px-6 pb-6">
          <v-btn @click="prev" :disabled="isFirstStep">Previous</v-btn>
          <v-spacer />
          <v-btn
            @click="onClickNextOrSubmit(next)"
            :disabled="!canContinue || isSubmitted"
            :color="nextButtonColor"
          >
            {{ nextButtonLabel }}
          </v-btn>
        </div>
      </template>
    </v-stepper>
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
import { computed, ref, watch } from 'vue'

import {
  SubmitStatus,
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
const isFirstStep = computed<boolean>(() => currentStep.value === 1)
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
const doApproveImmediately = ref<boolean>(false)

const isSubmitted = ref<boolean>(false)
const hasSubmitError = ref<boolean>(false)
const submitErrorMessage = ref<string>('')
watch(currentStep, () => {
  // Reset submit status if we change steps after submission; this means we can
  // submit another (or the same...) job.
  isSubmitted.value = false
  submitErrorMessage.value = ''
})

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

function onClickNextOrSubmit(next: () => void): void {
  if (isLastStep.value) {
    submit()
  } else {
    next()
  }
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
