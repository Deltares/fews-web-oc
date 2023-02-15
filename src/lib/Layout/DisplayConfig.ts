import { ChartConfig } from "@/components/TimeSeriesComponent/lib/ChartConfig";

export enum DisplayType {
  TimeSeriesChart = 'TimeSeriesChart',
  TimeSeriesTable = 'TimeSeriesTable'
}

export interface DisplayConfig {
  id: string;
  type: DisplayType;
  title: string;
  class: string;
  config: Partial<ChartConfig>;
}


