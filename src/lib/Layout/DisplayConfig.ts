import { ChartConfig } from "@/components/TimeSeriesComponent/lib/ChartConfig";

export enum DisplayType {
  TimeSeriesChart = 'TimeSeriesChart',
  TimeSeriesTable = 'TimeSeriesTable',
  ElevationChart = 'ElevationChart',
}

export interface DisplayConfig {
  id: string;
  types: DisplayType[];
  title: string;
  class: string;
  config: Partial<ChartConfig>[];
}


