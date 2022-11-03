import {ChartSeries} from "./ChartSeries";
import {Axis} from "./Axis";

export interface ChartConfig {
  title: string;
  xAxis?: Axis[];
  yAxis?: Axis[];
  radialAxis?: Axis[];
  angularAxis?: Axis[];
  colorAxis?: Axis[];
  series?: ChartSeries[];
}
