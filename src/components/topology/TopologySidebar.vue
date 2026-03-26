<template>
  <HierarchicalMenu v-model:active="active" :type="menuType" :items="items" />
</template>

<script setup lang="ts">
import HierarchicalMenu from '@/components/general/HierarchicalMenu.vue'
import { type ColumnItem } from '@/components/general/ColumnItem'
import { recursiveUpdateNode } from '@/lib/topology/nodes'
import { useNodesStore } from '@/stores/nodes'
import { useTaskRunColorsStore } from '@/stores/taskRunColors'
import { useTaskRunsStore } from '@/stores/taskRuns'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useWorkflowsStore } from '@/stores/workflows'
import {
  type TopologyThresholdNode,
  type TopologyNode,
} from '@deltares/fews-pi-requests'
import { watch, ref, computed } from 'vue'

interface Props {
  nodeId?: string | string[]
  topologyId?: string
  topologyNode?: TopologyNode
  showActiveThresholdCrossingsForFilters?: boolean
  showLeafNodesAsButton?: boolean
  subNodes?: TopologyNode[]
  thresholds?: TopologyThresholdNode[]
}
const props = defineProps<Props>()

const workflowsStore = useWorkflowsStore()
const taskRunsStore = useTaskRunsStore()
const taskRunColorsStore = useTaskRunColorsStore()
const nodesStore = useNodesStore()
const settings = useUserSettingsStore()

const active = ref<string>()
watch([() => nodesStore.activeNodeId, active], () => {
  // Clear the bounding box and stop drawing when we switch nodes while selecting a bounding box.
  workflowsStore.boundingBox = null
  workflowsStore.isDrawingBoundingBox = false
  workflowsStore.coordinate = null
  workflowsStore.isSelectingCoordinate = false

  taskRunColorsStore.clearColors()
  taskRunsStore.clearSelectedTaskRuns()
})

const menuType = computed(() => {
  const configured = settings.get('ui.hierarchical-menu-style')?.value as string
  return configured ?? 'auto'
})

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

const items = ref<ColumnItem[]>([])

watch(() => props.subNodes, updateItems)
watch(() => props.thresholds, updateItems)

function updateItems(): void {
  if (!props.subNodes) return

  items.value = recursiveUpdateNode(
    props.subNodes,
    props.thresholds,
    props.showActiveThresholdCrossingsForFilters,
    props.topologyId,
    props.showLeafNodesAsButton,
  )
}
</script>
