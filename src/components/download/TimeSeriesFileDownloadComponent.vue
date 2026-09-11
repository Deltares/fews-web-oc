<template>
  <v-dialog v-model="showDialog" max-width="400">
    <v-card :title="t('download.downloadTimeSeries')">
      <v-card-text class="pb-0">
        <v-text-field
          v-model="fileNameInput"
          :label="t('download.fileName')"
          variant="underlined"
          density="compact"
          hide-details
        >
          <template #append>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  size="small"
                  variant="tonal"
                  :text="fileType.title"
                  append-icon="mdi-chevron-down"
                />
              </template>
              <v-list>
                <v-list-item
                  v-for="ft in fileTypes"
                  :key="ft.title"
                  density="compact"
                  :disabled="ft.disabled"
                  :title="ft.title"
                  :active="selectedFileType === ft.title"
                  @click="selectedFileType = ft.title"
                />
              </v-list>
            </v-menu>
          </template>
        </v-text-field>
      </v-card-text>
      <v-card-item>
        <DownloadDisclaimerAcceptance />
      </v-card-item>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="() => cancelDialog()">{{ t('common.cancel') }}</v-btn>
        <v-btn
          variant="flat"
          color="primary"
          :disabled="!canDownload"
          @click="() => downloadFile(fileType.format)"
        >
          Download
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  CorrelationFilter,
  DocumentFormat,
  FilterActionsFilter,
  TimeSeriesFilter,
  TimeSeriesGridActionsFilter,
  TimeSeriesTopologyActionsFilter,
} from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { DisplayConfig } from '@/lib/display/DisplayConfig.ts'
import { downloadFileAttachment } from '@/lib/download/downloadFiles.ts'
import { computed, ref, watchEffect, watch } from 'vue'
import { useSystemTimeStore } from '@/stores/systemTime.ts'
import { UseTimeSeriesOptions } from '@/services/useTimeSeries'
import { DateTime } from 'luxon'
import { DataDownloadFilter } from '@/lib/download/types/DataDownloadFilter.ts'
import { useAlertsStore } from '@/stores/alerts'
import { isCorrelationFilter, isDataDownloadFilter } from '@/lib/filters'
import { convertFewsPiDateTimeToJsDate, getFilenameTimestamp } from '@/lib/date'

import { useI18n } from 'vue-i18n'
import { getDownloadFileUrl } from '@/lib/download/download'
import { useDownloadDisclaimerStore } from '@/stores/downloadDisclaimer'
import DownloadDisclaimerAcceptance from '@/components/download/DownloadDisclaimerAcceptance.vue'
import { getRequestHeaders } from '@/lib/requests/transformRequest'

const { t } = useI18n()
type SingleFilter =
  | FilterActionsFilter
  | TimeSeriesGridActionsFilter
  | DataDownloadFilter
  | CorrelationFilter
  | TimeSeriesTopologyActionsFilter

interface Props {
  config?: DisplayConfig | null
  options?:
    Pick<FilterActionsFilter, 'useDisplayUnits' | 'convertDatum'> | undefined
  filter?: SingleFilter | SingleFilter[]
  startTime?: Date | undefined
  endTime?: Date | undefined
}

const props = defineProps<Props>()

const showDialog = defineModel<boolean>({
  default: false,
})

const store = useSystemTimeStore()
const downloadDisclaimerStore = useDownloadDisclaimerStore()
const viewPeriodFromStore = computed<UseTimeSeriesOptions>(() => {
  return {
    startTime: store.startTime,
    endTime: store.endTime,
  }
})

const alertStore = useAlertsStore()

// Normalize the filter prop, which can be a single filter or an array of
// filters, to always work with an array internally.
const filters = computed<SingleFilter[]>(() => {
  if (!props.filter) return []
  return Array.isArray(props.filter) ? props.filter : [props.filter]
})

const isOnlyHeadersDownload = computed(() => {
  return filters.value.some(
    (filter) => isDataDownloadFilter(filter) && filter.onlyHeaders,
  )
})

interface FileType {
  title: string
  format: DocumentFormat
  disabled?: boolean
}

const hasCorrelationFilter = computed(() =>
  filters.value.some((filter) => isCorrelationFilter(filter)),
)

const fileTypes = computed<FileType[]>(() => [
  {
    title: 'csv',
    format: DocumentFormat.PI_CSV_ID_AND_NAME,
    disabled: isOnlyHeadersDownload.value || hasCorrelationFilter.value,
  },
  {
    title: 'json',
    format: DocumentFormat.PI_JSON,
    disabled: false,
  },
  {
    title: 'xml',
    format: DocumentFormat.PI_XML,
    disabled: hasCorrelationFilter.value,
  },
])

const selectedFileType = ref('csv')
const fileType = computed(() => {
  return (
    fileTypes.value.find((ft) => ft.title === selectedFileType.value) ??
    fileTypes.value[0]
  )
})

watchEffect(() => {
  if (fileType.value.disabled) {
    selectedFileType.value =
      fileTypes.value.find((ft) => !ft.disabled)?.title ??
      fileTypes.value[0].title
  }
})

const cancelDialog = () => {
  showDialog.value = false
}
const fileNameInput = ref('timeseries')

const canDownload = computed(
  () =>
    !downloadDisclaimerStore.isConfigured ||
    downloadDisclaimerStore.hasAccepted,
)

watch(
  () => showDialog.value,
  (newValue) => {
    if (!newValue) return
    const timestamp = getFilenameTimestamp()
    fileNameInput.value = `timeseries_${timestamp}`
    downloadDisclaimerStore.ensureShown()
  },
)

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

// use startTime and endTime if set, otherwise use the options from the store, otherwise use the period form the config
function determineViewPeriod() {
  const _options = viewPeriodFromStore.value
  let startDate: Date | null | undefined = props.startTime
    ? props.startTime
    : _options?.startTime
  let endDate: Date | null | undefined = props.endTime
    ? props.endTime
    : _options?.endTime

  const period = props.config?.period

  if (!startDate && period) {
    startDate = convertFewsPiDateTimeToJsDate(period.startDate)
  }
  if (!endDate && period) {
    endDate = convertFewsPiDateTimeToJsDate(period.endDate)
  }

  const result: Pick<TimeSeriesFilter, 'startTime' | 'endTime'> = {}
  if (startDate) {
    const startTime = DateTime.fromJSDate(startDate, {
      zone: 'UTC',
    })
      .set({ millisecond: 0 })
      .toISO({ suppressMilliseconds: true })
    if (startTime) result.startTime = startTime
  }
  if (endDate) {
    const endTime = DateTime.fromJSDate(endDate, {
      zone: 'UTC',
    })
      .set({ millisecond: 0 })
      .toISO({ suppressMilliseconds: true })
    if (endTime) result.endTime = endTime
  }

  return result
}

function getTopologyActionsFilter(): TimeSeriesTopologyActionsFilter {
  return {
    nodeId: props.config?.nodeId ?? '',
    timeSeriesDisplayIndex: props.config?.index ?? 0,
    convertDatum: props.options?.convertDatum,
    useDisplayUnits: props.options?.useDisplayUnits,
  }
}

// When downloading multiple filters, disambiguate the file names using the
// filter's parameter ids (falling back to the index if not available).
function getFileNameSuffix(filter: SingleFilter, index: number): string {
  const parameterIds = (filter as FilterActionsFilter).parameterIds
  if (parameterIds) {
    return Array.isArray(parameterIds) ? parameterIds.join('_') : parameterIds
  }
  return `${index + 1}`
}

async function downloadFile(downloadFormat: DocumentFormat) {
  if (!canDownload.value) return
  const viewPeriod = determineViewPeriod()
  const filterList = filters.value.length
    ? filters.value
    : [getTopologyActionsFilter()]
  const headers = await getRequestHeaders()

  filterList.forEach((filter, index) => {
    const url = getDownloadFileUrl(baseUrl, filter, downloadFormat, viewPeriod)
    const fileName =
      filterList.length > 1
        ? `${fileNameInput.value}_${getFileNameSuffix(filter, index)}`
        : fileNameInput.value

    downloadFileSafe(url.href, fileName, downloadFormat, headers)
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
    const message =
      error instanceof Error ? error.message : t('download.errors.failed')
    alertStore.addAlert({
      type: 'error',
      message,
    })
    showDialog.value = false
  }
}
</script>
