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
import { computed, ref, watch } from 'vue'
import type { RouteParamsGeneric } from 'vue-router'
import type {
  DashboardActionEventBus,
  DashboardActionParams,
} from '@/lib/topology/dashboardActions'
import { SsdActionResult } from '@deltares/fews-ssd-requests'
import type { NavigateRoute } from '@/lib/router'

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

const componentItem = computed(() => {
  return convertItemToComponentItem(
    props.item,
    routeParams.value,
    actionParams.value,
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
      const hasChartSibling = props.siblings.some(
        (item) => item.component === 'charts',
      )
      if (hasChartSibling) {
        emitDashboardAction(to)
      } else {
        navigateTo(to)
      }
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
