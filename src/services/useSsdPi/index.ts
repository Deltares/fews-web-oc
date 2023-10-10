import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'
import type { DisplayConfig } from '@/lib/display/DisplayConfig'
import {
  ClickType,
  SsdWebserviceProvider,
  type ActionRequest,
} from '@deltares/fews-ssd-requests'
import {
  ref,
  type MaybeRefOrGetter,
  type Ref,
  shallowRef,
  toValue,
  watchEffect,
} from 'vue'
import { transformRequestFn } from '@/lib/requests/transformRequest'

export interface UseSsdPiReturn {
  displayConfig: Ref<DisplayConfig | undefined>
  displays: Ref<DisplayConfig[] | undefined>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
  error: Ref<any>
}

export function useSsdPi(
  baseUrl: string,
  panelId: MaybeRefOrGetter<string>,
  objectId: MaybeRefOrGetter<string>,
  plotId?: MaybeRefOrGetter<number>,
): UseSsdPiReturn {
  const ssdProvider = new SsdWebserviceProvider(baseUrl, {
    transformRequestFn: transformRequestFn(),
  })

  const isReady = ref(false)
  const isLoading = ref(false)
  const displayConfig = ref<DisplayConfig>()
  const displays = ref<DisplayConfig[]>()
  const error = shallowRef<unknown | undefined>(undefined)

  watchEffect(async () => {
    const _displays: DisplayConfig[] = []
    const filter: ActionRequest = {
      panelId: toValue(panelId),
      objectId: toValue(objectId),
      clickType: ClickType.LEFTSINGLECLICK,
      config: true,
    }
    const _plotId = toValue(plotId) ?? 0
    const action = await ssdProvider.getAction(filter)
    for (const result of action.results) {
      if (result.config === undefined) continue
      const title = result.config.timeSeriesDisplay.title ?? ''
      let subplots: ChartConfig[] = []
      if (result.config.timeSeriesDisplay.subplots) {
        subplots = result.config.timeSeriesDisplay.subplots?.map((subPlot) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return timeSeriesDisplayToChartConfig(subPlot, title)
        })
      }
      const display: DisplayConfig = {
        id: title,
        title,
        class: 'singles',
        requests: result.requests,
        subplots,
      }
      _displays.push(display)
    }
    displays.value = _displays
    displayConfig.value = _displays[_plotId]
  })

  return {
    displays,
    displayConfig,
    isReady,
    isLoading,
    error,
  }
}
