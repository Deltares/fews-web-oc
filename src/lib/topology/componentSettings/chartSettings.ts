import type { DeepRequired } from '@/lib/utils/types'
import type { ChartsSettings } from '@deltares/fews-pi-requests'

export const defaultChartSettings: DeepRequired<ChartsSettings> = {
  general: {
    startPanel: 'timeseriesChart',
    hideToolBar: 'false',
    showLocationNames: true,
  },
  actions: {
    panelPlacement: {
      defaultPlacement: 'right',
      allowedPlacement: ['all'],
    },
    downloadData: true,
    downloadMetaData: true,
    downloadFigure: true,
  },
  timeSeriesChart: {
    enabled: true,
    legend: {
      numberOfLines: '1',
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
    },
  },
  timeSeriesTable: {
    enabled: true,
    allowDepthSorting: true,
    sortDepthColumn: 'descending',
  },
  verticalProfileChart: {
    enabled: true,
    legend: {
      numberOfLines: '1',
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
    },
  },
  verticalProfileTable: {
    enabled: true,
    allowDepthSorting: true,
    sortDepthColumn: 'descending',
  },
  metaDataPanel: {
    enabled: true,
  },
}
