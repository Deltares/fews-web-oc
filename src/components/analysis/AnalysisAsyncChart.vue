<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs">
    <v-card flat border class="ma-2" v-if="task">
      <v-list-item>
        <template #prepend>
          <v-icon
            :icon="getIconForTaskStatus(task.status)"
            :color="getColorForTaskStatus(task.status)"
            size="20"
          />
        </template>
        <v-list-item-subtitle>
          {{ toHumanReadableDate(task.timeZeroTimestamp) }}
        </v-list-item-subtitle>

        <v-list-item-title>{{ workflow?.name }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ task.taskId }}
        </v-list-item-subtitle>
      </v-list-item>
      <TaskRunProgress
        v-if="task?.status === 'running'"
        :dispatch-timestamp="task.dispatchTimestamp"
        :expected-runtime-seconds="workflow?.expectedRuntimeSeconds ?? null"
      />
    </v-card>
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import TaskRunProgress from '@/components/tasks/TaskRunProgress.vue'
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import type { AsyncChart } from '@/lib/analysis'
import {
  convertFewsPiTaskRunToTaskRun,
  getColorForTaskStatus,
  getIconForTaskStatus,
  getTaskStatusCategory,
} from '@/lib/taskruns'
import { configManager } from '@/services/application-config'
import { useTaskRuns } from '@/services/useTaskRuns'
import { useTaskRunStatus } from '@/services/useTaskRunStatus'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { computed, watchEffect } from 'vue'
import { toHumanReadableDate } from '@/lib/date'

interface Props {
  chart: AsyncChart
}
const props = defineProps<Props>()

const taskRefreshInterval = 5000

const { taskRunStatus, interval: taskRunStatusInterval } = useTaskRunStatus(
  () => ({
    taskId: props.chart.taskId,
  }),
  taskRefreshInterval,
)

watchEffect(() => {
  if (taskRunStatus.value?.taskRunId?.length) {
    taskRunStatusInterval.value?.pause()
  }
})

const taskRunIds = computed(() =>
  taskRunStatus.value?.taskRunId ? [taskRunStatus.value.taskRunId] : [],
)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { taskRuns, interval: taskRunInterval } = useTaskRuns(
  baseUrl,
  taskRunIds,
  taskRefreshInterval,
)
const task = computed(() => {
  if (!taskRuns.value?.length) return
  return convertFewsPiTaskRunToTaskRun(taskRuns.value?.[0])
})

const category = computed(() => {
  const status = task.value?.status
  if (!status) return

  return getTaskStatusCategory(status)
})

watchEffect(() => {
  if (category.value === 'completed' || category.value === 'failed') {
    taskRunInterval.value?.pause()
  }
})

const availableWorkflowsStore = useAvailableWorkflowsStore()
const workflow = computed(() => {
  const workflowId = task.value?.workflowId
  if (!workflowId) return

  return availableWorkflowsStore.byId(task.value.workflowId)
})
</script>
