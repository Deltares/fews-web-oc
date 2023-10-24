<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu
      rootName="Topology"
      v-model:active="active"
      :items="items"
      v-model:open="open"
    >
    </ColumnMenu>
  </Teleport>
  <router-view></router-view>
</template>

<script setup lang="ts">
import type { ColumnItem } from '@/components/general/ColumnItem'
import ColumnMenu from '@/components/general/ColumnMenu.vue'
import { getTopologyNodes } from '@/lib/topology'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { ref, watch } from 'vue'

const WEB_BROWSER_DISPLAY: string = 'web browser display'

interface Props {
  nodeId?: string
}

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
})

const active = ref<string[]>([])
const open = ref<string[]>([])
const items = ref<ColumnItem[]>([])

watch(
  () => props.nodeId,
  () => {
    if (active.value[0] !== props.nodeId) {
      active.value = [props.nodeId]
    }
  },
  { immediate: true },
)

const nodes = ref<TopologyNode[]>()
getTopologyNodes().then((response) => {
  nodes.value = response
})

function anyChildNodeIsVisible(nodes: TopologyNode[] | undefined): boolean {
  if (nodes === undefined) return false
  for (const node of nodes) {
    if (topologyNodeIsVisible(node)) return true
  }
  return false
}

function topologyNodeIsVisible(node: TopologyNode): boolean {
  if (node.url !== undefined) return true
  if (node.filterIds !== undefined && node.filterIds.length > 0) return true
  if (node.gridDisplaySelection !== undefined) return true
  if (node.displayId !== undefined) return true
  if (node.displayGroups !== undefined && node.displayGroups.length > 0)
    return true
  return anyChildNodeIsVisible(node.topologyNodes)
}

function recursiveUpdateNode(nodes: TopologyNode[]) {
  return nodes
    .filter((node) => topologyNodeIsVisible(node))
    .map((node) => {
      const result: ColumnItem = {
        id: node.id,
        name: node.name,
        icon: getIcon(node),
      }
      if (node.topologyNodes) {
        result.children = recursiveUpdateNode(node.topologyNodes)
      } else {
        if (node.url !== undefined && node.mainPanel === WEB_BROWSER_DISPLAY) {
          result.href = node.url
          result.target = node.url
        } else if (
          node.displayGroups !== undefined ||
          node.displayId !== undefined
        ) {
          result.to = {
            name: 'TopologyTimeSeries',
            params: {
              nodeId: node.id,
            },
          }
        } else if (node.gridDisplaySelection !== undefined) {
          result.to = {
            name: 'TopologySpatialDisplay',
            params: {
              nodeId: node.id,
              layerName: node.gridDisplaySelection?.plotId,
            },
          }
        } else {
          result.to = {
            name: 'TopologyDisplay',
            params: {
              nodeId: node.id,
            },
          }
        }
      }
      return result
    })
}

function getIcon(node: TopologyNode): string | undefined {
  if (node.url && node.mainPanel === WEB_BROWSER_DISPLAY) return 'mdi-share'
  return undefined
}

function updateItems(): void {
  if (nodes.value) {
    items.value = recursiveUpdateNode(nodes.value)
  }
}

watch(nodes, updateItems)
</script>
