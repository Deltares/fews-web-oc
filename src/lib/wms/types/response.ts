export enum TimeSeriesType {
  ExternalForecasting = 'EXTERNAL_FORECASTING',
}

export interface KeywordList {
  parameterId: string;
  locationId: string;
  moduleInstanceId: string;
  timeSeriesType: TimeSeriesType;
  forecastTime: string;
}

export interface Style {
  name: string;
  title: string;
}

export interface Layer {
  name: string;
  title: string;
  groupName: string;
  groupTitle: string;
  keywordList: KeywordList;
  styles: Style[];
  times?: string[];
  externalForecastTime: string;
}

export interface GetCapabilitiesResponse {
  title: string;
  layers: Layer[];
}

export interface GetLegendGraphicResponse {
    legend: any;
}
