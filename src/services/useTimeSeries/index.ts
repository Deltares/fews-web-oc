import {
  PiWebserviceProvider,
  type ActionRequest,
  type TimeSeriesEvent,
  TimeSeriesResult,
  TimeSeriesResponse,
  type DomainAxisEventValuesStringArray,
  type Header,
  type TimeSeriesFilter,
} from '@deltares/fews-pi-requests'
import {
  computed,
  onUnmounted,
  ref,
  shallowRef,
  toValue,
  watch,
  watchEffect,
} from 'vue'
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

export function useTimeSeries(
  baseUrl: string,
  requests: MaybeRefOrGetter<ActionRequest[]>,
  options: MaybeRefOrGetter<UseTimeSeriesOptions>,
  fetchingEnabled?: MaybeRefOrGetter<boolean>,
  selectedTime?: MaybeRefOrGetter<Date | undefined>,
): UseTimeSeriesReturn {
  let controller = new AbortController()
  const series = shallowRef<Record<string, Series>>({})
  const MAX_SERIES = 20
  const loadingSeriesIds = ref<string[]>([])
  const isLoading = computed(() => loadingSeriesIds.value.length > 0)

  const watchedParams = [
    requests,
    options,
    fetchingEnabled,
    selectedTime,
  ].filter((p) => p !== undefined)
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
    const _requests = toValue(requests)
    const _selectedTime = toValue(selectedTime)

    const currentSeriesIds = Object.keys(series.value)
    const updatedSeriesIds: string[] = []
    loadingSeriesIds.value = _requests.flatMap((r) => (r.key ? [r.key] : []))

    const promises = _requests.map(async (request) => {
      const relativeUrl = getRelativeUrlForRequest(request)

      const isGridTimeSeries = request.request.includes('/timeseries/grid?')
      const piSeries =
        await piProvider.getTimeSeriesWithRelativeUrl(relativeUrl)
      if (request.key) {
        loadingSeriesIds.value.splice(
          loadingSeriesIds.value.indexOf(request.key),
          1,
        )
      }
      if (piSeries.timeSeries === undefined) return

      piSeries.timeSeries.forEach((timeSeries, index) => {
        const resourceId = isGridTimeSeries
          ? `${request.key}[${index}]`
          : (request.key ?? '')
        updatedSeriesIds.push(resourceId)

        const _series = convertTimeSeriesResultToSeries(
          timeSeries,
          piSeries,
          resourceId,
          _selectedTime,
        )
        if (_series !== undefined) {
          series.value = {
            ...series.value,
            [resourceId]: _series,
          }
        }
      })
    })
    const results = await Promise.allSettled(promises)
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `Failed to fetch time series for request URL ${_requests[index].request}: ${result.reason}`,
        )
      }
    })

    const oldSeriesIds = difference(currentSeriesIds, updatedSeriesIds)
    if (oldSeriesIds.length > MAX_SERIES) {
      for (const seriesId of oldSeriesIds) {
        delete series.value[seriesId]
      }
    }
  }

  function getRelativeUrlForRequest(request: ActionRequest): string {
    const _options = toValue(options)

    // Parse request URL to URL object to be able to append query parameters.
    const url = absoluteUrl(`${baseUrl}/${request.request}`)

    const convertToDateTime = (date: Date | null | undefined) => {
      if (!date) return null
      return DateTime.fromJSDate(date, {
        zone: 'UTC',
      })
    }
    const startTime = convertToDateTime(_options.startTime)
    const endTime = convertToDateTime(_options.endTime)

    const convertToFewsPiDateTimeQueryParameter = (
      datetime: DateTime | null,
    ) => {
      if (!datetime) return null
      return datetime.toISO({ suppressMilliseconds: true })
    }
    const startTimeQuery = convertToFewsPiDateTimeQueryParameter(startTime)
    const endTimeQuery = convertToFewsPiDateTimeQueryParameter(endTime)

    // Set start and end time.
    if (startTimeQuery) url.searchParams.set('startTime', startTimeQuery)
    if (endTimeQuery) url.searchParams.set('endTime', endTimeQuery)

    // Set thinning if specified.
    if (_options.thinning) {
      const parseDateTimeFromSearchParam = (param: string) => {
        const dateTimeString = url.searchParams.get(param)
        if (!dateTimeString) return null
        return DateTime.fromISO(dateTimeString)
      }
      // If no start or end time was specified, parse it from the query
      // parameter obtained from the original actions request URL.
      const requestStartTime =
        startTime ?? parseDateTimeFromSearchParam('startTime')
      const requestEndTime = endTime ?? parseDateTimeFromSearchParam('endTime')

      if (requestStartTime && requestEndTime) {
        const durationMilliseconds = Interval.fromDateTimes(
          requestStartTime,
          requestEndTime,
        ).length('millisecond')
        const estimatedChartWidth = 0.5 * window.outerWidth
        const millisecondsPerPixel = Math.round(
          durationMilliseconds / estimatedChartWidth,
        )
        url.searchParams.set('thinning', millisecondsPerPixel.toString())
      }
    }

    if (_options.convertDatum) {
      url.searchParams.set('convertDatum', _options.convertDatum.toString())
    }

    if (_options.useDisplayUnits) {
      url.searchParams.set(
        'useDisplayUnits',
        _options.useDisplayUnits.toString(),
      )
    }

    // Convert absolute URL back into relative URL with updated search
    // parameters.
    return request.request.split('?')[0] + url.search
  }

  function convertTimeSeriesResultToSeries(
    timeSeries: TimeSeriesResult,
    response: TimeSeriesResponse,
    resourceId: string,
    selectedTime?: Date,
  ): Series | undefined {
    const header = timeSeries.header
    if (header === undefined) return undefined

    const resource = new SeriesUrlRequest(
      'fews-pi',
      `dummyUrl-for-resource-${resourceId}`,
    )
    const series = new Series(resource)

    series.missingValue = header.missVal
    const timeZone =
      response.timeZone === undefined
        ? 'Z'
        : timeZoneOffsetString(+response.timeZone)
    series.header.timeZone = response.timeZone
    series.header.version = response.version
    series.header.name = `${header.stationName} - ${header.parameterId} (${header.moduleInstanceId})`

    series.header.unit = header.units
    series.header.timeStep = header.timeStep
    series.header.parameter = header.parameterId
    series.header.location = header.stationName
    series.header.source = header.moduleInstanceId
    series.start = convertFewsPiDateTimeToJsDate(header.startDate, timeZone)
    series.end = convertFewsPiDateTimeToJsDate(header.endDate, timeZone)
    if (timeSeries.events) {
      series.data = timeSeries.events.map((event) => {
        return {
          x: convertFewsPiDateTimeToJsDate(event, timeZone),
          y: event.value === series.missingValue ? null : +event.value,
          flag: event.flag,
          flagSource: event.flagSource,
          comment: event.comment,
          user: event.user,
        }
      })
    } else if (timeSeries.domains && selectedTime) {
      series.domains = timeSeries.domains
      fillSeriesForElevation(series, selectedTime, timeZone)
    }
    series.lastUpdated = new Date()

    return series
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

export function useTimeSeriesHeaders(
  baseUrl: string,
  filterId: MaybeRefOrGetter<string | undefined>,
) {
  const timeSeriesHeaders = ref<Header[]>([])

  const isLoading = ref(false)
  const error = shallowRef<string>()

  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  async function fetch() {
    const _filterId = toValue(filterId)
    if (_filterId === undefined) {
      timeSeriesHeaders.value = []
      return
    }

    isLoading.value = true

    const filter: TimeSeriesFilter = {
      onlyHeaders: true,
      filterId: _filterId,
    }
    try {
      const timeSeriesResponse = await piProvider.getTimeSeries(filter)
      timeSeriesHeaders.value =
        timeSeriesResponse.timeSeries
          ?.flatMap((ts) => ts.header)
          .filter((header) => header !== undefined) ?? []
    } catch {
      error.value = 'Error loading time series headers'
      timeSeriesHeaders.value = []
    } finally {
      isLoading.value = false
    }
  }

  watchEffect(fetch)

  return {
    timeSeriesHeaders,
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
