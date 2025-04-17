<template>
  <div class="task-runs-panel h-100">
    <div class="d-flex pt-3 pb-2">
      <WorkflowFilterControl
        v-model="selectedWorkflowIds"
        @update:model-value="flagManuallyChanged"
      />
      <TaskStatusFilterControl v-model="selectedTaskStatuses" />
      <v-spacer />
      <PeriodFilterControl v-model="period" />
    </div>
    <div class="overflow-y-auto">
      <v-list-item v-if="sortedTasks.length === 0">
        No tasks available
      </v-list-item>

      <!-- Important to have item-height as it greatly improves performance -->
      <v-virtual-scroll
        class="scroll-container h-100"
        :items="sortedTasks"
        :item-height="62"
      >
        <template #default="{ item: task }">
          <div class="mb-2 mx-2">
            <TaskRunSummary
              :task="task"
              v-model:expanded="expandedItems[task.taskId]"
            />
          </div>
        </template>
      </v-virtual-scroll>
    </div>
    <v-divider />
    <v-list-item :title="`Last updated: ${lastUpdatedString}`">
      <template #append>
        <v-progress-circular
          v-if="taskRuns.isLoading.value"
          size="20"
          indeterminate
        />
        <v-btn
          v-else
          density="compact"
          variant="plain"
          icon="mdi-refresh"
          @click="taskRuns.fetch()"
        />
      </template>
    </v-list-item>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { RelativePeriod } from '@/lib/period'
import { TaskRun, TaskStatus } from '@/lib/taskruns'

import { useTaskRuns } from '@/services/useTasksRuns'

import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'

import TaskStatusFilterControl from './TaskStatusFilterControl.vue'
import TaskRunSummary from './TaskRunSummary.vue'
import WorkflowFilterControl from './WorkflowFilterControl.vue'
import PeriodFilterControl from './PeriodFilterControl.vue'

interface Props {
  topologyNodeId?: string
}

const props = defineProps<Props>()

const availableWorkflowsStore = useAvailableWorkflowsStore()

const selectedWorkflowIds = ref<string[]>(availableWorkflowsStore.workflowIds)
const expandedItems = ref<Record<string, boolean>>({})

// Automatically select preferred workflow IDs if the user has not changed the
// filter manually yet, otherwise, leave the filter as-is.
let hasChangedWorkflowsFilterManually = false
const flagManuallyChanged = () => (hasChangedWorkflowsFilterManually = true)
watch(
  () => availableWorkflowsStore.preferredWorkflowIds,
  (preferredWorkflowIds) => {
    if (hasChangedWorkflowsFilterManually) return
    if (preferredWorkflowIds.length === 0) {
      // If we have no preferred workflow IDs, select all.
      selectedWorkflowIds.value = availableWorkflowsStore.workflowIds
    } else {
      // Otherwise, show only the preferred workflow IDs.
      selectedWorkflowIds.value = preferredWorkflowIds
    }
  },
)

// The request for the available workflows may still be pending while this
// component is created, so we may initialise the default selected workflows
// with an empty array. To fix this, we reinitialise our selection upon changes
// in the workflows, which occur when they have been fetched.
watch(
  () => availableWorkflowsStore.workflowIds,
  (fetchedWorkflowIds) => {
    selectedWorkflowIds.value = fetchedWorkflowIds
  },
  { once: true },
)

// Select all task statuses by default.
const selectedTaskStatuses = ref<TaskStatus[]>(Object.values(TaskStatus))

// Look 1 day back by default.
const period = ref<RelativePeriod | null>({
  startOffsetSeconds: -24 * 60 * 60,
  endOffsetSeconds: 0,
})

const TASKS_REFRESH_INTERVAL_SECONDS = 15
const taskRuns = useTaskRuns(
  TASKS_REFRESH_INTERVAL_SECONDS,
  period,
  selectedWorkflowIds,
  selectedTaskStatuses,
  () => props.topologyNodeId,
)

const sortedTasks = computed<TaskRun[]>(() => {
  return taskRuns.filteredTaskRuns.value.sort((a, b) => {
    const hasDispatchTimeA = a.dispatchTimestamp !== null
    const hasDispatchTimeB = b.dispatchTimestamp !== null
    if (!hasDispatchTimeA && !hasDispatchTimeB) {
      // If both tasks are pending, sort by workflowId.
      return a.workflowId.localeCompare(b.workflowId)
    } else if (!hasDispatchTimeA) {
      // If A is pending and B is not, return A.
      return -1
    } else if (!hasDispatchTimeB) {
      // If B is pending and A is not, return B.
      return 1
    } else {
      // Otherwise, sort by timestamp.
      return b.dispatchTimestamp! - a.dispatchTimestamp!
    }
  })
})

const lastUpdatedString = computed<string>(() => {
  const lastUpdated = taskRuns.lastUpdatedTimestamp.value
  if (lastUpdated === null) return '—'
  return new Date(lastUpdated).toLocaleString()
})
</script>

<style scoped>
.refresh-container {
  height: 28px;
}

.task-runs-panel {
  width: 450px;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
}
</style>
