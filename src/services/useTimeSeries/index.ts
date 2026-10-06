import {
  PiWebserviceProvider,
  type ActionRequest,
  type TimeSeriesEvent,
  type TimeSeriesResult,
  type TimeSeriesResponse,
  type Header,
  type DomainAxisValue,
  type DomainAxisEventValuesStringArray,
} from '@deltares/fews-pi-requests'
import { computed, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import {
  usePiTimeSeries,
  type PiTimeSeriesQueryOptions,
  type UsePiTimeSeriesOptions,
} from '@deltares/fews-web-oc-composables'
import { absoluteUrl } from '../../lib/utils/absoluteUrl'
import { Series } from '../../lib/timeseries/timeSeries'
import { SeriesUrlRequest } from '../../lib/timeseries/timeSeriesResource'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { convertFewsPiDateTimeToJsDate } from '@/lib/date'

export interface UseTimeSeriesReturn {
  series: ComputedRef<Record<string, Series>>
  loading: ComputedRef<boolean>
  refreshing: ComputedRef<boolean>
  loadingKeys: ComputedRef<string[]>
  requestRefresh: () => void
  pauseRefresh: () => void
  resumeRefresh: () => void
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
  requests: MaybeRefOrGetter<ActionRequest[]>,
  options: MaybeRefOrGetter<PiTimeSeriesQueryOptions>,
  fetchingEnabled?: MaybeRefOrGetter<boolean>,
  selectedTime?: MaybeRefOrGetter<Date | undefined>,
  refresh?: UsePiTimeSeriesOptions['refresh'],
): UseTimeSeriesReturn {
  const enabled = computed(
    () => fetchingEnabled === undefined || toValue(fetchingEnabled),
  )
  const requestEntries = computed(() => {
    const usedKeys = new Set<string>()

    return toValue(requests).map((request, index) => {
      const baseKey = request.key ?? `request-${index}`
      let key = baseKey
      let suffix = 1
      while (usedKeys.has(key)) {
        key = `${baseKey}#${suffix}`
        suffix += 1
      }
      usedKeys.add(key)

      return { key, request }
    })
  })
  const piRequests = computed(() =>
    requestEntries.value.map(({ key, request }) => ({
      key,
      relativeUrl: request.request,
    })),
  )
  const {
    responses,
    loading,
    refreshing,
    loadingKeys,
    requestRefresh,
    pauseRefresh,
    resumeRefresh,
  } = usePiTimeSeries({
    requests: piRequests,
    query: options,
    enabled,
    refresh,
  })
  const series = computed(() => {
    const result: Record<string, Series> = {}
    const currentSelectedTime = toValue(selectedTime)

    requestEntries.value.forEach(({ key, request }) => {
      const response = responses.value[key]
      if (!response?.timeSeries) return

      const isGridTimeSeries = request.request.includes('/timeseries/grid?')
      response.timeSeries.forEach((timeSeries, index) => {
        const resourceId = isGridTimeSeries ? `${key}[${index}]` : key
        const convertedSeries = convertTimeSeriesResultToSeries(
          timeSeries,
          response,
          resourceId,
          currentSelectedTime,
        )
        if (convertedSeries !== undefined) result[resourceId] = convertedSeries
      })
    })

    return result
  })

  return {
    series,
    loading,
    refreshing,
    loadingKeys,
    requestRefresh,
    pauseRefresh,
    resumeRefresh,
  }
}

export async function fetchTimeSeriesHeaders(
  baseUrl: string,
  requests: ActionRequest[],
) {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const promises = requests.map(async (request) => {
    const url = absoluteUrl(`${baseUrl}/${request.request}`)
    url.searchParams.set('onlyHeaders', 'true')
    const relativeUrl = request.request.split('?')[0] + url.search
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
  filterId: MaybeRefOrGetter<string | undefined>,
) {
  const requests = computed(() => {
    const id = toValue(filterId)
    return id === undefined
      ? []
      : [{ key: `headers-${id}`, filter: { filterId: id } }]
  })
  const { responses } = usePiTimeSeries({
    requests,
    query: { onlyHeaders: true },
    enabled: computed(() => toValue(filterId) !== undefined),
  })
  const timeSeriesHeaders = computed(() =>
    Object.values(responses.value).flatMap(
      (response) =>
        response.timeSeries
          ?.flatMap((timeSeries) => timeSeries.header)
          .filter((header): header is Header => header !== undefined) ?? [],
    ),
  )

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

  const edits = Object.entries(data).flatMap(([timeSeriesId, events]) => {
    const request = requests.find((r) => r.key === timeSeriesId)
    if (request === undefined) return []
    const url = absoluteUrl(`${baseUrl}${request.editRequest}`)
    return [
      {
        url: url.toString(),
        payload: {
          version,
          timeZone,
          timeSeries: [{ events }],
        },
      },
    ]
  })

  await Promise.all(
    edits.map(({ url, payload }) =>
      piProvider.postTimeSeriesEdit(url, payload),
    ),
  )
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
      // Keep track of the most recent domain axis values encountered while iterating.
      // These latest values are then paired with the matching event found later in this loop.
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
