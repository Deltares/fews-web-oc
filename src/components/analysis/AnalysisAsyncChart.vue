<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs">
    <TaskRunSummary v-if="task" :task :canVisualize="false" class="mb-2 mx-3" />
    <v-skeleton-loader
      v-else
      height="70"
      type="list-item-two-line"
      class="rounded-lg"
    />
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import TaskRunSummary from '@/components/tasks/TaskRunSummary.vue'
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import type { AsyncChart } from '@/lib/analysis'
import {
  convertFewsPiTaskRunToTaskRun,
  getTaskStatusCategory,
} from '@/lib/taskruns'
import { configManager } from '@/services/application-config'
import { useTaskRuns } from '@/services/useTaskRuns'
import { useTaskRunStatus } from '@/services/useTaskRunStatus'
import { computed, watchEffect } from 'vue'

interface Props {
  chart: AsyncChart
}
const props = defineProps<Props>()

const { taskRunStatus, interval: taskRunStatusInterval } = useTaskRunStatus(
  () => ({
    taskId: props.chart.taskId,
  }),
  2000,
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
  5000,
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
</script>
