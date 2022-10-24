import * as CSS from "csstype";
import {ChartSeriesOptions} from "./ChartSeriesOptions";

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
