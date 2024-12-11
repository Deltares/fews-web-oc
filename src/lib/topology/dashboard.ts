import type { TopologyNode } from '@deltares/fews-pi-requests'
import { defineAsyncComponent, type Component } from 'vue'
import { ComponentProps } from '@/lib/utils/types'

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

const componentNameToComponentMap = {
  map: SpatialDisplay,
  chart: TimeSeriesDisplay,
  'data-download': DataDownloadDisplayView,
  reports: ReportsDisplayView,
  'ssd': SchematicStatusDisplay,
  'system-monitor': SystemMonitorDisplayView,
} satisfies Record<string, Component>

type ComponentName = keyof typeof componentNameToComponentMap

type PropsForComponentName<T extends ComponentName> = ComponentProps<
  (typeof componentNameToComponentMap)[T]
>

function componentNameIsSupported(
  componentName: string,
): componentName is ComponentName {
  return componentName in componentNameToComponentMap
}

export function getComponentForName(
  componentName: string,
): Component | undefined {
  if (!componentNameIsSupported(componentName)) return
  return componentNameToComponentMap[componentName]
}

export function getComponentPropsForNode(
  componentName: string,
  node?: TopologyNode,
): PropsForComponentName<ComponentName> | undefined {
  if (!node) return
  if (!componentNameIsSupported(componentName)) return

  if (componentName === 'map') {
    const result: PropsForComponentName<'map'> = {
      layerName: node.gridDisplaySelection?.plotId,
      filterIds: node.filterIds,
    }
    return result
  }

  if (componentName === 'chart') {
    const result: PropsForComponentName<'chart'> = {
      nodeId: node.id,
    }
    return result
  }

  if (componentName === 'data-download') {
    const result: PropsForComponentName<'data-download'> = {
      nodeId: node.id,
      topologyNode: node,
    }
    return result
  }

  if (componentName === 'reports') {
    const result: PropsForComponentName<'reports'> = {
      topologyNode: node,
    }
    return result
  }

  if (componentName === 'ssd') {
    const result: PropsForComponentName<'ssd'> = {
      panelId: node.scadaPanelId,
      groupId: node.id,
      objectId: '',
      showDateTimeSlider: false,
    }
    return result
  }

  if (componentName === 'system-monitor') {
    const result: PropsForComponentName<'system-monitor'> = {}
    return result
  }
}
