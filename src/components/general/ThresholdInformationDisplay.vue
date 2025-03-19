<template>
  <v-sheet class="threshold-display-container">
    <v-data-iterator :items=warningLevels>
      <template v-slot:default="{ items }">
        <v-list density="compact">
          <v-list-item
            v-for="item in items"
            :key="item.raw.id"
            :title="item.raw.title">
          </v-list-item>
        </v-list>
      </template>
    </v-data-iterator>
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
      id: warningLevel.id
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