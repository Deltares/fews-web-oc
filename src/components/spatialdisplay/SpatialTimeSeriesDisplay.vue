<template>
  <div style="dislay: flex; flex-direction: column; height: 100%; width: 100%">
    <div style="flex: 1 1 100%; height: 100%">
      <WindowComponent>
        <template v-slot:toolbar>
          <v-toolbar-items
            class="flex-0-0"
            v-model="displayType"
            mandatory
            size="small"
          >
            <v-btn
              v-for="item in displayTypeItems"
              :key="item.value"
              :value="item.value"
              :aria-label="item.label"
              :text="item.label"
              :active="displayType === item.value"
              variant="text"
              width="20px"
              class="pa-0 text-capitalize"
              @click="displayType = item.value"
              :disabled="item.disabled"
            >
              <v-icon :style="item.iconStyle">{{ item.icon }}</v-icon>
            </v-btn>
          </v-toolbar-items>
          <span class="ml-5">{{ displayConfig?.title }}</span>
          <v-spacer />
        </template>
        <template v-slot:toolbar-append>
          <v-btn size="small" icon>
            <v-icon>mdi-dots-horizontal</v-icon>
            <v-menu activator="parent" density="compact">
              <v-list>
                <v-list-item
                  prepend-icon="mdi-download"
                  @click="downloadDialogStore.showDialog = true"
                  :disabled="!showDataDownload"
                  >Download time series ...</v-list-item
                >
              </v-list>
            </v-menu>
          </v-btn>
          <v-btn size="small" icon @click="onClose">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
        <TimeSeriesComponent
          :config="displayConfig"
          :elevation-chart-config="elevationChartDisplayconfig"
          :current-time="props.currentTime"
          :displayType="displayType"
          :information-content="tooltip"
        >
        </TimeSeriesComponent>
        <TimeSeriesFileDownloadComponent
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
import { StyleValue, ref, watch } from 'vue'
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
import { useLocationTooltip } from '@/services/useLocationTooltip'
import { isFilterActionsFilter } from '@/lib/filters'
import { useDownloadDialogStore } from '@/stores/downloadDialog'
import type { ChartSettings } from '@/lib/topology/componentSettings'

interface Props {
  filter: filterActionsFilter | timeSeriesGridActionsFilter
  elevationChartFilter?: timeSeriesGridActionsFilter
  currentTime?: Date
  settings?: ChartSettings
}

const userSettings = useUserSettingsStore()
const systemTimeStore = useSystemTimeStore()

const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
})

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const downloadDialogStore = useDownloadDialogStore()

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

const { tooltip } = useLocationTooltip(baseUrl, () =>
  isFilterActionsFilter(props.filter)
    ? {
        filterId: props.filter.filterId,
        locationId: props.filter.locationIds,
      }
    : undefined,
)

interface DisplayTypeItem {
  icon: string
  label: string
  value: DisplayType
  iconStyle?: StyleValue
  disabled?: boolean
}

const showDataDownload = computed(() => {
  return (
    !(props.settings?.downloadEnabled === false) &&
    !downloadDialogStore.disabled
  )
})

const displayType = ref(DisplayType.TimeSeriesChart)
const displayTypeItems = computed<DisplayTypeItem[]>(() => {
  const noElevationCharts = !(
    (elevationChartDisplayconfig.value?.subplots?.length ?? 0) > 0
  )
  const noTooltip = !tooltip.value

  const chartDisabled = props.settings?.chartEnabled === false
  const elevationChartDisabled = props.settings?.elevationChartEnabled === false
  const tableDisabled = props.settings?.tableEnabled === false
  const metaDataDisabled = props.settings?.metaDataEnabled === false
  return [
    {
      icon: 'mdi-chart-line',
      label: 'Chart',
      value: DisplayType.TimeSeriesChart,
      disabled: chartDisabled,
    },
    {
      icon: 'mdi-elevation-rise',
      label: 'Vertical profile',
      value: DisplayType.ElevationChart,
      iconStyle: 'transform: rotate(-90deg);',
      disabled: elevationChartDisabled || noElevationCharts,
    },
    {
      icon: 'mdi-table',
      label: 'Table',
      value: DisplayType.TimeSeriesTable,
      disabled: tableDisabled,
    },
    {
      icon: 'mdi-information-outline',
      label: 'Information',
      value: DisplayType.Information,
      disabled: metaDataDisabled || noTooltip,
    },
    // Mdi icon for metatdata at the current location
    //    {
    //     icon: 'mdi-information',
    //    label: 'Metadata',
  ]
})

watch(displayTypeItems, () => {
  const activeItems = displayTypeItems.value.map((dt) => dt.value)
  if (!activeItems.includes(displayType.value)) {
    displayType.value = activeItems[0]
  }
})

function onClose(): void {
  emit('close')
}
</script>
