<template>
  <div>
    <v-menu>
      <template #activator="{ props }">
        <v-btn v-bind="props" size="small" variant="tonal" :disabled>
          {{ selectedFileType.title }}
          <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="ft in fileTypes"
          :key="ft.title"
          density="compact"
          :title="ft.title"
          :active="selectedFileType.title === ft.title"
          @click="selectedFileType = ft"
        />
      </v-list>
    </v-menu>

    <v-btn
      variant="plain"
      @click="downloadFilters"
      :disabled
      icon="mdi-download"
    />
  </div>
</template>

<script setup lang="ts">
import { convertJSDateToFewsPiParameter } from '@/lib/date'
import { downloadFileAttachment } from '@/lib/download'
import { getDownloadFileUrl } from '@/lib/download/download'
import { configManager } from '@/services/application-config'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import { useAlertsStore } from '@/stores/alerts'
import { DocumentFormat } from '@deltares/fews-pi-requests'
import type { filterActionsFilter } from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue'

interface Props {
  filters: filterActionsFilter[]
  startTime: Date
  endTime: Date
}
const props = defineProps<Props>()

const disabled = computed(() => props.filters.length === 0)

const alertStore = useAlertsStore()

const fileTypes = [
  { title: 'csv', format: DocumentFormat.PI_CSV_ID_AND_NAME },
  { title: 'json', format: DocumentFormat.PI_JSON },
  { title: 'xml', format: DocumentFormat.PI_XML },
]

const selectedFileType = ref(fileTypes[0])

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

async function downloadFilters() {
  const viewPeriod = {
    startTime: convertJSDateToFewsPiParameter(props.startTime),
    endTime: convertJSDateToFewsPiParameter(props.endTime),
  }
  const headers = await authenticationManager.getAuthorizationHeaders()

  const fileType = selectedFileType.value

  const date = new Date()
  const dateString = date.toISOString().replace(/[-:T]/g, '').slice(0, 14)

  props.filters.forEach((filter) => {
    const url = getDownloadFileUrl(baseUrl, filter, fileType.format, viewPeriod)
    const fileName = `timeseries_${filter.parameterIds}_${dateString}`

    downloadFileSafe(url.href, fileName, selectedFileType.value.format, headers)
  })
}

async function downloadFileSafe(
  url: string,
  fileName: string,
  documentFormat: DocumentFormat,
  headers: Headers,
) {
  try {
    await downloadFileAttachment(url, fileName, documentFormat, headers)
  } catch (error) {
    if (error instanceof Error) {
      alertStore.addAlert({
        type: 'error',
        message: error.message,
      })
    }
  }
}
</script>
