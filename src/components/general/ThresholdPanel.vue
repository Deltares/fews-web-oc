<template>
  <div v-if="warningLevels?.length" class="threshold-panel h-100 d-flex flex-column">
    <v-data-iterator :items=warningLevels>
      <template v-slot:default="{ items, isExpanded, toggleExpand}">
        <v-card v-for="item in items"
        :key="item.raw.id"
          border
          flat
          density="compact"
          @click="() => toggleExpand(item)"
          :ripple="false"
        >
          <v-card-text class="py-2 h-100">
            <div class="d-flex w-100">
              <div class="w-100">

                <div class="d-flex align-center ga-1 w-100">
                  <v-avatar start :image="item.raw.icon" rounded class="me-1 flex-0-0" size="20"></v-avatar>
                  <div class="flex-1-1 overflow-hidden">
                    <div :class="{ 'text-wrap': isExpanded(item) }">
                      {{ item.raw.name }}
                    </div>
                  </div>
                  <v-avatar end :text="`${item.raw.count}`"></v-avatar>
                </div>
              </div>
            </div>
            <div v-if="isExpanded(item)" class="d-flex mt-4">
              <v-card
                v-for="crossing in item.raw.thresholdCrossing"
                :key="crossing.locationId"
                flat
                density="compact" :ripple="false"
              >
                <div :class="{ 'text-wrap': isExpanded(item) }">
                  {{ crossing.locationId }}
                </div>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </template>
    </v-data-iterator>
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
      thresholdCrossing: thresholds.aggregatedLevelThresholdCrossings?.filter(
        (crossing) => crossing.warningLevelId == warningLevel.id
      )
    }
  })
})

</script>

<style scoped>
.threshold-panel {
  width: 300px;
}

.text-wrap {
  white-space: normal;
}

.text-wrap-no {
  white-space: nowrap;
}
</style>