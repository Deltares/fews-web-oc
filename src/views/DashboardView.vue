<template>
  <DashboardDisplay v-if="dashboard" :dashboard="dashboard" />
  <v-alert v-else>No dashboard available</v-alert>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardDisplay from '@/components/general/DashboardDisplay.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { getResourcesStaticUrl } from '@/lib/fews-config'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const dashboard = computed(() => {
  if (!props.topologyNode) return
  const css = getResourcesStaticUrl(`${props.topologyNode.id}.css`)
  return {
    id: props.topologyNode.id,
    css,
    panels: props.topologyNode.topologyNodes ?? [],
  }
})
</script>
