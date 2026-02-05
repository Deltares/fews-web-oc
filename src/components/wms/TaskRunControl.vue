<template>
  <ControlChip v-if="numberOfTaskRuns > 0" :class="{ 'pr-0': taskRunId }">
    <v-btn
      variant="plain"
      density="compact"
      @click="toggleTaskRunId"
      :icon="
        taskRunId ? 'mdi-chart-box-multiple' : 'mdi-chart-box-multiple-outline'
      "
    />
    <v-menu v-if="taskRunId" transition="slide-y-transition">
      <template #activator="{ props, isActive }">
        <v-list-item
          v-bind="props"
          aria-label="Select Task Run"
          variant="text"
          density="compact"
          class="text-capitalize px-2"
        >
          <div class="d-flex align-center ga-2">
            <v-icon icon="mdi-circle" :color="selectedTaskRunColor" />

            <div>
              <v-list-item-title class="selected-task-run-title">
                {{ selectedWorkflowName }}
              </v-list-item-title>

              <v-list-item-subtitle
                v-if="selectedTaskRunTimeZero"
                class="selected-task-run-subtitle"
              >
                {{ selectedTaskRunTimeZero }}
              </v-list-item-subtitle>
            </div>
            <SelectIcon :active="isActive" />
          </div>
        </v-list-item>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="item in taskRuns"
          @click="taskRunId = item.taskId"
          :active="item.taskId === taskRunId"
        >
          <div class="d-flex align-center ga-2">
            <v-icon
              icon="mdi-circle"
              :color="taskRunColorsStore.getColor(item.taskId)"
              size="sm"
            />

            <div>
              <v-list-item-title class="selected-task-run-title">
                {{ getWorkflowName(item) }}
              </v-list-item-title>

              <v-list-item-subtitle
                v-if="selectedTaskRunTimeZero"
                class="selected-task-run-subtitle"
              >
                {{ toHumanReadableDateTime(item.timeZeroTimestamp) }}
              </v-list-item-subtitle>
            </div>
          </div>
        </v-list-item>
      </v-list>
    </v-menu>
  </ControlChip>
</template>

<script setup lang="ts">
import ControlChip from '@/components/wms/ControlChip.vue'
import SelectIcon from '@/components/general/SelectIcon.vue'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { useTaskRunsStore } from '@/stores/taskRuns'
import { computed, watch } from 'vue'
import { toHumanReadableDateTime } from '@/lib/date'
import { sortTasks, type TaskRun } from '@/lib/taskruns'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'

const taskRunId = defineModel<string>('taskRunId')

const availableWorkflowsStore = useAvailableWorkflowsStore()
const taskRunsStore = useTaskRunsStore()
const taskRunColorsStore = useTaskRunColorsStore()

const taskRuns = computed(() => taskRunsStore.selectedTaskRuns.sort(sortTasks))

const selectedTaskRun = computed(() =>
  taskRuns.value.find((taskRun) => taskRun.taskId === taskRunId.value),
)
const selectedWorkflowName = computed(() =>
  getWorkflowName(selectedTaskRun.value),
)
const selectedTaskRunTimeZero = computed(() =>
  selectedTaskRun.value
    ? toHumanReadableDateTime(selectedTaskRun.value.timeZeroTimestamp)
    : undefined,
)
const selectedTaskRunColor = computed(() =>
  selectedTaskRun.value
    ? taskRunColorsStore.getColor(selectedTaskRun.value.taskId)
    : undefined,
)

function getWorkflowName(taskRun: TaskRun | undefined): string {
  if (!taskRun) {
    return 'Default view'
  }
  const workflow = availableWorkflowsStore.byId(taskRun.workflowId)
  return workflow ? workflow.name : 'Unknown workflow'
}

const numberOfTaskRuns = computed(() => taskRuns.value.length)

watch(numberOfTaskRuns, (newNumberOfTaskRuns, oldNumberOfTaskRuns) => {
  if (newNumberOfTaskRuns > 0 && oldNumberOfTaskRuns == 0) {
    taskRunId.value = taskRuns.value[0].taskId
  }
})

watch(
  taskRuns,
  (newRuns) => {
    if (
      taskRunId.value &&
      !newRuns.find((taskRun) => taskRun.taskId === taskRunId.value)
    ) {
      taskRunId.value = newRuns[0]?.taskId
    }
  },
  { deep: true },
)

let lastSelectedTaskRunId: string | undefined = undefined

function toggleTaskRunId() {
  if (taskRunId.value === undefined) {
    if (
      lastSelectedTaskRunId &&
      taskRuns.value.find((t) => t.taskId === lastSelectedTaskRunId)
    ) {
      taskRunId.value = lastSelectedTaskRunId
    } else {
      taskRunId.value = taskRuns.value[0]?.taskId
    }
  } else {
    lastSelectedTaskRunId = taskRunId.value
    taskRunId.value = undefined
  }
}
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
