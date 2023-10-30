import { ActionRequest, PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { ref, shallowRef, toValue, watchEffect } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { absoluteUrl } from '../../lib/utils/absoluteUrl'
import { DateTime, Interval } from 'luxon'
import { Series } from '../../lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '../../lib/timeseries/timeSeriesResource'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'

export interface UseTimeSeriesReturn {
  error: Ref<any>
  series: Ref<Record<string, Series>>
  isReady: Ref<boolean>
  isLoading: Ref<boolean>
}

export interface UseTimeSeriesOptions {
  startTime?: Date
  endTime?: Date
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
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(controller),
    })
    const _requests = toValue(requests)
    const _options = toValue(options)

    for (const r in _requests) {
      const request = _requests[r]
      const url = absoluteUrl(`${baseUrl}/${request.request}`)
      const queryParams = url.searchParams
      const startTimeString = queryParams.get('startTime')
      const endTimeString = queryParams.get('endTime')
      if (_options?.startTime && _options?.endTime) {
        const startTime = DateTime.fromJSDate(_options.startTime, {
          zone: 'UTC',
        })
        const endTime = DateTime.fromJSDate(_options?.endTime, { zone: 'UTC' })
        const timeStepPerPixel = Math.round(
          Interval.fromDateTimes(startTime, endTime).length() /
            window.outerWidth /
            2,
        )
        url.searchParams.set(
          'startTime',
          startTime.toISO({ suppressMilliseconds: true }) ?? '',
        )
        url.searchParams.set(
          'endTime',
          endTime.toISO({ suppressMilliseconds: true }) ?? '',
        )
        url.searchParams.set('thinning', `${timeStepPerPixel}`)
      } else if (startTimeString !== null && endTimeString !== null) {
        const startTime = DateTime.fromISO(startTimeString, { zone: 'UTC' })
        const endTime = DateTime.fromISO(endTimeString, { zone: 'UTC' })
        const timeStepPerPixel = Math.round(
          Interval.fromDateTimes(startTime, endTime).length() /
            window.outerWidth /
            2,
        )
        url.searchParams.set(
          'startTime',
          startTime.toISO({ suppressMilliseconds: true }) ?? '',
        )
        url.searchParams.set(
          'endTime',
          endTime.toISO({ suppressMilliseconds: true }) ?? '',
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
                }
              })
            }
            series.value[resourceId] = _series
          }
      })
    }
  })

  const shell = {
    series,
    isReady,
    isLoading,
    error,
  }

  return shell
}
