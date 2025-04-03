<template>
  <template v-if="thresholdCrossings?.length">
    <Teleport to="#threshold-summary-top" defer>
      <v-btn class="ms-0 ps-0" @click="toggleThresholdPanel">
        <v-icon v-if="isPanelOpen">mdi-menu-close</v-icon>
        <v-icon v-else>mdi-menu-open</v-icon>
      </v-btn>
    </Teleport>
    <div v-if="isPanelOpen" class="threshold-panel d-flex flex-column">
      <v-data-iterator
        :items="thresholdCrossings"
        items-per-page="-1"
        item-value="locationId"
        class="threshold-panel-iterator ms-2 h-100"
      >
        <template
          v-slot:default="{
            items: crossings,
            isExpanded: isCrossingExpanded,
            toggleExpand: toggleCrossingExpand,
          }"
        >
          <v-virtual-scroll
            :items="crossings"
            :item-height="item_height_px"
            height="100%"
          >
            <template v-slot:default="{ item: crossing }">
              <div class="pb-1">
                <v-card
                  border
                  :key="crossing.raw.locationId"
                  flat
                  density="compact"
                  @click="() => toggleCrossingExpand(crossing)"
                  :ripple="false"
                  class="w-100"
                >
                  <v-card-text class="pa-0 h-100">
                    <div class="d-flex align-center justify-space-between ga-2 h-100">
                      <div
                        class="d-flex flex-column pa-2 overflow-hidden"
                      >
                        <v-list-item-title>
                          {{ crossing.raw.locationId }}
                        </v-list-item-title>
                        <v-card-subtitle class="pa-0">
                          {{ toHumanReadableDate(crossing.raw.maxValueTime) }}
                        </v-card-subtitle>
                      </div>
                      <div class="max-value flex-shrink-0" :style="{background: crossing.raw.color, color: getContrastColor(crossing.raw.color)}">
                          {{ crossing.raw.maxValue }}
                      </div>
                    </div>
                    <DataTable
                      v-if="isCrossingExpanded(crossing)"
                      class="mt-2 ms-2"
                      :tableData="toTableDate(crossing.raw)"
                    />
                  </v-card-text>
                </v-card>
              </div>
            </template>
          </v-virtual-scroll>
        </template>
      </v-data-iterator>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { computed, ref } from 'vue'
import {
  toDateDifferenceString,
  toDateRangeString,
  toHumanReadableDate,
} from '@/lib/date'
import { LevelThresholdCrossings } from '@deltares/fews-pi-requests'
import DataTable from '@/components/general/DataTable.vue'
import { getContrastColor } from "@/lib/charts/styles"

interface Props {
  nodeId?: string
}

const props = defineProps<Props>()

const isPanelOpen = ref(false)

const ITEM_HEIGHT = 56
const item_height_px = `${ITEM_HEIGHT}px`
const ITEMS_PER_PANEL = 6
const panel_height_px = `${ITEM_HEIGHT * ITEMS_PER_PANEL}px`
  

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const { thresholds: thresholdsArray } = useTopologyThresholds(
  baseUrl,
  () => props.nodeId,
)

const thresholdCrossings = computed(() => {
  if (thresholdsArray.value === undefined || thresholdsArray.value.length === 0)
    return []
  const thresholds = thresholdsArray.value[0]
  return thresholds.levelThresholdCrossings?.sort((a, b) => b.severity - a.severity)
})

function toTableDate(crossing: LevelThresholdCrossings) {
  return [
    {
      columns: [
        {
          header: 'First event time',
          value: toHumanReadableDate(crossing.firstValueTime),
        },
        {
          header: 'First event value',
          value: crossing.firstValue?.toString(),
        },
      ],
    },
    {
      columns: [
        {
          header: 'Max. event time',
          value: toHumanReadableDate(crossing.maxValueTime),
        },
        {
          header: 'Max. event value',
          value: crossing.maxValue?.toString(),
        },
      ],
    },
    {
      columns: [
        {
          header: 'Last event time',
          value: toHumanReadableDate(crossing.lastValueTime),
        },
        {
          header: 'Last event value',
          value: crossing.lastValue?.toString(),
        },
      ],
    },
    {
      columns: [
        {
          header: 'Event duration',
          subHeader: toDateDifferenceString(
            crossing.firstValueTime,
            crossing.lastValueTime,
          ),
          value: toDateRangeString(
            crossing.firstValueTime,
            crossing.lastValueTime,
          ),
        },
      ],
    },
  ]
}

function toggleThresholdPanel(): void {
  isPanelOpen.value = !isPanelOpen.value
}
</script>

<style scoped>
.threshold-panel {
  width: 300px;
  position: absolute;
  top: 95px;
  right: 5px;
  z-index: 1000;
  height: v-bind(panel_height_px)
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

.threshold-panel-iterator > * {
  height: 100%;
}

.max-value {
  height: v-bind(item_height_px);
  width: 50px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
