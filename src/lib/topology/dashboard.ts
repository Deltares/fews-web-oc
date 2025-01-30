import type { TopologyNode } from '@deltares/fews-pi-requests'
import { defineAsyncComponent, type Component } from 'vue'
import { ComponentProps } from '@/lib/utils/types'
import { ComponentType } from '@/lib/topology/component'

const SpatialDisplay = defineAsyncComponent(
  () => import('@/components/spatialdisplay/SpatialDisplay.vue'),
)
const TimeSeriesDisplay = defineAsyncComponent(
  () => import('@/components/timeseries/TimeSeriesDisplay.vue'),
)
const DataDownloadDisplayView = defineAsyncComponent(
  () => import('@/views/DataDownloadDisplayView.vue'),
)
const ReportsDisplayView = defineAsyncComponent(
  () => import('@/views/ReportsDisplayView.vue'),
)
const SchematicStatusDisplay = defineAsyncComponent(
  () => import('@/components/ssd/SchematicStatusDisplay.vue'),
)
const SystemMonitorDisplayView = defineAsyncComponent(
  () => import('@/views/SystemMonitorDisplayView.vue'),
)

const Empty = defineAsyncComponent(() => import('@/views/Empty.vue'))

export const componentTypeToComponentMap = {
  map: SpatialDisplay,
  charts: TimeSeriesDisplay,
  'data-download-display': DataDownloadDisplayView,
  report: ReportsDisplayView,
  'schematic-status-display': SchematicStatusDisplay,
  'system-monitor': SystemMonitorDisplayView,
  tasks: Empty,
  'html-display': Empty,
  dashboard: Empty,
  'log-display': Empty,
} satisfies Record<ComponentType, Component>

export type PropsForComponentType<T extends ComponentType> = ComponentProps<
  (typeof componentTypeToComponentMap)[T]
>

export function getComponentPropsForNode(
  componentType: ComponentType,
  node?: TopologyNode,
): PropsForComponentType<ComponentType> | undefined {
  if (!node) return

  if (componentType === 'map') {
    const result: PropsForComponentType<'map'> = {
      layerName: node.gridDisplaySelection?.plotId,
      filterIds: node.filterIds,
    }
    return result
  }

  if (componentType === 'charts') {
    const result: PropsForComponentType<'charts'> = {
      nodeId: node.id,
    }
    return result
  }

  if (componentType === 'data-download-display') {
    const result: PropsForComponentType<'data-download-display'> = {
      nodeId: node.id,
      topologyNode: node,
    }
    return result
  }

  if (componentType === 'report') {
    const result: PropsForComponentType<'report'> = {
      topologyNode: node,
    }
    return result
  }

  if (componentType === 'schematic-status-display') {
    const result: PropsForComponentType<'schematic-status-display'> = {
      panelId: node.scadaPanelId,
      groupId: node.id,
      objectId: '',
      showDateTimeSlider: false,
    }
    return result
  }

  if (componentType === 'system-monitor') {
    const result: PropsForComponentType<'system-monitor'> = {}
    return result
  }
}
