<template>
  <VisualCompare :skeleton="false">
    <template #left>
      <img
        src="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
        alt="Left Image"
      />
    </template>
    <template #right>
      <img
        src="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg"
        alt="Right Image"
      />
    </template>
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
