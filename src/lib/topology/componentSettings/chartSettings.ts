export interface ChartSettings {
  general: General
  actions: Actions
  timeseriesChart: TimeseriesChart
  timeseriesTable: TimeseriesTable
  verticalProfileChart: VerticalProfileChart
  verticalProfileTable: VerticalProfileTable
  metaDataPanel: MetaDataPanel
}

export const defaultChartSettings: ChartSettings = {
  general: {
    startPanel: 'timeseriesChart',
    hideToolbar: false,
    showLocationNames: true,
  },
  actions: {
    panelPlacement: {
      defaultPlacement: 'right',
      allowedPlacement: 'all',
    },
    downloadData: true,
    downloadMetaData: true,
    downloadFigure: true,
  },
  timeseriesChart: {
    show: true,
    legend: {
      show: true,
      numberOfLines: 1,
      placement: 'above chart',
    },
    xAxis: {
      show: true,
      xTicks: true,
      xLabel: true,
    },
    yAxis: {
      show: true,
      yTicks: true,
      yLabel: true,
      yLabelPlacement: 'top',
    },
  },
  timeseriesTable: {
    show: true,
    allowDateTimeSorting: true,
    sortDateTimeColumn: 'descending',
  },
  verticalProfileChart: {
    show: true,
    legend: {
      show: true,
      numberOfLines: 1,
      placement: 'above chart',
    },
    xAxis: {
      show: true,
      xTicks: true,
      xLabel: true,
    },
    yAxis: {
      show: true,
      yTicks: true,
      yLabel: true,
      yLabelPlacement: 'top',
    },
  },
  verticalProfileTable: {
    show: true,
    allowDepthColumnSorting: true,
    sortDepthColumn: 'descending',
  },
  metaDataPanel: {
    show: true,
  },
}

interface General {
  startPanel:
    | 'metaDataPanel'
    | 'timeseriesChart'
    | 'timeseriesTable'
    | 'verticalProfileChart'
    | 'verticalProfileTable'
  hideToolbar: boolean | 'auto'
  showLocationNames: boolean
}

interface PanelPlacement {
  defaultPlacement: 'right'
  allowedPlacement: 'right' | 'all' | 'left' | 'bottom' | 'detached'
}

interface Actions {
  panelPlacement: PanelPlacement
  downloadData: boolean
  downloadMetaData: boolean
  downloadFigure: boolean
}

interface Legend {
  show: boolean
  numberOfLines: number | 'all'
  placement:
    | 'auto'
    | 'above chart'
    | 'under chart'
    | 'inside upper right'
    | 'inside lower right'
    | 'inside upper left'
    | 'inside lower left'
}

interface XAxis {
  show: boolean
  xTicks: boolean
  xLabel: boolean
}

interface YAxis {
  show: boolean
  yTicks: boolean
  yLabel: boolean
  yLabelPlacement: 'auto' | 'top' | 'beside'
}

interface TimeseriesChart {
  show: boolean
  legend: Legend
  xAxis: XAxis
  yAxis: YAxis
}

interface TimeseriesTable {
  show: boolean
  allowDateTimeSorting: boolean
  sortDateTimeColumn: 'descending' | 'ascending'
}

interface VerticalProfileChart {
  show: boolean
  legend: Legend
  xAxis: XAxis
  yAxis: YAxis
}

interface VerticalProfileTable {
  show: boolean
  allowDepthColumnSorting: boolean
  sortDepthColumn: 'descending' | 'ascending'
}

interface MetaDataPanel {
  show: boolean
}
