import type { TopologyNode } from '@deltares/fews-pi-requests'
import { defineAsyncComponent, type Component } from 'vue'
import {
  nodeHasCharts,
  nodeHasDataDownload,
  nodeHasMap,
  nodeHasReports,
  nodeHasSchematicStatusDisplay,
  nodeHasSystemMonitor,
} from './nodes'
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

export interface ComponentWithProps<T extends Component> {
  component: T
  props: ComponentProps<T>
}

export function getComponentWithPropsForNode(node: TopologyNode | undefined) {
  if (!node) {
    return {
      component: undefined,
      props: undefined,
    }
  }

  if (nodeHasMap(node)) {
    const result: ComponentWithProps<typeof SpatialDisplay> = {
      component: SpatialDisplay,
      props: {
        layerName: node.gridDisplaySelection?.plotId,
        filterIds: node.filterIds,
      },
    }
    return result
  }

  if (nodeHasCharts(node)) {
    const result: ComponentWithProps<typeof TimeSeriesDisplay> = {
      component: TimeSeriesDisplay,
      props: {
        nodeId: node.id,
      },
    }
    return result
  }

  if (nodeHasDataDownload(node)) {
    const result: ComponentWithProps<typeof DataDownloadDisplayView> = {
      component: DataDownloadDisplayView,
      props: {
        nodeId: node.id,
        topologyNode: node,
      },
    }
    return result
  }

  if (nodeHasReports(node)) {
    const result: ComponentWithProps<typeof ReportsDisplayView> = {
      component: ReportsDisplayView,
      props: {
        topologyNode: node,
      },
    }
    return result
  }

  if (nodeHasSchematicStatusDisplay(node)) {
    const result: ComponentWithProps<typeof SchematicStatusDisplay> = {
      component: SchematicStatusDisplay,
      props: {
        panelId: node.scadaPanelId,
        groupId: node.id,
        objectId: '',
      },
    }
    return result
  }
  if (nodeHasSystemMonitor(node)) {
    const result: ComponentWithProps<typeof SystemMonitorDisplayView> = {
      component: SystemMonitorDisplayView,
      props: {},
    }
    return result
  }

  return {
    component: undefined,
    props: undefined,
  }
}
