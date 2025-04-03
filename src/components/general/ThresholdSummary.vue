<template>
  <Teleport to="#main-side-panel">
    <div v-if="warningLevels?.length" class="threshold-summary h-100 d-flex justify-center flex-column flex-wrap">
      <div class="align-self-start flex-0-0 w-100" id="threshold-summary-top">
      </div>
      <v-list v-model:selected="selectedLevelIds" select-strategy="leaf" class="d-flex flex-1-0 flex-column justify-center w-100 pa-0 overflow-hidden">
        <v-list-item
          v-for="warningLevel in warningLevels"
          :key="warningLevel.id"
          :value="warningLevel.id"
          label
          size="small"
          density="compact"
          class="ma-0 py-1 px-0 w-100 flex-nowrap"
        >
          <div class="d-flex align-center flex-column flex-nowrap w-100">
            <v-badge
              color="#dcdddc"
              :model-value="(warningLevel.count ?? 0) > 0"
              :content="warningLevel.count"
              location="top start"
              offset-x="8"
              offset-y="1"
            >
              <v-img width="30px" :src="warningLevel.icon"></v-img>
            </v-badge>
            <span class="warning-label" style="width: 65px;">
              {{ warningLevel.name }}
            </span>
          </div>
        </v-list-item>
      </v-list>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { getResourcesIconsUrl } from '@/lib/fews-config'
import { computed, ref, watch } from 'vue'
import { LevelThresholdWarningLevels } from '@deltares/fews-pi-requests'

interface Props {
  nodeId?: string
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { thresholds: thresholdsArray } = useTopologyThresholds(
  baseUrl,
  () => props.nodeId,
)

const selectedLevelIds = ref<string[]>([])

const selectedLevels = defineModel<LevelThresholdWarningLevels[]>({default: () => [] })

watch(selectedLevelIds, () => {
  if (selectedLevelIds.value.length === 0) {
    selectedLevels.value = aggregatedWarningLevels.value
  } else {
    selectedLevels.value = aggregatedWarningLevels.value.filter((level) => selectedLevelIds.value.includes(level.id))
  }
})

const aggregatedWarningLevels = computed(() => {
  if (thresholdsArray.value === undefined || thresholdsArray.value.length === 0)
    return []
  const aggregatedLevels = thresholdsArray.value[0]?.aggregatedLevelThresholdWarningLevels
  return aggregatedLevels !== undefined ? aggregatedLevels : []
})

const warningLevels = computed(() => {
  const levels = aggregatedWarningLevels.value
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
  width: 65px;
}

.warning-count {
  text-align: center;
}

.warning-label {
  width: 100%;
  text-align: center;
  font-size: 0.875em;
  overflow-wrap: unset !important;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

:deep(.v-list-item__content) {
  overflow: visible !important;
}

:deep(.v-chip__content) {
  width: 100%;
}
</style>
