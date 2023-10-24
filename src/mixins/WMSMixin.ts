import {Component, Vue} from 'vue-property-decorator'
import {GetLegendGraphicFilter, GetLegendGraphicResponse, Layer, WMSProvider} from '@deltares/fews-wms-requests'

@Component
export default class WMSMixin extends Vue {
  wmsProvider!: WMSProvider
  externalForecast: Date = new Date('invalid')
  layers: Layer[] = []

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
    this.wmsProvider = new WMSProvider(url.toString() + '/wms', {transformRequestFn: this.transformRequest})
  }

  async getCapabilities (): Promise<void> {
    const capabilities = await this.wmsProvider.getCapabilities({})
    this.layers = capabilities.layers
  }

  async getTimes (layers: string): Promise<Date[]> {
    const capabilities = await this.wmsProvider.getCapabilities({ layers, importFromExternalDataSource: false, onlyHeaders: false, forecastCount: 1 })
    let valueDates: Date[]
    let selectedLayer: Layer
    if (capabilities.layers.length > 0) {
      selectedLayer = capabilities.layers[0]
      capabilities.layers.forEach( l => {
        if (l.name === layers) {
          selectedLayer = l
        }
      })
      if (selectedLayer.times) {
        const dates = selectedLayer.times.map((time) => {
          return new Date(time)
        })
        let firstValueDate = dates[0]
        let lastValueDate = dates[dates.length - 1]
        if (selectedLayer.firstValueTime) {
          firstValueDate = new Date(selectedLayer.firstValueTime)
        }
        if (selectedLayer.lastValueTime) {
          lastValueDate = new Date(selectedLayer.lastValueTime)
        }
        valueDates = dates.filter(d => d >= firstValueDate && d <= lastValueDate)
        if (selectedLayer.keywordList && selectedLayer.keywordList[0].forecastTime) {
          this.externalForecast = new Date(selectedLayer.keywordList[0].forecastTime)
        }
      } else {
        valueDates = []
      }
    } else {
      this.externalForecast = new Date('invalid')
      return Promise.reject(new Error('No forecast for selected layer'))
    }
    return valueDates
  }

  async getLegendGraphic (layers: string, colorScaleRange?: string): Promise<GetLegendGraphicResponse> {
    const legendGraphicFilter: GetLegendGraphicFilter = {
      layers,
      colorscalerange: colorScaleRange
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return await this.wmsProvider.getLegendGraphic({...legendGraphicFilter, useDisplayUnits: true})
  }

  async transformRequest(request: Request): Promise<Request> {
    if (!this.$config.authenticationIsEnabled) return request
    // $auth only exists if authentication is enabled.
    return this.$auth.transformRequestAuth(request);
  }
}
