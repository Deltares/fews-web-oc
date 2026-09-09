<template>
  <ShareMenu />
</template>

<script setup lang="ts">
import ShareMenu from '@/components/share/ShareMenu.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}
defineProps<Props>()
</script>
