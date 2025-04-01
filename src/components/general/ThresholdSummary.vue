<template>
  <Teleport to="#main-side-panel-left" defer>
    <div class="threshold-summary h-100 flex-wrap">
      <v-list-item
        v-for="warningLevel in warningLevels"
        :key="warningLevel.id"
        label
        size="small"
        density="compact"
        class="ma-0 pa-1"
      >
        <div class="d-flex align-center flex-column">
          <v-list-item-title>
            <v-img width="40px" :src="warningLevel.icon"></v-img>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ warningLevel.name }}
          </v-list-item-subtitle>
        </div>
        <template v-slot:append>
          <v-list-item-subtitle>
            {{ warningLevel.count }}
          </v-list-item-subtitle>
        </template>
      </v-list-item>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { getResourcesIconsUrl } from '@/lib/fews-config'
import { computed } from 'vue'

interface Props {
  nodeId?: string
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { thresholds: thresholdsArray } = useTopologyThresholds(
  baseUrl,
  () => props.nodeId,
)

const warningLevels = computed(() => {
  if (thresholdsArray.value === undefined || thresholdsArray.value.length === 0)
    return []
  const thresholds = thresholdsArray.value[0]
  return thresholds.aggregatedLevelThresholdWarningLevels
    ?.map((warningLevel) => {
      return {
        ...warningLevel,
        ...{
          icon: warningLevel.icon
            ? getResourcesIconsUrl(warningLevel.icon)
            : undefined,
        },
      }
    })
    .sort((a, b) => b.severity - a.severity)
})
</script>

<style scoped>
.threshold-summary {
  width: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 0 0 auto;
}
</style>
