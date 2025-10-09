<template>
  <v-card
    border
    flat
    density="compact"
    :ripple="false"
    @click="taskRunsStore.toggleTaskRun(task)"
  >
    <v-card-text class="py-2 px-1 h-100 flex-grow-1">
      <div class="d-flex w-100">
        <div class="w-100">
          <div class="d-flex align-center ga-1 w-100">
            <v-checkbox-btn
              v-model="selected"
              class="flex-0-0"
              density="compact"
              :color="taskRunColor"
              :disabled="task.isCurrent"
              @click.stop="taskRunsStore.toggleTaskRun(task)"
            >
              <v-tooltip
                text="Visualize in charts"
                open-delay="500"
                activator="parent"
              />
            </v-checkbox-btn>

            <div class="flex-1-1 overflow-hidden">
              <div :class="{ 'text-wrap': expanded }">
                {{ workflowTitle }}
              </div>
              <v-list-item-subtitle
                v-if="whatIfTemplate"
                :class="{ 'text-wrap': expanded, 'text-wrap-no': !expanded }"
              >
                {{ `${whatIfTemplate.name}` }}
              </v-list-item-subtitle>
              <v-list-item-subtitle
                :class="{ 'text-wrap': expanded, 'text-wrap-no': !expanded }"
              >
                {{ timeZeroString }}
              </v-list-item-subtitle>
            </div>
            <v-btn
              density="compact"
              :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              @click.stop="onExpansionPanelToggle"
              end
            ></v-btn>
          </div>
        </div>
      </div>
      <DataTable v-if="expanded" class="mt-4" :tableData="tableData" />
    </v-card-text>
    <ForecastRange
      v-if="startTime && endTime"
      :startTime="startTime"
      :endTime="endTime"
      :timeZero="new Date(task.timeZeroTimestamp ?? 0)"
      :startForecastTime="new Date(task.outputStartTimestamp ?? 0)"
      :endForecastTime="new Date(task.outputEndTimestamp ?? 0)"
    />
  </v-card>
</template>
<script setup lang="ts">
import { TaskRun, TaskStatus } from '@/lib/taskruns'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { computed } from 'vue'
import ForecastRange from './ForecastRange.vue'
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
  startTime: Date | null
  endTime: Date | null
}

const { task, startTime, endTime } = defineProps<Props>()

const taskRunColor = computed(() => {
  // Get color from store, fallback to contrast color if not found
  return taskRunColorsStore.getColor(task.taskId) || '--contrast-color'
})

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
})

// This should be done with :model-value but its internal watch sometimes
// doesn't trigger when the value changes
const selected = computed({
  get() {
    return taskRunsStore.taskRunIsSelected(task) || task.isCurrent
  },
  set(_) {
    // No-op
  },
})

const tableData = computed(() => [
  {
    columns: [{ header: 'Task Description', value: task.description }],
  },
  {
    columns: [
      { header: 'Workflow Description', value: workflow.value?.description },
    ],
  },
  {
    columns: [
      { header: 'User', value: task.userId ?? 'No user' },
      { header: 'Task run ID', value: task.taskId },
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
        subHeader: taskDurationDifferenceString.value,
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

const workflow = computed(() => availableWorkflowsStore.byId(task.workflowId))

const whatIfTemplate = computed(() =>
  availableWhatIfTemplatesStore.byId(workflow.value?.whatIfTemplateId),
)

const expectedRunTimeSeconds = computed(
  () => workflow.value?.expectedRuntimeSeconds ?? null,
)

const workflowTitle = computed(() => workflow.value?.name ?? 'Unknown workflow')

const isRunning = computed<boolean>(() => task.status === TaskStatus.Running)

const timeZeroString = computed<string>(() =>
  toHumanReadableDate(task.timeZeroTimestamp),
)

const taskDurationString = computed(() =>
  toDateRangeString(task.dispatchTimestamp, task.completionTimestamp),
)

const taskDurationDifferenceString = computed(() =>
  toDateAbsDifferenceString(task.dispatchTimestamp, task.completionTimestamp),
)

const outputTimeString = computed(() =>
  toDateRangeString(task.outputStartTimestamp, task.outputEndTimestamp),
)

const outputTimeDifferenceString = computed(() =>
  toDateAbsDifferenceString(task.outputStartTimestamp, task.outputEndTimestamp),
)

const expectedCompletionTimeString = computed(() => {
  if (!isRunning.value) return

  const expectedRunTime = expectedRunTimeSeconds.value
  if (expectedRunTime === null || task.dispatchTimestamp === null) {
    return
  }
  const expectedCompletionTimestamp =
    task.dispatchTimestamp + expectedRunTime * 1000
  return toHumanReadableDate(expectedCompletionTimestamp)
})

function onExpansionPanelToggle() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}
</script>

<style scoped>
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
