<template>
  <v-card
    border
    flat
    density="compact"
    @click="onExpansionPanelToggle"
    :ripple="false"
  >
    <div
      class="task_run__border"
      v-if="isCompleted && canVisualize && !task.isCurrent"
    />
    <v-card-text class="py-2 h-100 flex-grow-1">
      <div class="d-flex w-100">
        <div class="w-100">
          <v-list-item-subtitle class="mb-1">
            {{ timeZeroString }}
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
              <div :class="{ 'text-wrap': expanded }">
                {{ workflowTitle }}
              </div>
              <v-list-item-subtitle
                v-if="whatIfTemplate"
                :class="{ 'text-wrap': expanded, 'text-wrap-no': !expanded }"
              >
                {{ whatIfTemplate.name }}
              </v-list-item-subtitle>
            </div>
            <v-checkbox-btn
              v-if="isCompleted && canVisualize"
              v-model="selected"
              class="flex-0-0"
              density="compact"
              trueIcon="mdi-chart-areaspline-variant"
              falseIcon="mdi-chart-line"
              color="primary"
              :disabled="task.isCurrent"
              @click.stop="taskRunsStore.toggleTaskRun(task)"
            >
              <v-tooltip
                text="Visualize task in graphs"
                open-delay="500"
                activator="parent"
              />
            </v-checkbox-btn>
          </div>
        </div>
      </div>
      <DataTable v-if="expanded" class="mt-4" :tableData="tableData" />
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
  getTaskStatusCategory,
  TaskRun,
  TaskStatus,
  TaskStatusCategory,
} from '@/lib/taskruns'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { computed } from 'vue'
import TaskRunProgress from './TaskRunProgress.vue'
import DataTable from '@/components/general/DataTable.vue'
import {
  toDateAbsDifferenceString,
  toDateRangeString,
  toHumanReadableDate,
} from '@/lib/date'
import { useAvailableWhatIfTemplatesStore } from '@/stores/availableWhatIfTemplates'
import { useTaskRunsStore } from '@/stores/taskRuns'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'

const availableWorkflowsStore = useAvailableWorkflowsStore()
const availableWhatIfTemplatesStore = useAvailableWhatIfTemplatesStore()
const taskRunsStore = useTaskRunsStore()
const taskRunColorsStore = useTaskRunColorsStore()

interface Props {
  task: TaskRun
  canVisualize: boolean
}
const props = defineProps<Props>()

const taskRunColor = computed(() => {
  // Get color from store, fallback to 'primary' if not found
  return taskRunColorsStore.getColor(props.task.taskId) || 'primary'
})

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

// This should be done with :model-value but its internal watch sometimes
// doesn't trigger when the value changes
const selected = computed({
  get() {
    return taskRunsStore.taskRunIsSelected(props.task) || props.task.isCurrent
  },
  set(_) {
    // No-op
  },
})

const tableData = computed(() => [
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
    columns: [{ header: 'T0', value: timeZeroString.value }],
  },
  {
    columns: [
      {
        header: 'Output time span',
        subHeader: outputTimeDifferenceString.value,
        value: outputTimeString.value,
      },
    ],
  },
  {
    columns: [
      {
        header: 'Task duration',
        subHeader: taskDurtionDifferenceString.value,
        value: taskDurationString.value,
      },
    ],
  },
  {
    columns: [
      {
        header: 'Expected completion time',
        value: expectedCompletionTimeString.value,
      },
    ],
  },
])

const workflow = computed(() =>
  availableWorkflowsStore.byId(props.task.workflowId),
)

const whatIfTemplate = computed(() =>
  availableWhatIfTemplatesStore.byId(workflow.value?.whatIfTemplateId),
)

const expectedRunTimeSeconds = computed(
  () => workflow.value?.expectedRuntimeSeconds ?? null,
)

const workflowTitle = computed(() => workflow.value?.name ?? 'Unknown workflow')

const isRunning = computed<boolean>(
  () => props.task.status === TaskStatus.Running,
)

const timeZeroString = computed<string>(() =>
  toHumanReadableDate(props.task.timeZeroTimestamp),
)

const taskDurationString = computed(() =>
  toDateRangeString(
    props.task.dispatchTimestamp,
    props.task.completionTimestamp,
  ),
)

const taskDurtionDifferenceString = computed(() =>
  toDateAbsDifferenceString(
    props.task.dispatchTimestamp,
    props.task.completionTimestamp,
  ),
)

const outputTimeString = computed(() =>
  toDateRangeString(
    props.task.outputStartTimestamp,
    props.task.outputEndTimestamp,
  ),
)

const outputTimeDifferenceString = computed(() =>
  toDateAbsDifferenceString(
    props.task.outputStartTimestamp,
    props.task.outputEndTimestamp,
  ),
)

const expectedCompletionTimeString = computed(() => {
  if (!isRunning.value) return

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
const statusColor = computed(() =>
  getColorForTaskStatus(props.task.status, props.task.isCurrent),
)
const statusIcon = computed<string>(() =>
  getIconForTaskStatus(props.task.status),
)
const isCompleted = computed(() => {
  const category = getTaskStatusCategory(props.task.status)
  return category === TaskStatusCategory.Completed
})

function onExpansionPanelToggle() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}
</script>

<style scoped>
.task_run__border {
  background-color: v-bind(taskRunColor);
  width: 10px;
  position: absolute;
  height: 100%;
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

.title {
  font-size: 0.875rem;
}
</style>
