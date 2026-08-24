<template>
  <Teleport v-if="hasSideBar" to="#web-oc-sidebar-target">
    <TopologySidebar
      :nodeId="nodeId"
      :topologyId="topologyId"
      :topologyNode="topologyNode"
      :showActiveThresholdCrossingsForFilters="
        showActiveThresholdCrossingsForFilters
      "
      :thresholds="thresholds"
      :subNodes="subNodes"
      :showLeafNodesAsButton="showLeafsAsButton"
    />
  </Teleport>

  <template v-if="hasAppBar">
    <Teleport to="#app-bar-content-start">
      <LeafNodeButtons
        v-if="nodesStore.nodeButtons.length > 0 && showLeafsAsButton"
        v-model:activeNodeId="nodesStore.activeNodeId"
        :items="nodesStore.nodeButtons"
        variant="tonal"
      />
    </Teleport>

    <Teleport to="#app-bar-content-center">
      <DisplayTabs
        :nodeId="nodeId"
        role="tablist"
        aria-label="Node tab selection"
      />
    </Teleport>

    <Teleport to="#app-bar-content-end">
      <TopologySidePanel
        :topologyNode="topologyNode"
        :locationIds="locationIds"
        :showActiveThresholdCrossingsForFilters="
          showActiveThresholdCrossingsForFilters
        "
        @navigate="onNavigate"
      />
    </Teleport>
  </template>

  <div class="d-flex w-100 h-100">
    <router-view v-slot="{ Component }">
      <component
        :is="Component"
        :topologyNode="topologyNode"
        :settings="componentSettings"
        @navigate="onNavigate"
      />
    </router-view>
  </div>
</template>

<script setup lang="ts">
import LeafNodeButtons from '@/components/general/LeafNodeButtons.vue'
import DisplayTabs from '@/components/DisplayTabs.vue'
import TopologySidebar from '@/components/topology/TopologySidebar.vue'
import TopologySidePanel from '@/components/topology/TopologySidePanel.vue'

import { useConfigStore } from '@/stores/config'

import type { WebOcTopologyDisplayConfig } from '@deltares/fews-pi-requests'

import { computed, onUnmounted, watch, watchEffect } from 'vue'
import {
  onBeforeRouteUpdate,
  RouteLocationNormalized,
  useRoute,
  useRouter,
} from 'vue-router'
import { configManager } from '@/services/application-config'
import { displayTabsForNode } from '@/lib/topology/displayTabs.js'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import { useComponentSettings } from '@/services/useComponentSettings'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import type { NavigateRoute } from '@/lib/router'
import { fetchWmsCapabilitiesHeaders } from '@/lib/capabilities'
import { useNodesStore } from '@/stores/nodes'
import { nodeButtonItems } from '@/lib/topology/nodes'
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { useWarningLevelsStore } from '@/stores/warningLevels'

interface Props {
  topologyId?: string
  nodeId?: string | string[]
  panelId?: string
  layerName?: string
  locationIds?: string
  latitude?: string
  longitude?: string
  productKey?: string
  hasAppBar?: boolean
  hasSideBar?: boolean
  embed?: string
}

const props = withDefaults(defineProps<Props>(), {
  hasAppBar: true,
  hasSideBar: true,
})

const route = useRoute()
const router = useRouter()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { thresholds } = useTopologyThresholds(baseUrl)

const configStore = useConfigStore()
const availableWorkflowsStore = useAvailableWorkflowsStore()
const warningLevelsStore = useWarningLevelsStore()
const nodesStore = useNodesStore()
const topologyNodesStore = useTopologyNodesStore()

topologyNodesStore
  .fetch()
  .catch(() => console.error('Failed to fetch topology nodes'))

// Clear the preferred workflow IDs when we unmount.
onUnmounted(() => availableWorkflowsStore.clearPreferredWorkflowIds())

const topologyNode = computed(() => {
  const nodeId = props.nodeId
  if (!nodeId) return

  const id = Array.isArray(nodeId) ? nodeId[nodeId.length - 1] : nodeId
  return topologyNodesStore.getNodeById(id)
})

// Make sure the threshold levels are up to date for the current topology node.
watch(
  () => topologyNode.value?.id,
  (newId) => {
    if (!newId) return

    warningLevelsStore.setTopologyNodeId(newId)
    warningLevelsStore.selectedWarningLevelIds = []
  },
  { immediate: true },
)

const topologyComponentConfig = computed(() =>
  getComponentConfig(props.topologyId),
)

const topologyDisplayNodes = computed<string[] | undefined>(() => {
  // FIXME: Update when the types are updated
  // @ts-expect-error
  return topologyComponentConfig.value?.topologyDisplayNodes
})

const showLeafsAsButton = computed(
  () => topologyComponentConfig.value?.showLeafNodesAsButtons ?? false,
)

const showActiveThresholdCrossingsForFilters = computed(
  () =>
    topologyComponentConfig.value?.showActiveThresholdCrossingsForFilters ??
    false,
)

// Pre-fetch WMS capabilities headers for better performance later on.
fetchWmsCapabilitiesHeaders()

const subNodes = computed(() =>
  topologyNodesStore.getSubNodesForIds(topologyDisplayNodes.value),
)
watch(
  () => topologyNodesStore.nodes,
  async () => {
    const to = await reroute(route)
    if (to) router.push(to)
  },
)

function getComponentConfig(topologyId?: string) {
  const component = topologyId
    ? configStore.getComponentById(topologyId)
    : undefined
  const config = component as WebOcTopologyDisplayConfig | undefined
  return config ?? configStore.getComponentByType('TopologyDisplay')
}

const { componentSettings } = useComponentSettings(baseUrl, () => [
  // @ts-expect-error FIXME: Update when the types are updated
  topologyComponentConfig.value?.componentSettingsId,
  topologyNode.value?.componentSettingsId,
])

watchEffect(() => {
  if (showLeafsAsButton.value && Array.isArray(props.nodeId)) {
    const menuNodeId = props.nodeId[0]
    const menuNode = topologyNodesStore.getNodeById(menuNodeId)
    if (!menuNode) return
    nodesStore.setNodeButtons(
      nodeButtonItems(
        menuNode,
        props.topologyId,
        thresholds.value,
        showActiveThresholdCrossingsForFilters.value,
      ),
    )
    nodesStore.activeNodeId = props.nodeId[1]
  }
})

function onNavigate(to: NavigateRoute) {
  const name = `Topology${String(to.name)}`
  const layerName = to.params?.layerName ?? props.layerName

  switch (to.name) {
    case 'SpatialDisplayWithLocation':
      router.push({
        name,
        params: {
          nodeId: props.nodeId,
          layerName,
          locationIds: to.params?.locationIds,
        },
        query: route.query,
      })
      break
    case 'SpatialDisplayWithCoordinates':
      router.push({
        name,
        params: {
          nodeId: props.nodeId,
          layerName,
          latitude: to.params?.latitude,
          longitude: to.params?.longitude,
        },
        query: route.query,
      })
      break
    case 'SpatialDisplay':
      router.push({
        name,
        params: {
          nodeId: props.nodeId,
          layerName,
        },
        query: route.query,
      })
      break
    case 'SSDTimeSeriesDisplay':
    case 'SchematicStatusDisplay':
      router.push({
        name,
        params: { ...to.params },
        query: route.query,
      })
      break
    default:
      console.warn(`Unknown route name: ${String(to.name)}`)
  }
}

onBeforeRouteUpdate(reroute)

async function reroute(
  to: RouteLocationNormalized,
  from?: RouteLocationNormalized,
) {
  if (!to.params.nodeId) {
    const firstSubNodeId = topologyNodesStore.getFirstLeafNodeForId(
      subNodes.value[0].id,
    )?.id
    if (firstSubNodeId) {
      to.params.nodeId = firstSubNodeId
      return reroute(to, from)
    }
    return
  }

  if (to.name !== 'TopologyDisplay') return

  const topologyId = to.params.topologyId as string | undefined
  const nodeId = Array.isArray(to.params.nodeId)
    ? to.params.nodeId[to.params.nodeId.length - 1]
    : to.params.nodeId
  const node = topologyNodesStore.getNodeById(nodeId)
  if (!node) return

  const parentNode = topologyNodesStore.getParentNodeById(nodeId)
  const parentNodeId = parentNode?.id

  const componentConfig = getComponentConfig(topologyId)

  const showLeafNodesAsButtons =
    componentConfig?.showLeafNodesAsButtons ?? false
  const hasOneNodeId =
    typeof to.params.nodeId === 'string' ||
    (Array.isArray(to.params.nodeId) && to.params.nodeId.length === 1)

  if (showLeafNodesAsButtons && hasOneNodeId) {
    if (node.topologyNodes === undefined && parentNodeId) {
      return {
        name: 'TopologyDisplay',
        params: {
          nodeId: [parentNodeId, nodeId],
          topologyId,
        },
      }
    } else {
      return nodesStore.getRouteTarget(
        nodeButtonItems(
          node,
          topologyId,
          thresholds.value,
          showActiveThresholdCrossingsForFilters.value,
        ),
      )
    }
  }

  const tabs = await displayTabsForNode(
    node,
    showLeafNodesAsButtons ? parentNodeId : undefined,
    topologyId,
    from,
  )
  const tab = tabs.find((t) => t.to.name === from?.name) ?? tabs[0]
  return tab?.to
}
</script>
