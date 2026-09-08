import type { Component } from 'vue'
import type { SidePanelConfig } from '@deltares/fews-pi-requests'

import ThresholdsButton from '@/components/thresholds/ThresholdsButton.vue'

import ImportStatusSidePanel from '@/components/sidepanel/ImportStatusSidePanel.vue'
import LogSidePanel from '@/components/sidepanel/LogSidePanel.vue'
import MoreInfoSidePanel from '@/components/sidepanel/MoreInfoSidePanel.vue'
import NonCurrentDataSidePanel from '@/components/sidepanel/NonCurrentDataSidePanel.vue'
import RunTasksSidePanel from '@/components/sidepanel/RunTasksSidePanel.vue'
import ShareSidePanel from '@/components/sidepanel/ShareSidePanel.vue'
import TaskOverviewSidePanel from '@/components/sidepanel/TaskOverviewSidePanel.vue'
import ThresholdsSidePanel from '@/components/sidepanel/ThresholdsSidePanel.vue'

export type SidePanelType =
  | 'taskOverview'
  | 'nonCurrentData'
  | 'importStatus'
  | 'runTask'
  | 'documentFile'
  | 'logDisplay'
  | 'share'
  | 'thresholds'

export interface SidePanel {
  type: SidePanelType
  /** Icon used for the default toolbar button and the side panel menu. */
  icon: string
  /** Component rendered as the contents of the side panel. */
  component: Component
  /**
   * Component rendered instead of the default toolbar button; it is passed an
   * `active` prop and should emit a `click` event.
   */
  button?: Component
  /**
   * Whether the panel has a permanent button in the toolbar. Persistent panels
   * are not part of the side panel menu.
   */
  persistent?: boolean
}

/**
 * Props that can be passed to a side panel when it is opened, per panel type.
 */
export interface SidePanelProps {
  taskOverview: Record<string, never>
  importStatus: Record<string, never>
  nonCurrentData: Record<string, never>
  runTask: Record<string, never>
  logDisplay: { taskRunId?: string }
  documentFile: Record<string, never>
  share: Record<string, never>
  thresholds: { locationIds?: string }
}

/**
 * A request to open a side panel, optionally with props for that panel.
 *
 * This allows a side panel to open any other side panel, without having to know
 * how side panels are managed.
 */
export type SidePanelRequest = {
  [T in SidePanelType]: {
    type: T
    props?: SidePanelProps[T]
  }
}[SidePanelType]

export const sidePanels: SidePanel[] = [
  {
    type: 'taskOverview',
    icon: 'mdi-clipboard-text-clock',
    component: TaskOverviewSidePanel,
  },
  {
    type: 'importStatus',
    icon: 'mdi-database-import',
    component: ImportStatusSidePanel,
  },
  {
    type: 'nonCurrentData',
    icon: 'mdi-chart-box-multiple',
    component: NonCurrentDataSidePanel,
  },
  {
    type: 'runTask',
    icon: 'mdi-cog-play',
    component: RunTasksSidePanel,
  },
  {
    type: 'logDisplay',
    icon: 'mdi-message-text-clock',
    component: LogSidePanel,
  },
  {
    type: 'documentFile',
    icon: 'mdi-information-outline',
    component: MoreInfoSidePanel,
  },
  {
    type: 'share',
    icon: 'mdi-share-variant',
    component: ShareSidePanel,
  },
  {
    type: 'thresholds',
    icon: 'mdi-alert',
    component: ThresholdsSidePanel,
    button: ThresholdsButton,
    persistent: true,
  },
]

/**
 * Returns the side panels that are enabled.
 *
 * @param config side panel configuration from the FEWS configuration.
 * @param overrides enables or disables panels that are not part of the FEWS
 *   side panel configuration, regardless of the configuration.
 */
export function getEnabledSidePanels(
  config: SidePanelConfig | undefined,
  overrides: Partial<Record<SidePanelType, boolean>> = {},
): SidePanel[] {
  // NOTE: For now we always enable share, should be removed once SidePanel
  // configuration is implemented for it.
  const defaultOverrides: Partial<Record<SidePanelType, boolean>> = {
    share: true,
  }
  const allOverrides = { ...defaultOverrides, ...overrides }

  return sidePanels.filter(
    (sidePanel) =>
      allOverrides[sidePanel.type] ??
      config?.[sidePanel.type as keyof SidePanelConfig]?.enabled ??
      false,
  )
}
