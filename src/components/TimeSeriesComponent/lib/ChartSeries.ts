import * as CSS from "csstype";
import {ChartSeriesOptions, PolarChartSeriesOptions} from "./ChartSeriesOptions";

export interface ChartSeries {
  id: string;
  dataResources: string[];
  name: string;
  label?: string;
  type: string;
  options: ChartSeriesOptions | PolarChartSeriesOptions;
  unit: string;
  style: CSS.SvgPropertiesHyphen;
}
