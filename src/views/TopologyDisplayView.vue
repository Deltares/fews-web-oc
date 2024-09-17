<template>
  <Teleport to="#web-oc-sidebar-target">
    <HierarchicalMenu
      v-model:active="active"
      v-model:open="open"
      :type="menuType"
      :items="items"
    />
  </Teleport>
  <Teleport to="#web-oc-toolbar-target" v-if="showWorkflowsControl">
    <WorkflowsControl
      :disabled="secondaryWorkflows === null"
      :secondaryWorkflows="secondaryWorkflows"
    />
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
          <template v-for="item in nodeButtons">
            <v-list-item
              v-if="item.href"
              :href="item.href"
              :target="item.href ? '_blank' : undefined"
            >
              {{ item.name }}
              <template v-slot:append>
                <v-icon size="xsmall">{{ item.icon }}</v-icon>
              </template>
            </v-list-item>
            <v-list-item
              v-else
              :to="item.to"
              @click="activeParentId = item.name"
            >
              {{ item.name }}
              <template v-slot:append>
                <v-icon v-if="item.icon" size="xsmall">{{ item.icon }}</v-icon>
                <ThresholdInformation
                  :icon="item.thresholdIcon"
                  :count="item.thresholdCount"
                />
              </template>
            </v-list-item>
          </template>
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
      >
        <v-btn
          v-for="item in nodeButtons"
          :key="item.id"
          :to="item.to"
          @click="activeParentId = item.name"
        >
          {{ item.name }}
          <template v-slot:append>
            <v-icon v-if="item.icon" size="xsmall">{{ item.icon }}</v-icon>
            <ThresholdInformation
              :icon="item.thresholdIcon"
              :count="item.thresholdCount"
            />
          </template>
        </v-btn>
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
        :value="tab.type"
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
      <component
        :is="Component"
        :filter-ids="filterIds"
        :topologyNode="topologyNode"
      />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
import HierarchicalMenu from '@/components/general/HierarchicalMenu.vue'
import WorkflowsControl from '@/components/workflows/WorkflowsControl.vue'
import ThresholdInformation from '@/components/general/ThresholdInformation.vue'

import type { ColumnItem } from '@/components/general/ColumnItem'
import { createTopologyMap, getTopologyNodes } from '@/lib/topology'
import { useConfigStore } from '@/stores/config'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useWorkflowsStore } from '@/stores/workflows'

import type { TopologyNode } from '@deltares/fews-pi-requests'
import type { WebOcTopologyDisplayConfig } from '@deltares/fews-pi-requests'

import { computed, ref, watch, watchEffect } from 'vue'
import {
  type RouteLocationNamedRaw,
  onBeforeRouteUpdate,
  RouteLocationNormalized,
  useRoute,
  useRouter,
} from 'vue-router'
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'

interface Props {
  nodeId?: string | string[]
  layerName?: string
  locationId?: string
  latitude?: string
  longitude?: string
}

interface DisplayTab {
  type: 'charts' | 'map' | 'reports'
  id: string
  title: string
  href?: string
  target?: string
  to: RouteLocationNamedRaw
  icon: string
}

const props = defineProps<Props>()

const configStore = useConfigStore()
const settings = useUserSettingsStore()
const workflowsStore = useWorkflowsStore()

const menuType = computed(() => {
  const configured = settings.get('ui.hierarchical-menu-style')?.value as string
  return configured ?? 'auto'
})

const active = ref<string | undefined>(undefined)
watch(active, () => {
  // Clear the bounding box and stop drawing when we switch nodes while selecting a bounding box.
  workflowsStore.boundingBox = null
  workflowsStore.isDrawingBoundingBox = false
})
const activeNode = computed(() => {
  if (!active.value) return

  const node = topologyMap.value.get(active.value)
  return node?.topologyNodes
    ? node?.topologyNodes[activeParentNode.value]
    : node
})
const secondaryWorkflows = computed(() => {
  if (!activeNode.value?.secondaryWorkflows) return null
  return activeNode.value.secondaryWorkflows
})
const open = ref<string[]>([])
const items = ref<ColumnItem[]>([])

const filterIds = ref<string[]>([])
const topologyNode = ref<TopologyNode | undefined>(undefined)

const activeTab = ref('')
const displayTabs = ref<DisplayTab[]>([])

const activeParentNode = ref(0)
const nodeButtons = ref<any[]>([])
const activeParentId = ref('')

const externalLink = ref<string | undefined>('')

const route = useRoute()
const router = useRouter()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { thresholds } = useTopologyThresholds(baseUrl)

watch(
  () => props.nodeId,
  () => {
    if (props.nodeId) {
      if (typeof props.nodeId === 'string' && active.value !== props.nodeId) {
        active.value = props.nodeId
      } else if (
        Array.isArray(props.nodeId) &&
        active.value !== props.nodeId[0]
      ) {
        active.value = props.nodeId[0]
      }
    }
  },
  { immediate: true },
)

const topologyComponentConfig = computed(() => {
  return configStore.getComponentByType('TopologyDisplay') as
    | WebOcTopologyDisplayConfig
    | undefined
})

const showLeafsAsButton = computed(() => {
  return topologyComponentConfig.value?.showLeafNodesAsButtons ?? false
})

const showWorkflowsControl = computed(() => {
  return topologyComponentConfig.value?.enableTaskRuns ?? false
})

const showActiveThresholdCrossingsForFilters = computed(() => {
  return (
    topologyComponentConfig.value?.showActiveThresholdCrossingsForFilters ??
    false
  )
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
  if (
    node.filterIds !== undefined &&
    node.filterIds.length == 1 &&
    node.dataDownloadDisplay !== undefined
  )
    return true
  if (node.plotId != undefined && node.locationIds != undefined) return true
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
        thresholdIcon: getThresholdIcon(node),
        thresholdCount: getThresholdCount(node),
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
        thresholdIcon: getThresholdIcon(n),
        thresholdCount: getThresholdCount(n),
      }
      const href = getUrl(n)
      if (href) {
        result.href = href
      } else {
        result.to = {
          name: 'TopologyDisplay',
          params: {
            nodeId: [node.id, n.id],
          },
        }
      }
      return result
    })
}

function getIcon(node: TopologyNode): string | undefined {
  if (node.url && node.topologyNodes && !node.displayGroups)
    return 'mdi-open-in-new'
  return undefined
}

function getUrl(node: TopologyNode): string | undefined {
  if (node.url && node.topologyNodes && !node.displayGroups) return node.url
  return undefined
}

function getThresholdIcon(node: TopologyNode): string | undefined {
  return thresholds.value?.find((t) => t.id === node.id)?.topologyLocationIcon
}

function getThresholdCount(node: TopologyNode): number | undefined {
  if (!showActiveThresholdCrossingsForFilters.value) return undefined

  return thresholds.value?.find((t) => t.id === node.id)?.filterLocationsCount
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
    leafNode.displayId !== undefined ||
    (leafNode.plotId != undefined && leafNode.locationIds != undefined)
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
  if (
    leafNode.filterIds !== undefined &&
    leafNode.filterIds.length == 1 &&
    leafNode.dataDownloadDisplay !== undefined
  ) {
    _displayTabs.push({
      type: 'charts',
      id: timeseriesTabId,
      title: 'Download',
      to: {
        name: 'TopologyDataDownload',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
        },
      },
      icon: 'mdi-download',
    })
  }
  if (leafNode.reportDisplay?.reports.length) {
    _displayTabs.push({
      type: 'reports',
      id: timeseriesTabId,
      title: 'Reports',
      to: {
        name: 'TopologyReports',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
        },
      },
      icon: 'mdi-file-document',
    })
  }
  return _displayTabs
}

watch(nodes, updateItems)
watch(thresholds, updateItems)

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
  filterIds.value = node.filterIds ?? []
  topologyNode.value = node

  if (showLeafsAsButton.value && Array.isArray(props.nodeId)) {
    const menuNodeId = props.nodeId[0]
    const menuNode = topologyMap.value.get(menuNodeId) as any
    nodeButtons.value = nodeButtonItems(menuNode)
    if (!activeParentId.value && nodeButtons.value.length > 0) {
      activeParentId.value = nodeButtons.value[0].name
    }
  }

  // Create the displayTabs for the active node.
  if (node === undefined) return
  const _displayTabs = displayTabsForNode(node, parentNodeIdNodeId)
  displayTabs.value = _displayTabs

  externalLink.value = node.url
})

onBeforeRouteUpdate(reroute)

function reroute(to: RouteLocationNormalized) {
  if (!to.params.nodeId) {
    if (topologyMap.value.size === 0) return
    const topologyEntry = topologyMap.value.entries().next()
    if (topologyEntry.value) {
      to.params.nodeId = topologyEntry.value[0]
      return to
    }
    return
  }
  if (
    showLeafsAsButton.value &&
    (typeof to.params.nodeId === 'string' ||
      (Array.isArray(to.params.nodeId) && to.params.nodeId.length === 1))
  ) {
    const parentNodeId = Array.isArray(to.params.nodeId)
      ? to.params.nodeId[0]
      : to.params.nodeId
    const menuNode = topologyMap.value.get(parentNodeId) as any
    if (menuNode === undefined) return
    if (menuNode.topologyNodes === undefined) {
      const leafNodeId = parentNodeId
      const parentNode = [...topologyMap.value?.values()].find((p) => {
        return p.topologyNodes?.map((c) => c.id).includes(leafNodeId)
      })
      if (parentNode?.id === undefined) return
      const to = {
        name: 'TopologyDisplay',
        params: {
          nodeId: [parentNode?.id, leafNodeId],
        },
      }
      return to
    }
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
    if (to.name === 'TopologyDisplay') {
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
      const tabs = displayTabsForNode(menuNode as any, parentNodeId)
      let tabIndex = -1
      if (activeTab.value) {
        tabIndex = tabs.findIndex((t) => {
          return t.type === activeTab.value
        })
      }
      if (tabIndex < 0) {
        tabIndex = 0
        activeTab.value = tabs[tabIndex].type
      }
      return tabs[tabIndex].to
    }
  }
}
</script>

<style scoped>
.v-btn-group {
  color: inherit;
}
</style>
