<template>
  <v-select
    v-if="whatIfScenarios.length || isLoadingScenarios"
    v-model="selected"
    :items="whatIfScenarios"
    :loading="isLoadingScenarios"
    item-title="name"
    label="Select what-if scenario"
    variant="solo-filled"
    flat
    density="compact"
    hide-details
    return-object
    class="flex-0-0"
  />
</template>

<script setup lang="ts">
import { configManager } from '@/services/application-config'
import { useWhatIfScenarios } from '@/services/useWhatIfScenarios'
import { WhatIfScenarioDescriptor } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  whatIfTemplateId: string | undefined
  temporaryWhatIfScenarioName: string
}
const props = defineProps<Props>()

const selected = defineModel<WhatIfScenarioDescriptor>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const { whatIfScenarios: allWhatIfScenarios, isLoading: isLoadingScenarios } =
  useWhatIfScenarios(baseUrl, () => props.whatIfTemplateId)

const whatIfScenarios = computed(() =>
  allWhatIfScenarios.value?.filter(
    (scenario) => scenario.name !== props.temporaryWhatIfScenarioName,
  ),
)
</script>
