<template>
  <Teleport to="#web-oc-sidebar-target">
    <ColumnMenu v-model:active="active" :items="items" v-model:open="open">
    </ColumnMenu>
  </Teleport>
  <TimeSeriesDisplay :nodeId="nodeId" :plotId="plotId" @navigate="onNavigate" />
</template>

<script setup lang="ts">
import ColumnMenu from '../components/general/ColumnMenu.vue'
import { ref, watch } from 'vue'
import type { ColumnItem } from '../components/general/ColumnItem'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import TimeSeriesDisplay from '../components/timeseries/TimeSeriesDisplay.vue'
import { getTopologyNodes } from '@/lib/topology/getTopologyNodes'
import { useRoute, useRouter } from 'vue-router'
import type { NavigateRoute } from '@/lib/router'

const TIME_SERIES_DIALOG_PANEL: string = 'time series dialog'

interface Props {
  nodeId?: string
  plotId?: string
}

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
})

const route = useRoute()
const router = useRouter()

function onNavigate(to: NavigateRoute) {
  void router.replace({
    ...to,
    params: { nodeId: props.nodeId, ...to.params },
    query: route.query,
    hash: route.hash,
  })
}

const active = ref<string | undefined>(undefined)
const open = ref<string[]>([])
const items = ref<ColumnItem[]>([])

watch(
  () => props.nodeId,
  () => {
    if (active.value !== props.nodeId) {
      active.value = props.nodeId
    }
  },
  { immediate: true },
)

const topologyNodes = ref<TopologyNode[]>()

function anyChildNodeIsVisible(nodes: TopologyNode[] | undefined): boolean {
  if (nodes === undefined) return false
  for (const node of nodes) {
    if (topologyNodeIsVisible(node)) return true
  }
  return false
}

function topologyNodeIsVisible(node: TopologyNode): boolean {
  if (node.url !== undefined) return true
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
      } else if (
        node.url !== undefined &&
        node.mainPanel !== TIME_SERIES_DIALOG_PANEL
      ) {
        result.href = node.url
        result.target = node.url
      } else {
        result.to = {
          name: 'TimeSeriesDisplay',
          params: {
            nodeId: node.id,
          },
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
  if (topologyNodes.value) {
    const _items = recursiveUpdateNode(topologyNodes.value)
    items.value = _items
    const firstItem = _items[0]
    open.value = firstItem ? [firstItem.id] : []
  }
}

watch(topologyNodes, updateItems)
try {
  topologyNodes.value = await getTopologyNodes()
} catch (error) {
  console.error('Failed to fetch topology nodes.', error)
}
</script>
