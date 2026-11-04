<template>
  <ShadowFrame :htmlContent="reportHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ShadowFrame from '@/components/general/ShadowFrame.vue'
import { configManager } from '@/services/application-config'
import {
  type DynamicReportPanelConfig,
  useDynamicReportHtml,
} from '@/services/useDynamicReport'

interface Props {
  config: DynamicReportPanelConfig
  selectedDate?: Date
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const filter = computed(() => ({
  locationId: props.config.locationId,
  time: props.selectedDate?.toISOString(),
}))

const { reportHtml } = useDynamicReportHtml(
  baseUrl,
  () => props.config.displayId,
  () => props.config.capabilities,
  filter,
)
</script>
