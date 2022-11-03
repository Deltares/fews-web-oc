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

export interface PolarChartSeriesOptions {
  radial: {
    key: string;
  };
  angular: {
    key: string;
  };
  color: {
    key: string;
  }
}

