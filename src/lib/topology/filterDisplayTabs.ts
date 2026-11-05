import type { WebOCComponentSettingsClass } from '@deltares/fews-pi-requests'
import type { DisplayTab } from './displayTabs'

export function filterDisplayTabs(
  tabs: DisplayTab[],
  settings?: WebOCComponentSettingsClass,
): DisplayTab[] {
  return tabs.filter((tab) => {
    if (tab.type === 'dynamic-report-display') {
      return !settings?.charts?.dynamicReportDisplay?.enabled
    }
    return true
  })
}
