<template>
  <v-btn
    v-if="displayActionItems.length"
    size="small"
    icon
    name="Time series actions"
  >
    <v-icon size="small">mdi-dots-horizontal</v-icon>
    <v-menu activator="parent" density="compact">
      <v-list>
        <v-list-item
          v-for="item in displayActionItems"
          :key="item.label"
          @click="item.action"
          :prepend-icon="item.icon"
          :disabled="item.disabled"
        >
          {{ item.label }}
        </v-list-item>
      </v-list>
    </v-menu>
  </v-btn>
  <TimeSeriesFileDownloadComponent
    v-model="showDownloadDialog"
    :config="displayConfig"
    :options="options"
    :filter="filter"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  FilterActionsFilter,
  TimeSeriesGridActionsFilter,
} from '@deltares/fews-pi-requests'
import TimeSeriesFileDownloadComponent from '@/components/download/TimeSeriesFileDownloadComponent.vue'
import type { DisplayConfig } from '@/lib/display/DisplayConfig'
import type { ChartsSettings } from '@/lib/topology/componentSettings'
import type { DynamicReportPanelConfig } from '@/services/useDynamicReport'
import { useSelectedDate } from '@/services/useSelectedDate'
import { useUserSettingsStore } from '@/stores/userSettings'

interface Props {
  displayConfig?: DisplayConfig | null
  currentTime?: Date
  dynamicReport?: DynamicReportPanelConfig | null
  downloadReport?: boolean
  filter?: FilterActionsFilter | TimeSeriesGridActionsFilter
  settings: ChartsSettings
}

const props = withDefaults(defineProps<Props>(), { downloadReport: true })
const emit = defineEmits<{ 'export-report': [] }>()
const { t } = useI18n()
const { selectedDate } = useSelectedDate(() => props.currentTime)
const dynamicReportTime = computed(() =>
  props.dynamicReport?.capabilities.dimension?.name === 'time'
    ? selectedDate.value?.toISOString()
    : undefined,
)

const userSettings = useUserSettingsStore()
const options = computed<
  Pick<FilterActionsFilter, 'useDisplayUnits' | 'convertDatum'>
>(() => ({
  useDisplayUnits: userSettings.useDisplayUnits,
  convertDatum: userSettings.convertDatum,
}))

const showDownloadDialog = ref(false)

const displayActionItems = computed(() => {
  const dataDownloadEnabled = props.settings.actions.downloadData
  return [
    {
      icon: 'mdi-download',
      label: t('download.downloadTimeSeries'),
      action: () => {
        showDownloadDialog.value = true
      },
      disabled: (props.displayConfig?.index ?? -1) === -1,
      hidden: !dataDownloadEnabled,
    },
    {
      icon: 'mdi-export-variant',
      label: t('dynamicReport.exportReport'),
      action: () => emit('export-report'),
      disabled:
        props.dynamicReport?.capabilities.dimension?.name === 'time' &&
        dynamicReportTime.value === undefined,
      hidden:
        !props.downloadReport ||
        !props.settings.dynamicReportDisplay.enabled ||
        !props.dynamicReport,
    },
  ].filter((item) => !item.hidden)
})
</script>
