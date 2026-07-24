<template>
  <div
    v-if="displayTabs.length > 1"
    class="overflow-visible d-flex position-relative"
  >
    <div class="icon-group__underlay"></div>
    <v-btn
      variant="text"
      size="small"
      v-for="tab in displayTabs"
      :key="tab.id"
      :value="tab.type"
      :href="tab.href"
      :target="tab.target"
      :to="tab.to"
      :icon="tab.icon"
      ><v-icon size="large">{{ tab.icon }}</v-icon></v-btn
    >
  </div>
</template>

<script setup lang="ts">
import {
  displayTabsForNode,
  type DisplayTab,
} from '@/lib/topology/displayTabs.js'
import { useTopologyNodesStore } from '@/stores/topologyNodes'
import { ref, watchEffect } from 'vue'

interface Props {
  nodeId?: string | string[]
}

const props = defineProps<Props>()

const displayTabs = ref<DisplayTab[]>([])
const topologyNodesStore = useTopologyNodesStore()

// Update the displayTabs if the active node changes (or if the topologyMap changes).
// Redirect to the corresponding display of the updated active tab.
watchEffect(async () => {
  // Check if the current displayTab already matches the active node.
  if (!props.nodeId) return
  const nodeId = props.nodeId
  let activeNodeId: string
  if (Array.isArray(nodeId)) {
    activeNodeId = nodeId.length > 1 ? nodeId[nodeId.length - 1] : nodeId[0]
  } else {
    activeNodeId = nodeId
  }

  const parentNodeIdNodeId =
    Array.isArray(props.nodeId) && props.nodeId.length > 1
      ? props.nodeId[0]
      : undefined

  // Check if the active node is a leaf.
  const node = topologyNodesStore.getNodeById(activeNodeId)
  if (node === undefined) {
    return
  }

  // Create the displayTabs for the active node.
  displayTabs.value = await displayTabsForNode(node, parentNodeIdNodeId)
})
</script>

<style scoped>
.icon-group__underlay {
  position: absolute;
  background-color: currentColor;
  opacity: var(--v-activated-opacity); /* hidden by default */
  transition: opacity 0.18s ease;
  inset: 0; /* fill the container */
  border-radius: 20px;
}
</style>
