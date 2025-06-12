<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs" @remove="emit('remove')">
    <TaskRunSummary
      v-if="task && !isLoading"
      :task
      :canVisualize="false"
      class="mb-2 mx-3"
    />
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
import {
  createNewChartsForFilter,
  type AsyncChart,
  type CollectionEmits,
  type ProductChart,
} from '@/lib/analysis'
import {
  convertFewsPiTaskRunToTaskRun,
  getTaskStatusCategory,
} from '@/lib/taskruns'
import { configManager } from '@/services/application-config'
import { useTaskRuns } from '@/services/useTaskRuns'
import { useTaskRunStatus } from '@/services/useTaskRunStatus'
import { computed, ref, watch, watchEffect } from 'vue'
import {
  attributesToObject,
  fetchProductsMetaData,
} from '@/services/useProducts'

const TASK_STATUS_REFRESH_INTERVAL = 1000
const TASK_RUN_REFRESH_INTERVAL = 5000
const PRODUCT_META_DATA_REFRESH_INTERVAL = 2000

interface Props {
  chart: AsyncChart
}
const props = defineProps<Props>()

interface Emits extends CollectionEmits {
  remove: []
}
const emit = defineEmits<Emits>()

const isLoading = ref(false)

const { taskRunStatus, interval: taskRunStatusInterval } = useTaskRunStatus(
  () => ({
    taskId: props.chart.taskId,
  }),
  TASK_STATUS_REFRESH_INTERVAL,
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
  TASK_RUN_REFRESH_INTERVAL,
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

watch(
  category,
  async () => {
    if (category.value === 'completed') {
      const taskRunId = task.value?.taskId
      if (!taskRunId) {
        throw new Error('Task run ID is not available')
      }

      const filterId = props.chart.result.filterId
      const archiveProduct = props.chart.result.archiveProduct

      isLoading.value = true
      const filterCharts = filterId
        ? await createNewChartsForFilter({
            taskRunIds: taskRunId,
            filterId,
          })
        : []

      const archiveCharts = archiveProduct
        ? await getChartsForTaskRun(props.chart.title, taskRunId)
        : []
      isLoading.value = false

      if (filterCharts.length || archiveCharts.length) {
        emit('remove')
        filterCharts.forEach((chart) => emit('addChart', chart))
        archiveCharts.forEach((chart) => emit('addChart', chart))
      }
    }
  },
  { immediate: true },
)

async function getChartsForTaskRun(
  chartTitle: string,
  taskRunId: string,
): Promise<ProductChart[]> {
  const attributes = [{ key: 'taskRunId', value: taskRunId }]

  const fetchProducts = async (): Promise<ProductChart[]> => {
    try {
      const response = await fetchProductsMetaData(baseUrl, {
        attribute: attributesToObject(attributes),
        // @ts-expect-error: FIXME: Not yet added to the filter type
        forecastCount: 10,
      })

      // TODO: Filter on area and source id?
      return response.map((product) => ({
        id: crypto.randomUUID(),
        type: 'product',
        title: `Product of ${chartTitle}`,
        product,
      }))
    } catch (error) {
      console.error('Error fetching products metadata:', error)
      return []
    }
  }

  const waitForProducts = async (): Promise<ProductChart[]> => {
    let products: ProductChart[] = []
    while (products.length === 0) {
      products = await fetchProducts()
      if (products.length === 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, PRODUCT_META_DATA_REFRESH_INTERVAL),
        )
      }
    }
    return products
  }

  return await waitForProducts()
}
</script>
