<template>
  <ImportStatusControl @open-side-panel="emit('openSidePanel', $event)" />
</template>

<script setup lang="ts">
import ImportStatusControl from '@/components/systemmonitor/ImportStatusControl.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}
defineProps<Props>()

const emit = defineEmits(['openSidePanel'])
</script>
