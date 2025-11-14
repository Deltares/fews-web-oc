<template>
  <TaskRunsPanel class="flex-1-1" />
</template>
<script setup lang="ts">
import TaskRunsPanel from './TaskRunsPanel.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()
</script>
