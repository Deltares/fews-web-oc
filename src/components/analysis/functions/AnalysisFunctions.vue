<template>
  <div class="d-flex flex-column h-100">
    <v-tabs
      v-model="selectedFunction"
      variant="outlined"
      density="compact"
      mobile
      class="flex-0-0"
      align-tabs="center"
    >
      <v-tab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :prepend-icon="tab.icon"
        :text="tab.text"
        class="text-none"
      />
    </v-tabs>
    <div class="flex-1-1 overflow-auto">
      <AnalysisCorrelation
        v-if="selectedFunction === 'correlation'"
        :charts
        :series
        @addChart="emit('addChart', $event)"
        :isActive="isActive"
      />
      <AnalysisTimeResampling
        v-if="selectedFunction === 'time-resampling'"
        :filterId
        :charts
        :series
        :startTime
        :endTime
        :settings
        @addFilter="emit('addFilter', $event)"
        :isLoading="isLoading"
        :isActive="isActive"
      />
      <AnalysisWorkflow
        v-if="selectedFunction === activeWorkflowToolbox?.id"
        :key="activeWorkflowToolbox?.id"
        :customToolBox="activeWorkflowToolbox"
        @addChart="emit('addChart', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AnalysisCorrelation from '@/components/analysis/functions/AnalysisCorrelation.vue'
import AnalysisTimeResampling from '@/components/analysis/functions/AnalysisTimeResampling.vue'
import AnalysisWorkflow from '@/components/analysis/workflows/AnalysisWorkflow.vue'
import { computed, ref, watch } from 'vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { Chart, CollectionEmits } from '@/lib/analysis'
import type { DataAnalysisDisplayElement } from '@deltares/fews-pi-requests'

interface Props {
  filterId?: string
  charts: Chart[]
  series: Record<string, Series>
  startTime?: Date
  endTime?: Date
  config: DataAnalysisDisplayElement
  settings: ComponentSettings
  isLoading?: boolean
  isActive?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<CollectionEmits>()

const activeWorkflowToolbox = computed(() =>
  props.config.toolBoxes?.toolboxWorkflows?.find(
    (toolbox) => toolbox.id === selectedFunction.value,
  ),
)

const tabs = computed(() => {
  const toolboxes = props.config.toolBoxes
  const workflowToolboxes = toolboxes?.toolboxWorkflows ?? []
  return [
    {
      enabled: toolboxes?.correlation?.enabled ?? false,
      value: 'correlation',
      icon: 'mdi-function-variant',
      text: 'Correlation',
    },
    {
      enabled: toolboxes?.resampling?.enabled ?? false,
      value: 'time-resampling',
      icon: 'mdi-sigma',
      text: 'Time Resampling',
    },
    ...workflowToolboxes.map((item) => ({
      enabled: true,
      value: item.id,
      icon: item.iconId,
      text: item.name,
    })),
  ].filter((tab) => tab.enabled)
})

const selectedFunction = ref(tabs.value[0]?.value)

watch(tabs, resetSelectedFunction)
watch(() => props.isActive, resetSelectedFunction)
function resetSelectedFunction() {
  selectedFunction.value = tabs.value[0]?.value
}
</script>
