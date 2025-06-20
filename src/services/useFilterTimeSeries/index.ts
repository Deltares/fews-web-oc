import {
  PiWebserviceProvider,
  TimeSeriesResult,
  type TimeSeriesFilter,
} from '@deltares/fews-pi-requests'
import { computed, onUnmounted, ref, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { type Pausable } from '@vueuse/core'
import { useFocusAwareInterval } from '@/services/useFocusAwareInterval'

export interface UseTimeSeriesReturn {
  series: ShallowRef<Record<string, TimeSeriesResult>>
  isLoading: Ref<boolean>
  loadingSeriesIds: Ref<string[]>
  interval: Pausable
  refresh: () => void
}

const TIMESERIES_POLLING_INTERVAL = 1000 * 30

export interface UseTimeSeriesOptions {
  startTime?: Date | null
  endTime?: Date | null
  thinning?: boolean
  showVerticalProfile?: boolean
  convertDatum?: boolean
  useDisplayUnits?: boolean
}

function timeZoneOffsetString(offset: number): string {
  const offsetInMinutes = offset * 60
  const minutes = offsetInMinutes % 60
  const hours = Math.round(offsetInMinutes / 60)
  return `+${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}

export function useFilterTimeSeries(
  baseUrl: string,
  filter: MaybeRefOrGetter<TimeSeriesFilter>,
  options: MaybeRefOrGetter<UseTimeSeriesOptions>,
  fetchingEnabled?: MaybeRefOrGetter<boolean>,
): UseTimeSeriesReturn {
  let controller = new AbortController()
  const series = shallowRef<Record<string, TimeSeriesResult>>({})
  const loadingSeriesIds = ref<string[]>([])
  const isLoading = computed(() => loadingSeriesIds.value.length > 0)

  const watchedParams = [filter, options, fetchingEnabled].filter(
    (p) => p !== undefined,
  )
  watch(watchedParams, () => {
    loadTimeSeries()
  })

  async function loadTimeSeries() {
    if (fetchingEnabled !== undefined && !toValue(fetchingEnabled)) return

    controller.abort('Timeseries request triggered again before finishing.')
    controller = new AbortController()
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(controller),
    })
    const _filter = toValue(filter)
    console.debug('useFilterTimeSeries: loadTimeSeries', _filter)
    if (_filter === undefined || !_filter.filterId?.length ) return
    const updatedSeriesIds: string[] = []

    const piSeries = await piProvider.getTimeSeries(_filter)
    if (piSeries.timeSeries === undefined) return

    piSeries.timeSeries.forEach((timeSeries, index) => {
      const resourceId = `${timeSeries.header?.locationId}-${timeSeries.header?.parameterId}-${timeSeries.header?.moduleInstanceId}`
      updatedSeriesIds.push(resourceId)

      if (timeSeries !== undefined) {
        series.value = {
          ...series.value,
          [resourceId]: timeSeries,
        }
      }
    })
  }

  const interval = useFocusAwareInterval(
    loadTimeSeries,
    TIMESERIES_POLLING_INTERVAL,
    { immediateCallback: true },
  )

  onUnmounted(() => {
    controller.abort('useTimeSeries unmounted.')
  })

  return {
    series,
    isLoading,
    loadingSeriesIds,
    interval,
    refresh: loadTimeSeries,
  }
}
