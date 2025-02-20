import {
  defaultChartSettings,
  defaultMapSettings,
  defaultSchematicStatusDisplaySettings,
  defaultReportSettings,
} from '.'
import { WebOCComponentSettings } from '@deltares/fews-pi-requests'
import { DeepRequired } from '@/lib/utils/types'
import { merge } from 'lodash-es'

export type ComponentSettings = DeepRequired<WebOCComponentSettings>

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
  componentSettings: (WebOCComponentSettings | undefined)[],
): WebOCComponentSettings {
  const defaultSettings = getDefaultSettings()
  const settings = componentSettings.filter((s) => s !== undefined)
  return merge({}, defaultSettings, ...settings)
}
