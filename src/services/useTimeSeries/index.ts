import {
  ActionRequest,
  PiWebserviceProvider,
  type TimeSeriesFilter,
  type TimeSeriesEvent,
} from '@deltares/fews-pi-requests'
import { onUnmounted, ref, shallowRef, toValue, watchEffect } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { absoluteUrl } from '../../lib/utils/absoluteUrl'
import { DateTime, Interval } from 'luxon'
import { Series } from '../../lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '../../lib/timeseries/timeSeriesResource'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { difference } from 'lodash-es'

export interface UseTimeSeriesReturn {
  error: Ref<any>
  series: Ref<Record<string, Series>>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export interface UseTimeSeriesOptions {
  startTime?: Date | null
  endTime?: Date | null
  thinning?: boolean
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

function parsePiDateTime(
  event: { date: string; time: string },
  timeZone: string,
) {
  return `${event.date}T${event.time}${timeZone}`
}

/**
 * Reactive async state. Will not block your setup function and will trigger changes once
 * the promise is ready.
 *
 * @see https://vueuse.org/useAsyncState
 * @param url The initial state, used until the first evaluation finishes
 */
export function useTimeSeries(
  baseUrl: string,
  requests: MaybeRefOrGetter<ActionRequest[]>,
  lastUpdated: MaybeRefOrGetter<Date | undefined>,
  options?: MaybeRefOrGetter<UseTimeSeriesOptions>,
): UseTimeSeriesReturn {
  let controller = new AbortController()
  const isReady = ref(false)
  const isLoading = ref(false)
  const series = ref<Record<string, Series>>({})
  const error = shallowRef<any | undefined>(undefined)

  watchEffect(() => {
    controller.abort()
    controller = new AbortController()
    toValue(lastUpdated)
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(controller),
    })
    const _requests = toValue(requests)
    const _options = toValue(options)
    Object.assign(series.value, {})

    for (const r in _requests) {
      const request = _requests[r]
      const url = absoluteUrl(`${baseUrl}/${request.request}`)
      const queryParams = url.searchParams
      if (_options?.startTime) {
        const startTime = DateTime.fromJSDate(_options.startTime, {
          zone: 'UTC',
        })
        url.searchParams.set(
          'startTime',
          startTime.toISO({ suppressMilliseconds: true }) ?? '',
        )
      }
      if (_options?.endTime) {
        const endTime = DateTime.fromJSDate(_options.endTime, {
          zone: 'UTC',
        })
        url.searchParams.set(
          'endTime',
          endTime.toISO({ suppressMilliseconds: true }) ?? '',
        )
      }
      // Set thinning
      const startTimeString = queryParams.get('startTime')
      const endTimeString = queryParams.get('endTime')
      if (startTimeString !== null && endTimeString !== null) {
        const startTime = DateTime.fromISO(startTimeString, {
          zone: 'UTC',
        })
        const endTime = DateTime.fromISO(endTimeString, {
          zone: 'UTC',
        })
        const timeStepPerPixel = Math.round(
          Interval.fromDateTimes(startTime, endTime).length() /
            window.outerWidth /
            2,
        )
        url.searchParams.set('thinning', `${timeStepPerPixel}`)
      }
      if (_options?.useDisplayUnits !== undefined) {
        url.searchParams.set('useDisplayUnits', `${_options?.useDisplayUnits}`)
      }
      if (_options?.convertDatum) {
        url.searchParams.set('convertDatum', `${_options?.convertDatum}`)
      }

      const resourceId = `${request.key}`
      const relativeUrl = request.request.split('?')[0] + url.search
      piProvider.getTimeSeriesWithRelativeUrl(relativeUrl).then((piSeries) => {
        if (piSeries.timeSeries !== undefined)
          for (const timeSeries of piSeries.timeSeries) {
            if (timeSeries.events === undefined) continue
            const resource = new SeriesUrlRequest('fews-pi', 'dummyUrl')
            const _series = new Series(resource)
            const header = timeSeries.header
            if (header !== undefined) {
              const missingValue: string = header.missVal
              const timeZone =
                piSeries.timeZone === undefined
                  ? 'Z'
                  : timeZoneOffsetString(+piSeries.timeZone)

              _series.header.name = `${header.stationName} - ${header.parameterId} (${header.moduleInstanceId})`

              _series.header.unit = header.units
              _series.header.parameter = header.parameterId
              _series.header.location = header.stationName
              _series.header.source = header.moduleInstanceId
              _series.start = new Date(
                parsePiDateTime(header.startDate, timeZone),
              )
              _series.end = new Date(parsePiDateTime(header.endDate, timeZone))
              _series.data = timeSeries.events.map((event) => {
                return {
                  x: new Date(parsePiDateTime(event, timeZone)),
                  y: event.value === missingValue ? null : +event.value,
                  flag: event.flag,
                  flagSource: event.flagSource,
                  comment: event.comment,
                  user: event.user,
                }
              })
            }
            series.value[resourceId] = _series
          }
      })
    }
  })

  onUnmounted(() => {
    controller.abort()
  })

  const shell = {
    series,
    isReady,
    isLoading,
    error,
  }

  return shell
}

export async function postTimeSeriesEdit(
  baseUrl: string,
  requests: ActionRequest[],
  data: Record<string, TimeSeriesEvent[]>,
) {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  for (const timeSeriesId in data) {
    const events = data[timeSeriesId]
    const request = requests.find((r) => r.key === timeSeriesId)
    if (request === undefined) continue
    const url = absoluteUrl(`${baseUrl}${request.editRequest}`)
    const queryParams = url.searchParams
    const timeSeriesSetIndex = +(queryParams.get('timeSeriesSetIndex') ?? -1)
    const locationId = queryParams.get('locationId') ?? ''
    const filter: TimeSeriesFilter = {
      timeSeriesSetIndex,
      locationIds: [locationId],
      onlyHeaders: true,
    }
    const piSeriesHeaders = await piProvider.getTimeSeries(filter)
    const timeSeriesEdit = {
      version: piSeriesHeaders.version,
      timeZone: piSeriesHeaders.timeZone,
      timeSeries: [{ events }],
    }
    await piProvider.postTimeSeriesEdit(url.toString(), timeSeriesEdit)
  }
}
