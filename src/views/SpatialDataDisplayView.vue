<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu
      rootName="Spatial Data Viewer"
      v-model:active="active"
      :items="items"
      v-model:open="open"
    >
    </ColumnMenu>
  </Teleport>
  <SpatialDisplay></SpatialDisplay>
</template>

<script setup lang="ts">
import type { ColumnItem } from '@/components/general/ColumnItem'
import SpatialDisplay from '@/components/spatialdisplay/SpatialDisplay.vue'
import ColumnMenu from '@/components/general/ColumnMenu.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { ref, watch } from 'vue'
import { getTopologyNodes } from '@/lib/topology'

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

function topologyNodeIsVisible(node: TopologyNode): boolean {
  if (node.filterIds !== undefined && node.filterIds.length > 0 && 
      node.gridDisplaySelection?.plotId !== undefined) return true
  if (node.topologyNodes === undefined) return false
  return node.topologyNodes.some(topologyNodeIsVisible)
}

function recursiveUpdateNode(nodes: TopologyNode[]) {
  return nodes
    .filter((node) => topologyNodeIsVisible(node))
    .map((node) => {
      const result: ColumnItem = {
        id: node.id,
        name: node.name,
      }
      if (node.topologyNodes) {
        result.children = recursiveUpdateNode(node.topologyNodes)
      } else {
        result.to = {
          name: 'SpatialDataDisplay',
          params: {
            nodeId: node.id,
          },
        }
      }
      return result
    })
}

function updateItems(): void {
  if (nodes.value) {
    items.value = recursiveUpdateNode(nodes.value)
  }
}

watch(nodes, updateItems)

</script>
