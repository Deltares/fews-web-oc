<template>
  <ControlChip v-if="numberOfTaskRuns > 0">
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
          class="text-capitalize"
        >
          <v-list-item-title class="selected-task-run-title">
            {{ selectedWorkflowName }}
          </v-list-item-title>

          <v-list-item-subtitle
            v-if="selectedTaskRunTimeZero"
            class="selected-task-run-subtitle"
          >
            {{ selectedTaskRunTimeZero }}
          </v-list-item-subtitle>

          <template #append>
            <v-icon
              v-if="selectedTaskRunColor"
              icon="mdi-circle"
              :color="selectedTaskRunColor"
              class="me-2"
            />
            <SelectIcon :active="isActive" />
          </template>
        </v-list-item>
      </template>
      <v-list>
        <v-list-item
          v-for="item in taskRuns"
          :title="getWorkflowName(item)"
          :subtitle="toHumanReadableDateTime(item.timeZeroTimestamp)"
          @click="taskRunId = item.taskId"
          :active="item.taskId === taskRunId"
        >
          <template #append>
            <v-icon
              v-if="taskRunColorsStore.hasColor(item.taskId)"
              icon="mdi-circle"
              :color="taskRunColorsStore.getColor(item.taskId)"
              size="sm"
            />
          </template>
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
}

.selected-task-run-subtitle {
  font-size: 0.75rem;
}
</style>
