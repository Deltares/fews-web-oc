<template>
  <div style="dislay: flex; flex-direction: column; height: 100%; width: 100%">
    <div style="flex: 1 1 100%; height: 100%">
      <WindowComponent>
        <template v-slot:toolbar>
          <span class="ml-5">{{ displayConfig?.title }}</span>
          <v-spacer />
          <v-btn-toggle v-model="displayType" mandatory density="compact">
            <v-btn
              v-for="item in displayTypeItems"
              :key="item.value"
              :value="item.value"
              :aria-label="item.label"
              :text="item.label"
              size="small"
              variant="text"
              class="text-capitalize"
            >
              <v-icon :style="item.iconStyle">{{ item.icon }}</v-icon>
            </v-btn>
          </v-btn-toggle>
        </template>
        <template v-slot:toolbar-append>
          <v-btn size="small" variant="text" @click="onClose">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
        <TimeSeriesComponent
          :config="displayConfig"
          :elevation-chart-config="elevationChartDisplayconfig"
          :current-time="props.currentTime"
          :displayType="displayType"
        >
        </TimeSeriesComponent>
      </WindowComponent>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { configManager } from '@/services/application-config'
import WindowComponent from '@/components/general/WindowComponent.vue'
import TimeSeriesComponent from '@/components/timeseries/TimeSeriesComponent.vue'
import { DisplayType } from '@/lib/display/DisplayConfig'
import { useDisplayConfigFilter } from '@/services/useDisplayConfig'
import {
  filterActionsFilter,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import { computed } from 'vue'

interface Props {
  filter: filterActionsFilter | timeSeriesGridActionsFilter
  elevationChartFilter?: timeSeriesGridActionsFilter
  currentTime?: Date
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filter = computed(() => props.filter)
const { displayConfig } = useDisplayConfigFilter(baseUrl, filter)
watch(
  () => displayConfig,
  () => {
    if (!displayConfig.value) return

    if (displayConfig.value.subplots.length < 1) {
      onClose()
    }
  },
  { deep: true },
)

const elevationChartFilter = computed(() => props.elevationChartFilter ?? {})
const { displayConfig: elevationChartDisplayconfig } = useDisplayConfigFilter(
  baseUrl,
  elevationChartFilter,
)

interface DisplayTypeItem {
  icon: string
  label: string
  value: DisplayType
  iconStyle?: string
}

const displayType = ref(DisplayType.TimeSeriesChart)
const displayTypeItems = computed<DisplayTypeItem[]>(() => {
  const displayItems: DisplayTypeItem[] = [
    {
      icon: 'mdi-chart-line',
      label: 'Chart',
      value: DisplayType.TimeSeriesChart,
    },
    {
      icon: 'mdi-table',
      label: 'Table',
      value: DisplayType.TimeSeriesTable,
    },
  ]

  if ((elevationChartDisplayconfig.value?.subplots?.length ?? 0) > 0) {
    displayItems.push({
      icon: 'mdi-chart-line',
      label: 'Vertical profile',
      value: DisplayType.ElevationChart,
      iconStyle: 'transform: rotate(90deg)',
    })
  }

  return displayItems
})

function onClose(): void {
  emit('close')
}
</script>
