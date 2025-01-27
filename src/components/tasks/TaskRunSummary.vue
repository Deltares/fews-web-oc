<template>
  <div class="d-flex flex-column">
    <div>
      <div class="d-flex flex-row justify-space-between">
        <div>
          {{ workflow.name }}
        </div>
        <div v-if="task.isScheduled" class="scheduled-task">Scheduled</div>
        <div v-else>{{ task.userId }}</div>
      </div>
    </div>
    <div v-if="!task.isScheduled && task.description" class="description">
      {{ task.description }}
    </div>
    <div class="d-flex flex-row align-center gc-4">
      <div
        class="status d-flex flex-row align-center gc-1"
        :class="statusClass"
      >
        <v-icon :icon="statusIcon" size="20" />
        <span>{{ statusString }}</span>
      </div>
      <TaskRunProgress
        v-if="isRunning"
        :dispatch-timestamp="task.dispatchTimestamp"
        :expected-runtime-seconds="workflow.expectedRuntimeSeconds"
        color="info"
      />
    </div>
    <div class="times d-flex flex-row gc-4">
      <div>
        <div>T0</div>
        <div>{{ timeZeroString }}</div>
      </div>
      <div>
        <div>Dispatched</div>
        <div>{{ dispatchTimeString }}</div>
      </div>
      <div v-if="task.status === TaskStatus.Running">
        <div>Expected completion</div>
        <div>{{ expectedCompletionTimeString }}</div>
      </div>
      <div v-else>
        <div>Completed</div>
        <div>{{ completionTimeString }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  convertTaskStatusToString,
  getTaskStatusCategory,
  TaskRun,
  TaskStatus,
  TaskStatusCategory,
} from '@/lib/taskruns'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { computed } from 'vue'
import TaskRunProgress from './TaskRunProgress.vue'

const availableWorkflowsStore = useAvailableWorkflowsStore()

interface Props {
  task: TaskRun
}
const props = defineProps<Props>()

const workflow = computed(() =>
  availableWorkflowsStore.byId(props.task.workflowId),
)

const isRunning = computed<boolean>(
  () => props.task.status === TaskStatus.Running,
)

const timeZeroString = computed<string>(() =>
  formatTimestamp(props.task.timeZeroTimestamp),
)
const dispatchTimeString = computed<string>(() =>
  formatTimestamp(props.task.dispatchTimestamp),
)
const completionTimeString = computed<string>(() =>
  formatTimestamp(props.task.completionTimestamp),
)
const expectedCompletionTimeString = computed<string>(() => {
  const expectedRunTime = workflow.value.expectedRuntimeSeconds
  if (expectedRunTime === null || props.task.dispatchTimestamp === null) {
    // We have no expected runtime, return a placeholder.
    return formatTimestamp(null)
  }
  const expectedCompletionTimestamp =
    props.task.dispatchTimestamp + expectedRunTime * 1000
  return formatTimestamp(expectedCompletionTimestamp)
})

const statusString = computed<string>(() =>
  convertTaskStatusToString(props.task.status),
)
const statusClass = computed<string>(() => {
  const category = getTaskStatusCategory(props.task.status)
  switch (category) {
    case TaskStatusCategory.Pending:
    case TaskStatusCategory.Running:
      return 'pending'
    case TaskStatusCategory.Completed:
      return 'success'
    case TaskStatusCategory.Failed:
      return 'failed'
  }
})
const statusIcon = computed<string>(() => {
  const category = getTaskStatusCategory(props.task.status)
  switch (category) {
    case TaskStatusCategory.Pending:
      return 'mdi-human-queue'
    case TaskStatusCategory.Running:
      return 'mdi-run'
    case TaskStatusCategory.Completed:
      return 'mdi-check'
    case TaskStatusCategory.Failed:
      return 'mdi-alert-circle'
  }
})

function formatTimestamp(timestamp: number | null): string {
  if (timestamp === null) return '—'

  const date = new Date(timestamp)
  return date.toLocaleString()
}
</script>

<style scoped>
.description {
  font-size: 0.8em;
}

.times {
  font-size: 0.8em;
}

.times > div {
  display: flex;
  flex-direction: column;
}

.scheduled-task {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.status.failed {
  color: rgb(var(--v-theme-error));
}

.status.success {
  color: rgb(var(--v-theme-success));
}

.status.pending {
  color: rgb(var(--v-theme-info));
}
</style>
