<template>
  <SidePanelContent :title="title" @close="emit('close')">
    <NonCurrentDataPanel :topologyNode="topologyNode" />
  </SidePanelContent>
</template>
<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'

import SidePanelContent from './SidePanelContent.vue'
import NonCurrentDataPanel from '@/components/compare/NonCurrentDataPanel.vue'

interface Props {
  topologyNode?: TopologyNode
  title: string
}
defineProps<Props>()

interface Emits {
  close: []
}
const emit = defineEmits<Emits>()
</script>
