export enum WMSRequestType {
  GetCapabilities = 'GetCapabilities',
  GetLegendGraphic = 'GetLegendGraphic'
}

export interface WMSProviderConfig {
  name: string
  baseUrl: string
}

export type WMSProviders = Record < string, WMSProviderConfig >

export interface BaseWMSFilter {
  /** Format of the response. Options are: application/xml or application/json.
   *  The default format is application/xml. */
   format?: string;
}

export interface GetCapabilitiesFilter {
  format ? : string; // Format of the response. Options are: application/xml or application/json. The default format is application/xml.
  layers ? : string // (since 2019.02): the layerId of the plot for which the capabilities should be determined. Only one layerId is currently supported.
  onlyHeaders ? : boolean // (optional, since 2019.02): Get the capabilities without the times. The default is false.
  // forecastPeriod: By default only the current forecast will be returned by the GetCapabilities. To get other forecasts, a forecast period needs to be specified. When any forecasts are found, they will be returned as a layer with the plotId and external forecast time combined. For example: france_gfs_T_forecasts-2019-06-24T00:00:00Z. When requesting the capabilities with a forecast period, it is required to specify a layerId with the layers parameter.
  startForecastTime ? : string; // (format: yyyy-MM-ddTHH:mm:ssZ, since 2019.02): Start time of search period that looks for timeseries produced by forecasts that have their forecast time within this period.
  endForecastTime ? : string; //  (format: yyyy-MM-ddTHH:mm:ssZ, since 2019.02): End time of search period that looks for timeseries produced by forecasts that have their forecast time within this period.
  forecastCount ? : number // (since 2019.02): Number of forecast runs to return when using start- and end- forecast time. Default is 1.
  importFromExternalDataSource ? : boolean // (default=false, since 2020.01): apply seamless integration with the archive. Only valid when specifying a forecastPeriod (using startForecastTime, endForecastTime and forecastCount) and layers.
}

export interface GetLegendGraphicFilter extends BaseWMSFilter {
  layers?: string
}
