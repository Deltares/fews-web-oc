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
  createNewChartsForFilters,
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
import { DataAnalysisDisplayArchiveProduct } from '@deltares/fews-pi-requests'
import { ProductMetaDataType } from '@/services/useProducts/types'

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

      const filterId = props.chart.results.filterId
      const archiveProducts = props.chart.results.archiveProducts

      isLoading.value = true
      const filterCharts = filterId
        ? await createNewChartsForFilters(
            [
              {
                taskRunIds: taskRunId,
                filterId,
              },
            ],
            true,
          )
        : []

      const archiveCharts = archiveProducts
        ? await getChartsForTaskRun(
            props.chart.title,
            taskRunId,
            archiveProducts,
          )
        : []
      isLoading.value = false

      if (filterCharts.length || archiveCharts.length) {
        emit('remove')
        // Reverse the order of archiveCharts to maintain the configured order
        archiveCharts.toReversed().forEach((chart) => emit('addChart', chart))
        filterCharts.forEach((chart) => emit('addChart', chart))
      }
    }
  },
  { immediate: true },
)

async function getChartsForTaskRun(
  chartTitle: string,
  taskRunId: string,
  archiveProducts: DataAnalysisDisplayArchiveProduct[],
): Promise<ProductChart[]> {
  const attributes = [{ key: 'taskRunId', value: taskRunId }]

  const fetchProducts = async () => {
    try {
      return await fetchProductsMetaData(baseUrl, {
        attribute: attributesToObject(attributes),
        forecastCount: 10,
      })
    } catch (error) {
      console.error('Error fetching products metadata:', error)
      return []
    }
  }

  const findArchiveProducts = (products: ProductMetaDataType[]) => {
    return archiveProducts
      .map((archiveProduct) =>
        products.find(
          (product) =>
            archiveProduct.areaId === product.areaId &&
            archiveProduct.sourceId === product.sourceId &&
            archiveProduct.attributes?.every(
              (attr) => product.attributes[attr.key ?? ''] === attr.value,
            ),
        ),
      )
      .filter((product) => product !== undefined)
  }

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const waitForProducts = async () => {
    let matchingProducts: ProductMetaDataType[] = []
    while (matchingProducts.length !== archiveProducts.length) {
      const newProducts = await fetchProducts()
      matchingProducts = findArchiveProducts(newProducts)
      if (matchingProducts.length !== archiveProducts.length) {
        await wait(PRODUCT_META_DATA_REFRESH_INTERVAL)
      }
    }
    return matchingProducts
  }

  const products = await waitForProducts()
  return products.map((product) => {
    const name = product.attributes.name
    return {
      id: crypto.randomUUID(),
      type: 'product',
      title: name ?? `Product of ${chartTitle}`,
      product,
    }
  })
}
</script>
