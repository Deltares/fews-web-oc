<template>
  <ShadowFrame v-if="reportHtml" :htmlContent="reportHtml" />
  <span v-else-if="isReady" class="mx-auto mt-2">{{
    t('reports.noReportAvailable')
  }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ShadowFrame from '@/components/general/ShadowFrame.vue'
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

const filter = computed(() => ({
  locationId: props.config.locationId,
  time: props.selectedDate?.toISOString(),
}))

const { reportHtml, isReady } = useDynamicReportHtml(
  baseUrl,
  () => props.config.displayId,
  () => props.config.capabilities,
  filter,
)
</script>
