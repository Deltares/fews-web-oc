import { Vue, Component } from 'vue-property-decorator'
import { WMSProvider } from '@/lib/wms'

@Component
export default class WMSMixin extends Vue {
  wmsProvider!: WMSProvider
  externalForecast: Date = new Date('invalid')

  created (): void {
    const baseUrl = this.$config.get<string>('VUE_APP_FEWS_WEBSERVICES_URL')
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
    let dates: Date[]
    console.log(capabilities.layers.length)
    if (capabilities.layers.length > 0 && capabilities.layers[0].times) {
      dates = capabilities.layers[0].times.map((time: string) => { return new Date(time) })
      this.externalForecast = new Date(capabilities.layers[0].keywordList.forecastTime)
    } else {
      dates = []
      this.externalForecast = new Date('invalid')
      return Promise.reject(new Error('No forecast for selected layer'))
    }
    return dates
  }

  async getLegendGraphic (layers: string): Promise<any> {
    const response = await this.wmsProvider.getLegendGraphic({ layers })
    return response.legend
  }
}
