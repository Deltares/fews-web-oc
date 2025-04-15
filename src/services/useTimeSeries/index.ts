import {
  ActionRequest,
  PiWebserviceProvider,
  type TimeSeriesEvent,
  DomainAxisEventValuesStringArray,
} from '@deltares/fews-pi-requests'
import { computed, onUnmounted, ref, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter, Ref, ShallowRef } from 'vue'
import { absoluteUrl } from '../../lib/utils/absoluteUrl'
import { DateTime, Interval } from 'luxon'
import { Series } from '../../lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '../../lib/timeseries/timeSeriesResource'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { difference } from 'lodash-es'
import { SeriesData } from '@/lib/timeseries/types/SeriesData'
import { convertFewsPiDateTimeToJsDate } from '@/lib/date'
import { type Pausable } from '@vueuse/core'
import { useFocusAwareInterval } from '@/services/useFocusAwareInterval'

export interface UseTimeSeriesReturn {
  series: ShallowRef<Record<string, Series>>
  isLoading: Ref<boolean>
  loadingSeriesIds: Ref<string[]>
  interval: Pausable
}

const TIMESERIES_POLLING_INTERVAL = 1000 * 30

export interface UseTimeSeriesOptions {
  startTime?: Date | null
  endTime?: Date | null
  thinning?: boolean
  showVerticalProfile?: boolean
}

function timeZoneOffsetString(offset: number): string {
  const offsetInMinutes = offset * 60
  const minutes = offsetInMinutes % 60
  const hours = Math.round(offsetInMinutes / 60)
  return `+${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}

export function useTimeSeries(
  baseUrl: string,
  requests: MaybeRefOrGetter<ActionRequest[]>,
  lastUpdated: MaybeRefOrGetter<Date | undefined>,
  options: MaybeRefOrGetter<UseTimeSeriesOptions>,
  selectedTime?: MaybeRefOrGetter<Date | undefined>,
): UseTimeSeriesReturn {
  let controller = new AbortController()
  const series = shallowRef<Record<string, Series>>({})
  const MAX_SERIES = 20
  const loadingSeriesIds = ref<string[]>([])
  const isLoading = computed(() => loadingSeriesIds.value.length > 0)

  watch([lastUpdated, selectedTime ?? ref(), requests, options], () => {
    loadTimeSeries()
  })

  function loadTimeSeries() {
    controller.abort('Timeseries request triggered again before finishing.')
    controller = new AbortController()
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(controller),
    })
    const _requests = toValue(requests)
    const _options = toValue(options)
    const _selectedTime = toValue(selectedTime)

    const currentSeriesIds = Object.keys(series.value)
    const updatedSeriesIds: string[] = []
    loadingSeriesIds.value = _requests.flatMap((r) => (r.key ? [r.key] : []))

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
      if (_options?.thinning) {
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
      }

      const relativeUrl = request.request.split('?')[0] + url.search
      const isGridTimeSEries = request.request.includes('/timeseries/grid?')
      piProvider.getTimeSeriesWithRelativeUrl(relativeUrl).then((piSeries) => {
        if (request.key)
          loadingSeriesIds.value.splice(
            loadingSeriesIds.value.indexOf(request.key),
            1,
          )
        if (piSeries.timeSeries !== undefined)
          for (const index in piSeries.timeSeries) {
            const timeSeries = piSeries.timeSeries[index]
            const resourceId = isGridTimeSEries
              ? `${request.key}[${index}]`
              : (request.key ?? '')
            updatedSeriesIds.push(resourceId)
            const resource = new SeriesUrlRequest(
              'fews-pi',
              `dummyUrl-for-resource-${resourceId}`,
            )
            const _series = new Series(resource)
            const header = timeSeries.header
            if (header !== undefined) {
              _series.missingValue = header.missVal
              const timeZone =
                piSeries.timeZone === undefined
                  ? 'Z'
                  : timeZoneOffsetString(+piSeries.timeZone)
              _series.header.timeZone = piSeries.timeZone
              _series.header.version = piSeries.version
              _series.header.name = `${header.stationName} - ${header.parameterId} (${header.moduleInstanceId})`

              _series.header.unit = header.units
              _series.header.timeStep = header.timeStep
              _series.header.parameter = header.parameterId
              _series.header.location = header.stationName
              _series.header.source = header.moduleInstanceId
              _series.start = convertFewsPiDateTimeToJsDate(
                header.startDate,
                timeZone,
              )
              _series.end = convertFewsPiDateTimeToJsDate(
                header.endDate,
                timeZone,
              )
              if (timeSeries.events) {
                _series.data = timeSeries.events.map((event) => {
                  return {
                    x: convertFewsPiDateTimeToJsDate(event, timeZone),
                    y:
                      event.value === _series.missingValue
                        ? null
                        : +event.value,
                    flag: event.flag,
                    flagSource: event.flagSource,
                    comment: event.comment,
                    user: event.user,
                  }
                })
              } else if (timeSeries.domains && _selectedTime) {
                _series.domains = timeSeries.domains
                fillSeriesForElevation(_series, _selectedTime, timeZone)
              }
              _series.lastUpdated = new Date()
            }
            series.value = {
              ...series.value,
              [resourceId]: _series,
            }
          }
      })
    }
    const oldSeriesIds = difference(currentSeriesIds, updatedSeriesIds)
    if (oldSeriesIds.length > MAX_SERIES) {
      for (const seriesId of oldSeriesIds) {
        delete series.value[seriesId]
      }
    }
  }

  const interval = useFocusAwareInterval(
    loadTimeSeries,
    TIMESERIES_POLLING_INTERVAL,
  )

  onUnmounted(() => {
    controller.abort('useTimeSeries unmounted.')
  })

  return {
    series,
    isLoading,
    loadingSeriesIds,
    interval,
  }
}

export async function postTimeSeriesEdit(
  baseUrl: string,
  requests: ActionRequest[],
  data: Record<string, TimeSeriesEvent[]>,
  version: string,
  timeZone: string,
) {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  for (const timeSeriesId in data) {
    const events = data[timeSeriesId]
    const request = requests.find((r) => r.key === timeSeriesId)
    if (request === undefined) continue
    const url = absoluteUrl(`${baseUrl}${request.editRequest}`)
    const timeSeriesEdit = {
      version,
      timeZone,
      timeSeries: [{ events }],
    }
    await piProvider.postTimeSeriesEdit(url.toString(), timeSeriesEdit)
  }
}

function fillSeriesForElevation(
  timeSeries: Series,
  currentDate: Date,
  timeZone: string,
): void {
  if (timeSeries.domains === undefined) {
    throw new Error('No domains found')
  }
  const domainAxisValues = timeSeries.domains[0].domainAxisValues
  if (domainAxisValues !== undefined) {
    const domain = domainAxisValues[0]
    if (domain.values === undefined || domain.values.length < 1) {
      throw new Error('No domain values found')
    }

    // convert domain.values to an array of numbers
    const domainValues = domain.values.map(
      (value: DomainAxisEventValuesStringArray) => {
        return +value[0]
      },
    )
    const events = timeSeries.domains.slice(0)

    // find the event in the events that matches the date
    const event = events.find((event) => {
      const time = event.events![0].time
      const date = event.events![0].date
      if (time === undefined || date === undefined) {
        return false
      }
      const eventDate = convertFewsPiDateTimeToJsDate({ date, time }, timeZone)
      return eventDate.getTime() === currentDate.getTime()
    })

    timeSeries.data = domainValues
      .map((domainValue, index) => {
        const eventValue = event?.events?.[0]?.values?.[index]
        if (eventValue?.includes(timeSeries.missingValue ?? '')) {
          return
        }
        const eventFlag = event?.events?.[0]?.flag
        const x = eventValue === undefined ? null : +eventValue
        return {
          x,
          y: domainValue,
          flag: eventFlag,
        }
      })
      .filter((value) => !!value) as SeriesData[]
  }
}
