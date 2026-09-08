<template>
  <ImportStatusControl @open-side-panel="emit('openSidePanel', $event)" />
</template>

<script setup lang="ts">
import ImportStatusControl from '@/components/systemmonitor/ImportStatusControl.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import type { SidePanelRequest } from '@/lib/sidepanel'

interface Props {
  topologyNode?: TopologyNode
}
defineProps<Props>()

interface Emits {
  openSidePanel: [request: SidePanelRequest]
}
const emit = defineEmits<Emits>()
</script>
