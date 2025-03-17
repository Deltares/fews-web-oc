<template>
  <v-card
    border
    flat
    density="compact"
    @click="expanded = !expanded"
    :ripple="false"
  >
    <TaskRunProgress
      v-if="isRunning"
      :dispatch-timestamp="task.dispatchTimestamp"
      :expected-runtime-seconds="expectedRunTimeSeconds"
      color="info"
    />
    <v-card-text class="py-2 h-100">
      <div class="d-flex">
        <div>
          <div class="d-flex align-center ga-2">
            <v-tooltip>
              <template #activator="{ props }">
                <v-icon
                  class="me-2"
                  :icon="statusIcon"
                  :color="statusColor"
                  size="20"
                  v-bind="props"
                />
              </template>
              <span>{{ statusString }}</span>
            </v-tooltip>
            <v-list-item-title>
              {{ workflowTitle }}
            </v-list-item-title>
          </div>
          <v-list-item-subtitle>
            {{ dispatchTimeString }} - {{ whatIfTemplate?.name }}
          </v-list-item-subtitle>
          <div class="d-flex gap-2 align-center">
            <div class="d-flex flex-column user-select-text cursor-pointer">
              <v-card-subtitle class="pa-0">
                T0: {{ timeZeroString }} - ETA:
                {{ expectedCompletionTimeString }}
              </v-card-subtitle>
            </div>
          </div>
        </div>
      </div>
      <template v-if="expanded">
        <div @click.stop class="user-select-text">
          {{ workflow?.description }}
        </div>
        <div @click.stop class="user-select-text">{{ task.description }}</div>
        <div class="table-container mt-1">
          <table @click.stop class="running-tasks-table user-select-text">
            <thead>
              <tr>
                <th>User</th>
                <th>Task run ID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ task.userId ?? 'No user' }}</td>
                <td>{{ task.taskId }}</td>
              </tr>
            </tbody>
          </table>
          <table @click.stop class="running-tasks-table user-select-text">
            <thead>
              <tr>
                <th>Task duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {{ taskDurationString }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
<script setup lang="ts">
import {
  convertTaskStatusToString,
  getColorForTaskStatus,
  getIconForTaskStatus,
  TaskRun,
  TaskStatus,
} from '@/lib/taskruns'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { computed, ref } from 'vue'
import TaskRunProgress from './TaskRunProgress.vue'
import { toDateSpanString, toHumanReadableDate } from '@/lib/date'
import { useWhatIfTemplate } from '@/services/useWhatIfTemplate'
import { configManager } from '@/services/application-config'

const availableWorkflowsStore = useAvailableWorkflowsStore()

interface Props {
  task: TaskRun
}
const props = defineProps<Props>()

const expanded = ref(false)

const workflow = computed(() =>
  availableWorkflowsStore.byId(props.task.workflowId),
)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { whatIfTemplate } = useWhatIfTemplate(
  baseUrl,
  () => workflow.value?.whatIfTemplateId,
)

const expectedRunTimeSeconds = computed(
  () => workflow.value?.expectedRuntimeSeconds ?? null,
)

const workflowTitle = computed(() => workflow.value?.name ?? 'Unknown workflow')

const isRunning = computed<boolean>(
  () => props.task.status === TaskStatus.Running,
)

const dispatchTimeString = computed<string>(() =>
  toHumanReadableDate(props.task.dispatchTimestamp),
)

const timeZeroString = computed<string>(() =>
  toHumanReadableDate(props.task.timeZeroTimestamp),
)

const taskDurationString = computed(() =>
  toDateSpanString(
    props.task.dispatchTimestamp,
    props.task.completionTimestamp,
  ),
)

const expectedCompletionTimeString = computed<string>(() => {
  const expectedRunTime = expectedRunTimeSeconds.value
  if (expectedRunTime === null || props.task.dispatchTimestamp === null) {
    // We have no expected runtime, return a placeholder.
    return toHumanReadableDate(null)
  }
  const expectedCompletionTimestamp =
    props.task.dispatchTimestamp + expectedRunTime * 1000
  return toHumanReadableDate(expectedCompletionTimestamp)
})

const statusString = computed<string>(() =>
  convertTaskStatusToString(props.task.status),
)
const statusColor = computed<string>(() =>
  getColorForTaskStatus(props.task.status),
)
const statusIcon = computed<string>(() =>
  getIconForTaskStatus(props.task.status),
)
</script>

<style scoped>
.table-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.running-tasks-table {
  border-collapse: collapse;
}

.running-tasks-table th,
.running-tasks-table td {
  text-align: left;
  padding-right: 10px;
}

.running-tasks-table td {
  padding-bottom: 5px;
}

.user-select-text {
  user-select: text;
  cursor: text;
}

.selection-container {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
}
</style>
