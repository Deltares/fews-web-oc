<template>
  <ControlChip v-if="numberOfTaskRuns > 0">
    <v-icon icon="mdi-chart-box-multiple" class="mx-2" />
    <v-menu transition="slide-y-transition">
      <template #activator="{ props, isActive }">
        <v-list-item
          v-bind="props"
          aria-label="Select Task Run"
          variant="plain"
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
            <SelectIcon :active="isActive" />
          </template>
        </v-list-item>
      </template>
      <v-list>
        <v-list-item
          title="Current"
          @click="taskRunId = undefined"
          :active="taskRunId === undefined"
        />
        <v-list-item
          v-for="item in selectedTaskRuns"
          :title="getWorkflowName(item)"
          :subtitle="toHumanReadableDateTime(item.timeZeroTimestamp)"
          @click="taskRunId = item.taskId"
          :active="item.taskId === taskRunId"
        />
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
import { TaskRun } from '@/lib/taskruns'

const taskRunId = defineModel<string>('taskRunId')

const availableWorkflowsStore = useAvailableWorkflowsStore()
const { selectedTaskRuns } = useTaskRunsStore()

const selectedTaskRun = computed(() =>
  selectedTaskRuns.find((taskRun) => taskRun.taskId === taskRunId.value),
)
const selectedWorkflowName = computed(() =>
  getWorkflowName(selectedTaskRun.value),
)
const selectedTaskRunTimeZero = computed(() =>
  selectedTaskRun.value
    ? toHumanReadableDateTime(selectedTaskRun.value.timeZeroTimestamp)
    : undefined,
)

function getWorkflowName(taskRun: TaskRun | undefined): string {
  if (!taskRun) {
    return 'Current'
  }
  const workflow = availableWorkflowsStore.byId(taskRun.workflowId)
  return workflow ? workflow.name : 'Unknown workflow'
}

const numberOfTaskRuns = computed(() => selectedTaskRuns.length)

watch(numberOfTaskRuns, (newNumberOfTaskRuns, oldNumberOfTaskRuns) => {
  if (newNumberOfTaskRuns > 0 && oldNumberOfTaskRuns == 0) {
    taskRunId.value = selectedTaskRuns[0].taskId
  }
})

watch(selectedTaskRuns, (newRuns) => {
  if (
    taskRunId.value &&
    !newRuns.find((taskRun) => taskRun.taskId === taskRunId.value)
  ) {
    taskRunId.value = selectedTaskRuns[0]?.taskId
  }
})
</script>

<style scoped>
.selected-task-run-title {
  line-height: 1;
}

.selected-task-run-subtitle {
  font-size: 0.75rem;
}
</style>
