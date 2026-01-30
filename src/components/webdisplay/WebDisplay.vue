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
import { computed, onMounted } from 'vue'

interface Props {
  nodeId?: string | string[]
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

onMounted(() => {
  console.log('IFrame mounted', props)
})

const src = computed(() => {
  return props.topologyNode?.embedUrl ?? ''
})
</script>
