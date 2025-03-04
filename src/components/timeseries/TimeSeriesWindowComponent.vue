<template>
  <WindowComponent :toolBar="settings.general.toolBar">
    <template v-slot:toolbar>
      <v-toolbar-items
        class="flex-0-0"
        v-model="displayType"
        mandatory
        size="small"
      >
        <v-btn
          v-if="displayTypeItems.length > 1"
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

      <slot name="toolbar-title">
        <span class="ml-5">{{ displayConfig?.title }}</span>
      </slot>
      <v-spacer />
    </template>
    <template v-slot:toolbar-append>
      <v-btn
        size="small"
        icon
        v-if="displayActionItems.length"
        aria-labelledby="display-action-menu"
      >
        <v-icon>mdi-dots-horizontal</v-icon>
        <v-menu activator="parent" density="compact">
          <v-list>
            <v-list-item
              v-for="item in displayActionItems"
              :key="item.label"
              @click="item.action"
              :prepend-icon="item.icon"
            >
              {{ item.label }}
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
      <slot name="toolbar-append" />
    </template>
    <TimeSeriesComponent
      :config="displayConfig ?? undefined"
      :elevation-chart-config="elevationChartDisplayconfig ?? undefined"
      :current-time="currentTime"
      :displayType="displayType"
      :information-content="informationContent"
      :settings="settings"
    >
    </TimeSeriesComponent>
    <TimeSeriesFileDownloadComponent
      v-model="showDownloadDialog"
      :config="displayConfig"
      :options="options"
      :filter="filter"
    />
  </WindowComponent>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import WindowComponent from '@/components/general/WindowComponent.vue'
import TimeSeriesComponent from '@/components/timeseries/TimeSeriesComponent.vue'
import TimeSeriesFileDownloadComponent from '@/components/download/TimeSeriesFileDownloadComponent.vue'
import { DisplayConfig, DisplayType } from '@/lib/display/DisplayConfig'
import { type ChartsSettings } from '@/lib/topology/componentSettings'
import { computed, ref, StyleValue, watch } from 'vue'
import { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import { useUserSettingsStore } from '@/stores/userSettings'
import type {
  filterActionsFilter,
  timeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'

interface Props {
  displayConfig?: DisplayConfig | null
  elevationChartDisplayconfig?: DisplayConfig | null
  currentTime?: Date
  informationContent?: string | null
  filter?: filterActionsFilter | timeSeriesGridActionsFilter
  settings: ChartsSettings
}

const props = defineProps<Props>()

const { t } = useI18n()


const downloadDialogStore = useDownloadDialogStore()
const userSettings = useUserSettingsStore()

const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
})

interface DisplayTypeItem {
  icon: string
  label: string
  value: DisplayType
  iconStyle?: StyleValue
  disabled?: boolean
}

const showDownloadDialog = ref(false)

const displayActionItems = computed(() => {
  const dataDownloadEnabled = props.settings.actions.downloadData
  return [
    {
      icon: 'mdi-download',
      label: t('download_time_series'),
      action: () => {
        showDownloadDialog.value = true
      },
      disabled: (props.displayConfig?.index ?? -1) === -1,
      hidden: !dataDownloadEnabled,
    },
  ].filter((item) => !item.hidden)
})

function toDisplayType(
  value: typeof props.settings.general.startPanel,
): DisplayType {
  switch (value) {
    case 'metaDataPanel':
      return DisplayType.Information
    case 'timeSeriesChart':
      return DisplayType.TimeSeriesChart
    case 'timeSeriesTable':
      return DisplayType.TimeSeriesTable
    case 'verticalProfileChart':
      return DisplayType.ElevationChart
    case 'verticalProfileTable':
      throw new Error('Vertical profile table is not supported')
    default:
      throw new Error(`Unknown start panel: ${value}`)
  }
}

const displayType = ref<DisplayType>(
  toDisplayType(props.settings.general.startPanel),
)
watch(
  () => props.settings.general.startPanel,
  (newValue) => {
    displayType.value = toDisplayType(newValue)
  },
  { immediate: true },
)

const displayTypeItems = computed<DisplayTypeItem[]>(() => {
  const noElevationCharts = !(
    (props.elevationChartDisplayconfig?.subplots?.length ?? 0) > 0
  )
  const elevationChartsDefined = props.elevationChartDisplayconfig !== undefined

  const noTooltip = props.informationContent === null
  const tooltipDefined = props.informationContent !== undefined

  const chartEnabled = props.settings.timeSeriesChart.enabled
  const elevationChartEnabled =
    props.settings.verticalProfileChart.enabled && elevationChartsDefined
  const tableEnabled = props.settings.timeSeriesTable.enabled
  const metaDataEnabled = props.settings.metaDataPanel.enabled && tooltipDefined
  return [
    {
      icon: 'mdi-chart-line',
      label: 'Chart',
      value: DisplayType.TimeSeriesChart,
      hidden: !chartEnabled,
    },
    {
      icon: 'mdi-elevation-rise',
      label: 'Vertical profile',
      value: DisplayType.ElevationChart,
      iconStyle: 'transform: rotate(-90deg);',
      disabled: noElevationCharts,
      hidden: !elevationChartEnabled,
    },
    {
      icon: 'mdi-table',
      label: 'Table',
      value: DisplayType.TimeSeriesTable,
      hidden: !tableEnabled,
    },
    {
      icon: 'mdi-information-outline',
      label: 'Information',
      value: DisplayType.Information,
      disabled: noTooltip,
      hidden: !metaDataEnabled,
    },
    // Mdi icon for metatdata at the current location
    //    {
    //     icon: 'mdi-information',
    //    label: 'Metadata',
  ].filter((item) => !item.hidden)
})

watch(displayTypeItems, () => {
  const activeItems = displayTypeItems.value.map((dt) => dt.value)
  if (!activeItems.includes(displayType.value) && activeItems.length > 0) {
    displayType.value = activeItems[0]
  }
})
</script>
