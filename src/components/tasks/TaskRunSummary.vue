<template>
  <v-card
    border
    flat
    density="compact"
    @click="onExpansionPanelToggle"
    :ripple="false"
  >
    <v-card-text class="py-2 h-100 flex-grow-1">
      <div class="d-flex w-100">
        <div class="w-100">
          <v-list-item-subtitle class="mb-1 d-flex justify-space-between">
            <span>{{ timeZeroString }}</span>
            <div class="d-flex gc-1">
              <v-tooltip
                v-if="isCurrentUsersTask"
                :text="t('workflow.startedByMe')"
              >
                <template #activator="{ props }">
                  <v-icon v-bind="props" icon="mdi-account" size="small" />
                </template>
              </v-tooltip>
              <v-tooltip
                v-if="canBeFollowed"
                :text="
                  t(isFollowed ? 'workflow.following' : 'workflow.notFollowing')
                "
              >
                <template #activator="{ props }">
                  <v-icon
                    v-bind="props"
                    :icon="isFollowed ? 'mdi-bell' : 'mdi-bell-off'"
                    size="small"
                    @click.stop="toggleFollow"
                  />
                </template>
              </v-tooltip>
            </div>
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
              <v-list-item-subtitle v-if="task.description">
                <SingleLineWithOverflowTooltip
                  :text="task.description"
                  max-width="400"
                />
              </v-list-item-subtitle>
            </div>
          </div>
        </div>
      </div>
      <DataTable v-if="expanded" class="mt-4" :tableData="tableData" />
      <div v-if="expanded && task.whatIfScenario">
        <v-divider class="my-2" />
        <WhatIfScenarioSummary :what-if-scenario="task.whatIfScenario" />
      </div>
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
  toHumanReadableDateTime,
} from '@/lib/date'
import { useAvailableWhatIfTemplatesStore } from '@/stores/availableWhatIfTemplates'
import WhatIfScenarioSummary from './WhatIfScenarioSummary.vue'
import SingleLineWithOverflowTooltip from '../general/SingleLineWithOverflowTooltip.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const availableWorkflowsStore = useAvailableWorkflowsStore()
const availableWhatIfTemplatesStore = useAvailableWhatIfTemplatesStore()

interface Props {
  task: TaskRun
  isCurrentUsersTask?: boolean
  isFollowed?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isCurrentUsersTask: false,
  isFollowed: false,
})

interface Emits {
  follow: [taskRunId: string]
  unfollow: [taskRunId: string]
}
const emit = defineEmits<Emits>()

const expanded = defineModel<boolean>('expanded', {
  required: false,
  default: false,
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
      { header: 'Task run ID', value: props.task.taskRunId },
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
  toHumanReadableDateTime(props.task.timeZeroTimestamp),
)

const taskDurationString = computed(() =>
  toDateRangeString(
    props.task.dispatchTimestamp,
    props.task.completionTimestamp,
  ),
)

const taskDurationDifferenceString = computed(() =>
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
  return toHumanReadableDateTime(expectedCompletionTimestamp)
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

function onExpansionPanelToggle() {
  // Only expand when no text is selected
  if (window.getSelection()?.toString() === '') {
    expanded.value = !expanded.value
  }
}

const canBeFollowed = computed<boolean>(() => {
  const category = getTaskStatusCategory(props.task.status)
  return (
    category !== TaskStatusCategory.Completed &&
    category !== TaskStatusCategory.Failed
  )
})

function toggleFollow(): void {
  if (props.isFollowed) {
    emit('unfollow', props.task.taskRunId)
  } else {
    emit('follow', props.task.taskRunId)
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
