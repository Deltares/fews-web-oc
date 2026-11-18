<template>
  <WhatIfDisplayView :topologyNode="topologyNode" />
</template>

<script setup lang="ts">
import WhatIfDisplayView from '@/views/WhatIfDisplayView.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}
defineProps<Props>()
</script>
