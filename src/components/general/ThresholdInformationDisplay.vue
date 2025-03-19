<template>
  <v-sheet class="threshold-display-container">
    <v-data-iterator :items=warningLevels>
      <template v-slot:default="{ items }">
        <v-list density="compact">
          <v-list-item
            v-for="item in items"
            :key="item.raw.id">
            <template v-slot:prepend>
              <v-avatar start :image="item.raw.icon" rounded size="x-small"></v-avatar>
            </template>
            {{ item.raw.name }}
            <template v-slot:append>
              <v-avatar end :text="`${item.raw.count}`"></v-avatar>
            </template>
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
import { getResourcesIconsUrl } from '@/lib/fews-config';
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
      name: warningLevel.name,
      id: warningLevel.id,
      count: warningLevel.count,
      icon: warningLevel.icon ? getResourcesIconsUrl(warningLevel.icon) : undefined,
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