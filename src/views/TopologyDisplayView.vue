<template>
  <Teleport to="#web-oc-sidebar-target">
    <HierarchicalMenu
      v-model:active="active"
      v-model:open="open"
      :type="menuType"
      :items="items"
    />
  </Teleport>
  <WorkflowsControl
    v-if="showWorkFlowDialog"
    v-model:showDialog="showWorkFlowDialog"
    :secondaryWorkflows="secondaryWorkflows"
  />
  <Teleport to="#app-bar-content-start">
    <LeafNodeButtons
      v-if="nodesStore.nodeButtons.length > 0"
      v-model:activeParentId="nodesStore.activeParentId"
      v-model:activeParentNode="nodesStore.activeParentNode"
      v-model:nodeButtons="nodesStore.nodeButtons"
      variant="tonal"
    />
    <!-- TODO: Should this be a display tab maybe? -->
    <v-btn
      v-if="externalLink"
      :href="externalLink"
      target="_blank"
      variant="text"
      class="text-capitalize"
    >
      <v-icon>mdi-open-in-new</v-icon>Link
    </v-btn>
  </Teleport>
  <Teleport to="#app-bar-content-center">
    <v-toolbar-items v-if="displayTabs.length > 1">
      <v-btn
        variant="text"
        v-for="tab in displayTabs"
        :key="tab.id"
        :value="tab.type"
        :href="tab.href"
        :target="tab.target"
        :to="tab.to"
      >
        <v-icon>{{ tab.icon }}</v-icon>
      </v-btn>
    </v-toolbar-items>
  </Teleport>
  <Teleport to="#app-bar-content-end">
    <v-menu bottom left>
      <template v-slot:activator="{ props }">
        <v-btn icon variant="plain" v-bind="props">
          <v-icon>mdi-dots-horizontal-circle-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          title="Run workflow"
          :disabled="secondaryWorkflows === null"
          @click="showWorkFlowDialog = true"
        >
          <template #prepend>
            <v-badge
              :model-value="workflowsStore.hasActiveWorkflows"
              :content="workflowsStore.numActiveWorkflows"
              color="success"
            >
              <v-icon>mdi-wrench</v-icon>
            </v-badge>
          </template>
        </v-list-item>
        <v-list-item
          title="Download time series"
          prepend-icon="mdi-download"
          :disabled="downloadDialogStore.disabled"
          @click="downloadDialogStore.showDialog = true"
        />
        <v-list-item
          title="More Info"
          prepend-icon="mdi-information"
          :disabled="!topologyNode?.documentFile"
          @click="showInformationDisplay = true"
        />
      </v-list>
    </v-menu>
  </Teleport>
  <div class="d-flex w-100 h-100">
    <router-view v-slot="{ Component }">
      <keep-alive include="SpatialDisplay">
        <component
          :is="Component"
          :filter-ids="filterIds"
          :topologyNode="topologyNode"
        />
      </keep-alive>
    </router-view>
    <div
      v-if="showInformationDisplay"
      class="w-100 h-100"
      :style="informationDisplayStyle"
    >
      <InformationDisplayView
        :topologyNode="topologyNode"
        @close="showInformationDisplay = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import HierarchicalMenu from '@/components/general/HierarchicalMenu.vue'
import WorkflowsControl from '@/components/workflows/WorkflowsControl.vue'
import LeafNodeButtons from '@/components/general/LeafNodeButtons.vue'

import type { ColumnItem } from '@/components/general/ColumnItem'
import { createTopologyMap, getTopologyNodes } from '@/lib/topology'
import { useConfigStore } from '@/stores/config'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useWorkflowsStore } from '@/stores/workflows'

import type { TopologyNode } from '@deltares/fews-pi-requests'
import type { WebOcTopologyDisplayConfig } from '@deltares/fews-pi-requests'

import { computed, ref, StyleValue, watch, watchEffect } from 'vue'
import {
  type RouteLocationNamedRaw,
  onBeforeRouteUpdate,
  RouteLocationNormalized,
  useRoute,
  useRouter,
} from 'vue-router'
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import InformationDisplayView from '@/views/InformationDisplayView.vue'
import { useDisplay } from 'vuetify'
import { useNodesStore } from '@/stores/nodes'
import { nodeButtonItems, recursiveUpdateNode } from '@/lib/topology/nodes'
import { useDownloadDialogStore } from '@/stores/downloadDialog'

interface Props {
  nodeId?: string | string[]
  panelId?: string
  layerName?: string
  locationId?: string
  latitude?: string
  longitude?: string
}

interface DisplayTab {
  type: 'charts' | 'map' | 'reports' | 'schematic-status-display'
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
const downloadDialogStore = useDownloadDialogStore()

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
    ? node?.topologyNodes[nodesStore.activeParentNode]
    : node
})
const showWorkFlowDialog = ref(false)
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

const nodesStore = useNodesStore()

const externalLink = ref<string | undefined>('')

const { mobile } = useDisplay()
const informationDisplayStyle = computed<StyleValue>(() => {
  return {
    flex: mobile.value ? undefined : '0 0 33%',
    position: mobile.value ? 'fixed' : undefined,
    'z-index': mobile.value ? 999999 : undefined,
    'border-left': mobile.value ? undefined : '1px solid #e0e0e0',
  }
})

const showInformationDisplay = ref(false)
// watchEffect(() => {
//   if (!topologyNode.value?.documentFile) {
//     showInformationDisplay.value = false
//   }
// })

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

function updateItems(): void {
  if (nodes.value) {
    items.value = recursiveUpdateNode(
      nodes.value,
      thresholds.value,
      showActiveThresholdCrossingsForFilters.value,
      showLeafsAsButton.value,
    )
  }
}

function displayTabsForNode(leafNode: TopologyNode, parentNodeId?: string) {
  const activeNodeId = leafNode.id
  const timeseriesTabId = `${activeNodeId}-timeseries`
  const reportsTabId = `${activeNodeId}-reports`
  const spatialTabId = `${activeNodeId}-spatial`
  const ssdTabId = `${activeNodeId}-ssd`
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
      id: reportsTabId,
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
  if (leafNode.scadaPanelId !== undefined) {
    _displayTabs.push({
      type: 'schematic-status-display',
      id: ssdTabId,
      title: 'Schematic',
      to: {
        name: 'TopologySchematicStatusDisplay',
        params: {
          nodeId: parentNodeId ? [parentNodeId, leafNode.id] : leafNode.id,
          panelId: leafNode.scadaPanelId,
        },
      },
      icon: 'mdi-view-dashboard',
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
    nodesStore.setNodeButtons(
      nodeButtonItems(
        menuNode,
        thresholds.value,
        showActiveThresholdCrossingsForFilters.value,
      ),
    )
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
    const menuNode = topologyMap.value.get(parentNodeId) as TopologyNode
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
      return nodesStore.getRouteTarget(
        nodeButtonItems(
          menuNode,
          thresholds.value,
          showActiveThresholdCrossingsForFilters.value,
        ),
      )
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
        activeTab.value = tabs.length ? tabs[0].type : ''
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
