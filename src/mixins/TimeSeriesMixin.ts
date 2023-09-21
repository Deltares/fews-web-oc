import { Component, Mixins, Vue } from 'vue-property-decorator'
import { Series, SeriesUrlRequest } from '@/lib/TimeSeries'
import {ActionRequest,DomainAxisEvent,PiWebserviceProvider} from '@deltares/fews-pi-requests'
import PiRequestsMixin from "@/mixins/PiRequestsMixin"
import { DateTime, Interval } from 'luxon'

function timeZoneOffsetString (offset: number): string {
  const offsetInMinutes = offset * 60
  const minutes = offsetInMinutes % 60
  const hours = Math.round(offsetInMinutes/60)
  return `+${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`
}

function parsePiDateTime(event: DomainAxisEvent, timeZone: string) {
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

  async updateTimeSeries(requests: ActionRequest[], options?: { startTime: Date, endTime: Date, thinning: boolean}, elevation?: number
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
        const timeStepPerPixel = Math.round(Interval.fromDateTimes(startTime, endTime).length() / window.outerWidth /2)
        url.searchParams.set('startTime', startTime.toISO({ suppressMilliseconds: true }) ?? '')
        url.searchParams.set('endTime', endTime.toISO({ suppressMilliseconds: true }) ?? '')
        url.searchParams.set('thinning', `${timeStepPerPixel}`)
      } else if ( startTimeString !== null && endTimeString !== null) {
        const startTime = DateTime.fromISO(startTimeString, {zone: 'UTC'})
        const endTime = DateTime.fromISO(endTimeString, {zone: 'UTC'})
        const timeStepPerPixel =  Math.round(Interval.fromDateTimes(startTime, endTime).length() / window.outerWidth /2)
        url.searchParams.set('startTime', startTime.toISO({ suppressMilliseconds: true }) ?? '')
        url.searchParams.set('endTime', endTime.toISO({ suppressMilliseconds: true }) ?? '')
        url.searchParams.set('thinning', `${timeStepPerPixel}`)
      }
      const resourceId = `${request.key}`
      const relativeUrl = request.request.split('?')[0] + url.search
      webServiceProvider.getTimeSeriesWithRelativeUrl(relativeUrl).then( piSeries =>
      {
        if ( piSeries?.timeSeries !== undefined)
        for (const timeSeries of piSeries.timeSeries) {
          const resource = new SeriesUrlRequest('fews-pi', 'dummyUrl')
          const series = new Series(resource)
          const header = timeSeries.header
          if (header !== undefined) {
            const missingValue: string = header.missVal
            const timeZone = piSeries.timeZone === undefined ? 'Z' : timeZoneOffsetString(+piSeries.timeZone)
            series.timeZone = timeZone
            series.missingValue = missingValue
            series.header.name = `${header.stationName} - ${header.parameterId} (${header.moduleInstanceId})`
            series.header.unit = header.units
            series.header.parameter = header.parameterId
            series.header.location = header.stationName
            series.header.source = header.moduleInstanceId
            series.start = new Date(parsePiDateTime(header.startDate, timeZone) )
            series.end = new Date(parsePiDateTime(header.endDate, timeZone) )
            if (!elevation && timeSeries.events !== undefined) {
              series.data = timeSeries.events.map((event) => {
                return {
                  x: new Date( parsePiDateTime(event, timeZone)),
                  y: event.value === missingValue ? null : +event.value
                }
              })
            } else if (elevation && timeSeries.domains !== undefined && timeSeries) {
              series.domains = timeSeries.domains
              this.updateTimeSeriesWithElevation(series, elevation)
            } else {
              throw new Error('Timeseries data should include ' + (elevation ? 'domains' : 'events'))
            }
          }
          Vue.set(this.timeSeriesStore, resourceId, series)
        }
      })
    }
  }

  updateTimeSeriesWithElevation (timeSeries: Series, elevation: number): void {
    if (timeSeries.domains === undefined) {
      throw new Error('No domains found')
    }
    const domainAxisValues = timeSeries.domains[0].domainAxisValues
    if (domainAxisValues !== undefined) {
      const domain = domainAxisValues[0]

      if (!domain.values) return

      let elevationIndex = 0
      let closestValue = +domain.values[0]
      for (let i = 0; i < domain.values.length; i++) {
        const curr = +domain.values[i];

        if (Math.abs(curr - elevation) < Math.abs(closestValue - elevation)) {
          closestValue = curr
          elevationIndex = i
        }
      }

      timeSeries.data = timeSeries.domains.slice(1).map(singleDomain => {
        const e = singleDomain.events![0]
        return {
          x: new Date( parsePiDateTime(e, timeSeries.timeZone? timeSeries.timeZone : 'Z')),
          y: e.values![elevationIndex][0] === timeSeries.missingValue ? null : +e.values![elevationIndex][0]
        }
      })
    }
  }
}
