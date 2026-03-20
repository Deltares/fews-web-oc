<template>
  <iframe
    v-if="src"
    class="w-100 h-100"
    :src="src"
    title="Web Display"
  ></iframe>
</template>

<script setup lang="ts">
import { TopologyNode } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  nodeId?: string | string[]
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()
const src = computed(() => {
  return props.topologyNode?.embedUrl ?? ''
})
</script>
