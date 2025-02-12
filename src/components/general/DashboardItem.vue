<template>
  <component
    v-if="componentItem"
    class="overflow-auto flex-1-1"
    :is="componentItem.component"
    v-bind="componentItem.componentProps"
    :topologyNode="componentItem.topologyNode"
    :settings="componentItem.settings"
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
import {
  getSettings,
  fetchComponentSettings,
} from '@/lib/topology/componentSettings'
import { configManager } from '@/services/application-config'
import { asyncComputed } from '@vueuse/core'

interface Props {
  item: WebOCDashboardItem
  sliderEnabled: boolean
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const topologyNodesStore = useTopologyNodesStore()

const componentItem = asyncComputed(
  async () => await convertItemToComponentItem(props.item),
)

async function convertItemToComponentItem(item: WebOCDashboardItem) {
  const componentName = item.component
  const topologyNode = topologyNodesStore.getNodeById(item.topologyNodeId)
  const component = componentTypeToComponentMap[componentName]
  const componentProps = getComponentPropsForNode(componentName, topologyNode)
  const title = topologyNode?.name ?? componentTypeToTitleMap[componentName]
  const icon = topologyNode?.iconId ?? componentTypeToIconMap[componentName]
  const settings = await getComponentSettingsForItem(item)
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

async function getComponentSettingsForItem(item: WebOCDashboardItem) {
  const settings = item.componentSettingsId
    ? await fetchComponentSettings(baseUrl, item.componentSettingsId)
    : undefined
  return getSettings(settings)
}
</script>
