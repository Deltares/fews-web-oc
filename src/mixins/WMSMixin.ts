import { Vue, Component } from 'vue-property-decorator'
import { WMSProvider } from '@/lib/wms'

@Component
export default class WMSMixin extends Vue {
  wmsProvider!: WMSProvider
  externalForecast: Date = new Date('invalid')

  created (): void {
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    let url!: URL
    try {
      url = new URL(baseUrl)
    } catch (error) {
      if (error instanceof TypeError) {
        url = new URL(baseUrl, document.baseURI)
      }
    }
    this.wmsProvider = new WMSProvider(url.toString() + '/wms')
  }

  async getTimes (layers: string): Promise<Date[]> {
    const capabilities = await this.wmsProvider.getCapabilities({ layers, importFromExternalDataSource: false, onlyHeaders: false, forecastCount: 1 })
    let valueDates: Date[]
    if (capabilities.layers.length > 0 && capabilities.layers[0].times) {
      const dates = capabilities.layers[0].times.map((time) => { return new Date(time) })
      let firstValueDate = dates[0]
      let lastValueDate = dates[dates.length-1]
      if (capabilities.layers[0].firstValueTime) { firstValueDate = new Date(capabilities.layers[0].firstValueTime) }
      if (capabilities.layers[0].lastValueTime) { lastValueDate = new Date(capabilities.layers[0].lastValueTime) }
      valueDates = dates.filter(d => d >= firstValueDate && d <= lastValueDate)
      this.externalForecast = new Date(capabilities.layers[0].keywordList.forecastTime)
    } else {
      valueDates = []
      this.externalForecast = new Date('invalid')
      return Promise.reject(new Error('No forecast for selected layer'))
    }
    return valueDates
  }

  async getLegendGraphic (layers: string): Promise<any> {
    const response = await this.wmsProvider.getLegendGraphic({ layers })
    return response
  }
}
