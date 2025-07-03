import {
  PiWebserviceProvider,
  type ActionsResponse,
} from '@deltares/fews-pi-requests'
import { computed, ref, toValue, watch } from 'vue'
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
  plotIndex: MaybeRefOrGetter<number | undefined>,
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

  watch(
    [() => toValue(nodeId), () => toValue(taskRunIds), () => toValue(options)],
    async ([_nodeId, _taskRunIds, _options]) => {
      if (_nodeId === undefined) return
      if (_nodeId !== prevNodeId.value) {
        taskRunColorsStore.clearColors()
        prevNodeId.value = _nodeId
      }

      const filter = {
        nodeId: _nodeId,
        ..._options,
      }
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

      displays.value = actionsResponseToDisplayConfig(response.value, _nodeId)
    },
    { immediate: true },
  )

  const displayConfig = computed<DisplayConfig | null>((oldDisplayConfig) => {
    const _plotIndex = toValue(plotIndex)
    if (!displays.value) return null
    return displays.value[_plotIndex ?? 0] ?? oldDisplayConfig ?? null
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

  watch(
    [() => toValue(filter), () => toValue(taskRunIds)],
    async ([_filter, _taskRunIds]) => {
      if (_filter === undefined) return
      if (isFilterActionsFilter(_filter)) {
        if (!_filter.filterId) {
          response.value = undefined
          return
        }

        if (_filter.filterId !== prevFilterId.value) {
          taskRunColorsStore.clearColors()
          prevFilterId.value = _filter.filterId
        }

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
    },
    { immediate: true },
  )

  // Use a second watchEffect to not trigger a fetch on these reactive variables
  watch(response, (_reponse) => {
    if (!_reponse) {
      displayConfig.value = null
      displays.value = null
      return
    }

    const _displays = actionsResponseToDisplayConfig(_reponse, undefined)
    displays.value = _displays
    displayConfig.value = _displays[0]
  })

  const shell = {
    displays,
    displayConfig,
  }

  return shell
}

export function fetchActions(
  baseUrl: string,
  filter: Filter,
): Promise<ActionsResponse> {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  if (isFilterActionsFilter(filter)) {
    return piProvider.getFilterActions(filter)
  } else if (isTimeSeriesGridActionsFilter(filter)) {
    return piProvider.getTimeSeriesGridActions(filter)
  }
  throw new Error('Invalid filter type')
}
