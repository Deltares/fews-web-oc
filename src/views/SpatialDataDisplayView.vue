<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu
      rootName="Spatial Data Viewer"
      v-model:active="active"
      :items="items"
      v-model:open="open"
    />
  </Teleport>
  <SpatialDataDisplay :node="topologyMap.get(nodeId)" />
  <div class="child-container" :class="{ mobile }">
    <router-view @close="closeTimeSeriesDisplay"></router-view>
  </div>
</template>

<script setup lang="ts">
import type { ColumnItem } from '@/components/general/ColumnItem'
import SpatialDataDisplay from '@/components/spatialdatadisplay/SpatialDataDisplay.vue'
import ColumnMenu from '@/components/general/ColumnMenu.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { createTopologyMap, getTopologyNodes } from '@/lib/topology'

interface Props {
  nodeId?: string
}

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
})

const { mobile } = useDisplay()
const router = useRouter()

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
const topologyMap = ref(new Map<string, TopologyNode>())

getTopologyNodes().then((response) => {
  nodes.value = response
  topologyMap.value = createTopologyMap(nodes.value)
})

function topologyNodeIsVisible(node: TopologyNode): boolean {
  if (
    node.filterIds !== undefined &&
    node.filterIds.length > 0 &&
    node.gridDisplaySelection?.plotId !== undefined
  )
    return true
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

function closeTimeSeriesDisplay(objectId: string): void {
  if (objectId) {
    router
      .push({
        name: 'SpatialDataDisplay',
      })
      .then(() => {
        SpatialDataDisplay.value?.resize()
      })
  }
}
</script>
