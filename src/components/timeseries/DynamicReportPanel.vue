<template>
  <DynamicReportContent :html="reportHtml" class="flex-1-1">
  </DynamicReportContent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DynamicReportContent from '@/components/reports/DynamicReportContent.vue'
import { configManager } from '@/services/application-config'
import {
  type DynamicReportPanelConfig,
  useDynamicReportHtml,
} from '@/services/useDynamicReport'
import { useI18n } from 'vue-i18n'

interface Props {
  config: DynamicReportPanelConfig
  selectedDate?: Date
}

const props = defineProps<Props>()

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

const { reportHtml, isReady, error } = useDynamicReportHtml(
  baseUrl,
  () => props.config.displayId,
  () => props.config.capabilities,
  filter,
)
</script>
