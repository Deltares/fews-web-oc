<template>
  <div class="his-container pa-2 ga-2">
    <div class="his-data-selection h-100">
      <v-card
        border
        flat
        class="d-grid flex-column pb-2"
        :class="{ 'h-100': tab === 'data-selection' }"
      >
        <v-tabs v-model="tab">
          <v-tab
            prepend-icon="mdi-filter"
            text="Data selection"
            value="data-selection"
            class="text-none"
          />
          <v-tab
            prepend-icon="mdi-chart-line"
            text="Analysis"
            value="analysis"
            :disabled="!subplots.length"
            class="text-none"
          />
        </v-tabs>

        <v-tabs-window v-model="tab" class="h-100">
          <v-tabs-window-item value="data-selection" class="h-100">
            <HisDataSelection
              :filterId="filterId"
              :locations="locations"
              :geojson="geojson"
              :timeSeriesHeaders="timeSeriesHeaders"
              :boundingBox="boundingBox"
              @addFilter="addFilter"
            />
          </v-tabs-window-item>
          <v-tabs-window-item value="analysis" v-if="subplots.length">
            <HisAnalysis
              :filterId="filterId"
              :subplots="subplots"
              :series="series"
              :startTime="startTime"
              :endTime="endTime"
              :settings="settings"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </div>
    <div class="his-charts overflow-auto">
      <v-card border flat class="h-100 d-flex flex-column">
        <v-card-title class="flex-0-0 d-flex ga-1 align-center">
          <div>Charts</div>
          <v-spacer />
          <HisCollection v-model:selectedCollection="selectedCollection" />
          <v-btn :disabled="!selectedCollection" icon="mdi-content-save" />
        </v-card-title>
        <HisCharts
          v-if="subplots.length"
          :subplots="subplots"
          :series="series"
          :settings="settings"
          class="flex-1-1"
        />
        <v-card-text v-else> Select some data to display </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import HisDataSelection from '@/components/his/HisDataSelection.vue'
import HisCharts from '@/components/his/HisCharts.vue'
import HisCollection from '@/components/his/HisCollection.vue'
import HisAnalysis from '@/components/his/HisAnalysis.vue'
import type {
  ActionRequest,
  BoundingBox,
  filterActionsFilter,
} from '@deltares/fews-pi-requests'
import { ref, shallowRef } from 'vue'
import { useFilterLocations } from '@/services/useFilterLocations'
import { configManager } from '@/services/application-config'
import { useTimeSeries, useTimeSeriesHeaders } from '@/services/useTimeSeries'
import { fetchActions } from '@/services/useDisplayConfig'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import { type Collection } from '@/lib/his'
import { useUserSettingsStore } from '@/stores/userSettings'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import { ChartConfig } from '@/lib/charts/types/ChartConfig'

interface Props {
  filterId?: string
  boundingBox?: BoundingBox
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const userSettings = useUserSettingsStore()

const tab = ref('data-selection')

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const selectedCollection = ref<Collection>()

const { locations, geojson } = useFilterLocations(baseUrl, () =>
  props.filterId ? [props.filterId] : [],
)
const { timeSeriesHeaders } = useTimeSeriesHeaders(
  baseUrl,
  () => props.filterId,
)

const startTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
const endTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

const requests = shallowRef<ActionRequest[]>([])
const subplots = shallowRef<ChartConfig[]>([])

async function addFilter(filter: filterActionsFilter) {
  const actions = await fetchActions(baseUrl, filter)
  const results = actions.results

  const newSubplots = results.flatMap(
    (result) =>
      result.config?.timeSeriesDisplay.subplots?.map((subPlot) =>
        timeSeriesDisplayToChartConfig(subPlot, [startTime, endTime]),
      ) ?? [],
  )
  subplots.value = [...subplots.value, ...newSubplots]

  const getUniqueRequests = (requests: ActionRequest[]) =>
    requests.filter((req, i, s) => i === s.findIndex((r) => r.key === req.key))

  const newRequests = results.flatMap((result) => result.requests)
  requests.value = getUniqueRequests([...requests.value, ...newRequests])
}

const { series } = useTimeSeries(baseUrl, requests, () => ({
  startTime,
  endTime,
  useDisplayUnits: userSettings.useDisplayUnits,
  convertDatum: userSettings.convertDatum,
  thinning: true,
}))
</script>

<style scoped>
.his-container {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: 1fr 1fr;
}

@media (max-width: 600px) {
  .his-container {
    grid-template-columns: 1fr;
  }
}
</style>
