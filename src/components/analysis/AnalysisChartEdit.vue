<template>
  <v-dialog v-model="editing" width="auto">
    <v-card>
      <v-card-title>
        <EditableTitle
          :model-value="chart.title"
          @update:model-value="updateTitle"
        />
      </v-card-title>
      <v-list class="pt-0">
        <v-list-item v-for="(item, index) in chart.subplot.items" :key="index">
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
                <v-color-picker
                  :model-value="item.color"
                  @update:model-value="updateItem(index, { color: $event })"
                />
              </v-card>
            </v-menu>
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  :icon="getIconForMarkerStyle(item.markerStyle ?? 'none')"
                />
              </template>

              <v-card class="pa-2" width="200">
                <v-row density="compact">
                  <v-col
                    v-for="style in markerStyles"
                    :key="style.icon"
                    cols="4"
                    class="d-flex justify-center"
                  >
                    <v-btn
                      :icon="style.icon"
                      :active="(item.markerStyle ?? 'none') === style.value"
                      @click="updateItem(index, { markerStyle: style.value })"
                    />
                  </v-col>
                </v-row>
              </v-card>
            </v-menu>
            <AnalysisLineStyleEdit
              :item="item"
              @update:item="updateItem(index, $event)"
            />
            <v-number-input
              :model-value="item.lineWidth"
              @update:model-value="updateItem(index, { lineWidth: $event })"
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
              :model-value="item.legend"
              @update:model-value="updateItem(index, { legend: $event })"
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
import type { TimeSeriesDisplaySubplotItem } from '@deltares/fews-pi-requests'

interface Props {
  chart: PlotChart
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:chart': [chart: PlotChart]
}>()

const editing = defineModel<boolean>({
  required: true,
})

function getIconForMarkerStyle(style: string) {
  return markerStyles.find((s) => s.value === style)?.icon ?? ''
}

function updateTitle(title: string) {
  emit('update:chart', { ...props.chart, title })
}

function updateItem(
  index: number,
  updatedFields: Partial<TimeSeriesDisplaySubplotItem>,
) {
  const items = props.chart.subplot.items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...updatedFields } : item,
  )
  emit('update:chart', {
    ...props.chart,
    subplot: { ...props.chart.subplot, items },
  } as PlotChart)
}
</script>
