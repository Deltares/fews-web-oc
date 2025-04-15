<template>
  <Teleport to="#main-side-panel">
    <div v-if="warningLevels?.length" class="threshold-summary h-100 d-flex justify-center flex-column flex-wrap">
      <div class="align-self-start flex-0-0" id="threshold-summary-top">
      </div>
      <div class="d-flex flex-1-0 flex-column justify-center">
        <v-list-item
          v-for="warningLevel in warningLevels"
          :key="warningLevel.id"
          label
          size="small"
          density="compact"
          class="ma-0 pa-1 w-100"
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
  if (thresholds.aggregatedLevelThresholdWarningLevels === undefined) return []
  const levels = thresholds.aggregatedLevelThresholdWarningLevels
    .map((warningLevel) => {
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
  // The warning level with the lowest severity is always the default "no thresholds" level.
  // That level should not be shown in list of warning levels
  levels.pop()
  return levels
})
</script>

<style scoped>
.threshold-summary {
  width: 80px;
}
</style>
