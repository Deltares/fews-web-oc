import {
  DocumentFormat,
  PiWebserviceProvider,
  TaskStatus as TaskStatusId,
  TaskRun as FewsPiTaskRun,
} from '@deltares/fews-pi-requests'
import { computed, MaybeRefOrGetter, ref, toValue, watch } from 'vue'

import {
  convertJSDateToFewsPiParameter,
  convertTimestampToFewsPiParameter,
} from '@/lib/date'
import { RelativePeriod } from '@/lib/period'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  convertFewsPiTaskRunToTaskRun,
  TaskRun,
  TaskStatus,
} from '@/lib/taskruns'

import { configManager } from '../application-config'
import { convertRelativeToAbsolutePeriod } from '@/lib/period/convert'
import { useFocusAwareInterval } from '@/services/useFocusAwareInterval'

const shouldRefreshTaskRuns = ref(false)

// Allow other components to trigger a refresh of the task runs.
export function refreshTaskRuns() {
  shouldRefreshTaskRuns.value = !shouldRefreshTaskRuns.value
}

export function useTaskRuns(
  refreshIntervalSeconds: number,
  dispatchPeriod: MaybeRefOrGetter<RelativePeriod | null>,
  workflowIds: MaybeRefOrGetter<string[]>,
  statuses: MaybeRefOrGetter<TaskStatus[]>,
  topologyNodeId?: MaybeRefOrGetter<string | undefined>,
) {
  const isLoading = ref(false)
  const lastUpdatedTimestamp = ref<number | null>(null)
  const allTaskRuns = ref<TaskRun[]>([])
  const filteredTaskRuns = computed<TaskRun[]>(filterTasks)
  const outputStartTime = ref<Date | null>(null)
  const outputEndTime = ref<Date | null>(null)

  useFocusAwareInterval(
    () => {
      fetch().catch((error) => console.error(`Failed to fetch tasks: ${error}`))
    },
    refreshIntervalSeconds * 1000,
    { immediateCallback: true },
  )

  watch(
    [
      () => toValue(dispatchPeriod),
      () => toValue(topologyNodeId),
      () => shouldRefreshTaskRuns.value,
    ],
    fetch,
  )

  async function fetch(): Promise<void> {
    const _dispatchPeriod = toValue(dispatchPeriod)
    const _topologyNodeId = toValue(topologyNodeId)

    isLoading.value = true
    const fetchedTaskRuns = await fetchTaskRuns(
      _dispatchPeriod,
      _topologyNodeId,
    )
    isLoading.value = false

    allTaskRuns.value = fetchedTaskRuns.map(convertFewsPiTaskRunToTaskRun)
    if (allTaskRuns.value.length > 0) {
      const minStartTime = allTaskRuns.value.reduce(
        (min, task) =>
          task.outputStartTimestamp
            ? Math.min(min, task.outputStartTimestamp)
            : min,
        Infinity,
      )
      outputStartTime.value =
        minStartTime === Infinity ? null : new Date(minStartTime)
      const maxEndTime = allTaskRuns.value.reduce(
        (max, task) =>
          task.outputEndTimestamp
            ? Math.max(max, task.outputEndTimestamp)
            : max,
        -Infinity,
      )
      outputEndTime.value =
        maxEndTime === -Infinity ? null : new Date(maxEndTime)
    }

    lastUpdatedTimestamp.value = Date.now()
  }

  function filterTasks(): TaskRun[] {
    const _workflowIds = toValue(workflowIds)
    const _statuses = toValue(statuses)
    return allTaskRuns.value.filter(
      (task) =>
        _workflowIds.includes(task.workflowId) &&
        _statuses.includes(task.status),
    )
  }

  return {
    allTaskRuns,
    filteredTaskRuns,
    lastUpdatedTimestamp,
    outputStartTime,
    outputEndTime,
    isLoading,
    fetch,
  }
}

async function fetchTaskRuns(
  dispatchPeriod?: RelativePeriod | null,
  topologyNodeId?: string,
): Promise<FewsPiTaskRun[]> {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const period = dispatchPeriod
    ? convertRelativeToAbsolutePeriod(dispatchPeriod)
    : undefined
  const startDispatchTime = period
    ? convertTimestampToFewsPiParameter(period.startTimestamp)
    : undefined
  const endDispatchTime = undefined

  const filter = {
    documentFormat: DocumentFormat.PI_JSON,
    startDispatchTime,
    endDispatchTime,
    taskRunStatusIds: Object.values(TaskStatusId),
  }

  const topologyNodeFilter = {
    ...filter,
    topologyNodeId,
    forecastCount: 99999,
    startForecastTime: convertJSDateToFewsPiParameter(
      new Date('1900-01-01T00:00:00Z'),
    ),
    endForecastTime: convertJSDateToFewsPiParameter(
      new Date('3000-12-31T23:59:59Z'),
    ),
  }
  const response = await piProvider.getTaskRuns(
    topologyNodeId ? topologyNodeFilter : filter,
  )

  return response.taskRuns
}
