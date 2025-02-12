<template>
  <component
    v-if="componentItem"
    class="overflow-auto flex-1-1"
    :is="componentItem.component"
    v-bind="componentItem.componentProps"
    :topologyNode="componentItem.topologyNode"
    :settings="componentSettings"
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
import { asyncComputed } from '@vueuse/core'
import { useComponentSettings } from '@/services/useComponentSettings'
import type { ComponentSettings } from '@/lib/topology/componentSettings'

interface Props {
  item: WebOCDashboardItem
  sliderEnabled: boolean
  settings?: ComponentSettings
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const topologyNodesStore = useTopologyNodesStore()

const componentItem = asyncComputed(
  async () => await convertItemToComponentItem(props.item),
)

const { componentSettings } = useComponentSettings(
  baseUrl,
  () => props.item.componentSettingsId,
  () => props.settings,
)

async function convertItemToComponentItem(item: WebOCDashboardItem) {
  const componentName = item.component
  const topologyNode = topologyNodesStore.getNodeById(item.topologyNodeId)
  const component = componentTypeToComponentMap[componentName]
  const componentProps = getComponentPropsForNode(componentName, topologyNode)
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
</script>
