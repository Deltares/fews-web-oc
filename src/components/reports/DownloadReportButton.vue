<template>
  <v-btn
    icon
    :disabled="disabled"
    :aria-label="t('reports.downloadReport')"
    @click="downloadReport"
  >
    <v-icon>mdi-download</v-icon>
    <v-tooltip activator="parent" location="bottom">
      {{ t('reports.downloadReport') }}
    </v-tooltip>
  </v-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { downloadDynamicReport } from '@/lib/download/downloadDynamicReport'
import { configManager } from '@/services/application-config'

interface Props {
  displayId: string
  locationId?: string
  time?: string
  disabled?: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

async function downloadReport() {
  await downloadDynamicReport(baseUrl, {
    displayId: props.displayId,
    locationId: props.locationId,
    time: props.time,
  })
}
</script>
