import type { DeepRequired } from '@/lib/utils/types'
import type { ChartsSettings as PiChartsSettings } from '@deltares/fews-pi-requests'

export type ChartsSettings = DeepRequired<PiChartsSettings>

export const defaultChartSettings: ChartsSettings = {
  general: {
    startPanel: 'timeSeriesChart',
    hideToolBar: 'false',
    showLocationNames: true, // TODO: Implement
  },
  actions: {
    panelPlacement: {
      defaultPlacement: 'right', // TODO: Implement
      allowedPlacement: ['all'], // TODO: Implement
    },
    downloadData: true,
    downloadMetaData: true, // TODO: Implement
    downloadFigure: true, // TODO: Implement
  },
  timeSeriesChart: {
    enabled: true,
    legend: {
      numberOfLines: '2',
      placement: 'above chart',
    },
    xAxis: {
      show: true, // TODO: Implement
      xTicks: true,
      xLabel: true,
    },
    yAxis: {
      show: true, // TODO: Implement
      yTicks: true,
      yLabel: true,
    },
  },
  timeSeriesTable: {
    enabled: true,
    allowDateTimeSorting: true,
    sortDateTimeColumn: 'descending',
  },
  verticalProfileChart: {
    enabled: true,
    legend: {
      numberOfLines: '2',
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
    enabled: true, // TODO: Implement
    allowDepthSorting: true, // TODO: Implement
    sortDepthColumn: 'descending', // TODO: Implement
  },
  metaDataPanel: {
    enabled: true,
  },
}
