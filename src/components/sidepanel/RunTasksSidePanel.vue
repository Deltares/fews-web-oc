<template>
  <SidePanelContent :title="title" @close="emit('close')">
    <WhatIfDisplayView :topologyNode="topologyNode" />
  </SidePanelContent>
</template>

<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'

import SidePanelContent from './SidePanelContent.vue'
import WhatIfDisplayView from '@/views/WhatIfDisplayView.vue'

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
