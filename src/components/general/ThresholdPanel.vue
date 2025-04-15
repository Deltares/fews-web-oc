<template>
  <div v-if="warningLevels?.length" class="threshold-panel d-flex flex-column">
    <v-data-iterator
      :items="warningLevels"
      items-per-page="-1"
      :key="nodeId"
      class="threshold-panel-iterator h-100"
    >
      <template
        v-slot:default="{
          items: warningLevels,
          isExpanded: isLevelExpanded,
          toggleExpand: toggleLevelExpand,
        }"
      >
        <template
          v-for="warningLevel in warningLevels"
          :key="warningLevel.raw.id"
        >
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
                <div class="d-flex align-center ga-1 w-100">
                  <v-avatar
                    start
                    :image="warningLevel.raw.icon"
                    rounded
                    class="me-1 flex-0-0"
                    size="20"
                  ></v-avatar>
                  <div class="flex-1-1 overflow-hidden">
                    <div
                      :class="{ 'text-wrap': isLevelExpanded(warningLevel) }"
                    >
                      {{ warningLevel.raw.name }}
                    </div>
                  </div>
                  <v-avatar
                    end
                    :text="`${warningLevel.raw.count}`"
                  ></v-avatar>
                </div>
              </div>
            </v-card-text>
          </v-card>
          <v-data-iterator
            v-if="isLevelExpanded(warningLevel)"
            :items="warningLevel.raw.thresholdCrossing"
            items-per-page="-1"
            item-value="locationId"
            class="threshold-panel-iterator ms-2 h-50"
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
                item-height="50px"
                height="100%"
              >
                <template v-slot:default="{ item: crossing }">
                  <v-card
                    border
                    :key="crossing.raw.locationId"
                    flat
                    density="compact"
                    @click="() => toggleCrossingExpand(crossing)"
                    :ripple="false"
                    class="w-100"
                  >
                    <v-card-text class="py-2 h-100">
                      <div
                        class="d-flex flex-column user-select-text cursor-pointer"
                      >
                        <div class="d-flex align-center ga-2">
                          <v-list-item-title>
                            {{ crossing.raw.locationId }}
                          </v-list-item-title>
                          <v-card-subtitle class="pa-0"
                            >from
                            {{
                              toHumanReadableDate(crossing.raw.firstValueTime)
                            }}</v-card-subtitle
                          >
                        </div>
                        <v-card-subtitle class="pa-0">
                          Max: {{ crossing.raw.maxValue }} @
                          {{ toHumanReadableDate(crossing.raw.maxValueTime) }}
                        </v-card-subtitle>
                      </div>
                      <DataTable
                        v-if="isCrossingExpanded(crossing)"
                        class="mt-4"
                        :tableData="toTableDate(crossing.raw)"
                      />
                    </v-card-text>
                  </v-card>
                </template>
              </v-virtual-scroll>
            </template>
          </v-data-iterator>
        </template>
      </template>
    </v-data-iterator>
  </div>
</template>

<script setup lang="ts">
import { useTopologyThresholds } from '@/services/useTopologyThresholds'
import { configManager } from '@/services/application-config'
import { getResourcesIconsUrl } from '@/lib/fews-config'
import { computed } from 'vue'
import {
  toDateDifferenceString,
  toDateRangeString,
  toHumanReadableDate,
} from '@/lib/date'
import { AggregatedLevelThresholdCrossings } from '@deltares/fews-pi-requests'
import DataTable from '@/components/general/DataTable.vue'

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
        thresholdCrossing: thresholds.aggregatedLevelThresholdCrossings?.filter(
          (crossing) => crossing.warningLevelId == warningLevel.id,
        ),
      }
    })
    .sort((a, b) => b.severity - a.severity)
})

function toTableDate(crossing: AggregatedLevelThresholdCrossings) {
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
</script>

<style scoped>
.threshold-panel {
  width: 350px;
  position: absolute;
  top: 95px;
  right: 5px;
  z-index: 1000;
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
</style>
