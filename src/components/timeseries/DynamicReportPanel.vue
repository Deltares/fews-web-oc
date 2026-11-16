<template>
  <DynamicReportWorkspace
    :html="reportHtml"
    :display-id="config.displayId"
    :location-id="config.locationId"
    :time="filter.time"
    :initial-node-id="initialNodeId"
    :settings="settings"
    :can-edit="isReady && !isLoading && !error"
    :show-export="downloadReport && settings.report.downloadReport"
    :show-toolbar="exportMode"
    :toolbar-target="toolbarTarget"
    @close-export="emit('close-export')"
  >
    <template #empty>
      <v-alert v-if="error" type="error" variant="tonal" class="ma-2">
        {{ t('reports.loadFailed') }}
      </v-alert>
      <div v-else-if="isReady || isMissingTime" class="text-center mt-2">
        {{ t('reports.noReportAvailable') }}
      </div>
    </template>
  </DynamicReportWorkspace>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DynamicReportWorkspace from '@/components/reports/DynamicReportWorkspace.vue'
import {
  getDefaultSettings,
  type ComponentSettings,
} from '@/lib/topology/componentSettings'
import { configManager } from '@/services/application-config'
import {
  type DynamicReportPanelConfig,
  useDynamicReportHtml,
} from '@/services/useDynamicReport'
import { useI18n } from 'vue-i18n'

interface Props {
  config: DynamicReportPanelConfig
  selectedDate?: Date
  settings?: ComponentSettings
  initialNodeId?: string
  downloadReport?: boolean
  exportMode?: boolean
  toolbarTarget?: HTMLElement
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
  downloadReport: true,
})
const emit = defineEmits<{ 'close-export': [] }>()

const { t } = useI18n()
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const hasTimeDimension = computed(
  () => props.config.capabilities.dimension?.name === 'time',
)
const isMissingTime = computed(
  () => hasTimeDimension.value && props.selectedDate === undefined,
)

const filter = computed(() => ({
  locationId: props.config.locationId,
  // Only read the date for reports that depend on it, to avoid refetching
  time: hasTimeDimension.value ? props.selectedDate?.toISOString() : undefined,
}))

const { reportHtml, isReady, isLoading, error } = useDynamicReportHtml(
  baseUrl,
  () => props.config.displayId,
  () => props.config.capabilities,
  filter,
)
</script>
