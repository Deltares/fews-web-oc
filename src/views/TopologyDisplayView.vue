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
  <div class="d-flex flex-column h-100 w-100">
    <v-tabs v-model="activeTab" class="d-flex flex-shrink-0">
      <v-tab
        v-for="displayTab in displayTabs"
        :key="displayTab.id"
        :href="displayTab.href"
        :target="displayTab.target"
        :to="displayTab.to"
      >
        {{ displayTab.title }}
      </v-tab>
    </v-tabs>
    <div class="d-flex flex-column flex-shrink-1 flex-grow-0 h-100">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColumnItem } from '@/components/general/ColumnItem'
import ColumnMenu from '@/components/general/ColumnMenu.vue'
import { createTopologyMap, getTopologyNodes } from '@/lib/topology'
import router from '@/router'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { watchEffect } from 'vue'
import { ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const WEB_BROWSER_DISPLAY: string = 'web browser display'

interface Props {
  nodeId?: string
}

interface DisplayTab {
  id: string
  title: string
  href?: string
  target?: string
  to?: RouteLocationRaw
}

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
})

const active = ref<string[]>([])
const open = ref<string[]>([])
const items = ref<ColumnItem[]>([])

const activeTab = ref(0)
const displayTabs = ref<DisplayTab[]>([])

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
  createTopologyMap(nodes.value, topologyMap.value)
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

watchEffect(() => {
  if (
    displayTabs.value[activeTab.value] &&
    displayTabs.value[activeTab.value].id.includes(active.value[0])
  )
    return
  const node = topologyMap.value.get(active.value[0])
  if (node === undefined || node.topologyNodes) return
  const _displayTabs: DisplayTab[] = []
  if (node.displayGroups !== undefined || node.displayId !== undefined) {
    _displayTabs.push({
      id: `${node.id}-timeseries`,
      title: 'Time Series',
      to: {
        name: 'TopologyTimeSeries',
        params: {
          nodeId: node.id,
        },
      },
    })
  }
  if (node.gridDisplaySelection !== undefined) {
    _displayTabs.push({
      id: `${node.id}-spatial`,
      title: 'Spatial Display',
      to: {
        name: 'TopologySpatialDisplay',
        params: {
          nodeId: node.id,
          layerName: node.gridDisplaySelection?.plotId,
        },
      },
    })
  }
  if (node.url !== undefined) {
    _displayTabs.push({
      id: `${node.id}-${WEB_BROWSER_DISPLAY}`,
      title: 'Link',
      href: node.url,
      target: node.url,
    })
  }
  displayTabs.value = _displayTabs
  activeTab.value = 0
  if (_displayTabs.length > 0 && _displayTabs[0].to !== undefined) {
    router.push(_displayTabs[0].to)
  } else {
    router.push({ name: 'TopologyDisplay', params: { nodeId: node.id } })
  }
})
</script>
