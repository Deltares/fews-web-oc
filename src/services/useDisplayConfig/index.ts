import {
  PiWebserviceProvider,
  type ActionsResponse,
} from '@deltares/fews-pi-requests'
import { computed, ref, toValue, watchEffect } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { DisplayConfig } from '@/lib/display/DisplayConfig'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { MD5 } from 'crypto-js'
import {
  type Filter,
  isFilterActionsFilter,
  isTimeSeriesGridActionsFilter,
} from '@/lib/filters'
import { actionsResponseToDisplayConfig } from '@/lib/actions'
import { useFocusAwareInterval } from '../useFocusAwareInterval'

export interface UseDisplayConfigReturn {
  displayConfig: Ref<DisplayConfig | null>
  displays: Ref<DisplayConfig[] | null>
}

export interface UseDisplayConfigOptions {
  convertDatum?: boolean
  useDisplayUnits?: boolean
}

const POLLING_INTERVAL = 1000 * 30

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
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const response = ref<ActionsResponse>()

  watchEffect(loadTopologyActions)
  useFocusAwareInterval(loadTopologyActions, POLLING_INTERVAL, {
    immediate: true,
  })
  async function loadTopologyActions() {
    const _nodeId = toValue(nodeId)
    if (_nodeId === undefined) return

    response.value = await piProvider.getTopologyActions({
      nodeId: _nodeId,
      ...toValue(options),
    })
  }

  const displays = computed(() => {
    if (!response.value) return null

    const _nodeId = toValue(nodeId)
    const _startTime = toValue(startTime)
    const _endTime = toValue(endTime)

    return actionsResponseToDisplayConfig(
      response.value,
      _nodeId,
      _startTime,
      _endTime,
    )
  })

  const displayConfig = computed(() => {
    const _plotId = toValue(plotId)
    return displays.value?.find((d) => d.plotId === _plotId) ?? null
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
): UseDisplayConfigReturn {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const displayConfig = ref<DisplayConfig | null>(null)
  const displays = ref<DisplayConfig[] | null>(null)
  const response = ref<ActionsResponse>()

  watchEffect(loadActions)
  useFocusAwareInterval(loadActions, POLLING_INTERVAL, {
    immediate: true,
  })

  async function loadActions() {
    const _filter = toValue(filter)
    if (_filter === undefined) return

    if (isFilterActionsFilter(_filter)) {
      if (!_filter.filterId) return

      response.value = await piProvider.getFilterActions(_filter)
    } else if (isTimeSeriesGridActionsFilter(_filter)) {
      response.value = await piProvider.getTimeSeriesGridActions(_filter)

      response.value.results.forEach((result) => {
        result.requests.forEach((request) => {
          request.key = MD5(request.request).toString()
        })
        if (result.config?.timeSeriesDisplay.subplots) {
          let i = 0
          result.config.timeSeriesDisplay.subplots.forEach((subPlot) => {
            subPlot.items.forEach((item) => {
              if (item.request === undefined) {
                item.request = `${result.requests[0].key}[${i}]`
              }
              i++
            })
          })
        }
      })
    } else {
      displayConfig.value = null
      displays.value = null
      return
    }
  }

  // Use a second watchEffect to not trigger a fetch on these reactive variables
  watchEffect(() => {
    if (!response.value) return

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
