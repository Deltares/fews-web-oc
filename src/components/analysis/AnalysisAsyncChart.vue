<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs" @remove="emit('remove')">
    <TaskRunSummary v-if="task" :task :canVisualize="false" class="mb-2 mx-3" />
    <v-skeleton-loader
      v-else
      height="70"
      type="list-item-two-line"
      class="rounded-lg px-4"
    />
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import TaskRunSummary from '@/components/tasks/TaskRunSummary.vue'
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import type { AsyncChart, CollectionEmits, ProductChart } from '@/lib/analysis'
import {
  convertFewsPiTaskRunToTaskRun,
  getTaskStatusCategory,
} from '@/lib/taskruns'
import { configManager } from '@/services/application-config'
import { useTaskRuns } from '@/services/useTaskRuns'
import { useTaskRunStatus } from '@/services/useTaskRunStatus'
import { computed, watchEffect } from 'vue'
import {
  attributesToObject,
  fetchProductsMetaData,
} from '@/services/useProducts'

interface Props {
  chart: AsyncChart
}
const props = defineProps<Props>()

interface Emits extends CollectionEmits {
  remove: []
}
const emit = defineEmits<Emits>()

const { taskRunStatus, interval: taskRunStatusInterval } = useTaskRunStatus(
  () => ({
    taskId: props.chart.taskId,
  }),
  1000,
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

watchEffect(async () => {
  if (category.value === 'completed') {
    const taskRunId = task.value?.taskId
    if (!taskRunId) {
      throw new Error('Task run ID is not available')
    }

    const filterId = props.chart.result.filterId
    const archiveProduct = props.chart.result.archiveProduct

    if (filterId) {
      const filter = {
        taskRunIds: taskRunId,
        filterId,
      }
      emit('addFilter', { filter })
      emit('remove')
    }

    if (archiveProduct) {
      const charts = await getChartsForTaskRun(taskRunId)
      charts.forEach((chart) => emit('addChart', chart))
      emit('remove')
    }
  }
})

async function getChartsForTaskRun(taskRunId: string): Promise<ProductChart[]> {
  const attributes = [{ key: 'taskRunId', value: taskRunId }]

  try {
    const products = await fetchProductsMetaData(baseUrl, {
      attribute: attributesToObject(attributes),
      // @ts-expect-error: FIXME: Not yet added to the filter type
      forecastCount: 1,
    })

    // TODO: Filter on area and source id?
    return products.map((product) => ({
      id: crypto.randomUUID(),
      type: 'product',
      title: `Product for Task Run ${taskRunId}`,
      product,
      subplot: { items: [] },
    }))
  } catch (error) {
    console.error('Error fetching products metadata:', error)
    return []
  }
}
</script>
