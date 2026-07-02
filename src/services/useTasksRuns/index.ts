import {
  DocumentFormat,
  PiWebserviceProvider,
  TaskStatus as TaskStatusId,
  TaskRun as FewsPiTaskRun,
  WhatIfScenarioDescriptor,
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
  getTasksOutputTimeRange,
  TaskRun,
  TaskStatus,
} from '@/lib/taskruns'

import { configManager } from '../application-config'
import { convertRelativeToAbsolutePeriod } from '@/lib/period/convert'
import { useFocusAwareInterval } from '@/services/useFocusAwareInterval'
import { hasEqualIdentity } from '@/lib/auth/identityEquality'

const shouldRefreshTaskRuns = ref(false)

// Allow other components to trigger a refresh of the task runs.
export function refreshTaskRuns() {
  shouldRefreshTaskRuns.value = !shouldRefreshTaskRuns.value
}

const DEFAULT_REFRESH_INTERVAL_SECONDS = 15

interface UseTaskRunsOptions {
  userId?: MaybeRefOrGetter<string | null>
  topologyNodeId?: MaybeRefOrGetter<string | undefined>
  includeWhatIfScenario?: MaybeRefOrGetter<boolean>
  refreshIntervalSeconds?: number
}

export function useTaskRuns(
  dispatchPeriod: MaybeRefOrGetter<RelativePeriod | null>,
  workflowIds: MaybeRefOrGetter<string[]>,
  statuses: MaybeRefOrGetter<TaskStatus[]>,
  options: UseTaskRunsOptions = {},
) {
  const isLoading = ref(false)
  const lastUpdatedTimestamp = ref<number | null>(null)
  const allTaskRuns = ref<TaskRun[]>([])
  const filteredTaskRuns = computed<TaskRun[]>(filterTasks)
  const outputStartTime = ref<Date | null>(null)
  const outputEndTime = ref<Date | null>(null)
  const refreshIntervalSeconds =
    options.refreshIntervalSeconds ?? DEFAULT_REFRESH_INTERVAL_SECONDS

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
      () => toValue(options.topologyNodeId),
      () => shouldRefreshTaskRuns.value,
    ],
    fetch,
  )

  async function fetch(): Promise<void> {
    const _dispatchPeriod = toValue(dispatchPeriod)
    const _topologyNodeId = toValue(options.topologyNodeId)
    const _includeWhatIfScenario =
      toValue(options.includeWhatIfScenario) ?? true

    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(),
    })

    isLoading.value = true
    const fetchedTaskRuns = await fetchTaskRuns(
      piProvider,
      _dispatchPeriod,
      _topologyNodeId,
    )

    if (_includeWhatIfScenario) {
      allTaskRuns.value = await convertTaskRunsWithWhatIfScenario(
        piProvider,
        fetchedTaskRuns,
      )
    } else {
      allTaskRuns.value = fetchedTaskRuns.map((fetchedTaskRun) =>
        convertFewsPiTaskRunToTaskRun(fetchedTaskRun, null),
      )
    }
    isLoading.value = false

    if (allTaskRuns.value.length > 0) {
      const range = getTasksOutputTimeRange(allTaskRuns.value)
      outputStartTime.value = range.outputStartTime
      outputEndTime.value = range.outputEndTime
    }

    lastUpdatedTimestamp.value = Date.now()
  }

  function filterTasks(): TaskRun[] {
    const _workflowIds = toValue(workflowIds)
    const _statuses = toValue(statuses)
    const _userId = toValue(options.userId) ?? null

    const matchesUser = (task: TaskRun) => {
      if (_userId === null) return true
      if (task.userId === null) return false
      return hasEqualIdentity(task.userId, _userId)
    }

    return allTaskRuns.value.filter(
      (task) =>
        _workflowIds.includes(task.workflowId) &&
        _statuses.includes(task.status) &&
        matchesUser(task),
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
  piProvider: PiWebserviceProvider,
  dispatchPeriod?: RelativePeriod | null,
  topologyNodeId?: string,
): Promise<FewsPiTaskRun[]> {
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

async function convertTaskRunsWithWhatIfScenario(
  piProvider: PiWebserviceProvider,
  fetchedTaskRuns: FewsPiTaskRun[],
): Promise<TaskRun[]> {
  // Convert the fetched task runs to our internal representation, including
  // what-if scenario information if available.
  return Promise.all(
    fetchedTaskRuns.map(async (fetchedTaskRun) => {
      // Note: we cannot fetch this what-if scenario information for multiple
      //       what-if scenario IDs in a single request, as the endpoint does
      //       not support this.
      const whatIfScenario = await fetchWhatIfScenarioForTaskRun(
        piProvider,
        fetchedTaskRun,
      )
      return convertFewsPiTaskRunToTaskRun(fetchedTaskRun, whatIfScenario)
    }),
  )
}

async function fetchWhatIfScenarioForTaskRun(
  piProvider: PiWebserviceProvider,
  fetchedTaskRun: FewsPiTaskRun,
): Promise<WhatIfScenarioDescriptor | null> {
  // @ts-expect-error  types are not yet properly specified.
  const whatIfScenarioId: string | undefined = fetchedTaskRun.whatIfScenarioId

  if (!whatIfScenarioId) return null

  try {
    const response = await piProvider.getWhatIfScenarios({
      // @ts-expect-error  types are not yet properly specified.
      whatIfScenarioId,
    })
    // We should always get a single what-if scenario in the response when we
    // specify the ID.
    return response.whatIfScenarioDescriptors[0] ?? null
  } catch (error) {
    console.warn(
      `Failed to fetch what-if scenario with ID "${whatIfScenarioId}": ${error}`,
    )
    return null
  }
}
