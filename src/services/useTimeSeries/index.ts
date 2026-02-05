import {
  PiWebserviceProvider,
  type ActionRequest,
  type TimeSeriesEvent,
  type TimeSeriesResult,
  type TimeSeriesResponse,
  type Header,
  type TimeSeriesFilter,
  type DomainAxisValue,
  type DomainAxisEventValuesStringArray,
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
import { convertFewsPiDateTimeToJsDate } from '@/lib/date'
import { type Pausable } from '@vueuse/core'
import { useFocusAwareInterval } from '@/services/useFocusAwareInterval'

export interface UseTimeSeriesReturn {
  series: ShallowRef<Record<string, Series>>
  isLoading: Ref<boolean>
  loadingSeriesIds: Ref<string[]>
  interval: Pausable | undefined
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
  onlyHeaders?: boolean
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
  refresh = true,
): UseTimeSeriesReturn {
  let controller = new AbortController()
  const series = shallowRef<Record<string, Series>>({})
  const MAX_SERIES = 20
  const loadingSeriesIds = ref<string[]>([])
  const isLoading = computed(() => loadingSeriesIds.value.length > 0)

  const watchedParams = [requests, options, fetchingEnabled]
    .filter((p) => p !== undefined)
    .map((p) => () => toValue(p))
  watch(watchedParams, () => {
    loadTimeSeries()
  })

  async function loadTimeSeries() {
    if (fetchingEnabled !== undefined && !toValue(fetchingEnabled)) return

    controller.abort()
    controller = new AbortController()
    const piProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: createTransformRequestFn(controller),
    })
    const _requests = toValue(requests)
    const _selectedTime = toValue(selectedTime)
    const _options = toValue(options)

    const currentSeriesIds = Object.keys(series.value)
    const updatedSeriesIds: string[] = []
    loadingSeriesIds.value = _requests.flatMap((r) => (r.key ? [r.key] : []))

    const promises = _requests.map(async (request) => {
      const relativeUrl = getRelativeUrlForRequest(baseUrl, _options, request)

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
      if (result.status === 'rejected' && result.reason.name !== 'AbortError') {
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

  let interval: Pausable | undefined = undefined
  if (refresh) {
    interval = useFocusAwareInterval(
      loadTimeSeries,
      TIMESERIES_POLLING_INTERVAL,
      { immediateCallback: true },
    )
  } else {
    loadTimeSeries()
  }

  if (selectedTime !== undefined) {
    watch(
      () => toValue(selectedTime),
      () => {
        // Re-process all series to fill elevation data for the new selected time.
        const _selectedTime = toValue(selectedTime)
        Object.keys(series.value).forEach((seriesId) => {
          const _series = series.value[seriesId]
          if (
            _series.domains !== undefined &&
            _series.domains.length > 0 &&
            _selectedTime !== undefined
          ) {
            fillSeriesForElevation(_series, _selectedTime)
            _series.lastUpdated = new Date()
          }
        })

        series.value = { ...series.value }
      },
    )
  }

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

export function getRelativeUrlForRequest(
  baseUrl: string,
  options: UseTimeSeriesOptions,
  request: ActionRequest,
): string {
  // Parse request URL to URL object to be able to append query parameters.
  const url = absoluteUrl(`${baseUrl}/${request.request}`)

  const convertToDateTime = (date: Date | null | undefined) => {
    if (!date) return null
    return DateTime.fromJSDate(date, {
      zone: 'UTC',
    })
  }
  const startTime = convertToDateTime(options.startTime)
  const endTime = convertToDateTime(options.endTime)

  const convertToFewsPiDateTimeQueryParameter = (datetime: DateTime | null) => {
    if (!datetime) return null
    return datetime.toISO({ suppressMilliseconds: true })
  }
  const startTimeQuery = convertToFewsPiDateTimeQueryParameter(startTime)
  const endTimeQuery = convertToFewsPiDateTimeQueryParameter(endTime)

  // Set start and end time.
  if (startTimeQuery) url.searchParams.set('startTime', startTimeQuery)
  if (endTimeQuery) url.searchParams.set('endTime', endTimeQuery)

  // Set thinning if specified.
  if (options.thinning) {
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

  if (options.convertDatum) {
    url.searchParams.set('convertDatum', options.convertDatum.toString())
  }

  if (options.useDisplayUnits) {
    url.searchParams.set('useDisplayUnits', options.useDisplayUnits.toString())
  }

  // Convert absolute URL back into relative URL with updated search
  // parameters.
  return request.request.split('?')[0] + url.search
}

export async function fetchTimeSeriesHeaders(
  baseUrl: string,
  requests: ActionRequest[],
  options: UseTimeSeriesOptions,
) {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const _options = {
    ...options,
    onlyHeaders: true,
  }

  const promises = requests.map(async (request) => {
    const relativeUrl = getRelativeUrlForRequest(baseUrl, _options, request)
    const timeSeriesResponse =
      await piProvider.getTimeSeriesWithRelativeUrl(relativeUrl)
    return (
      timeSeriesResponse.timeSeries
        ?.flatMap((ts) => ts.header)
        .filter((header) => header !== undefined) ?? []
    )
  })

  const settled = await Promise.allSettled(promises)
  const results = settled.filter((result) => result.status === 'fulfilled')

  const headers: Record<string, Header[]> = {}
  requests.forEach((request, index) => {
    const key = request.key ?? ''
    headers[key] = results[index].value
  })
  return headers
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
    timeSeriesHeaders.value = []

    const _filterId = toValue(filterId)
    if (_filterId === undefined) return

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
  series.header.timeZone = timeZone
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
    fillSeriesForElevation(series, selectedTime)
  }
  series.lastUpdated = new Date()

  return series
}

/**
 * Finds the event in the time series that matches the current date and returns it along the most recent domainAxisValues, which are needed to fill the elevation data.
 */
function findCurrentEventWithCorrespondingDomainAxisValues(
  timeSeries: Series,
  currentDate: Date,
) {
  if (timeSeries.domains === undefined) {
    throw new Error('No domains found')
  }

  const timeZone = timeSeries.header.timeZone

  let domainAxisValues: DomainAxisValue | undefined = undefined

  for (const domain of timeSeries.domains) {
    if (domain.domainAxisValues) {
      domainAxisValues = domain.domainAxisValues[0]
    }

    if (domain.events === undefined) continue

    for (const event of domain.events) {
      const date = event.date
      const time = event.time
      if (date === undefined || time === undefined) continue

      const eventDate = convertFewsPiDateTimeToJsDate({ date, time }, timeZone)
      if (eventDate.getTime() === currentDate.getTime()) {
        return {
          domainAxisValues,
          event,
        }
      }
    }
  }
}

function fillSeriesForElevation(timeSeries: Series, currentDate: Date): void {
  const result = findCurrentEventWithCorrespondingDomainAxisValues(
    timeSeries,
    currentDate,
  )

  // convert domain.values to an array of numbers
  const domainValues =
    result?.domainAxisValues?.values?.map((value) => +value[0]) ?? []
  const event = result?.event

  const missingValue = timeSeries.missingValue

  if (event === undefined) {
    timeSeries.data = []
    return
  }

  const isMissing = (value: DomainAxisEventValuesStringArray | undefined) => {
    return missingValue !== undefined && value?.includes(missingValue)
  }

  timeSeries.data = domainValues.flatMap((domainValue, index) => {
    const eventValue = event.values?.[index]
    const eventFlag = event.flag as TimeSeriesEvent['flag']

    if (isMissing(eventValue)) return []

    const x = eventValue === undefined ? null : +eventValue

    return [
      {
        x,
        y: domainValue,
        flag: eventFlag,
      },
    ]
  })
}
