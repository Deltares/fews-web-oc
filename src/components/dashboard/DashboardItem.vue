<template>
  <component
    v-if="componentItem"
    class="overflow-auto flex-1-1"
    :is="componentItem.component"
    v-bind="componentItem.componentProps"
    :topologyNode="componentItem.topologyNode"
    :settings="componentSettings"
    @navigate="onNavigate"
    @dashboardAction="emit('dashboardAction', $event)"
  />
</template>

<script setup lang="ts">
import type {
  TopologyNode,
  WebOCDashboardItem,
} from '@deltares/fews-pi-requests'
import {
  type ComponentType,
  componentTypeToIconMap,
  componentTypeToTitleMap,
} from '@/lib/topology/component'
import {
  componentTypeToComponentMap,
  getComponentPropsForNode,
  type PropsForComponentType,
} from '@/lib/topology/dashboard'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import { configManager } from '@/services/application-config'
import { useComponentSettings } from '@/services/useComponentSettings'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { type Component, ref, shallowRef, watch } from 'vue'
import type { RouteParamsGeneric } from 'vue-router'
import type {
  DashboardActionEventBus,
  DashboardActionParams,
} from '@/lib/topology/dashboardActions'
import type { SsdActionResult } from '@deltares/fews-ssd-requests'
import type { NavigateRoute } from '@/lib/router'

interface ComponentItem {
  title: string
  icon: string
  component: Component
  componentProps: PropsForComponentType<ComponentType> | undefined
  componentName: string
  topologyNode: TopologyNode | undefined
}

interface Props {
  item: WebOCDashboardItem
  siblings: WebOCDashboardItem[]
  actionEventBus: DashboardActionEventBus
  settings?: ComponentSettings
}

const props = defineProps<Props>()

interface Emits {
  dashboardAction: [result: SsdActionResult]
}
const emit = defineEmits<Emits>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const topologyNodesStore = useTopologyNodesStore()
const routeParams = ref<RouteParamsGeneric>({})

const actionParams = ref<DashboardActionParams>({})
watch(
  () => props.actionEventBus.trigger,
  () => {
    const { actionId, ...params } = props.actionEventBus.payload
    const isValidAction = !actionId || props.item.actionIds?.includes(actionId)
    if (isValidAction) {
      actionParams.value = {
        ...actionParams.value,
        ...params,
      }
    }
  },
)

const componentItem = shallowRef<ComponentItem>()
watch(
  [() => props.item, actionParams, routeParams],
  async () => {
    componentItem.value = await convertItemToComponentItem(
      props.item,
      routeParams.value,
      actionParams.value,
    )
  },
  { immediate: true },
)

const { componentSettings } = useComponentSettings(
  baseUrl,
  () => [props.item.componentSettingsId],
  () => props.settings,
)

async function convertItemToComponentItem(
  item: WebOCDashboardItem,
  routeParams: RouteParamsGeneric,
  actionParams: DashboardActionParams,
): Promise<ComponentItem> {
  const componentName = item.component
  const topologyNode = topologyNodesStore.getNodeById(item.topologyNodeId)
  const component = componentTypeToComponentMap[componentName]
  const componentProps = await getComponentPropsForNode(
    componentName,
    topologyNode,
    routeParams,
    actionParams,
  )
  const title = topologyNode?.name ?? componentTypeToTitleMap[componentName]
  const icon = topologyNode?.iconId ?? componentTypeToIconMap[componentName]
  return {
    title,
    icon,
    component,
    componentProps,
    componentName,
    topologyNode,
  }
}

function onNavigate(to: NavigateRoute) {
  switch (to.name) {
    case 'SpatialTimeSeriesDisplay':
      const hasChartSibling = props.siblings.some(
        (item) => item.component === 'charts',
      )
      const locationIds = to.params?.locationIds

      if (hasChartSibling && locationIds) {
        emitChartLocationAction(locationIds)
        delete to.params?.locationIds
      }

      navigateTo(to)
      break
    case 'SpatialDisplay':
    case 'SpatialTimeSeriesDisplayWithCoordinates':
    case 'SSDTimeSeriesDisplay':
    case 'SchematicStatusDisplay':
      navigateTo(to)
      break
    default:
      console.warn(`Unknown route name: ${String(to.name)}`)
  }
}

function navigateTo(to: NavigateRoute) {
  routeParams.value = {
    ...to.params,
  }
}

function emitChartLocationAction(locationIds: string[] | string) {
  const locationId = Array.isArray(locationIds)
    ? locationIds[0]
    : locationIds.split(',')[0]
  if (locationId) {
    emit('dashboardAction', {
      type: 'WEBOC_DASHBOARD',
      charts: {
        chartsLocationId: locationId,
        // FIXME: Remove this once fixed in the schema
        displayId: locationId,
      },
    })
  }
}
</script>
