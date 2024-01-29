<template>
  <Teleport to="#web-oc-sidebar-target">
    <v-toolbar v-if="!mobile" density="compact">
      <v-btn-toggle
        v-model="menuType"
        variant="tonal"
        divided
        density="compact"
        class="ma-2"
      >
        <v-btn variant="text" value="treemenu">
          <v-icon>mdi-file-tree</v-icon>
        </v-btn>
        <v-btn variant="text" value="columnmenu">
          <v-icon>mdi-view-week</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-toolbar>
    <TreeMenu
      v-if="menuType === 'treemenu' && !mobile"
      v-model:active="active"
      :items="items"
      :open="open"
    >
    </TreeMenu>
    <ColumnMenu
      v-else-if="menuType === 'columnmenu' || mobile"
      v-model:active="active"
      :items="items"
      :open="open"
    >
    </ColumnMenu>
  </Teleport>
  <Teleport to="#app-bar-content">
    <template v-if="showLeafsAsButton">
      <v-menu v-if="nodeButtons.length > 4">
        <template v-slot:activator="{ props }">
          <v-btn variant="tonal" class="ma-2" v-bind="props">
            {{ activeParentId }}
            <v-icon end> mdi-menu-down </v-icon>
          </v-btn>
        </template>

        <v-list class="bg-grey-lighten-3">
          <v-list-item
            v-for="item in nodeButtons"
            :to="item.to"
            @click="activeParentId = item.name"
          >
            {{ item.name }}
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn-toggle
        v-else
        v-model="activeParentNode"
        variant="tonal"
        divided
        density="compact"
        mandatory
        class="ma-2"
        ><v-btn
          v-for="item in nodeButtons"
          :to="item.to"
          @click="activeParentId = item.name"
          >{{ item.name }}</v-btn
        >
      </v-btn-toggle>
    </template>
    <v-btn-toggle
      v-if="displayTabs.length > 1"
      v-model="activeTab"
      variant="tonal"
      divided
      density="compact"
      class="ma-2"
    >
      <v-btn
        v-for="tab in displayTabs"
        :key="tab.id"
        :href="tab.href"
        :target="tab.target"
        :to="tab.to"
        class="text-capitalize"
      >
        <v-icon>{{ tab.icon }}</v-icon>
        {{ tab.title }}
      </v-btn>
    </v-btn-toggle>
    <v-btn
      v-if="externalLink"
      :href="externalLink"
      target="_blank"
      variant="text"
      class="flex-0-0 align-self-center text-capitalize"
      ><v-icon>mdi-open-in-new</v-icon>Link</v-btn
    >
  </Teleport>
  <router-view v-slot="{ Component }">
    <keep-alive include="SpatialDisplay">
      <component :is="Component" :filter-ids="filterIds" />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
import type { ColumnItem } from '@/components/general/ColumnItem'
import ColumnMenu from '@/components/general/ColumnMenu.vue'
import TreeMenu from '@/components/general/TreeMenu.vue'
import { createTopologyMap, getTopologyNodes } from '@/lib/topology'
import { useConfigStore } from '@/stores/config'

import type { TopologyNode } from '@deltares/fews-pi-requests'
import { watchEffect } from 'vue'
import { computed } from 'vue'
import { ref, watch } from 'vue'
import {
  type RouteLocationNamedRaw,
  onBeforeRouteUpdate,
  RouteLocationNormalized,
  useRoute,
  useRouter,
} from 'vue-router'
import { useDisplay } from 'vuetify'

interface Props {
  nodeId?: string | string[]
  layerName?: string
  locationId?: string
  latitude?: string
  longitude?: string
}

interface DisplayTab {
  type: string
  id: string
  title: string
  href?: string
  target?: string
  to: RouteLocationNamedRaw
  icon: string
}

const props = defineProps<Props>()

const configStore = useConfigStore()
const { mobile } = useDisplay()

const active = ref<string[]>([])
const open = ref<string[]>([])
const items = ref<ColumnItem[]>([])
const menuType = ref('treemenu')

const filterIds = ref<string[]>([])

const activeTab = ref(0)
const activeTabType = ref('')
const displayTabs = ref<DisplayTab[]>([])

const activeParentNode = ref(0)
const nodeButtons = ref<any[]>([])
const activeParentId = ref('')

const externalLink = ref<string>('')

const route = useRoute()
const router = useRouter()

watch(
  () => props.nodeId,
  () => {
    if (props.nodeId) {
      if (
        typeof props.nodeId === 'string' &&
        active.value[0] !== props.nodeId
      ) {
        active.value = [props.nodeId]
      } else if (active.value[0] !== props.nodeId[0]) {
        active.value = [props.nodeId[0]]
      }
    }
  },
  { immediate: true },
)

const showLeafsAsButton = computed(() => {
  const component = configStore.getComponentByType('TopologyDisplay')
  return component?.showLeafNodesAsButtons ?? false
})

const nodes = ref<TopologyNode[]>()
const topologyMap = ref(new Map<string, TopologyNode>())

getTopologyNodes().then((response) => {
  nodes.value = response
  topologyMap.value = createTopologyMap(nodes.value)
  const to = reroute(route)
  if (to) {
    router.push(to)
  }
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

function recursiveUpdateNode(nodes: TopologyNode[], skipLeaves = false) {
  return nodes
    .filter((node) => topologyNodeIsVisible(node))
    .map((node) => {
      const result: ColumnItem = {
        id: node.id,
        name: node.name,
        icon: getIcon(node),
        href: getUrl(node),
        to: {
          name: 'TopologyDisplay',
          params: {
            nodeId: node.id,
          },
        },
      }
      if (node.topologyNodes) {
        const items = recursiveUpdateNode(node.topologyNodes, skipLeaves)
        if (skipLeaves) {
          const itemsWithChildren = items.filter((i) => i.children)
          result.children = itemsWithChildren
        } else {
          result.children = items
        }
      }
      return result
    })
}

function nodeButtonItems(node: TopologyNode) {
  if (node.topologyNodes === undefined) return []
  return node.topologyNodes
    .filter((n) => topologyNodeIsVisible(n))
    .map((n) => {
      const result: ColumnItem = {
        id: n.id,
        name: n.name,
        icon: getIcon(n),
        to: {
          name: 'TopologyDisplay',
          params: {
            nodeId: [node.id, n.id],
          },
        },
      }
      return result
    })
}

function getIcon(node: TopologyNode): string | undefined {
  if (node.url && !node.topologyNodes && !node.displayGroups)
    return 'mdi-open-in-new'
  return undefined
}

function getUrl(node: TopologyNode): string | undefined {
  if (node.url && !node.topologyNodes && !node.displayGroups) return node.url
  return undefined
}

function updateItems(): void {
  if (nodes.value) {
    items.value = recursiveUpdateNode(nodes.value, showLeafsAsButton.value)
  }
}

function displayTabsForNode(leafNode: TopologyNode, parentNodeId?: string) {
  const activeNodeId = leafNode.id
  const timeseriesTabId = `${activeNodeId}-timeseries`
  const spatialTabId = `${activeNodeId}-spatial`
  const _displayTabs: DisplayTab[] = []
  if (
    leafNode.gridDisplaySelection !== undefined ||
    leafNode.filterIds !== undefined
  ) {
    _displayTabs.push({
      type: 'map',
      id: spatialTabId,
      title: 'Map',
      to: {
        name: 'TopologySpatialDisplay',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
          layerName: leafNode.gridDisplaySelection?.plotId,
        },
      },
      icon: 'mdi-map',
    })
  }
  if (
    leafNode.displayGroups !== undefined ||
    leafNode.displayId !== undefined
  ) {
    _displayTabs.push({
      type: 'charts',
      id: timeseriesTabId,
      title: 'Charts',
      to: {
        name: 'TopologyTimeSeries',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
        },
      },
      icon: 'mdi-chart-multiple',
    })
  }
  return _displayTabs
}

watch(nodes, updateItems)

// Update the displayTabs if the active node changes (or if the topologyMap changes).
// Redirect to the corresponding display of the updated active tab.
watchEffect(() => {
  // Check if the current displayTab already matches the active node.
  if (!props.nodeId) return
  const activeNodeId = Array.isArray(props.nodeId)
    ? props.nodeId.length > 1
      ? props.nodeId[props.nodeId.length - 1]
      : props.nodeId[0]
    : props.nodeId

  const parentNodeIdNodeId = Array.isArray(props.nodeId)
    ? props.nodeId[0]
    : undefined

  // Check if the active node is a leaf.
  const node = topologyMap.value.get(activeNodeId)
  if (node === undefined) {
    filterIds.value = []
    return
  }
  if (node.filterIds) {
    filterIds.value = node.filterIds
  }
  if (showLeafsAsButton.value && Array.isArray(props.nodeId)) {
    const menuNodeId = props.nodeId[0]
    const menuNode = topologyMap.value.get(menuNodeId) as any
    nodeButtons.value = nodeButtonItems(menuNode)
  }

  // Create the displayTabs for the active node.
  if (node === undefined) return
  const _displayTabs = displayTabsForNode(node, parentNodeIdNodeId)
  displayTabs.value = _displayTabs

  if (node.url !== undefined) {
    externalLink.value = node.url
  }
})

onBeforeRouteUpdate(reroute)

function reroute(to: RouteLocationNormalized) {
  if (!to.params.nodeId) {
    if (topologyMap.value.size === 0) return
    const parentNodeId = topologyMap.value.entries().next().value[0]
    to.params.nodeId = parentNodeId
    return to
  }
  if (
    (showLeafsAsButton.value && typeof to.params.nodeId === 'string') ||
    (Array.isArray(to.params.nodeId) && to.params.nodeId.length === 1)
  ) {
    const parentNodeId = Array.isArray(to.params.nodeId)
      ? to.params.nodeId[0]
      : to.params.nodeId
    const menuNode = topologyMap.value.get(parentNodeId) as any
    if (to.name === 'TopologyDisplay') {
      const sources = nodeButtonItems(menuNode)
      if (activeParentId.value) {
        const sourceIndex = sources.findIndex((source) => {
          return source.name === activeParentId.value
        })
        if (sourceIndex > -1) {
          activeParentNode.value = sourceIndex
          activeParentId.value = sources[sourceIndex].name
          return sources[sourceIndex].to
        }
      }
      activeParentNode.value = 0
      activeParentId.value = sources[0].name
      return sources[0].to
    }
  } else {
    const leafNodeId = Array.isArray(to.params.nodeId)
      ? to.params.nodeId.length > 1
        ? to.params.nodeId[to.params.nodeId.length - 1]
        : to.params.nodeId[0]
      : to.params.nodeId
    const parentNodeId =
      Array.isArray(to.params.nodeId) && to.params.nodeId.length > 1
        ? to.params.nodeId[0]
        : undefined
    const menuNode = topologyMap.value.get(leafNodeId)
    if (to.name === 'TopologyDisplay') {
      const tabs = displayTabsForNode(menuNode as any, parentNodeId)
      if (activeTabType.value) {
        const tabIndex = tabs.findIndex((t) => {
          return t.type === activeTabType.value
        })
        if (tabIndex > -1) {
          activeTab.value = tabIndex
          activeTabType.value = tabs[tabIndex].type
          return tabs[tabIndex].to
        }
      }
      console.log(tabs)
      activeTab.value = 0
      activeTabType.value = tabs[0].type
      return tabs[0].to
    }
  }
}
</script>

<style scoped>
.v-btn-group {
  color: inherit;
}
</style>
