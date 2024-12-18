<template>
  <BaseTasksFilterControl
    v-model="selectedWorkflowIds"
    :items="workflowItems"
    label="Workflows"
    do-sort-items
  />
</template>
<script setup lang="ts">
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'

import BaseTasksFilterControl from '@/components/tasks/BaseTaskFilterControl.vue'
import { computed } from 'vue'

const availableWorkflowsStore = useAvailableWorkflowsStore()
const selectedWorkflowIds = defineModel<string[]>({ required: true })

const workflowItems = computed(() =>
  availableWorkflowsStore.workflows.map((workflow) => {
    const id = workflow.workflowId
    const isPreferred =
      availableWorkflowsStore.preferredWorkflowIds.includes(id)
    return {
      id,
      title: workflow.name,
      value: workflow.workflowId,
      isPreferred,
    }
  }),
)
</script>
