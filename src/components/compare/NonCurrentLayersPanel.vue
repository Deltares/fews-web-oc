<template>
  <div class="task-runs-panel h-100">
    <div class="d-flex pt-3 pb-2 align-center">
      <v-spacer />
      <PeriodFilterControl v-model="period" />
    </div>
    <v-virtual-scroll
      class="overflow-y-auto h-100"
      :items="
        capabilities?.layers
          .slice(1)
          .filter((l) => !l.completelyMissing)
          .toReversed() ?? []
      "
      :item-height="75"
    >
      <template #default="{ item: layer }">
        <v-card border flat density="compact" class="my-1 mx-2">
          <v-card-text class="py-2 px-1 h-100 flex-grow-1">
            <div class="d-flex w-100">
              <div class="d-flex align-center ga-1 w-100">
                <v-checkbox-btn class="flex-0-0" density="compact">
                  <v-tooltip
                    text="Visualize in charts"
                    open-delay="500"
                    activator="parent"
                  />
                </v-checkbox-btn>

                <div class="flex-1-1 overflow-hidden">
                  <div>
                    {{ layerTitle }}
                  </div>
                  <v-list-item-subtitle>
                    {{
                      toHumanReadableDate(
                        new Date(
                          getForecastTime(layer.keywordList) ?? 0,
                        ).getTime(),
                      )
                    }}
                  </v-list-item-subtitle>
                </div>
                <v-btn density="compact" icon="mdi-chevron-up" end></v-btn>
              </div>
            </div>
          </v-card-text>

          <ForecastRange
            v-if="layer.times?.length && outputStartTime && outputEndTime"
            :startTime="outputStartTime"
            :endTime="outputEndTime"
            :timeZero="new Date(getForecastTime(layer.keywordList) ?? 0)"
            :startForecastTime="new Date(layer.firstValueTime ?? 0)"
            :endForecastTime="new Date(layer.lastValueTime ?? 0)"
          />
        </v-card>
      </template>
    </v-virtual-scroll>
    <v-list-item :title="`Last updated:`">
      <template #append>
        <v-btn density="compact" variant="plain" icon="mdi-refresh">
          <template #loader>
            <v-progress-circular size="20" indeterminate />
          </template>
        </v-btn>
      </template>
    </v-list-item>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import {
  convertRelativeToAbsolutePeriod,
  type RelativePeriod,
} from '@/lib/period'
import PeriodFilterControl from '@/components/tasks/PeriodFilterControl.vue'
import ForecastRange from '@/components/compare/ForecastRange.vue'

import { configManager } from '@/services/application-config'
import { useWmsCapabilities } from '@/services/useWms'
import { GetCapabilitiesFilter, Keyword } from '@deltares/fews-wms-requests'
import { convertTimestampToFewsPiParameter } from '@/lib/date'
import { toHumanReadableDate } from '@/lib/date'

interface Props {
  layerName?: string
}

const { layerName = '' } = defineProps<Props>()
const period = ref<RelativePeriod | null>({
  startOffsetSeconds: -24 * 60 * 60,
  endOffsetSeconds: 0,
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filter = computed<GetCapabilitiesFilter>(() => {
  console.log('layerName', layerName, period.value)
  const forecastPeriod = period.value
    ? convertRelativeToAbsolutePeriod(period.value)
    : undefined
  const startForecastTime = forecastPeriod
    ? convertTimestampToFewsPiParameter(forecastPeriod.startTimestamp)
    : undefined
  const endForecastTime = forecastPeriod
    ? convertTimestampToFewsPiParameter(forecastPeriod.endTimestamp)
    : undefined
  return {
    layers: layerName,
    endForecastTime,
    startForecastTime,
    forecastCount: 2147483647,
  }
})

const { capabilities, outputStartTime, outputEndTime } = useWmsCapabilities(
  baseUrl,
  filter,
)

const layerTitle = computed(() => {
  if (capabilities.value === undefined) return 'No layers found'
  if (capabilities.value.layers.length === 0) return 'No layers found'
  return capabilities.value.layers[0].title
})

function getForecastTime(
  keywordList: Keyword[] | undefined,
): string | undefined {
  return keywordList?.[0].forecastTime
}
</script>

<style scoped>
.task-runs-panel {
  width: 450px;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  height: 100%;
  overflow: hidden;
}
</style>
