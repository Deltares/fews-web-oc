<template>
  <div v-if="reportHtml" class="d-flex flex-column h-100 w-100">
    <div v-if="downloadReport" class="d-flex justify-end flex-shrink-0">
      <DownloadReportButton
        :displayId="config.displayId"
        :locationId="filter.locationId"
        :time="filter.time"
        :disabled="isLoading || !isReady || !!error || isMissingTime"
      />
    </div>
    <ShadowFrame :htmlContent="reportHtml" />
  </div>
  <v-alert v-else-if="error" type="error" variant="tonal" class="ma-2">
    {{ t('reports.loadFailed') }}
  </v-alert>
  <div v-else-if="isReady || isMissingTime" class="text-center mt-2">
    {{ t('reports.noReportAvailable') }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ShadowFrame from '@/components/general/ShadowFrame.vue'
import DownloadReportButton from '@/components/reports/DownloadReportButton.vue'
import { configManager } from '@/services/application-config'
import {
  type DynamicReportPanelConfig,
  useDynamicReportHtml,
} from '@/services/useDynamicReport'
import { useI18n } from 'vue-i18n'

interface Props {
  config: DynamicReportPanelConfig
  selectedDate?: Date
  downloadReport?: boolean
}

const props = withDefaults(defineProps<Props>(), { downloadReport: true })

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
