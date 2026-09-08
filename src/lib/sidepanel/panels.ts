import type { Component } from 'vue'
import type { SidePanelConfig } from '@deltares/fews-pi-requests'

import ImportStatusSidePanel from '@/components/sidepanel/ImportStatusSidePanel.vue'
import LogSidePanel from '@/components/sidepanel/LogSidePanel.vue'
import MoreInfoSidePanel from '@/components/sidepanel/MoreInfoSidePanel.vue'
import NonCurrentDataSidePanel from '@/components/sidepanel/NonCurrentDataSidePanel.vue'
import RunTasksSidePanel from '@/components/sidepanel/RunTasksSidePanel.vue'
import ShareSidePanel from '@/components/sidepanel/ShareSidePanel.vue'
import TaskOverviewSidePanel from '@/components/sidepanel/TaskOverviewSidePanel.vue'

// FIXME: Remove 'share' once SidePanel configuration is implemented for it.
export type SidePanelType = Exclude<
  keyof SidePanelConfig | 'share',
  'exportStatus'
>

export interface SidePanel {
  type: SidePanelType
  icon: string
  component: Component
}

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
]

export function getEnabledSidePanels(
  config: SidePanelConfig | undefined,
): SidePanel[] {
  // FIXME: For now we always enable share, should be removed once SidePanel
  // configuration is implemented for it.
  return sidePanels.filter(
    (sidePanel) =>
      sidePanel.type === 'share' || config?.[sidePanel.type]?.enabled,
  )
}
