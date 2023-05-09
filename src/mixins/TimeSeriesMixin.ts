import { Component, Mixins, Vue } from 'vue-property-decorator'
import { Series, SeriesUrlRequest } from '@/lib/TimeSeries'
import {ActionRequest, PiWebserviceProvider} from '@deltares/fews-pi-requests'
import PiRequestsMixin from "@/mixins/PiRequestsMixin"
import type { TimeSeriesResponse } from '@deltares/fews-pi-requests'

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

  async updateTimeSeries(requests: ActionRequest[]
  ): Promise<void> {

    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const webServiceProvider = new PiWebserviceProvider(baseUrl, {transformRequestFn: this.transformRequest})
    for (const r in requests) {
      const request = requests[r]
      const url = absoluteUrl(`${baseUrl}/${request.request}`)
      const piSeries: TimeSeriesResponse = await webServiceProvider.getTimeSeriesWithRelativeUrl(request.request);
      if ( piSeries.timeSeries === undefined) continue
      for (const timeSeries of piSeries.timeSeries) {
        if (timeSeries.events === undefined) continue
        const resourceId = `${request.key}`
        const resource = new SeriesUrlRequest('fews-pi', url.toString())
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
              y: event.flag === '8' ? null : parseFloat(event.value)
            }
          })
        }
        Vue.set(this.timeSeriesStore, resourceId, series)
      }
    }
  }
}
