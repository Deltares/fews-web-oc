<template>
  <WindowComponent :toolBar="settings.general.toolBar">
    <template v-slot:toolbar>
      <v-toolbar-items
        class="flex-0-0"
        v-model="displayType"
        mandatory
        size="small"
      >
        <template v-if="displayTypeItems.length > 1">
          <v-btn
            v-for="item in displayTypeItems"
            :key="item.value"
            :value="item.value"
            :aria-label="item.label"
            :text="item.label"
            :active="displayType === item.value"
            :disabled="item.disabled"
            variant="text"
            min-width="48"
            class="pa-0"
            @click="onDisplayTypeClick(item.value)"
          >
            <v-icon :style="item.iconStyle">{{ item.icon }}</v-icon>
          </v-btn>
        </template>
      </v-toolbar-items>

      <slot name="toolbar-title">
        <span class="ml-5">{{ displayConfig?.title }}</span>
      </slot>
      <v-spacer />
    </template>
    <template v-slot:toolbar-append>
      <TimeSeriesDisplayActions
        :displayConfig="displayConfig"
        :currentTime="currentTime"
        :dynamicReport="dynamicReport"
        :downloadReport="downloadReport"
        :filter="filter"
        :settings="settings"
      />
      <slot name="toolbar-append" />
    </template>
    <TimeSeriesComponent
      :config="displayConfig ?? undefined"
      :elevation-chart-config="elevationChartDisplayconfig ?? undefined"
      :brush-chart-config="brushChartConfig ?? undefined"
      :disable-thinning="disableThinning"
      :current-time="currentTime"
      v-model:displayType="displayType"
      :information-content="informationContent"
      :dynamic-report="dynamicReport"
      :settings="settings"
    >
    </TimeSeriesComponent>
  </WindowComponent>
</template>

<script setup lang="ts">
import { ref, StyleValue, watch, watchEffect } from 'vue'
import WindowComponent from '@/components/general/WindowComponent.vue'
import TimeSeriesComponent from '@/components/timeseries/TimeSeriesComponent.vue'
import TimeSeriesDisplayActions from '@/components/timeseries/TimeSeriesDisplayActions.vue'
import { DisplayConfig, DisplayType } from '@/lib/display/DisplayConfig'
import { type ChartsSettings } from '@/lib/topology/componentSettings'
import type { DynamicReportPanelConfig } from '@/services/useDynamicReport'
import type {
  FilterActionsFilter,
  TimeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'

interface Props {
  displayConfig?: DisplayConfig | null
  brushChartConfig?: DisplayConfig | null
  disableThinning?: boolean
  elevationChartDisplayconfig?: DisplayConfig | null
  currentTime?: Date
  informationContent?: string | null
  dynamicReport?: DynamicReportPanelConfig | null
  downloadReport?: boolean
  filter?: FilterActionsFilter | TimeSeriesGridActionsFilter
  settings: ChartsSettings
}

const props = withDefaults(defineProps<Props>(), { downloadReport: true })

interface DisplayTypeItem {
  icon: string
  label: string
  value: DisplayType
  iconStyle?: StyleValue
  disabled?: boolean
}

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
    case 'dynamicReportDisplay':
      return DisplayType.DynamicReport
    case 'verticalProfileTable':
      throw new Error('Vertical profile table is not supported')
    default:
      throw new Error(`Unknown start panel: ${value}`)
  }
}

const displayType = ref<DisplayType>(
  toDisplayType(props.settings.general.startPanel),
)
// Whether the user explicitly selected a display type, in which case the
// start panel should no longer be selected automatically once it becomes
// available (e.g. after asynchronously loading its content).
const userSelectedDisplayType = ref(false)
watch(
  () => props.settings.general.startPanel,
  (newValue) => {
    displayType.value = toDisplayType(newValue)
    userSelectedDisplayType.value = false
  },
  { immediate: true },
)

function onDisplayTypeClick(value: DisplayType) {
  displayType.value = value
  userSelectedDisplayType.value = true
}

const displayTypeItems = ref<DisplayTypeItem[]>([])

watchEffect(() => {
  const noElevationCharts =
    (props.elevationChartDisplayconfig?.subplots?.length ?? 0) === 0
  const elevationChartsDefined = props.elevationChartDisplayconfig !== undefined

  const noTooltip = props.informationContent === null
  const tooltipDefined = props.informationContent !== undefined

  const chartEnabled = props.settings.timeSeriesChart.enabled
  const elevationChartEnabled =
    props.settings.verticalProfileChart.enabled && elevationChartsDefined
  const tableEnabled = props.settings.timeSeriesTable.enabled
  const metaDataEnabled = props.settings.metaDataPanel.enabled && tooltipDefined

  const dynamicReportEnabled =
    props.settings.dynamicReportDisplay.enabled &&
    props.dynamicReport !== undefined
  const noDynamicReport = props.dynamicReport === null
  const enabledItems = [
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
    {
      icon: 'mdi-table-clock',
      label: 'Report',
      value: DisplayType.DynamicReport,
      disabled: noDynamicReport,
      hidden: !dynamicReportEnabled,
    },
  ].filter((item) => !item.hidden)
  const activeItems = enabledItems
    .filter((item) => !item.disabled)
    .map((dt) => dt.value)
  const startDisplayType = toDisplayType(props.settings.general.startPanel)
  if (
    !userSelectedDisplayType.value &&
    activeItems.includes(startDisplayType)
  ) {
    displayType.value = startDisplayType
  } else if (!activeItems.includes(displayType.value)) {
    displayType.value = activeItems[0] ?? DisplayType.Unknown
  }
  displayTypeItems.value = enabledItems
})
</script>
