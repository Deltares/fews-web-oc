<template>
  <NonCurrentDataPanel :topologyNode="topologyNode" />
</template>
<script setup lang="ts">
import NonCurrentDataPanel from '@/components/compare/NonCurrentDataPanel.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}
defineProps<Props>()
</script>
