<template>
  <DataDownloadDisplayComponent
    v-if="topologyNode"
    :key="topologyNode.id"
    :nodeId="nodeId"
    :topologyNode="topologyNode"
  />
</template>

<script setup lang="ts">
import DataDownloadDisplayComponent from '@/components/download/DataDownloadDisplayComponent.vue'
import { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  nodeId?: string | string[]
  topologyNode?: TopologyNode
}

defineProps<Props>()
</script>
