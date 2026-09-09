<template>
  <div>
    <v-menu>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          size="small"
          variant="tonal"
          :disabled
          :text="selectedFileType.title"
          append-icon="mdi-chevron-down"
        />
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
      @click="showDownloadDialog = true"
      :disabled
      icon="mdi-download"
    />

    <v-dialog v-model="showDownloadDialog" max-width="400">
      <v-card :title="t('download.downloadData')">
        <v-card-text>
          {{ t('download.fileFormat') }}: {{ selectedFileType.title }}
        </v-card-text>
        <v-card-actions class="justify-space-between flex-wrap">
          <DownloadDisclaimerAcceptance />
          <div class="d-flex w-100 justify-end ga-2">
            <v-btn
              @click="showDownloadDialog = false"
              :text="t('common.cancel')"
            />
            <v-btn
              variant="flat"
              color="primary"
              :disabled="!canDownload"
              @click="confirmDownload"
              :text="t('download.download')"
            />
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  convertJSDateToFewsPiParameter,
  getFilenameTimestamp,
} from '@/lib/date'
import { downloadFileAttachment } from '@/lib/download'
import { getDownloadFileUrl } from '@/lib/download/download'
import { configManager } from '@/services/application-config'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import { useAlertsStore } from '@/stores/alerts'
import { useDownloadDisclaimerStore } from '@/stores/downloadDisclaimer'
import DownloadDisclaimerAcceptance from '@/components/download/DownloadDisclaimerAcceptance.vue'
import { DocumentFormat } from '@deltares/fews-pi-requests'
import type { FilterActionsFilter } from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  filters: FilterActionsFilter[]
  startTime: Date
  endTime: Date
}
const props = defineProps<Props>()

const disabled = computed(() => props.filters.length === 0)

const alertStore = useAlertsStore()
const downloadDisclaimerStore = useDownloadDisclaimerStore()

const fileTypes = [
  { title: 'csv', format: DocumentFormat.PI_CSV_ID_AND_NAME },
  { title: 'json', format: DocumentFormat.PI_JSON },
  { title: 'xml', format: DocumentFormat.PI_XML },
]

const selectedFileType = ref(fileTypes[0])
const showDownloadDialog = ref(false)

const canDownload = computed(
  () =>
    !downloadDisclaimerStore.isConfigured ||
    downloadDisclaimerStore.hasAccepted,
)

watch(showDownloadDialog, (newValue) => {
  if (!newValue) return
  downloadDisclaimerStore.ensureShown()
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

function confirmDownload() {
  if (!canDownload.value) return
  showDownloadDialog.value = false
  downloadFilters()
}

async function downloadFilters() {
  const viewPeriod = {
    startTime: convertJSDateToFewsPiParameter(props.startTime),
    endTime: convertJSDateToFewsPiParameter(props.endTime),
  }
  const headers = await authenticationManager.getAuthorizationHeaders()

  const fileType = selectedFileType.value

  const timestamp = getFilenameTimestamp()

  props.filters.forEach((filter) => {
    const url = getDownloadFileUrl(baseUrl, filter, fileType.format, viewPeriod)
    const fileName = `timeseries_${filter.parameterIds}_${timestamp}`

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
    const message = error instanceof Error ? error.message : 'Unknown error'
    alertStore.addAlert({
      type: 'error',
      message,
    })
  }
}
</script>
