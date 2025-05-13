<template>
  <HisDisplayComponent v-if="filterId" :filterId :boundingBox />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HisDisplayComponent from './HisDisplayComponent.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useHisDisplay } from '@/services/useHisDisplay'
import { configManager } from '@/services/application-config'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const filterId = computed(() => props.topologyNode?.filterIds?.[0])
const boundingBox = computed(() => props.topologyNode?.boundingBox)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { hisDisplay } = useHisDisplay(baseUrl)
</script>
