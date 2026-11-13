<template>
  <Teleport to="#main" :disabled="!reportExportMode">
    <div
      class="d-flex flex-column h-100 w-100"
      :class="{ 'report-export-main bg-surface': reportExportMode }"
    >
      <WindowComponent
        :toolBar="reportExportMode ? 'true' : settings.general.toolBar"
      >
        <template v-slot:toolbar>
          <div
            v-if="reportExportMode"
            ref="reportToolbarTarget"
            class="d-flex w-100"
          />
          <template v-else>
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
        </template>
        <template v-if="!reportExportMode" v-slot:toolbar-append>
          <TimeSeriesDisplayActions
            :displayConfig="displayConfig"
            :currentTime="currentTime"
            :dynamicReport="dynamicReport"
            :downloadReport="reportDownloadEnabled"
            :filter="filter"
            :settings="settings"
            @export-report="openReportExport"
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
          :report-settings="reportSettings"
          :report-node-id="reportNodeId"
          :download-report="reportDownloadEnabled"
          :report-export-mode="reportExportMode"
          :report-toolbar-target="reportToolbarTarget"
          @close-report-export="reportExportMode = false"
          :settings="settings"
        >
        </TimeSeriesComponent>
      </WindowComponent>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, StyleValue, watch, watchEffect } from 'vue'
import WindowComponent from '@/components/general/WindowComponent.vue'
import TimeSeriesComponent from '@/components/timeseries/TimeSeriesComponent.vue'
import TimeSeriesDisplayActions from '@/components/timeseries/TimeSeriesDisplayActions.vue'
import { DisplayConfig, DisplayType } from '@/lib/display/DisplayConfig'
import {
  type ChartsSettings,
  type ComponentSettings,
} from '@/lib/topology/componentSettings'
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
  reportSettings?: ComponentSettings
  reportNodeId?: string
  downloadReport?: boolean
  filter?: FilterActionsFilter | TimeSeriesGridActionsFilter
  settings: ChartsSettings
}

const props = withDefaults(defineProps<Props>(), { downloadReport: true })
const reportExportMode = ref(false)
const reportToolbarTarget = ref<HTMLElement>()
const reportDownloadEnabled = computed(
  () =>
    props.downloadReport &&
    (props.reportSettings?.report.downloadReport ?? true),
)

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

function openReportExport() {
  onDisplayTypeClick(DisplayType.DynamicReport)
  reportExportMode.value = true
}

watch(
  [
    () => props.dynamicReport?.displayId,
    () => props.dynamicReport?.locationId,
    displayType,
    reportDownloadEnabled,
  ],
  () => {
    reportExportMode.value = false
  },
  { flush: 'sync' },
)

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

  const dynamicReportEnabled = props.settings.dynamicReportDisplay.enabled
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

<style scoped>
.report-export-main {
  position: fixed;
  top: var(--v-layout-top, 0px);
  right: var(--v-layout-right, 0px);
  bottom: var(--v-layout-bottom, 0px);
  left: var(--v-layout-left, 0px);
  width: auto !important;
  height: auto !important;
  /* Above map controls (1000), below Vuetify overlays (2000). */
  z-index: 1001;
}

@media print {
  .report-export-main {
    position: static;
  }
}
</style>
