<template>
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
            <AnalysisLineStyleEdit :item="item" />
            <v-number-input
              v-model="item.lineWidth"
              density="compact"
              variant="outlined"
              hide-details
              type="number"
              :min="0.1"
              :max="10"
              class="mx-2"
              label="Width"
              control-variant="stacked"
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
</template>

<script setup lang="ts">
import EditableTitle from '@/components/general/EditableTitle.vue'
import AnalysisLineStyleEdit from './AnalysisLineStyleEdit.vue'
import { markerStyles } from '@/lib/charts/styles'
import type { PlotChart } from '@/lib/analysis'

interface Props {
  chart: PlotChart
}

defineProps<Props>()

const editing = defineModel<boolean>({
  required: true,
})
</script>
