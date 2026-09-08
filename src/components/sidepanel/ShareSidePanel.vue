<template>
  <SidePanelContent :title="title" @close="emit('close')">
    <ShareMenu />
  </SidePanelContent>
</template>

<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'

import SidePanelContent from './SidePanelContent.vue'
import ShareMenu from '@/components/share/ShareMenu.vue'

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
