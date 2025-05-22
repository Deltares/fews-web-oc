import {
  PiWebserviceProvider,
  type ActionsResponse,
} from '@deltares/fews-pi-requests'
import { computed, ref, toValue, watch, watchEffect } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { DisplayConfig } from '@/lib/display'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.js'
import {
  type Filter,
  isFilterActionsFilter,
  isTimeSeriesGridActionsFilter,
} from '@/lib/filters'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import {
  actionsResponseToDisplayConfig,
  addFilterPeriodToConfig,
  addIndexToKeys,
} from '@/lib/display'

export interface UseDisplayConfigReturn {
  displayConfig: Ref<DisplayConfig | null>
  displays: Ref<DisplayConfig[] | null>
}

export interface UseDisplayConfigOptions {
  convertDatum?: boolean
  useDisplayUnits?: boolean
}

/**
 * Create the displays and the display configs of a node and selected time series display.
 *
 * @param {string} baseUrl  url of the FEWS web services.
 * @param {string} nodeId  id of the topology node.
 * @param {number} plotId  number of the plot node of a display group.
 */
export function useDisplayConfig(
  baseUrl: string,
  nodeId: MaybeRefOrGetter<string | undefined>,
  plotId: MaybeRefOrGetter<string | undefined>,
  startTime?: MaybeRefOrGetter<Date | undefined>,
  endTime?: MaybeRefOrGetter<Date | undefined>,
  options?: MaybeRefOrGetter<UseDisplayConfigOptions>,
  taskRunIds?: MaybeRefOrGetter<string[]>,
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const response = ref<ActionsResponse>()
  const displays = ref<DisplayConfig[] | null>(null)
  const taskRunColorsStore = useTaskRunColorsStore()
  const prevNodeId = ref<string | undefined>(undefined)

  watchEffect(async () => {
    const _nodeId = toValue(nodeId)
    if (_nodeId === undefined) return
    if (_nodeId !== prevNodeId.value) {
      taskRunColorsStore.clearColors()
      prevNodeId.value = _nodeId
    }

    const filter = {
      nodeId: _nodeId,
      ...toValue(options),
    }
    const _taskRunIds = toValue(taskRunIds)
    const taskRunsFilter = {
      ...filter,
      // TODO: Change this to string.join(',') when the backend is fixed
      taskRunIds: _taskRunIds,
      currentForecastsAlwaysVisible: true,
    }

    response.value = await piProvider.getTopologyActions(
      _taskRunIds?.length ? taskRunsFilter : filter,
    )
    // Assign a color to each task run id in the actions response
    // and add it to the colorsMapping
    for (const taskRunId of _taskRunIds ?? []) {
      // If it is not current and doesn't have a color already, assign a color to the taskRunId
      if (!taskRunColorsStore.getColor(taskRunId)) {
        taskRunColorsStore.setColor(taskRunId)
      }
    }
  })

  watch([startTime, endTime, response], () => {
    if (!response.value) return

    const _nodeId = toValue(nodeId)
    const _startTime = toValue(startTime)
    const _endTime = toValue(endTime)

    displays.value = actionsResponseToDisplayConfig(
      response.value,
      _nodeId,
      _startTime,
      _endTime,
    )
  })

  const displayConfig = computed<DisplayConfig | null>((oldDisplayConfig) => {
    const _plotId = toValue(plotId)
    if (!displays.value) return null
    return (
      displays.value.find((d) => d.plotId === _plotId) ??
      oldDisplayConfig ??
      null
    )
  })

  return {
    displays,
    displayConfig,
  }
}

/**
 * Create the displays and the display configs for a time series display using filter actions.
 *
 * @param baseUrl The URL of the FEWS web services.
 * @params filter The filter for the actions request.
 * @returns An object with `displays` and `displayConfig` properties.
 */
export function useDisplayConfigFilter(
  baseUrl: string,
  filter: MaybeRefOrGetter<Filter | undefined>,
  startTime: MaybeRefOrGetter<Date | undefined>,
  endTime: MaybeRefOrGetter<Date | undefined>,
  taskRunIds?: MaybeRefOrGetter<string[]>,
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const displayConfig = ref<DisplayConfig | null>(null)
  const displays = ref<DisplayConfig[] | null>(null)
  const response = ref<ActionsResponse>()
  const taskRunColorsStore = useTaskRunColorsStore()
  const prevFilterId = ref<string | undefined>(undefined)

  watchEffect(async () => {
    const _filter = toValue(filter)
    if (_filter === undefined) {
      response.value = undefined
      return
    }

    if (isFilterActionsFilter(_filter)) {
      if (!_filter.filterId) return

      if (_filter.filterId !== prevFilterId.value) {
        taskRunColorsStore.clearColors()
        prevFilterId.value = _filter.filterId
      }

      const _taskRunIds = toValue(taskRunIds)
      const taskRunsFilter = {
        ..._filter,
        taskRunIds: _taskRunIds?.join(','),
        currentForecastsAlwaysVisible: true,
      }
      // Assign a color to each task run id in the actions response
      // and add it to the colorsMapping
      for (const taskRunId of _taskRunIds ?? []) {
        // If it is not current and doesn't have a color already, assign a color to the taskRunId
        if (!taskRunColorsStore.getColor(taskRunId)) {
          taskRunColorsStore.setColor(taskRunId)
        }
      }
      const _response = await piProvider.getFilterActions(
        _taskRunIds?.length ? taskRunsFilter : _filter,
      )
      response.value = _response
    } else if (isTimeSeriesGridActionsFilter(_filter)) {
      const _response = await piProvider.getTimeSeriesGridActions(_filter)
      // Grid actions normally do not return a period, if that is the case,
      // we add the requested period from the filter to the config.
      // This is done to have a default period for necessary for resetting
      // the domain of a chart after zooming in.
      addFilterPeriodToConfig(_response.results, _filter)
      addIndexToKeys(_response.results)
      response.value = _response
    } else {
      displayConfig.value = null
      displays.value = null
      return
    }
  })

  // Use a second watchEffect to not trigger a fetch on these reactive variables
  watchEffect(() => {
    if (!response.value) {
      displayConfig.value = null
      displays.value = null
      return
    }

    const _startTime = toValue(startTime)
    const _endTime = toValue(endTime)
    let nodeId = undefined

    const _displays = actionsResponseToDisplayConfig(
      response.value,
      nodeId,
      _startTime,
      _endTime,
    )
    displays.value = _displays
    displayConfig.value = _displays[0]
  })

  const shell = {
    displays,
    displayConfig,
  }

  return shell
}
