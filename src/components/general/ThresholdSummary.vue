<template>
  <div class="d-flex ma-0 pa-0 flex-0-0 flex-wrap">
    <v-chip
      v-for="warningLevel in warningLevels"
      :key="warningLevel.id"
      variant="tonal"
      label
      size="small"
      density="compact"
      class="ml-1 flex-0-0"
    >
      <template v-slot:prepend>
        <v-avatar start :image="warningLevel.icon" rounded size="small"></v-avatar>
        {{ warningLevel.count }}
      </template>
    </v-chip>
  </div>
</template>

<script setup lang="ts">
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { getResourcesIconsUrl } from '@/lib/fews-config';
import { computed } from 'vue';

interface Props {
  nodeId?: string
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { thresholds: thresholdsArray } = useTopologyThresholds(baseUrl, () => props.nodeId)

const warningLevels = computed(() => {
  if (thresholdsArray.value === undefined || thresholdsArray.value.length === 0) return []
  const thresholds = thresholdsArray.value[0]
  return thresholds.aggregatedLevelThresholdWarningLevels?.map((warningLevel) => {
    return {
      name: warningLevel.name,
      id: warningLevel.id,
      count: warningLevel.count,
      icon: warningLevel.icon ? getResourcesIconsUrl(warningLevel.icon) : undefined,
    }
  })
})

</script>
