<template>
  <iframe v-if="url" :src="url" title="Information Document" class="w-100 h-100 ma-0 pa-0 border-none" />
  <div v-else class="pa-4">
    <span>No information document configured</span>
  </div>
</template>

<script setup lang="ts">
import { getResourcesStaticUrl } from '@/lib/fews-config'
import { TopologyNode } from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const url = computed(() => {
  const resource = props.topologyNode?.documentFile
  if (!resource) return

  return getResourcesStaticUrl(resource)
})
</script>
