import * as CSS from 'csstype'

export interface ChartSeriesOptions {
  x: {
    key: string;
    axisIndex: number;
  };
  y: {
    key: string;
    axisIndex: number;
  };
}

export interface ChartSeries {
  id: string;
  dataResources: string[];
  name: string;
  label?: string;
  type: string;
  options: ChartSeriesOptions;
  unit: string;
  style: CSS.SvgPropertiesHyphen;
}

export interface Axis {
  type: string;
  location: string;
  label?: string;
  unit?: string;
  includeZero?: boolean
  domain?: number[] | Date[]
}

export interface ChartConfig {
  title: string;
  xAxis?: Axis[];
  yAxis?: Axis[];
  radialAxis?: Axis[];
  angularAxis?: Axis[];
  series?: ChartSeries[];
  lastUpdated: Date;
  reloadRequired: boolean;
}
