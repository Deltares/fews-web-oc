import type {TimeSeriesEvent} from '@deltares/fews-pi-requests';

export interface SeriesHeader {
  name?: string;
  location?: string;
  parameter?: string;
  source?: string;
  unit?: string;
}

export interface SeriesDataEvent extends Pick<TimeSeriesEvent, "flag" | "flagSource" | "user" | "comment"> {
  x: Date;
  y: number | null;
}

export enum SeriesResourceType {
  DdApiRequest = 'DdApiRequest',
  FewsPiRequest = 'FewsPiRequest',
  UrlRequest = 'UrlRequest',
  Derived = 'Derived'
}

export enum SeriesOperationType {
  FactorOffset = 'factor-offset',
  Add = 'add',
  Subtract = 'subtract',
  Multiply = 'multiply',
  Divide = 'divide',
  WindDirection = 'wind-direction',
  WaterDirection = 'water-direction',
  Amplitude = 'amplitude',
  VerticalClearance = 'vertical-clearance',
}
