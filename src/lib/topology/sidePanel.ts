import { SidePanelConfig } from '@deltares/fews-pi-requests'
import { defineAsyncComponent, type Component } from 'vue'
import { useI18n } from 'vue-i18n'

const WorkflowsControl = defineAsyncComponent(
  () => import('@/components/workflows/WorkflowsControl.vue'),
)
const InformationDisplayView = defineAsyncComponent(
  () => import('@/views/InformationDisplayView.vue'),
)
const TaskRunsOverview = defineAsyncComponent(
  () => import('@/components/tasks/TaskRunsOverview.vue'),
)
const ImportStatusControl = defineAsyncComponent(
  () => import('@/components/systemmonitor/ImportStatusControl.vue'),
)
const VisualizeDataControl = defineAsyncComponent(
  () => import('@/components/tasks/VisualizeDataControl.vue'),
)
const LogDisplay = defineAsyncComponent(
  () => import('@/components/logdisplay/LogDisplay.vue'),
)

export type SidePanelType =
  | 'tasks'
  | 'thresholds'
  | 'info'
  | 'workflows'
  | 'visualize'
  | 'import'
  | 'logs'

export interface SidePanel {
  type: SidePanelType
  title: string
  icon: string
  component: Component
  disabled?: boolean
  props?: Record<string, unknown>
}

export function getSidePanelConfigs(
  config: SidePanelConfig | undefined,
): SidePanel[] {
  if (!config) return []

  const { t } = useI18n()

  return [
    {
      type: 'tasks',
      title: t('sidePanel.taskOverview'),
      icon: 'mdi-clipboard-text-clock',
      component: TaskRunsOverview,
      disabled: !config.taskOverview?.enabled,
    },
    {
      type: 'import',
      title: t('sidePanel.importStatus'),
      icon: 'mdi-database-import',
      component: ImportStatusControl,
      disabled: !config.importStatus?.enabled,
    },
    {
      type: 'visualize',
      title: t('sidePanel.noncurrentData'),
      icon: 'mdi-chart-box-multiple',
      component: VisualizeDataControl,
      disabled: !config.nonCurrentData?.enabled,
    },
    {
      type: 'workflows',
      title: t('sidePanel.runTasks'),
      icon: 'mdi-cog-play',
      component: WorkflowsControl,
      disabled: !config.runTask?.enabled,
    },
    {
      type: 'logs',
      title: t('sidePanel.logDisplay'),
      icon: 'mdi-file-document-outline',
      component: LogDisplay,
      // @ts-expect-error fix once logdisplay has been added to fews-pi-requests
      disabled: !config.logDisplay?.enabled,
      // @ts-expect-error fix once logdisplay has been added to fews-pi-requests
      props: { logDisplayId: config.logDisplay?.logDisplayId },
    },
    {
      type: 'info',
      title: t('sidePanel.moreInfo'),
      icon: 'mdi-information-outline',
      component: InformationDisplayView,
      disabled: !config.documentFile?.enabled,
    },
  ]
}
