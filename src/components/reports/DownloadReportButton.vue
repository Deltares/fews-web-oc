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
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { downloadFileWithXhr } from '@/lib/download'
import { getRequestHeaders } from '@/lib/requests/transformRequest'
import { configManager } from '@/services/application-config'

interface Props {
  displayId: string
  locationId?: string
  time?: string
  disabled?: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()
const provider = new PiWebserviceProvider(
  configManager.get('VITE_FEWS_WEBSERVICES_URL'),
)

async function downloadReport() {
  const url = provider.dynamicReportDisplayUrl({
    displayId: props.displayId,
    locationId: props.locationId,
    time: props.time,
    useLastValue: true,
  })
  const filename = [props.displayId, props.locationId, props.time]
    .filter(Boolean)
    .join('-')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
  const headers = await getRequestHeaders()
  await downloadFileWithXhr(url, `${filename}.html`, headers)
}
</script>
