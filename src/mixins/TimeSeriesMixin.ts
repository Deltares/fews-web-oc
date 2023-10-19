import { Component, Mixins, Vue } from 'vue-property-decorator'
import { Series, SeriesUrlRequest } from '@/lib/TimeSeries'
import {ActionRequest, DomainAxisEventValuesStringArray, PiWebserviceProvider} from '@deltares/fews-pi-requests'
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
  seriesStore: Record<string, Series> = {}
  controller: AbortController = new AbortController

  async updateTimeSeries(requests: ActionRequest[], options?: { startTime: Date, endTime: Date, thinning: boolean}, selectedTime?: Date
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
      let resourceId = `${request.key}`
      const relativeUrl = request.request.split('?')[0] + url.search
      webServiceProvider.getTimeSeriesWithRelativeUrl(relativeUrl).then( piSeries =>
      {
        if ( piSeries?.timeSeries !== undefined)
        for (const [index, timeSeries] of piSeries.timeSeries.entries()) {
          const resource = new SeriesUrlRequest('fews-pi', 'dummyUrl')
          const series = new Series(resource)
          const header = timeSeries.header
          if (piSeries.timeSeries.length > 1){
                      resourceId = `${request.key}-${index}`
          }
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
            if (timeSeries.events !== undefined) {
              series.data = timeSeries.events.map((event) => {
                return {
                  x: new Date( parsePiDateTime(event, timeZone)),
                  y: event.value === missingValue ? null : +event.value
                }
              })
            } else if (selectedTime && timeSeries.domains !== undefined && timeSeries) {
              series.domains = timeSeries.domains
              this.fillSeriesForElevation(series, selectedTime)
            } else {
              throw new Error('No data found')
            }
          }
          Vue.set(this.seriesStore, resourceId, series)
        }
      })
    }
  }

  fillSeriesForElevation (timeSeries: Series, date: Date): void {
    if (timeSeries.domains === undefined) {
      throw new Error('No domains found')
    }
    const domainAxisValues = timeSeries.domains[0].domainAxisValues
    if (domainAxisValues !== undefined) {
      const domain= domainAxisValues[0]
      if (domain.values === undefined || domain.values.length < 1) {
        throw new Error('No domain values found')
      }

      // convert domain.values to an array of numbers
      const domainValues = domain.values.map((value: DomainAxisEventValuesStringArray) => {
        return +value[0]
      })
      const events = timeSeries.domains.slice(1)

      // find the event in the events that matches the date
      const event = events.find((event) => {
        const time = event.events![0].time
        const day = event.events![0].date
        const eventDate = new Date(`${day}T${time}.000Z`)
        return eventDate.getTime() === date.getTime()
      })

      timeSeries.data = domainValues.map((domainValue, index) => {
        const eventValue = event?.events?.[0]?.values?.[index]
        if (eventValue?.includes(timeSeries.missingValue??"")){
          return null
        }
        const x = eventValue === undefined ? null : +eventValue
        return {
          x,
          y: domainValue
        }
      }
      ).filter((value) => value !== null);
    }
  }
}