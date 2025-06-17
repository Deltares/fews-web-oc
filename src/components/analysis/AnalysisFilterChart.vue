<template>
  <AnalysisChartCard :chart="chart" v-bind="$attrs" @edit="editing = true">
    <TimeSeriesChart
      :config
      :series
      :zoomHandler
      :settings="settings.charts.timeSeriesChart"
    />
    <v-dialog v-model="editing" width="auto">
      <v-card>
        <v-card-title><EditableTitle v-model="chart.title" /></v-card-title>
        <v-list class="pt-0">
          <v-list-item v-for="item in chart.subplot.items">
            <template #prepend>
              <v-menu :close-on-content-click="false">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-chart-timeline-variant"
                    :color="item.color"
                  />
                </template>
                <v-card>
                  <v-color-picker v-model="item.color" />
                </v-card>
              </v-menu>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon>
                    <v-icon>{{
                      markerStyles.find(
                        (style) => style.value === item.markerStyle,
                      )?.icon
                    }}</v-icon>
                  </v-btn>
                </template>

                <v-card class="pa-2" width="200">
                  <v-row dense>
                    <v-col
                      v-for="style in markerStyles"
                      :key="style.icon"
                      cols="4"
                      class="d-flex justify-center"
                    >
                      <v-btn
                        :icon="style.icon"
                        @click="() => (item.markerStyle = style.value)"
                      />
                    </v-col>
                  </v-row>
                </v-card>
              </v-menu>
              <v-select
                v-model="item.lineStyle"
                :items="lineStyles"
                density="compact"
                variant="outlined"
                width="120"
                item-value="value"
                item-title="label"
                hide-details
                class="mx-2"
              />
            </template>
            <div class="d-flex align-center ga-1">
              <EditableTitle
                v-if="item.legend !== undefined"
                v-model="item.legend"
              />
            </div>
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>
  </AnalysisChartCard>
</template>

<script setup lang="ts">
import EditableTitle from '@/components/general/EditableTitle.vue'
import AnalysisChartCard from '@/components/analysis/AnalysisChartCard.vue'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import { timeSeriesDisplayToChartConfig } from '@/lib/charts/timeSeriesDisplayToChartConfig'
import type { PlotChart } from '@/lib/analysis'
import type { Series } from '@/lib/timeseries/timeSeries'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import type { ZoomHandler } from '@deltares/fews-web-oc-charts'
import { computed, ref } from 'vue'
import { TimeSeriesDisplaySubplot } from '@deltares/fews-pi-requests'
import { markerStyles, lineStyles } from '@/lib/charts/styles'

interface Props {
  chart: PlotChart
  subplot: TimeSeriesDisplaySubplot
  series: Record<string, Series>
  zoomHandler?: ZoomHandler
  settings: ComponentSettings
  domain?: [Date, Date]
}

const props = defineProps<Props>()

const config = computed(() =>
  timeSeriesDisplayToChartConfig(props.subplot, props.domain),
)

const editing = ref(false)
</script>
