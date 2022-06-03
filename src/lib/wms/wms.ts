import {
  BaseWMSFilter,
  GetCapabilitiesFilter,
  GetLegendGraphicFilter,
  GetCapabilitiesResponse,
  GetLegendGraphicResponse,
  WMSProviderConfig,
  WMSProviders,
  WMSRequestType,
} from './types'

import {
  requestJson,
  filterToParamsWMS,
} from './request-utils'

interface WMSApi {
  getCapabilities (filter: GetCapabilitiesFilter): Promise<GetCapabilitiesResponse>
}

export class WMSProvider implements WMSApi {
  private baseUrl: string

  constructor (baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getCapabilities (filter: GetCapabilitiesFilter): Promise<GetCapabilitiesResponse> {
    return this.executeWMSRequest(WMSRequestType.GetCapabilities, filter)
  }

  async getLegendGraphic (filter: GetLegendGraphicFilter): Promise<GetLegendGraphicResponse> {
    filter = { ...{ service: 'WMS', version: '1.3' }, ...filter }
    return this.executeWMSRequest(WMSRequestType.GetLegendGraphic, filter)
  }

  private executeWMSRequest<filterType extends BaseWMSFilter, responseType> (requestType: WMSRequestType, filter: filterType): Promise<responseType> {
    const defaults: Partial<BaseWMSFilter> = {
      format: 'application/json',
    }
    const filterWithDefaults = { ...defaults, ...filter }
    const queryParameters = filterToParamsWMS(requestType, filterWithDefaults)
    const url = `${this.baseUrl}${queryParameters}`
    return requestJson(url) as Promise<responseType>
  }
}

export interface WMS {
  getProviders (): WMSProviders
  getProviderConfig (provider: string): WMSProviderConfig
  getCapabilities (provider: string, filter: GetCapabilitiesFilter,): Promise<GetCapabilitiesResponse>
}
