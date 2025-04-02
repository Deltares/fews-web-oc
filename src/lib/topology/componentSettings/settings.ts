import {
  defaultChartSettings,
  defaultMapSettings,
  defaultSchematicStatusDisplaySettings,
  defaultReportSettings,
} from '.'
import { WebOCComponentSettingsClass } from '@deltares/fews-pi-requests'
import { DeepRequired } from '@/lib/utils/types'
import { merge } from 'lodash-es'

export type ComponentSettings = DeepRequired<WebOCComponentSettingsClass>

export function getDefaultSettings(): ComponentSettings {
  return {
    id: '',
    map: defaultMapSettings,
    ssd: defaultSchematicStatusDisplaySettings,
    charts: defaultChartSettings,
    report: defaultReportSettings,
  }
}

export function getSettings(
  componentSettings: (WebOCComponentSettingsClass | undefined)[],
): WebOCComponentSettingsClass {
  const defaultSettings = getDefaultSettings()
  const settings = componentSettings.filter((s) => s !== undefined)
  return merge({}, defaultSettings, ...settings)
}
