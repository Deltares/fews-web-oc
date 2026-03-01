<template>
  <v-list-item>
    <div class="d-flex align-center ga-2">
      <v-icon icon="mdi-circle" size="sm" :color :disabled="item?.isCurrent" />

      <div>
        <v-list-item-title class="selected-task-run-title">
          {{ workflowName }}
        </v-list-item-title>

        <v-list-item-subtitle class="selected-task-run-subtitle">
          {{ timeZeroString }}
        </v-list-item-subtitle>
      </div>
      <slot name="append" />
    </div>
  </v-list-item>
</template>

<script setup lang="ts">
import type { TaskRun } from '@/lib/taskruns'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { toHumanReadableDateTime } from '@/lib/date'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import { computed } from 'vue'

interface Props {
  item: TaskRun | undefined
}
const { item } = defineProps<Props>()

const availableWorkflowsStore = useAvailableWorkflowsStore()
const taskRunColorsStore = useTaskRunColorsStore()

const workflowName = computed(() => {
  if (!item) return 'Unknown task'
  const workflow = availableWorkflowsStore.byId(item.workflowId)
  return workflow ? workflow.name : 'Unknown workflow'
})

const timeZeroString = computed(() => {
  if (!item) return ''
  return toHumanReadableDateTime(item.timeZeroTimestamp)
})

const color = computed(() => {
  if (!item) return
  return taskRunColorsStore.getColor(item.taskId)
})
</script>

<style scoped>
.selected-task-run-title {
  line-height: 1;
  font-size: 0.875rem;
}

.selected-task-run-subtitle {
  font-size: 0.75rem;
}
</style>
