<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu
      rootName="Topology"
      :active.sync="active"
      :items="items"
      :open.sync="open"
    >
    </ColumnMenu>
  </Teleport>
  <div></div>
</template>

<script setup lang="ts">
import type { ColumnItem } from '@/components/general/ColumnItem'
import ColumnMenu from '@/components/general/ColumnMenu.vue'
import { configManager } from '@/services/application-config'
import { useTopologyNodes } from '@/services/useTopologyNodes'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { ref, watch } from 'vue'

const TIME_SERIES_DIALOG_PANEL: string = 'time series dialog'

interface Props {
  nodeId?: string
}

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
})
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const active = ref<string[]>([])
const open = ref<string[]>([])
const items = ref<ColumnItem[]>([])

const selectedPlot = ref(0)

const { nodes } = useTopologyNodes(baseUrl, () => props.nodeId, selectedPlot)

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
        if (
          node.url !== undefined &&
          node.mainPanel !== TIME_SERIES_DIALOG_PANEL
        ) {
          result.href = node.url
          result.target = node.url
        } else {
          result.wmsLayerId =
            node.gridDisplaySelection !== undefined
              ? node.gridDisplaySelection.plotId
              : undefined
          result.filterIds = node.filterIds ?? []
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
  if (node.url && node.mainPanel !== TIME_SERIES_DIALOG_PANEL)
    return 'mdi-share'
  return undefined
}

function updateItems(): void {
  if (nodes.value) {
    const _items = recursiveUpdateNode(nodes.value)
    items.value = _items
    open.value = [_items[0].id]
  }
}

watch(nodes, updateItems)
</script>
