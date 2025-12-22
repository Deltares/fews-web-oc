<template>
  <div class="task-runs-panel h-100">
    <div class="d-flex pt-3 pb-2 align-center">
      <WorkflowFilterControl v-model="selectedWorkflowIds" />
      <TaskStatusFilterControl v-model="selectedTaskStatuses" />
      <v-spacer />
      <PeriodFilterControl v-model="period" />
    </div>
    <div class="task-content">
      <v-list-item v-if="sortedTasks.length === 0">
        No tasks available.
      </v-list-item>

      <!-- Important to have item-height as it greatly improves performance -->
      <v-virtual-scroll
        v-else
        class="overflow-y-auto h-100"
        :items="groupedTasks"
        :item-height="62"
      >
        <template #default="{ item: task }">
          <v-btn
            v-if="!isTaskRun(task)"
            class="mx-2 px-1 text-none"
            variant="plain"
            :append-icon="getTaskSectionIcon(task.label)"
            @click="toggleTaskSection(task.label)"
          >
            {{ task.label }}
          </v-btn>
          <div v-else class="my-1 mx-2">
            <TaskRunSummary
              :task="task"
              :key="task.taskId"
              v-model:expanded="expandedItems[task.taskId]"
            />
          </div>
        </template>
      </v-virtual-scroll>
    </div>
    <v-divider />
    <v-footer>
      <div class="refresh-container ms-3">
        Last updated: {{ lastUpdatedString }}
      </div>
      <v-spacer />
      <v-btn
        density="compact"
        variant="plain"
        icon="mdi-refresh"
        :loading="isLoading"
        @click="refreshTaskRuns()"
      >
        <template #loader>
          <v-progress-circular size="20" indeterminate />
        </template>
      </v-btn>
    </v-footer>
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
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const availableWorkflowsStore = useAvailableWorkflowsStore()

const selectedWorkflowIds = ref<string[]>(availableWorkflowsStore.workflowIds)
const expandedItems = ref<Record<string, boolean>>({})

// Set preferred workflow IDs for the running tasks menu, if this node has
// associated workflows.
watch(
  () => props.topologyNode,
  (node) => {
    const primaryWorkflowId = node?.workflowId ? [node.workflowId] : []
    const secondaryWorkflowIds =
      node?.secondaryWorkflows?.map(
        (workflow) => workflow.secondaryWorkflowId,
      ) ?? []
    // Note: this list of workflow IDs may be empty, in which case we have no
    //       preferred workflow.
    const preferredWorkflowIds = [...primaryWorkflowId, ...secondaryWorkflowIds]
    availableWorkflowsStore.setPreferredWorkflowIds(preferredWorkflowIds)

    if (preferredWorkflowIds.length > 0) {
      // If we have preferred workflow IDs, select them.
      selectedWorkflowIds.value = preferredWorkflowIds
    } else {
      // Otherwise, select all available workflows.
      selectedWorkflowIds.value = availableWorkflowsStore.workflowIds
    }
  },
  { immediate: true },
)

const allTaskStatuses = Object.values(TaskStatus)
const selectedTaskStatuses = ref<TaskStatus[]>(allTaskStatuses)
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
  () => props.topologyNode?.id,
)

const sortedTasks = computed(() => filteredTaskRuns.value.toSorted(sortTasks))
const showCurrent = ref(true)
const showNonCurrent = ref(true)

const groupedTasks = computed(() => {
  const currentTasks = sortedTasks.value.filter((task) => task.isCurrent)
  const nonCurrentTasks = sortedTasks.value.filter((task) => !task.isCurrent)

  const result = []
  if (currentTasks.length) {
    result.push({ isHeader: true, label: 'Current' })
    if (showCurrent.value) {
      result.push(...currentTasks)
    }
  }
  if (nonCurrentTasks.length) {
    result.push({ isHeader: true, label: 'Non Current' })
    if (showNonCurrent.value) {
      result.push(...nonCurrentTasks)
    }
  }

  return result
})

function toggleTaskSection(label: string) {
  if (label === 'Current') {
    showCurrent.value = !showCurrent.value
  } else if (label === 'Non Current') {
    showNonCurrent.value = !showNonCurrent.value
  }
}

function getTaskSectionIcon(label: string) {
  if (label === 'Current') {
    return showCurrent.value ? 'mdi-chevron-down' : 'mdi-chevron-right'
  } else if (label === 'Non Current') {
    return showNonCurrent.value ? 'mdi-chevron-down' : 'mdi-chevron-right'
  }
  return ''
}

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
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  height: 100%;
  overflow: hidden;
}

.task-content {
  overflow: hidden;
  position: relative;
}
</style>
