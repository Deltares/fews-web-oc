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
  topologyNodeId: MaybeRefOrGetter<string | undefined>,
) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const isLoading = ref(false)
  const lastUpdatedTimestamp = ref<number | null>(null)
  const allTaskRuns = ref<TaskRun[]>([])
  const filteredTaskRuns = computed<TaskRun[]>(filterTasks)

  useFocusAwareInterval(() => {
    fetch().catch((error) => console.error(`Failed to fetch tasks: ${error}`))
  }, refreshIntervalSeconds * 1000)

  // Fetch taskruns if a new dispatch period is selected.
  watch(() => toValue(dispatchPeriod), fetch)
  watch(() => toValue(topologyNodeId), fetch)
  watch(() => shouldRefreshTaskRuns.value, fetch)

  async function fetch(): Promise<void> {
    const _dispatchPeriod = toValue(dispatchPeriod)
    const _topologyNodeId = toValue(topologyNodeId)

    isLoading.value = true
    const fetchedTaskRuns = await fetchTaskRuns(
      _topologyNodeId,
      _dispatchPeriod,
    )
    isLoading.value = false

    allTaskRuns.value = fetchedTaskRuns.map(convertFewsPiTaskRunToTaskRun)
    lastUpdatedTimestamp.value = Date.now()
  }

  async function fetchTaskRuns(
    topologyNodeId?: string,
    dispatchPeriod?: RelativePeriod | null,
  ): Promise<FewsPiTaskRun[]> {
    const period = dispatchPeriod
      ? convertRelativeToAbsolutePeriod(dispatchPeriod)
      : undefined
    const startDispatchTime = period
      ? convertTimestampToFewsPiParameter(period.startTimestamp)
      : undefined
    const endDispatchTime = period
      ? convertTimestampToFewsPiParameter(period.endTimestamp)
      : undefined
    const response = await piProvider.getTaskRuns({
      documentFormat: DocumentFormat.PI_JSON,
      startDispatchTime,
      endDispatchTime,
      taskRunStatusIds: Object.values(TaskStatusId),
      topologyNodeId,
      // @ts-expect-error: FIXME: Remove once the library is fixed.
      forecastCount: 99999,
      startForecastTime: convertJSDateToFewsPiParameter(
        new Date('1900-01-01T00:00:00Z'),
      ),
      endForecastTime: convertJSDateToFewsPiParameter(
        new Date('3000-12-31T23:59:59Z'),
      ),
    })

    return response.taskRuns
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
    isLoading,
    fetch,
  }
}
