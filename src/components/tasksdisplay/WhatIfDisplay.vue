<template>
  <div class="d-flex w-100 h-100 justify-center overflow-y-auto">
    <div class="whatif-container w-100 d-flex flex-column gr-4 pa-4">
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
        v-model="selectedWhatIfScenario"
        :whatIfTemplateId="selectedWhatIfTemplate?.id"
        :temporaryWhatIfScenarioName
      />

      <template v-if="doShowConfiguration">
        <v-card flat border class="flex-0-0">
          <v-card-title>Scenario configuration</v-card-title>
          <v-card-text>
            <json-forms
              class="pt-1"
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
          <WhatIfTimeZeroSelect
            v-model="timeZero"
            :workflowId="selectedWorkflow?.id"
          />
        </div>

        <div>
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
        <div class="d-flex w-100">
          <v-spacer />
          <v-btn
            variant="flat"
            color="primary"
            :disabled="!canSubmit"
            @click="submit"
            width="300"
            class="my-2"
            :loading="isPosting"
          >
            Submit
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import jsonFormsConfig from '@/assets/JsonFormsConfig.json'
import WhatIfScenarioSelect from './WhatIfScenarioSelect.vue'
import WhatIfTimeZeroSelect from './WhatIfTimeZeroSelect.vue'

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
  generateJsonSchema,
  getErrorsForProperties,
  getJsonDataFromProperties,
  ScenarioData,
} from '@/lib/whatif'
import { postRunTask, postWhatIfScenario } from '@/lib/whatif/fetch'
import type { WorkflowItem } from '@/lib/workflows'
import { refreshTaskRuns } from '@/services/useTasksRuns'
import { useAvailableWhatIfTemplatesStore } from '@/stores/availableWhatIfTemplates'

interface Props {
  workflows: WorkflowItem[]
}
const props = defineProps<Props>()

const emit = defineEmits(['postTask'])

const availableWhatIfTemplatesStore = useAvailableWhatIfTemplatesStore()

const selectedWhatIfTemplate = ref<WhatIfTemplate>()
const selectedWhatIfScenario = ref<WhatIfScenarioDescriptor>()
const selectedProperties = ref<ScenarioData>({})

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
  },
  { immediate: true },
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
  const validTimeZero = timeZero.value !== undefined
  return hasSelectedWorkflow && hasAllProperties && hasNoErrors && validTimeZero
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

function resetAlerts(): void {
  isSubmitted.value = false
  hasSubmitError.value = false
  submitErrorMessage.value = ''
}

async function submit(): Promise<void> {
  if (!selectedWorkflow.value) return
  if (!selectedWhatIfTemplate.value) return
  const whatIfTemplateId = selectedWhatIfTemplate.value.id
  const workflowId = selectedWorkflow.value.id
  const properties = selectedProperties.value as Record<string, string | number>

  resetAlerts()

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

  const filter: RunTaskFilter = {
    workflowId,
    timeZero: timeZero.value,
    scenarioId: scenarioResult.data.id,
    description: description.value,
  }

  const result = await postRunTask(filter)
  isPosting.value = false

  setTimeout(() => {
    refreshTaskRuns()
  }, 1500)

  isSubmitted.value = true
  if (result.status === 'success') {
    emit('postTask', result.data)
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

.datetime-field :deep(.v-field) {
  padding-right: 0;
}
</style>
