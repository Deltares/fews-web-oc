import type { SidePanelSettings } from '@deltares/fews-pi-requests'

import type { SidePanelType } from './panels'

/**
 * Returns the side panel to open for the `showComponent` component setting.
 *
 * @param showComponent the panel configured in the component settings.
 * @param enabledTypes types of the panels that are currently enabled.
 * @returns the type of the panel to open, or null if no panel should be opened.
 */
export function getSidePanelTypeForShowComponent(
  showComponent: SidePanelSettings['showComponent'],
  enabledTypes: SidePanelType[],
): SidePanelType | null {
  if (showComponent === undefined || showComponent === 'None') return null
  if (showComponent === 'shareOptions') return 'share'

  // When import and export status are both enabled, they share the import
  // status panel.
  if (
    showComponent === 'exportStatus' &&
    enabledTypes.includes('importStatus')
  ) {
    return 'importStatus'
  }
  return showComponent
}
