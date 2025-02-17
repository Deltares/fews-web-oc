import {
  DocumentFormat,
  PiWebserviceProvider,
  TaskStatus as TaskStatusId,
  TaskRun as FewsPiTaskRun,
} from '@deltares/fews-pi-requests'
import {
  computed,
  MaybeRefOrGetter,
  onUnmounted,
  ref,
  toValue,
  watch,
} from 'vue'

import { convertTimestampToFewsPiParameter } from '@/lib/date'
import { RelativePeriod } from '@/lib/period'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  convertFewsPiTaskRunToTaskRun,
  TaskRun,
  TaskStatus,
} from '@/lib/taskruns'
import { createTimer } from '@/lib/timer'

import { configManager } from '../application-config'
import { convertRelativeToAbsolutePeriod } from '@/lib/period/convert'

export function useTaskRuns(
  refreshIntervalSeconds: number,
  dispatchPeriod: MaybeRefOrGetter<RelativePeriod | null>,
  workflowIds: MaybeRefOrGetter<string[]>,
  statuses: MaybeRefOrGetter<TaskStatus[]>,
) {
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const isLoading = ref(false)
  const lastUpdatedTimestamp = ref<number | null>(null)
  const allTaskRuns = ref<TaskRun[]>([])
  const filteredTaskRuns = computed<TaskRun[]>(filterTasks)

  const timer = createTimer(
    () => {
      fetch().catch((error) => console.error(`Failed to fetch tasks: ${error}`))
    },
    refreshIntervalSeconds,
    true,
  )
  onUnmounted(() => timer.deactivate())

  // Fetch taskruns if a new dispatch period is selected.
  watch(() => toValue(dispatchPeriod), fetch)

  async function fetch(): Promise<void> {
    const _dispatchPeriod = toValue(dispatchPeriod)
    const hasPeriod = _dispatchPeriod !== null

    isLoading.value = true
    const fetchedTaskRuns = hasPeriod
      ? await fetchTaskRunsForPeriod(_dispatchPeriod)
      : await fetchAllTaskRuns()
    isLoading.value = false

    allTaskRuns.value = fetchedTaskRuns.map(convertFewsPiTaskRunToTaskRun)
    lastUpdatedTimestamp.value = Date.now()
  }

  async function fetchAllTaskRuns(): Promise<FewsPiTaskRun[]> {
    const response = await piProvider.getTaskRuns({
      documentFormat: DocumentFormat.PI_JSON,
      taskRunStatusIds: Object.values(TaskStatusId),
    })
    return response.taskRuns
  }

  async function fetchTaskRunsForPeriod(
    dispatchPeriod: RelativePeriod,
  ): Promise<FewsPiTaskRun[]> {
    const period = convertRelativeToAbsolutePeriod(dispatchPeriod)
    const startDispatchTime = convertTimestampToFewsPiParameter(
      period.startTimestamp,
    )
    const endDispatchTime = convertTimestampToFewsPiParameter(
      period.endTimestamp,
    )
    // FIXME: it is documented that tasks can only be fetched for a specific
    //        workflowId (i.e. that that is a required parameter), but that
    //        seems to be untrue.
    const response = await piProvider.getTaskRuns({
      documentFormat: DocumentFormat.PI_JSON,
      startDispatchTime,
      endDispatchTime,
      taskRunStatusIds: Object.values(TaskStatusId),
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
