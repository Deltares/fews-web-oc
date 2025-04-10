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
import { type WebOCDashboardItem } from '@deltares/fews-pi-requests'
import {
  componentTypeToIconMap,
  componentTypeToTitleMap,
} from '@/lib/topology/component'
import {
  componentTypeToComponentMap,
  getComponentPropsForNode,
} from '@/lib/topology/dashboard'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import { configManager } from '@/services/application-config'
import { useComponentSettings } from '@/services/useComponentSettings'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { computed, ref } from 'vue'
import type { RouteParamsGeneric } from 'vue-router'
import type { DashboardActionParams } from '@/lib/topology/dashboardActions'
import { SsdActionResult } from '@deltares/fews-ssd-requests'
import type { NavigateRoute } from '@/lib/router'

interface Props {
  item: WebOCDashboardItem
  sliderEnabled: boolean
  actionId?: string
  actionParams: DashboardActionParams
  settings?: ComponentSettings
}

const props = defineProps<Props>()

interface Emits {
  dashboardAction: [result: SsdActionResult]
}
const emit = defineEmits<Emits>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const topologyNodesStore = useTopologyNodesStore()

const componentItem = computed(() => {
  const hasActionId =
    !props.actionId || props.item.actionIds?.includes(props.actionId)
  return convertItemToComponentItem(
    props.item,
    routeParams.value,
    hasActionId ? props.actionParams : {},
  )
})

const { componentSettings } = useComponentSettings(
  baseUrl,
  () => [props.item.componentSettingsId],
  () => props.settings,
)

function convertItemToComponentItem(
  item: WebOCDashboardItem,
  routeParams: RouteParamsGeneric,
  actionParams: DashboardActionParams,
) {
  const componentName = item.component
  const topologyNode = topologyNodesStore.getNodeById(item.topologyNodeId)
  const component = componentTypeToComponentMap[componentName]
  const componentProps = getComponentPropsForNode(
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

const routeParams = ref<RouteParamsGeneric>({})

function onNavigate(to: NavigateRoute) {
  switch (to.name) {
    case 'SpatialTimeSeriesDisplay':
      emitDashboardAction(to)
      break
    case 'SpatialDisplay':
    case 'SpatialTimeSeriesDisplayWithCoordinates':
    case 'SSDTimeSeriesDisplay':
    case 'SchematicStatusDisplay':
      routeParams.value = {
        ...to.params,
      }
      break
    default:
      console.warn(`Unknown route name: ${String(to.name)}`)
  }
}

function emitDashboardAction(to: NavigateRoute) {
  const locationId = Array.isArray(to.params?.locationIds)
    ? to.params.locationIds[0]
    : to.params?.locationIds.split(',')[0]
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
