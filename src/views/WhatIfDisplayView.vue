<template>
  <div v-if="whatIfWorkflows.length === 0" class="ma-4">
    {{ t('workflow.noTasksConfiguredForNode') }}
  </div>
  <WhatIfDisplay
    v-else
    :key="props.topologyNode?.id"
    :workflows="whatIfWorkflows"
  />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { getWorkflowIdsForNode } from '@/lib/workflows/tasks'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { WorkflowItem } from '@/lib/workflows'
import WhatIfDisplay from '@/components/tasksdisplay/WhatIfDisplay.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  topologyNode?: TopologyNode
}
const props = defineProps<Props>()

const availableWorkflowsStore = useAvailableWorkflowsStore()

const workflowIds = computed<string[]>(() =>
  props.topologyNode ? getWorkflowIdsForNode(props.topologyNode) : [],
)

const whatIfWorkflows = computed<WorkflowItem[]>(() =>
  availableWorkflowsStore.whatIfWorkflows.filter((wf) =>
    workflowIds.value.includes(wf.id),
  ),
)
</script>
