<template>
  <component
    class="overflow-auto flex-1-1"
    :is="componentItem.component"
    v-bind="componentItem.componentProps"
    :topologyNode="componentItem.topologyNode"
    :settings="componentItem.settings"
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
import { useComponentSettingsStore } from '@/stores/componentSettings'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import {
  type DashboardSettings,
  getSettings,
} from '@/lib/topology/componentSettings'
import { computed, reactive, ref } from 'vue'
import { RouteLocationNormalized } from 'vue-router'

interface Props {
  item: WebOCDashboardItem
  settings: DashboardSettings
}

const props = defineProps<Props>()

const topologyNodesStore = useTopologyNodesStore()
const componentSettingsStore = useComponentSettingsStore()

const componentItem = computed(() => {
  return convertItemToComponentItem(props.item)
})

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
  const settings = getComponentSettingsForItem(item)
  return {
    title,
    icon,
    component,
    componentProps,
    componentName,
    topologyNode,
    settings,
  }
}

function getComponentSettingsForItem(item: WebOCDashboardItem) {
  const settings = item.componentSettingsId
    ? componentSettingsStore.getSettingsById(item.componentSettingsId)
    : undefined
  const componentSettings = getSettings(settings, item.component)

  // If dashboard has a shared date time slider,
  // disable the date time slider for child component
  if (props.settings.dateTimeSliderEnabled) {
    if ('dateTimeSliderEnabled' in componentSettings) {
      componentSettings['dateTimeSliderEnabled'] = false
    }
  }

  return componentSettings
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
