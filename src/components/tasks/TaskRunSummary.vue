<template>
  <v-card
    border
    flat
    density="compact"
    @click="onExpansionPanelToggle"
    :ripple="false"
  >
    <v-card-text class="py-2 h-100">
      <div class="d-flex w-100">
        <div class="w-100">
          <v-list-item-subtitle class="mb-1">
            {{ dispatchTimeString }} &bull; T0: {{ timeZeroString }}
            <span v-if="task.isCurrent"> &bull; Current</span>
          </v-list-item-subtitle>
          <div class="d-flex align-center ga-1 w-100">
            <v-tooltip>
              <template #activator="{ props }">
                <v-icon
                  class="me-1 flex-0-0"
                  :icon="statusIcon"
                  :color="statusColor"
                  size="20"
                  v-bind="props"
                />
              </template>
              <span>{{ statusString }}</span>
            </v-tooltip>
            <div class="flex-1-1 overflow-hidden">
              <v-list-item-title :class="{ 'text-wrap': expanded }">
                {{ workflowTitle }}
              </v-list-item-title>
              <v-list-item-subtitle
                v-if="whatIfTemplate"
                :class="{ 'text-wrap': expanded, 'text-wrap-no': !expanded }"
              >
                {{ whatIfTemplate.name }}
              </v-list-item-subtitle>
            </div>
          </div>
        </div>
      </div>
      <template v-if="expanded">
        <div class="table-container mt-1">
          <table v-for="table in tableData" class="running-tasks-table">
            <thead>
              <tr>
                <th v-for="column in table.columns.filter((c) => !!c.value)">
                  {{ column.header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td v-for="column in table.columns.filter((c) => !!c.value)">
                  {{ column.value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </v-card-text>
    <TaskRunProgress
      v-if="isRunning"
      :dispatch-timestamp="task.dispatchTimestamp"
      :expected-runtime-seconds="expectedRunTimeSeconds"
      color="info"
    />
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
import { computed } from 'vue'
import TaskRunProgress from './TaskRunProgress.vue'
import { toDateSpanString, toHumanReadableDate } from '@/lib/date'
import type { WhatIfTemplate } from '@deltares/fews-pi-requests'

const availableWorkflowsStore = useAvailableWorkflowsStore()

interface Props {
  task: TaskRun
  whatIfTemplates: WhatIfTemplate[]
}
const props = defineProps<Props>()

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

const tableData = computed(() => {
  const data = [
    {
      columns: [{ header: 'Task Description', value: props.task.description }],
    },
    {
      columns: [
        { header: 'Workflow Description', value: workflow.value?.description },
      ],
    },
    {
      columns: [
        { header: 'User', value: props.task.userId ?? 'No user' },
        { header: 'Task run ID', value: props.task.taskId },
      ],
    },
    {
      columns: [{ header: 'Output time span', value: outputTimeString.value }],
    },
    {
      columns: [{ header: 'Task duration', value: taskDurationString.value }],
    },
    {
      columns: [
        {
          header: 'Expected completion time',
          value: expectedCompletionTimeString.value,
        },
      ],
    },
  ]
  return data.filter((table) => table.columns.some((c) => !!c.value))
})

const workflow = computed(() =>
  availableWorkflowsStore.byId(props.task.workflowId),
)

const whatIfTemplate = computed(() =>
  props.whatIfTemplates.find(
    (template) => template.id === workflow.value?.whatIfTemplateId,
  ),
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

const outputTimeString = computed(() =>
  toDateSpanString(
    props.task.outputStartTimestamp,
    props.task.outputEndTimestamp,
  ),
)

const expectedCompletionTimeString = computed(() => {
  const expectedRunTime = expectedRunTimeSeconds.value
  if (expectedRunTime === null || props.task.dispatchTimestamp === null) {
    return
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

function onExpansionPanelToggle() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}
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

.selection-container {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
}

.text-wrap {
  white-space: normal;
}

.text-wrap-no {
  white-space: nowrap;
}
</style>
