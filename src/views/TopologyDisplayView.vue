<template>
  <Teleport to="#web-oc-sidebar-target">
    <HierarchicalMenu v-model:active="active" :type="menuType" :items="items" />
  </Teleport>
  <WorkflowsControl
    v-model:showDialog="workflowsStore.showDialog"
    :secondaryWorkflows="secondaryWorkflows"
  />
  <Teleport to="#app-bar-content-start">
    <LeafNodeButtons
      v-if="nodesStore.nodeButtons.length > 0"
      v-model:activeNodeId="nodesStore.activeNodeId"
      :items="nodesStore.nodeButtons"
      variant="tonal"
    />
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
    <ThresholdPanel :nodeId="topologyNode?.id"></ThresholdPanel>
    <v-menu bottom left>
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-dots-horizontal-circle-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          title="Run tasks..."
          :disabled="secondaryWorkflows === null"
          @click="workflowsStore.showDialog = true"
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
          title="More Info"
          prepend-icon="mdi-information"
          :disabled="!topologyNode?.documentFile"
          @click="showInformationDisplay = true"
        />
      </v-list>
    </v-menu>
    <TaskRunsControl v-if="showTaskMenu" :topologyNode="topologyNode" />
  </Teleport>
  <div class="d-flex w-100 h-100">
    <router-view v-slot="{ Component }">
      <keep-alive include="SpatialDisplay">
        <component
          :is="Component"
          :topologyNode="topologyNode"
          :settings="componentSettings"
          @navigate="onNavigate"
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
import ThresholdPanel from '@/components/general/ThresholdPanel.vue'

import type { ColumnItem } from '@/components/general/ColumnItem'
import { useConfigStore } from '@/stores/config'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useWorkflowsStore } from '@/stores/workflows'

import type { TopologyNode } from '@deltares/fews-pi-requests'
import type { WebOcTopologyDisplayConfig } from '@deltares/fews-pi-requests'

import { computed, onUnmounted, ref, StyleValue, watch, watchEffect } from 'vue'
import {
  onBeforeRouteUpdate,
  RouteLocationNormalized,
  useRoute,
  useRouter,
} from 'vue-router'
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import InformationDisplayView from '@/views/InformationDisplayView.vue'
import TaskRunsControl from '@/components/tasks/TaskRunsControl.vue'
import { useDisplay } from 'vuetify'
import { useNodesStore } from '@/stores/nodes'
import { nodeButtonItems, recursiveUpdateNode } from '@/lib/topology/nodes'
import {
  displayTabsForNode,
  type DisplayTab,
} from '@/lib/topology/displayTabs.js'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import { useComponentSettings } from '@/services/useComponentSettings'
import { useAvailableWorkflowsStore } from '@/stores/availableWorkflows'
import { useTaskRunsStore } from '@/stores/taskRuns'
import type { NavigateRoute } from '@/lib/router'

interface Props {
  topologyId?: string
  nodeId?: string | string[]
  panelId?: string
  layerName?: string
  locationIds?: string
  latitude?: string
  longitude?: string
}

const props = defineProps<Props>()

const configStore = useConfigStore()
const settings = useUserSettingsStore()
const workflowsStore = useWorkflowsStore()
const availableWorkflowsStore = useAvailableWorkflowsStore()
const taskRunsStore = useTaskRunsStore()

const menuType = computed(() => {
  const configured = settings.get('ui.hierarchical-menu-style')?.value as string
  return configured ?? 'auto'
})

const showTaskMenu = computed(() => configStore.general.taskMenu?.enabled)

const active = ref<string | undefined>(undefined)
watch(active, () => {
  // Clear the bounding box and stop drawing when we switch nodes while selecting a bounding box.
  workflowsStore.boundingBox = null
  workflowsStore.isDrawingBoundingBox = false
  workflowsStore.coordinate = null
  workflowsStore.isSelectingCoordinate = false

  taskRunsStore.clearSelectedTaskRuns()
})

const activeNode = computed(() => {
  if (!active.value) return

  const node = topologyNodesStore.getNodeById(active.value)
  if (node?.topologyNodes) {
    const leafNode = node.topologyNodes.find(
      (n) => n.id === nodesStore.activeNodeId,
    )
    return leafNode
  }
  return node
})
// Clear the preferred workflow IDs when we unmount.
onUnmounted(() => availableWorkflowsStore.clearPreferredWorkflowIds())

const secondaryWorkflows = computed(() => {
  if (!activeNode.value?.secondaryWorkflows) return null
  return activeNode.value.secondaryWorkflows
})

const items = ref<ColumnItem[]>([])

const topologyNode = ref<TopologyNode | undefined>(undefined)

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
  const component = props.topologyId
    ? configStore.getComponentById(props.topologyId)
    : configStore.getComponentByType('TopologyDisplay')
  return component as WebOcTopologyDisplayConfig | undefined
})

const topologyDisplayNodes = computed<string[] | undefined>(() => {
  // FIXME: Update when the types are updated
  // @ts-expect-error
  return topologyComponentConfig.value?.topologyDisplayNodes
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

const topologyNodesStore = useTopologyNodesStore()
topologyNodesStore
  .fetch()
  .catch(() => console.error('Failed to fetch topology nodes'))

const subNodes = computed(() =>
  topologyNodesStore.getSubNodesForIds(topologyDisplayNodes.value),
)
watch(
  () => topologyNodesStore.nodes,
  () => {
    const to = reroute(route)
    if (to) router.push(to)
  },
)

function updateItems(): void {
  if (subNodes.value) {
    items.value = recursiveUpdateNode(
      subNodes.value,
      thresholds.value,
      showActiveThresholdCrossingsForFilters.value,
      showLeafsAsButton.value,
    )
  }
}

watch(subNodes, updateItems)
watch(thresholds, updateItems)

const { componentSettings } = useComponentSettings(baseUrl, () => [
  // @ts-expect-error FIXME: Update when the types are updated
  topologyComponentConfig.value?.componentSettingsId,
  // @ts-expect-error FIXME: Update when the types are updated
  topologyNode.value?.componentSettingsId,
])

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

  const parentNodeIdNodeId =
    Array.isArray(props.nodeId) && props.nodeId.length > 1
      ? props.nodeId[0]
      : undefined

  // Check if the active node is a leaf.
  const node = topologyNodesStore.getNodeById(activeNodeId)
  if (node === undefined) {
    return
  }
  topologyNode.value = node

  if (showLeafsAsButton.value && Array.isArray(props.nodeId)) {
    const menuNodeId = props.nodeId[0]
    const menuNode = topologyNodesStore.getNodeById(menuNodeId)
    if (!menuNode) return
    nodesStore.setNodeButtons(
      nodeButtonItems(
        menuNode,
        thresholds.value,
        showActiveThresholdCrossingsForFilters.value,
      ),
    )
    nodesStore.activeNodeId = props.nodeId[1]
  }

  // Create the displayTabs for the active node.
  displayTabs.value = displayTabsForNode(node, parentNodeIdNodeId)

  externalLink.value = node.url
})

function onNavigate(to: NavigateRoute) {
  const name = `Topology${String(to.name)}`

  switch (to.name) {
    case 'SpatialTimeSeriesDisplay':
      router.push({
        name,
        params: {
          nodeId: props.nodeId,
          layerName: props.layerName,
          locationIds: to.params?.locationIds,
        },
        query: route.query,
      })
      break
    case 'SpatialTimeSeriesDisplayWithCoordinates':
      router.push({
        name,
        params: {
          nodeId: props.nodeId,
          layerName: props.layerName,
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
          layerName: props.layerName,
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

function reroute(to: RouteLocationNormalized, from?: RouteLocationNormalized) {
  if (!to.params.nodeId) {
    const firstSubNodeId = subNodes.value[0].id
    if (firstSubNodeId) {
      to.params.nodeId = firstSubNodeId
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
    const menuNode = topologyNodesStore.getNodeById(parentNodeId)
    if (menuNode === undefined) return
    if (menuNode.topologyNodes === undefined) {
      const leafNodeId = parentNodeId
      const parentNode = topologyNodesStore.getParentNodeById(leafNodeId)
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
      const menuNode = topologyNodesStore.getNodeById(leafNodeId)
      if (!menuNode) return

      const topologyId = to.params.topologyId as string
      const tabs = displayTabsForNode(menuNode, parentNodeId, topologyId, from)
      const tab = tabs.find((t) => t.to.name === from?.name) ?? tabs[0]
      if (tab) {
        return tab.to
      }
    }
  }
}
</script>

<style scoped>
.v-btn-group {
  color: inherit;
}
</style>
