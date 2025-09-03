<template>
  <Teleport to="#web-oc-sidebar-target">
    <HierarchicalMenu v-model:active="active" :type="menuType" :items="items" />
  </Teleport>
  <Teleport to="#app-bar-content-start">
    <LeafNodeButtons
      v-if="nodesStore.nodeButtons.length > 0 && showLeafsAsButton"
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
    <ThresholdsControl
      :topologyNode="topologyNode"
      @navigate="onNavigate"
      :locationIds="props.locationIds"
      v-if="showActiveThresholdCrossingsForFilters"
    />
    <TaskRunsControl
      v-if="secondaryControl === 'tasks' && showTaskMenu"
      :topologyNode="topologyNode"
    />
    <VisualizeDataControl
      v-if="secondaryControl === 'visualize' && showTaskMenu"
      :topologyNode="topologyNode"
    />
    <WorkflowsControl
      v-if="secondaryControl === 'workflows'"
      :secondaryWorkflows="secondaryWorkflows"
    />
    <v-btn
      v-if="secondaryControl === 'info'"
      icon="mdi-information-outline"
      :disabled="!topologyNode?.documentFile"
      :active="sidePanelStore.isActive('info')"
      @click="sidePanelStore.toggleActive('info')"
    />
    <v-menu location="bottom right">
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list>
        <!-- Task Run Overview option -->
        <v-list-item
          v-if="showTaskMenu && secondaryControl !== 'tasks'"
          prepend-icon="mdi-format-list-checks"
          title="Task Overview"
          @click="
            () => {
              activeControl = 'tasks'
              secondaryControl = 'tasks'
              sidePanelStore.setActive('tasks')
            }
          "
        >
          <template #prepend>
            <v-badge
              v-if="workflowsStore.hasActiveWorkflows"
              :content="workflowsStore.numActiveWorkflows"
              color="success"
            >
              <v-icon>mdi-clipboard-text-clock</v-icon>
            </v-badge>
            <v-icon v-else>mdi-clipboard-text-clock</v-icon>
          </template>
        </v-list-item>
        <!-- Visualize Data option -->
        <v-list-item
          v-if="showTaskMenu && secondaryControl !== 'visualize'"
          prepend-icon="mdi-chart-box-multiple"
          title="Non-current Data"
          @click="
            () => {
              activeControl = 'visualize'
              secondaryControl = 'visualize'
              sidePanelStore.setActive('visualize')
            }
          "
        >
        </v-list-item>
        <!-- Run Tasks option (open dialog directly) -->
        <v-list-item
          v-if="secondaryControl !== 'workflows'"
          title="Run Tasks..."
          :disabled="secondaryWorkflows === null"
          @click="
            () => {
              activeControl = 'workflows'
              secondaryControl = 'workflows'
              sidePanelStore.setActive('workflows')
            }
          "
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
        <!-- Info option -->
        <v-list-item
          v-if="secondaryControl !== 'info'"
          prepend-icon="mdi-information-outline"
          title="More Info"
          :disabled="!topologyNode?.documentFile"
          @click="
            () => {
              activeControl = 'info'
              secondaryControl = 'info'
              sidePanelStore.setActive('info')
            }
          "
          :active="activeControl === 'info'"
        />
      </v-list>
    </v-menu>
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
      v-if="sidePanelStore.isActive('info')"
      class="w-100 h-100"
      :style="informationDisplayStyle"
    >
      <InformationDisplayView
        :topologyNode="topologyNode"
        @close="sidePanelStore.close()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import HierarchicalMenu from '@/components/general/HierarchicalMenu.vue'
import WorkflowsControl from '@/components/workflows/WorkflowsControl.vue'
import LeafNodeButtons from '@/components/general/LeafNodeButtons.vue'

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
import ThresholdsControl from '@/components/thresholds/ThresholdsControl.vue'
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
import { useSidePanelStore } from '@/stores/sidePanel'
import VisualizeDataControl from '@/components/tasks/VisualizeDataControl.vue'

interface Props {
  topologyId?: string
  nodeId?: string | string[]
  panelId?: string
  layerName?: string
  locationIds?: string
  latitude?: string
  longitude?: string
  productId?: string
}

const props = defineProps<Props>()

const configStore = useConfigStore()
const settings = useUserSettingsStore()
const workflowsStore = useWorkflowsStore()
const availableWorkflowsStore = useAvailableWorkflowsStore()
const taskRunsStore = useTaskRunsStore()
const sidePanelStore = useSidePanelStore()

// For managing which control is active in the button group
const activeControl = ref<
  'thresholds' | 'workflows' | 'tasks' | 'info' | 'visualize'
>('thresholds') // Options: 'thresholds', 'workflows', 'tasks', 'info', visualize
const secondaryControl = ref<'workflows' | 'tasks' | 'info' | 'visualize'>(
  'tasks',
) // Options: 'workflows', 'tasks', 'info', 'visualize'

// Sync activeControl and secondaryControl with sidePanelStore
watch(
  () => sidePanelStore.activeSidePanel,
  (newPanel) => {
    if (newPanel && newPanel !== 'thresholds') {
      activeControl.value = newPanel
    }
  },
)

// When activeControl changes, update the side panel if needed
watch(activeControl, (newControl) => {
  if (!sidePanelStore.isActive(newControl)) {
    sidePanelStore.setActive(newControl)
  }
})

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

const topologyComponentConfig = computed(() =>
  getComponentConfig(props.topologyId),
)

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
      props.topologyId,
      showLeafsAsButton.value,
    )
  }
}

function getComponentConfig(topologyId?: string) {
  const component = topologyId
    ? configStore.getComponentById(topologyId)
    : undefined
  const config = component as WebOcTopologyDisplayConfig | undefined
  return config ?? configStore.getComponentByType('TopologyDisplay')
}

watch(subNodes, updateItems)
watch(thresholds, updateItems)

const { componentSettings } = useComponentSettings(baseUrl, () => [
  // @ts-expect-error FIXME: Update when the types are updated
  topologyComponentConfig.value?.componentSettingsId,
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
        props.topologyId,
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

  const tabs = displayTabsForNode(
    node,
    showLeafNodesAsButtons ? parentNodeId : undefined,
    topologyId,
    from,
  )
  const tab = tabs.find((t) => t.to.name === from?.name) ?? tabs[0]
  return tab?.to
}
</script>

<style scoped></style>
