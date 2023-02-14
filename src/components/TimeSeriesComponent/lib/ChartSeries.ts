import * as CSS from "csstype";
import { ChartMarkerOptions } from "./ChartMarkerOptions";
import { ChartSeriesOptions } from "./ChartSeriesOptions";

export interface ChartSeries {
  id: string;
  dataResources: string[];
  name: string;
  label?: string;
  marker?: ChartMarkerOptions;
  type: string;
  options: ChartSeriesOptions;
  unit: string;
  style: CSS.SvgPropertiesHyphen;
}
