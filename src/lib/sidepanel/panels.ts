import type { AllowedComponentProps, Component, VNodeProps } from 'vue'
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
import type { ComponentProps } from '@/lib/utils/types'

interface SidePanelDefinition {
  type: string
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
 * All side panels that exist.
 *
 * This is the single source of truth for side panels: the available side panel
 * types and the props each panel accepts are derived from it.
 */
const sidePanelDefinitions = [
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
] as const satisfies readonly SidePanelDefinition[]

export type SidePanelType = (typeof sidePanelDefinitions)[number]['type']

export interface SidePanel extends SidePanelDefinition {
  type: SidePanelType
}

export const sidePanels: SidePanel[] = [...sidePanelDefinitions]

/** The component that renders the contents of a side panel. */
type SidePanelComponent<T extends SidePanelType> = Extract<
  (typeof sidePanelDefinitions)[number],
  { type: T }
>['component']

/**
 * Props that are always supplied by the component that renders the side panels,
 * so they cannot be passed when opening a side panel.
 */
type ManagedSidePanelProp = 'topologyNode' | 'logDisplayId'

/**
 * Props that can be passed to a side panel when it is opened.
 *
 * These are derived from the props of the panel's component, excluding the
 * props that are managed by the component that renders the side panels.
 */
export type SidePanelProps<T extends SidePanelType> = Omit<
  ComponentProps<SidePanelComponent<T>>,
  | keyof VNodeProps
  | keyof AllowedComponentProps
  | `on${string}` /* NOSONAR(S6571) */
  | ManagedSidePanelProp /* NOSONAR(S6571) */
>

export type SidePanelRequest = {
  [T in SidePanelType]: {
    type: T
    props?: SidePanelProps<T>
  }
}[SidePanelType]

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
