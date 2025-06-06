<template>
  <WhatIfDisplay :workflows @postTask="addFilter" />
</template>

<script setup lang="ts">
import WhatIfDisplay from '@/components/tasksdisplay/WhatIfDisplay.vue'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import type {
  filterActionsFilter,
  ToolboxWorkflow,
} from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  customToolBox: ToolboxWorkflow
}
const props = defineProps<Props>()

interface Emits {
  addFilter: [filter: filterActionsFilter]
}
const emit = defineEmits<Emits>()

const workflowsStore = useAvailableWorkflowsStore()

const workflows = computed(() => {
  const workflow = workflowsStore.byId(props.customToolBox.workflowId)
  return workflow ? [workflow] : []
})

function addFilter(taskRunId: string) {
  emit('addFilter', {
    filterId: props.customToolBox.results.filterId,
    taskRunIds: taskRunId,
  })
}
</script>
