<template>
  <Teleport to="#secondary-side-panel-end">
    <div v-if="warningLevels?.length" class="threshold-summary-container">
      <div class="threshold-summary-top" id="threshold-summary-top">
      </div>
      <v-list
        v-model:selected="selectedLevelIds"
        select-strategy="leaf"
        class="threshold-summary-center"
        lines="two"
      >
        <v-list-item
          v-for="warningLevel in warningLevels"
          :key="warningLevel.id"
          :value="warningLevel.id"
          label
          size="small"
          density="compact"
          class="ma-0 py-3 px-0 w-100 flex-nowrap overflow-hidden"
        >
          <div class="d-flex align-center flex-column flex-nowrap px-1">
            <v-badge
              :model-value="(warningLevel.count ?? 0) > 0"
              location="top end"
              offset-x="5"
              offset-y="1"
              color="transparent"
            >
            <template #badge>
              <v-chip size="small" density="compact" class="pa-0 px-1">{{ warningLevel.count }}</v-chip>
            </template>
              <v-img width="30px" :src="warningLevel.icon"></v-img>
            </v-badge>
            <v-list-item-subtitle>
              {{ warningLevel.name }}
            </v-list-item-subtitle>
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
.threshold-summary-container {
  width: 65px;
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  height: 100%;
}

.threshold-summary-top {
  grid-row: 1;
  height: 36px;
}

.threshold-summary-center {
  grid-row: 2;
  height: 100%;
  align-self: center;
}

.warning-count {
  text-align: center;
}

.v-list-item-subtitle {
  font-size: 0.8em;
  color: var(--v-theme-on-surface);
  opacity: 1;
}

:deep(.v-list-item__content) {
  overflow: visible !important;
}

:deep(.v-chip__content) {
  width: 100%;
}
</style>
