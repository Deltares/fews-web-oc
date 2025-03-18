<template>
  <v-sheet class="threshold-display-container">
    <v-list :items=warningLevels></v-list>
  </v-sheet>
</template>

<script setup lang="ts">
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import { computed } from 'vue';

interface Props {
  topologyNode?: TopologyNode
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { thresholds } = useTopologyThresholds(baseUrl, () => props.topologyNode?.id)

const warningLevels = computed(() => {
  if (thresholds.value === undefined || thresholds.value.length === 0) return []
  return thresholds.value[0].levelThresholdWarningLevels?.map((warningLevel) => {
    return {
      title: `${warningLevel.name}: ${warningLevel.count}`,
      value: warningLevel.id
    }
  })
})

</script>

<style scoped>
.threshold-display-container {
  position: absolute;
  z-index: 1000;
  top: 95px;
}
</style>