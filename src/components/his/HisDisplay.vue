<template>
  <HisDisplayComponent :filterId :boundingBox />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HisDisplayComponent from './HisDisplayComponent.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const filterId = computed(() => props.topologyNode?.filterIds?.[0])
const boundingBox = computed(() => props.topologyNode?.boundingBox)
</script>
