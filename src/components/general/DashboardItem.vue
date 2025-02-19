<template>
  <component
    v-if="componentItem"
    class="overflow-auto flex-1-1"
    :is="componentItem.component"
    v-bind="componentItem.componentProps"
    :topologyNode="componentItem.topologyNode"
    :settings="componentSettings"
    @navigate="onNavigate"
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
import { computed, reactive } from 'vue'
import { RouteLocationNormalized } from 'vue-router'

interface Props {
  item: WebOCDashboardItem
  sliderEnabled: boolean
  settings?: ComponentSettings
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const topologyNodesStore = useTopologyNodesStore()

const componentItem = computed(() => {
  return convertItemToComponentItem(props.item)
})

const { componentSettings } = useComponentSettings(
  baseUrl,
  () => [props.item.componentSettingsId],
  () => props.settings,
)

function convertItemToComponentItem(item: WebOCDashboardItem) {
  const componentName = item.component
  const topologyNode = topologyNodesStore.getNodeById(item.topologyNodeId)
  const component = componentTypeToComponentMap[componentName]
  const componentProps = getComponentPropsForNode(
    componentName,
    topologyNode,
    params,
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
interface Params {
  locationIds?: string
  latitude?: string
  longitude?: string
}

const params = reactive<Params>({})

function onNavigate(to: RouteLocationNormalized) {
  switch (to.name) {
    case 'SpatialTimeSeriesDisplay':
      params.locationIds =
        typeof to.params.locationIds === 'string'
          ? to.params.locationIds
          : to.params.locationIds.join(',')
      params.latitude = undefined
      params.longitude = undefined
      break
    case 'SpatialTimeSeriesDisplayWithCoordinates':
      params.locationIds = undefined
      params.latitude = String(to.params.latitude)
      params.longitude = String(to.params.longitude)
      break
    case 'SpatialDisplay':
      params.locationIds = undefined
      params.latitude = undefined
      params.longitude = undefined
      break
    default:
      console.warn(`Unknown route name: ${String(to.name)}`)
  }
}
</script>
