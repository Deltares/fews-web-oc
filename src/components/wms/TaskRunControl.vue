<template>
  <ControlChip v-if="numberOfTaskRuns > 0">
    <v-icon icon="mdi-chart-box-multiple" class="mx-2" />
    <v-menu transition="slide-y-transition">
      <template #activator="{ props, isActive }">
        <v-btn
          v-bind="props"
          variant="plain"
          aria-label="Select Task Run"
          class="text-capitalize"
          :text="getWorkflowName(taskRunId)"
        >
          <template #append>
            <SelectIcon :active="isActive" />
          </template>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          title="Current"
          @click="taskRunId = undefined"
          :active="taskRunId === undefined"
        />
        <v-list-item
          v-for="item in selectedTaskRuns"
          :title="getWorkflowName(item.taskId)"
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

const taskRunId = defineModel<string>('taskRunId')

const availableWorkflowsStore = useAvailableWorkflowsStore()
const { selectedTaskRuns } = useTaskRunsStore()

function getWorkflowName(taskRunId: string | undefined): string {
  if (!taskRunId) {
    return 'Current'
  }

  const taskRun = selectedTaskRuns.find(
    (taskRun) => taskRun.taskId === taskRunId,
  )
  if (!taskRun) {
    return 'Unknown task run'
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
