<template>
  <WhatIfDisplay :key="props.topologyNode?.id" :workflows="whatIfWorkflows" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { getWorkflowIdsForNode } from '@/lib/workflows/tasks'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { WorkflowItem } from '@/lib/workflows'
import WhatIfDisplay from '@/components/tasksdisplay/WhatIfDisplay.vue'

interface Props {
  topologyNode?: TopologyNode
}
const props = defineProps<Props>()

const availableWorkflowsStore = useAvailableWorkflowsStore()

const workflowIds = computed<string[]>(() =>
  props.topologyNode ? getWorkflowIdsForNode(props.topologyNode) : [],
)

const whatIfWorkflows = computed<WorkflowItem[]>(() =>
  workflowIds.value
    .map((id) => availableWorkflowsStore.byId(id))
    .filter((wf) => wf !== undefined)
    .filter((wf) => wf.whatIfTemplateId !== undefined),
)
</script>
