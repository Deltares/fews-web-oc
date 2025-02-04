import { type ChartSettings, defaultChartSettings } from './chartSettings'

export interface MapSettings extends ChartSettings {
  chartPanelEnabled: boolean
  locationSearchEnabled: boolean
  dateTimeSliderEnabled: boolean
}

export const defaultMapSettings: MapSettings = {
  ...defaultChartSettings,
  chartPanelEnabled: true,
  locationSearchEnabled: true,
  dateTimeSliderEnabled: true,
}
