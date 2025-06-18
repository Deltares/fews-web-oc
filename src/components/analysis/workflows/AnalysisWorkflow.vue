<template>
  <WhatIfDisplay
    :workflows
    configuration-title="Configuration"
    hide-scenario-select
    hide-description
    @postTask="addChart"
  />
</template>

<script setup lang="ts">
import WhatIfDisplay from '@/components/tasksdisplay/WhatIfDisplay.vue'
import { AsyncChart, Chart } from '@/lib/analysis'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import type { ToolboxWorkflow } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  customToolBox: ToolboxWorkflow
}
const props = defineProps<Props>()

interface Emits {
  addChart: [chart: Chart]
}
const emit = defineEmits<Emits>()

const workflowsStore = useAvailableWorkflowsStore()

const workflows = computed(() => {
  const workflow = workflowsStore.byId(props.customToolBox.workflowId)
  return workflow ? [workflow] : []
})

function addChart(taskId: string) {
  const results = props.customToolBox.results
  const title = props.customToolBox.name

  const chart: AsyncChart = {
    id: crypto.randomUUID(),
    type: 'async',
    title,
    taskId,
    results,
  }

  emit('addChart', chart)
}
</script>
