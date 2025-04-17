<template>
  <div class="task-runs-panel h-100">
    <div class="d-flex pt-3 pb-2 align-center">
      <WorkflowFilterControl
        v-model="selectedWorkflowIds"
        @update:model-value="flagManuallyChanged"
      />
      <TaskStatusFilterControl v-model="selectedTaskStatuses" />
      <v-spacer />
      <v-checkbox-btn
        v-model="showAllSelectedTaskRuns"
        class="flex-0-0 me-2"
        density="compact"
        false-icon="mdi-chart-line"
        true-icon="mdi-chart-areaspline-variant"
        color="primary"
      />
      <PeriodFilterControl v-model="period" />
    </div>
    <div class="overflow-y-auto">
      <v-list-item v-if="sortedTasks.length === 0">
        {{
          showAllSelectedTaskRuns
            ? 'You have no visualized tasks'
            : 'No tasks available'
        }}
      </v-list-item>

      <!-- Important to have item-height as it greatly improves performance -->
      <v-virtual-scroll
        v-else
        class="scroll-container h-100"
        :items="groupedTasks"
        :item-height="62"
      >
        <template #default="{ item: task }">
          <div v-if="!isTaskRun(task)" class="mx-2">
            {{ task.label }}
          </div>
          <div v-else class="mb-2 mx-2">
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
        <v-progress-circular v-if="isLoading" size="20" indeterminate />
        <v-btn
          v-else
          density="compact"
          variant="plain"
          icon="mdi-refresh"
          @click="refreshTaskRuns()"
        />
      </template>
    </v-list-item>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { RelativePeriod } from '@/lib/period'
import { sortTasks, isTaskRun, TaskStatus } from '@/lib/taskruns'

import { useTaskRuns } from '@/services/useTasksRuns'

import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'

import TaskStatusFilterControl from './TaskStatusFilterControl.vue'
import TaskRunSummary from './TaskRunSummary.vue'
import WorkflowFilterControl from './WorkflowFilterControl.vue'
import PeriodFilterControl from './PeriodFilterControl.vue'
import { useTaskRunsStore } from '@/stores/taskRuns'

interface Props {
  topologyNodeId?: string
}

const props = defineProps<Props>()

const availableWorkflowsStore = useAvailableWorkflowsStore()
const taskRunsStore = useTaskRunsStore()

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
const {
  filteredTaskRuns,
  isLoading,
  lastUpdatedTimestamp,
  fetch: refreshTaskRuns,
} = useTaskRuns(
  TASKS_REFRESH_INTERVAL_SECONDS,
  period,
  selectedWorkflowIds,
  selectedTaskStatuses,
  () => props.topologyNodeId,
)
const showAllSelectedTaskRuns = ref(false)

const taskRuns = computed(() =>
  showAllSelectedTaskRuns.value
    ? taskRunsStore.selectedTaskRuns
    : filteredTaskRuns.value,
)

const sortedTasks = computed(() => taskRuns.value.sort(sortTasks))

const groupedTasks = computed(() => {
  const currentTasks = sortedTasks.value.filter((task) => task.isCurrent)
  const nonCurrentTasks = sortedTasks.value.filter((task) => !task.isCurrent)

  const result = []
  if (currentTasks.length) {
    result.push({ isHeader: true, label: 'Current' }, ...currentTasks)
  }
  if (nonCurrentTasks.length) {
    const label = showAllSelectedTaskRuns.value ? 'Visualized' : 'Non Current'
    result.push({ isHeader: true, label }, ...nonCurrentTasks)
  }

  return result
})

const lastUpdatedString = computed<string>(() => {
  const lastUpdated = lastUpdatedTimestamp.value
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
