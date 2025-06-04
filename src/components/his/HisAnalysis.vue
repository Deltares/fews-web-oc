<template>
  <div class="d-flex flex-column h-100">
    <v-tabs
      v-model="selectedFunction"
      variant="outlined"
      density="compact"
      mobile
      class="flex-0-0"
    >
      <v-tab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        :prepend-icon="tab.icon"
        :text="tab.text"
      />
    </v-tabs>
    <div class="flex-1-1 overflow-auto">
      <HisCorrelation
        v-if="selectedFunction === 'correlation'"
        :charts
        :series
        @addChart="emit('addChart', $event)"
        :isActive="isActive"
      />
      <HisTimeResampling
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
      <HisWorkflow
        v-if="selectedFunction === activeWorkflowToolbox?.id"
        :customToolBox="activeWorkflowToolbox"
        @addFilter="emit('addFilter', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import HisCorrelation from '@/components/his/functions/HisCorrelation.vue'
import HisTimeResampling from '@/components/his/functions/HisTimeResampling.vue'
import HisWorkflow from '@/components/his/functions/HisWorkflow.vue'
import { computed, ref, watch } from 'vue'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { Chart } from '@/lib/analysis'
import { filterActionsFilter } from '@deltares/fews-pi-requests'
import { DataAnalysisDisplay } from '@/services/useDataAnalysisDisplay'

interface Props {
  filterId?: string
  charts: Chart[]
  series: Record<string, Series>
  startTime?: Date
  endTime?: Date
  config: DataAnalysisDisplay
  settings: ComponentSettings
  isLoading?: boolean
  isActive?: boolean
}

const props = defineProps<Props>()

interface Emits {
  addChart: [chart: Chart]
  addFilter: [filter: filterActionsFilter]
}
const emit = defineEmits<Emits>()

const activeWorkflowToolbox = computed(() =>
  props.config.toolBoxes?.toolboxWorkflow?.find(
    (toolbox) => toolbox.id === selectedFunction.value,
  ),
)

const tabs = computed(() => {
  const toolboxes = props.config.toolBoxes
  const workflowToolboxes = toolboxes?.toolboxWorkflow ?? []
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
