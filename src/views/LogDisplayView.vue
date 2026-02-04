<template>
  <LogDisplay :logDisplayId="topologyNode?.logDisplay?.id" />
</template>

<script setup lang="ts">
import LogDisplay from '@/components/logdisplay/LogDisplay.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}

defineProps<Props>()
</script>
