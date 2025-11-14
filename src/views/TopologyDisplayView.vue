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
      :locationIds="locationIds"
      v-if="showActiveThresholdCrossingsForFilters"
    />
    <SidePanelControl
      v-if="activeSecondaryControl"
      :type="activeSecondaryControl.type"
      :title="activeSecondaryControl.title"
      :icon="activeSecondaryControl.icon"
    >
      <component
        :is="activeSecondaryControl.component"
        :topologyNode="topologyNode"
      />
    </SidePanelControl>
    <v-menu location="bottom right">
      <template #activator="{ props }">
        <v-btn
          icon="mdi-dots-vertical"
          v-bind="props"
          aria-label="More Sidepanel Options"
        />
      </template>
      <v-list>
        <v-list-item
          v-for="control in secondaryControls.filter(
            (c) => !c.disabled && c.type !== secondaryControl,
          )"
          :prepend-icon="control.icon"
          :title="control.title"
          @click="
            () => {
              activeControl = control.type
              secondaryControl = control.type
              sidePanelStore.setActive(control.type)
            }
          "
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
  </div>
</template>

<script setup lang="ts">
import HierarchicalMenu from '@/components/general/HierarchicalMenu.vue'
import WorkflowsControl from '@/components/workflows/WorkflowsControl.vue'
import LeafNodeButtons from '@/components/general/LeafNodeButtons.vue'
import SidePanelControl from '@/components/sidepanel/SidePanelControl.vue'

import type { ColumnItem } from '@/components/general/ColumnItem'
import { useConfigStore } from '@/stores/config'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useWorkflowsStore } from '@/stores/workflows'

import type { TopologyNode } from '@deltares/fews-pi-requests'
import type { WebOcTopologyDisplayConfig } from '@deltares/fews-pi-requests'

import {
  type Component,
  computed,
  onUnmounted,
  ref,
  watch,
  watchEffect,
} from 'vue'
import {
  onBeforeRouteUpdate,
  RouteLocationNormalized,
  useRoute,
  useRouter,
} from 'vue-router'
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import InformationDisplayView from '@/views/InformationDisplayView.vue'
import TaskRunsOverview from '@/components/tasks/TaskRunsOverview.vue'
import ImportStatusControl from '@/components/systemmonitor/ImportStatusControl.vue'
import ThresholdsControl from '@/components/thresholds/ThresholdsControl.vue'
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
import { SidePanel, useSidePanelStore } from '@/stores/sidePanel'
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
const nodesStore = useNodesStore()

// For managing which control is active in the button group
const activeControl = ref<SidePanel>('thresholds')
const secondaryControl = ref<SidePanel>('tasks')
const activeSecondaryControl = computed(() =>
  secondaryControls.value.find((s) => s.type === secondaryControl.value),
)

interface SecondaryControl {
  type: SidePanel
  title: string
  icon: string
  component: Component
  disabled?: boolean
}

const secondaryControls = computed<SecondaryControl[]>(() => {
  const sidePanelConfig = configStore.general.sidePanel
  return [
    {
      type: 'tasks',
      title: 'Task Overview',
      icon: 'mdi-clipboard-text-clock',
      component: TaskRunsOverview,
      disabled:
        !showTaskMenu.value && sidePanelConfig?.taskOverview?.enabled === false,
    },
    {
      type: 'import',
      title: 'Import Status',
      icon: 'mdi-database-import',
      component: ImportStatusControl,
      disabled:
        !showTaskMenu.value && sidePanelConfig?.importStatus?.enabled === false,
    },
    {
      type: 'visualize',
      title: 'Non-Current Data',
      icon: 'mdi-chart-box-multiple',
      component: VisualizeDataControl,
      disabled:
        !showTaskMenu.value &&
        sidePanelConfig?.nonCurrentData?.enabled === false,
    },
    {
      type: 'workflows',
      title: 'Run Tasks',
      icon: 'mdi-cog-play',
      component: WorkflowsControl,
      disabled:
        !showTaskRuns.value && sidePanelConfig?.runTask?.enabled === false,
    },
    {
      type: 'info',
      title: 'More Info',
      icon: 'mdi-information-outline',
      component: InformationDisplayView,
      disabled: sidePanelConfig?.documentFile?.enabled === false,
    },
  ]
})

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

const showTaskMenu = computed(
  () => configStore.general.sidePanel?.runTask?.enabled,
)

const active = ref<string | undefined>(undefined)
watch(
  () => nodesStore.activeNodeId,
  () => {
    // Clear the bounding box and stop drawing when we switch nodes while selecting a bounding box.
    workflowsStore.boundingBox = null
    workflowsStore.isDrawingBoundingBox = false
    workflowsStore.coordinate = null
    workflowsStore.isSelectingCoordinate = false

    taskRunsStore.clearSelectedTaskRuns()
  },
)

// Clear the preferred workflow IDs when we unmount.
onUnmounted(() => availableWorkflowsStore.clearPreferredWorkflowIds())

const items = ref<ColumnItem[]>([])

const topologyNode = ref<TopologyNode | undefined>(undefined)

const displayTabs = ref<DisplayTab[]>([])

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

const showTaskRuns = computed(
  () => topologyComponentConfig.value?.enableTaskRuns ?? false,
)

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
