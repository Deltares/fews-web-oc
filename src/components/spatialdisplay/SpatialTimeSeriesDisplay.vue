<template>
  <div style="dislay: flex; flex-direction: column; height: 100%; width: 100%">
    <div style="flex: 1 1 100%; height: 100%">
      <WindowComponent>
        <template v-slot:toolbar>
          <span class="ml-5">{{ displayConfig?.title }}</span>
          <v-spacer />
          <v-btn-toggle
            class="flex-0-0"
            v-model="displayType"
            mandatory
            density="compact"
          >
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
              <v-icon>{{ item.icon }}</v-icon>
            </v-btn>
          </v-btn-toggle>
          <v-btn
            v-if="(displayConfig?.index ?? -1) != -1"
            @click="openFileDownloadDialog"
            size="small"
            class="text-capitalize"
            variant="text"
            v-bind="props"
          >
            <v-icon>mdi-download</v-icon>
          </v-btn>
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
        <TimeSeriesFileDownloadComponent
          v-model="showFileDownloadDialog"
          :config="displayConfig"
          :options="options"
          :filter="filter"
        >
        </TimeSeriesFileDownloadComponent>
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
import {
  useDisplayConfigFilter,
  type UseDisplayConfigOptions,
} from '@/services/useDisplayConfig'
import {
  filterActionsFilter,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import { computed } from 'vue'
import TimeSeriesFileDownloadComponent from '@/components/download/TimeSeriesFileDownloadComponent.vue'
import { useUserSettingsStore } from '@/stores/userSettings.ts'
import { useSystemTimeStore } from '@/stores/systemTime'
interface Props {
  filter: filterActionsFilter | timeSeriesGridActionsFilter
  elevationChartFilter?: timeSeriesGridActionsFilter
  currentTime?: Date
}

const showFileDownloadDialog = ref(false)
const openFileDownloadDialog = () => {
  showFileDownloadDialog.value = true
}
const settings = useUserSettingsStore()
const systemTimeStore = useSystemTimeStore()

const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: settings.useDisplayUnits,
    convertDatum: settings.convertDatum,
  }
})

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filter = computed(() => props.filter)
const { displayConfig } = useDisplayConfigFilter(
  baseUrl,
  filter,
  () => systemTimeStore.startTime,
  () => systemTimeStore.endTime,
)
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

const { displayConfig: elevationChartDisplayconfig } = useDisplayConfigFilter(
  baseUrl,
  () => props.elevationChartFilter ?? {},
  () => systemTimeStore.startTime,
  () => systemTimeStore.endTime,
)

interface DisplayTypeItem {
  icon: string
  label: string
  value: DisplayType
}

watch(elevationChartDisplayconfig, () => {
  if (displayType.value === DisplayType.ElevationChart) {
    displayType.value = DisplayType.TimeSeriesChart
  }
})
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
      icon: 'mdi-elevation-rise',
      label: 'Vertical profile',
      value: DisplayType.ElevationChart,
    })
  }

  return displayItems
})

function onClose(): void {
  emit('close')
}
</script>
