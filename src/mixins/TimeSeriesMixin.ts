import { Component, Mixins, Vue } from 'vue-property-decorator'
import { Series, SeriesUrlRequest } from '@/lib/TimeSeries'
import {ActionRequest, PiWebserviceProvider} from '@deltares/fews-pi-requests'
import PiRequestsMixin from "@/mixins/PiRequestsMixin"
import { DateTime, Interval } from 'luxon'

function timeZoneOffsetString (offset: number): string {
  const offsetInMinutes = offset * 60
  const minutes = offsetInMinutes % 60
  const hours = Math.round(offsetInMinutes/60)
  return `+${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`
}

function parsePiDateTime(event: {date: string, time: string} , timeZone: string) {
  return `${event.date}T${event.time}${timeZone}`
}

function absoluteUrl(urlString: string): URL {
  let url!: URL
  try {
    url = new URL(urlString)
  } catch (error) {
    if (error instanceof TypeError) {
      url = new URL(urlString, document.baseURI)
    }
  }
  return url
}

@Component
export default class TimeSeriesMixin extends Mixins(PiRequestsMixin) {
  timeSeriesStore: Record<string, Series> = {}
  controller: AbortController = new AbortController

  async updateTimeSeries(requests: ActionRequest[], options?: { startTime: Date, endTime: Date, thinning: boolean}
  ): Promise<void> {

    this.controller.abort()
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    this.controller = new AbortController()
    const transformRequest = this.getTransformRequest(this.controller)
    const webServiceProvider = new PiWebserviceProvider(baseUrl, {
      transformRequestFn: transformRequest
    })
    for (const r in requests) {
      const request = requests[r]
      const url = absoluteUrl(`${baseUrl}/${request.request}`)
      const queryParams = url.searchParams
      const startTimeString = queryParams.get('startTime')
      const endTimeString = queryParams.get('endTime')
      if (options?.startTime
         && options?.endTime) {
        const startTime = DateTime.fromJSDate(options?.startTime, {zone: 'UTC'})
        const endTime = DateTime.fromJSDate(options?.endTime, {zone: 'UTC'})
        const intervalInMillis = Interval.fromDateTimes(startTime, endTime).length()
        url.searchParams.set('startTime', startTime.toISO({ suppressMilliseconds: true}) ?? '')
        url.searchParams.set('endTime', endTime.toISO({ suppressMilliseconds: true}) ?? '')
        url.searchParams.set('thinning', `${intervalInMillis / window.outerWidth}`)
      } else if ( startTimeString !== null && endTimeString !== null) {
        const startTime = DateTime.fromISO(startTimeString, {zone: 'UTC'})
        const endTime = DateTime.fromISO(endTimeString, {zone: 'UTC'})
        const intervalInMillis = Interval.fromDateTimes(startTime, endTime).length()
        url.searchParams.set('startTime', startTime.toISO({ suppressMilliseconds: true}) ?? '')
        url.searchParams.set('endTime', endTime.toISO({ suppressMilliseconds: true}) ?? '')
        url.searchParams.set('thinning', `${intervalInMillis / window.outerWidth}`)
      }
      const resourceId = `${request.key}`
      const relativeUrl = request.request.split('?')[0] + url.search
      webServiceProvider.getTimeSeriesWithRelativeUrl(relativeUrl).then( piSeries =>
      {
        if ( piSeries.timeSeries !== undefined)
        for (const timeSeries of piSeries.timeSeries) {
          if (timeSeries.events === undefined) continue
          const resource = new SeriesUrlRequest('fews-pi', 'dummyUrl')
          const series = new Series(resource)
          const header = timeSeries.header
          if (header !== undefined) {
            const missingValue: string = header.missVal
            const timeZone = piSeries.timeZone === undefined ? 'Z' : timeZoneOffsetString(+piSeries.timeZone)
            series.header.name = `${header.stationName} - ${header.parameterId} (${header.moduleInstanceId})`
            series.header.unit = header.units
            series.header.parameter = header.parameterId
            series.header.location = header.stationName
            series.header.source = header.moduleInstanceId
            series.start = new Date(parsePiDateTime(header.startDate, timeZone) )
            series.end = new Date(parsePiDateTime(header.endDate, timeZone) )
            series.data = timeSeries.events.map((event) => {
              return {
                x: new Date( parsePiDateTime(event, timeZone)),
                y: event.value === missingValue ? null : +event.value
              }
            })
          }
          Vue.set(this.timeSeriesStore, resourceId, series)
        }
      })
    }
  }
}
