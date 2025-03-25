<template>
  <v-btn
    icon="mdi-alert-outline"
    :active="isPanelOpen"
    @click="toggleThresholdPanel"
  >
  </v-btn>
  <Teleport to="#main-side-panel-left" defer>
    <div v-if="isPanelOpen" class="threshold-panel h-100 d-flex flex-column">
      <v-data-iterator v-if="warningLevels?.length" :items="warningLevels" items-per-page="-1" :key="nodeId">
        <template v-slot:default="{ items: warningLevels, isExpanded: isLevelExpanded, toggleExpand: toggleLevelExpand}">
          <template v-for="warningLevel in warningLevels"
          :key="warningLevel.raw.id">
            <v-card 
              border
              flat
              density="compact"
              :disabled="warningLevel.raw.thresholdCrossing?.length === 0"
              @click="() => toggleLevelExpand(warningLevel)"
              :ripple="false"
            >
              <v-card-text class="py-2 h-100">
                <div class="d-flex w-100">
                  <div class="w-100">

                    <div class="d-flex align-center ga-1 w-100">
                      <v-avatar start :image="warningLevel.raw.icon" rounded class="me-1 flex-0-0" size="20"></v-avatar>
                      <div class="flex-1-1 overflow-hidden">
                        <div :class="{ 'text-wrap': isLevelExpanded(warningLevel) }">
                          {{ warningLevel.raw.name }}
                        </div>
                      </div>
                      <v-avatar end :text="`${warningLevel.raw.count}`"></v-avatar>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
            <div v-if="isLevelExpanded(warningLevel)" class="d-flex flex-column">
              <v-data-iterator :items="warningLevel.raw.thresholdCrossing" items-per-page="-1" item-value="locationId">
                <template v-slot:default="{ items: crossings, isExpanded: isCrossingExpanded, toggleExpand: toggleCrossingExpand}">
                  <v-card
                    v-for="crossing in crossings"
                    :key="crossing.raw.locationId"
                    flat
                    density="compact"
                    @click="() => toggleCrossingExpand(crossing)"
                    :ripple="false"
                    >
                    <v-card-text class="py-2 h-100">
                      <div :class="{ 'text-wrap': isCrossingExpanded(crossing) }">
                        {{ crossing.raw.locationId }}
                      </div>
                      <div v-if="isCrossingExpanded(crossing)" class="d-flex mt-4 flex-column">
                        <v-card
                          flat
                          density="compact"
                          :ripple="false"
                        >
                          <v-card-text class="py-2 h-100">
                            <div :class="{ 'text-wrap': isCrossingExpanded(crossing) }">
                              Max value: {{ crossing.raw.maxValue }}
                            </div>
                          </v-card-text>
                        </v-card>
                      </div>
                    </v-card-text>
                  </v-card>
                </template>
              </v-data-iterator>
            </div>
          </template>
        </template>
      </v-data-iterator>
      <div v-else>No warning level crossings</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { getResourcesIconsUrl } from '@/lib/fews-config';
import { computed, ref } from 'vue';

interface Props {
  nodeId?: string
}

const props = defineProps<Props>()

const isPanelOpen = ref(false)

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

function toggleThresholdPanel(): void {
  isPanelOpen.value = !isPanelOpen.value
}

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

.v-card--disabled > :not(.v-card__loader) {
  opacity: 1 !important;
}
</style>