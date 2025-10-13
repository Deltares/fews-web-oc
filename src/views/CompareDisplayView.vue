<template>
  <VisualCompare
    leftImage="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
    rightImage="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg"
    :skeleton="false"
    class="h-100"
  >
  </VisualCompare>
</template>

<script setup lang="ts">
import VisualCompare from '@/components/compare/VisualCompare.vue'
import type { NavigateRoute } from '@/lib/router'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyId?: string
  nodeId?: string | string[]
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = defineProps<Props>()

interface Emits {
  navigate: [to: NavigateRoute]
}

const emit = defineEmits<Emits>()

</script>
