<template>
  <WhatIfDisplayView :topologyNode="topologyNode" class="flex-1-1" />
</template>

<script setup lang="ts">
import WhatIfDisplayView from '@/views/WhatIfDisplayView.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()
</script>
