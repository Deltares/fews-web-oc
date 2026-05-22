import type { DeepRequired } from '@/lib/utils/types'
import type { ChartsSettings as PiChartsSettings } from '@deltares/fews-pi-requests'

type DeepRequiredChartsSettings = DeepRequired<PiChartsSettings>

type WithOptionalLocationEnabledAttribute<
  T extends { locationEnabledAttribute: unknown },
> = Omit<T, 'locationEnabledAttribute'> & {
  locationEnabledAttribute?: T['locationEnabledAttribute']
}

export type ChartsSettings = Omit<
  DeepRequiredChartsSettings,
  | 'timeSeriesChart'
  | 'timeSeriesTable'
  | 'verticalProfileChart'
  | 'verticalProfileTable'
  | 'metaDataPanel'
> & {
  timeSeriesChart: WithOptionalLocationEnabledAttribute<
    DeepRequiredChartsSettings['timeSeriesChart']
  >
  timeSeriesTable: WithOptionalLocationEnabledAttribute<
    DeepRequiredChartsSettings['timeSeriesTable']
  >
  verticalProfileChart: WithOptionalLocationEnabledAttribute<
    DeepRequiredChartsSettings['verticalProfileChart']
  >
  verticalProfileTable: WithOptionalLocationEnabledAttribute<
    DeepRequiredChartsSettings['verticalProfileTable']
  >
  metaDataPanel: WithOptionalLocationEnabledAttribute<
    DeepRequiredChartsSettings['metaDataPanel']
  >
}

export const defaultChartSettings: ChartsSettings = {
  general: {
    startPanel: 'timeSeriesChart',
    toolBar: 'true',
    locationNames: true, // TODO: Implement
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
      minNumberOfLines: '2',
      maxNumberOfLines: '2',
      placement: 'above chart',
    },
    xAxis: {
      enabled: true, // TODO: Implement
      xTicks: true,
      xLabel: true,
    },
    yAxis: {
      enabled: true, // TODO: Implement
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
      minNumberOfLines: '2',
      maxNumberOfLines: '2',
      placement: 'above chart',
    },
    xAxis: {
      enabled: true,
      xTicks: true,
      xLabel: true,
    },
    yAxis: {
      enabled: true,
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
