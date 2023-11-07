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
  <Teleport to="#app-bar-content">
    <v-tabs v-model="activeTab" class="d-flex flex-shrink-0">
      <v-tab
        v-for="tab in displayTabs"
        :key="tab.id"
        :href="tab.href"
        :target="tab.target"
        :to="tab.to"
      >
        {{ tab.title }}
        <v-icon v-if="tab.href">mdi-share</v-icon>
      </v-tab>
    </v-tabs>
    <v-btn
      v-if="externalLink"
      :href="externalLink"
      target="_blank"
      variant="text"
      class="flex-0-0 align-self-center"
      >Link<v-icon>mdi-share</v-icon></v-btn
    >
  </Teleport>
  <router-view></router-view>
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
const externalLink = ref<string>('')

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
  if (node.url !== undefined) return true
  if (node.filterIds !== undefined && node.filterIds.length > 0) return true
  if (node.gridDisplaySelection !== undefined) return true
  if (node.displayId !== undefined) return true
  if (node.displayGroups !== undefined && node.displayGroups.length > 0)
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
        icon: getIcon(node),
        href: getUrl(node),
      }
      if (node.topologyNodes) {
        result.children = recursiveUpdateNode(node.topologyNodes)
      }
      return result
    })
}

function getIcon(node: TopologyNode): string | undefined {
  if (node.url && !node.topologyNodes && !node.displayGroups) return 'mdi-share'
  return undefined
}

function getUrl(node: TopologyNode): string | undefined {
  if (node.url && !node.topologyNodes && !node.displayGroups) return node.url
  return undefined
}

function updateItems(): void {
  if (nodes.value) {
    items.value = recursiveUpdateNode(nodes.value)
  }
}

watch(nodes, updateItems)

// Update the displayTabs if the active node changes (or if the topologyMap changes).
// Redirect to the corresponding display of the updated active tab.
watchEffect(() => {
  // Check if the current displayTab already matches the active node.
  const activeNodeId = active.value[0]
  const timeseriesTabId = `${activeNodeId}-timeseries`
  const spatialTabId = `${activeNodeId}-spatial`
  const urlTabId = `${activeNodeId}-${WEB_BROWSER_DISPLAY}`
  if (
    displayTabs.value[activeTab.value] &&
    (displayTabs.value[activeTab.value].id === timeseriesTabId ||
      displayTabs.value[activeTab.value].id === spatialTabId ||
      displayTabs.value[activeTab.value].id === urlTabId)
  )
    return

  // Check if the active node is a leaf.
  const node = topologyMap.value.get(active.value[0])
  if (node === undefined || node.topologyNodes) return

  // Create the displayTabs for the active node.
  const _displayTabs: DisplayTab[] = []
  if (node.displayGroups !== undefined || node.displayId !== undefined) {
    _displayTabs.push({
      id: timeseriesTabId,
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
      id: spatialTabId,
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
    externalLink.value = node.url
  }
  displayTabs.value = _displayTabs

  // Redirect to the first displayTab.
  activeTab.value = 0
  if (_displayTabs.length > 0 && _displayTabs[0].to !== undefined) {
    router.push(_displayTabs[0].to)
  } else {
    router.push({ name: 'TopologyDisplay', params: { nodeId: node.id } })
  }
})
</script>
