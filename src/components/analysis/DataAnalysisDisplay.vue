<template>
  <AnalysisDisplayWrapper
    v-if="dataAnalysisDisplay"
    :key="dataAnalysisDisplay.id"
    :config="dataAnalysisDisplay"
    :boundingBox
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AnalysisDisplayWrapper from '@/components/analysis/AnalysisDisplayWrapper.vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { useDataAnalysisDisplay } from '@/services/useDataAnalysisDisplay'
import { configManager } from '@/services/application-config'

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const boundingBox = computed(() => props.topologyNode?.boundingBox)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { dataAnalysisDisplay } = useDataAnalysisDisplay(
  baseUrl,
  () => props.topologyNode?.dataAnalysisDisplayId,
)
</script>
