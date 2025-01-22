<template>
  <component
    class="overflow-auto flex-1-1"
    :is="componentItem.component"
    v-bind="componentItem.componentProps"
    :topologyNode="componentItem.topologyNode"
    :settings="componentItem.settings"
  />
</template>

<script setup lang="ts">
import type { DashboardItem } from '@/lib/dashboard/types'
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
import { computed } from 'vue'

interface Props {
  item: DashboardItem
}

const props = defineProps<Props>()

const topologyNodesStore = useTopologyNodesStore()
const componentSettingsStore = useComponentSettingsStore()

const componentItem = computed(() => {
  return convertItemToComponentItem(props.item)
})

function convertItemToComponentItem(item: DashboardItem) {
  const componentName = item.component
  const topologyNode = topologyNodesStore.getNodeById(item.topologyNodeId)
  const component = componentTypeToComponentMap[componentName]
  const componentProps = getComponentPropsForNode(componentName, topologyNode)
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

function getComponentSettingsForItem(item: DashboardItem) {
  const settings = componentSettingsStore.getSettingsById(
    item.componentSettingsId,
  )
  return settings?.[item.component]
}
</script>
