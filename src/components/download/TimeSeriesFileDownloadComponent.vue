<template>
  <v-dialog v-model="downloadDialogStore.showDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Download timeseries</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="fileName"
          label="File Name"
          variant="underlined"
          density="compact"
        >
          <template v-slot:append>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" size="small" variant="tonal">
                  {{ fileType }}
                  <v-icon>mdi-chevron-down</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="(_item, key) in fileTypes"
                  :key="key"
                  density="compact"
                  :disabled="isOnlyHeadersDownload && key === 'csv'"
                  @click="fileType = key"
                >
                  <v-list-item-title>{{ key }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-text-field>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn
          variant="flat"
          color="primary"
          @click="() => downloadFile(fileTypes[fileType])"
          >Download</v-btn
        >
        <v-btn @click="() => cancelDialog()">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  ActionsPeriodDate,
  DocumentFormat,
  filterActionsFilter,
  PiWebserviceProvider,
  TimeSeriesFilter,
  timeSeriesGridActionsFilter,
  TimeSeriesTopologyActionsFilter,
} from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { DisplayConfig } from '@/lib/display/DisplayConfig.ts'
import type { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'
import { downloadFileAttachment } from '@/lib/download/downloadFiles.ts'
import {
  computed,
  onMounted,
  onUnmounted,
  onUpdated,
  ref,
  toValue,
  watch,
  watchEffect,
} from 'vue'
import { useSystemTimeStore } from '@/stores/systemTime.ts'
import { UseTimeSeriesOptions } from '@/services/useTimeSeries'
import { DateTime } from 'luxon'
import { DataDownloadFilter } from '@/lib/download/types/DataDownloadFilter.ts'
import { useDownloadDialogStore } from '@/stores/downloadDialog'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { useAlertsStore } from '@/stores/alerts'

const store = useSystemTimeStore()
const downloadDialogStore = useDownloadDialogStore()
const viewPeriodFromStore = computed<UseTimeSeriesOptions>(() => {
  return {
    startTime: store.startTime,
    endTime: store.endTime,
  }
})

const alertStore = useAlertsStore()
const userId = ref('')
onMounted(() => {
  userId.value = crypto.randomUUID()
})

interface Props {
  config?: DisplayConfig | null
  options: UseDisplayConfigOptions
  filter?:
    | filterActionsFilter
    | timeSeriesGridActionsFilter
    | DataDownloadFilter
    | undefined
  startTime?: Date | undefined
  endTime?: Date | undefined
}

const fileTypes = {
  csv: DocumentFormat.PI_CSV,
  json: DocumentFormat.PI_JSON,
  xml: DocumentFormat.PI_XML,
} as const

const props = defineProps<Props>()

const fileType = ref<keyof typeof fileTypes>('csv')

const cancelDialog = () => {
  downloadDialogStore.showDialog = false
}
const fileName = ref('timeseries')
onUpdated(() => {
  if (!downloadDialogStore.showDialog) return
  let dateValue = new Date()
  const FILE_FORMAT_DATE_FMT = 'yyyyMMddHHmmss'
  const defaultDateTimeString =
    DateTime.fromJSDate(dateValue).toFormat(FILE_FORMAT_DATE_FMT)
  fileName.value = `timeseries_${defaultDateTimeString}`
})
watch(
  () => props.config,
  () => {
    downloadDialogStore.disabled = (props.config?.index ?? -1) == -1
  },
)
onUnmounted(() => {
  downloadDialogStore.disabled = true
})

const isOnlyHeadersDownload = computed(() => {
  return isDataDownloadFilter(props.filter) ? props.filter.onlyHeaders : false
})
watchEffect(() => {
  if (isOnlyHeadersDownload.value && fileType.value === 'csv') {
    fileType.value = 'json'
  }
})

function isTimeSeriesGridActionsFilter(
  filter: filterActionsFilter | timeSeriesGridActionsFilter | undefined,
): filter is timeSeriesGridActionsFilter {
  return (filter as timeSeriesGridActionsFilter)?.x !== undefined
}

function isDataDownloadFilter(
  filter:
    | filterActionsFilter
    | timeSeriesGridActionsFilter
    | TimeSeriesFilter
    | undefined,
): filter is DataDownloadFilter {
  return (filter as DataDownloadFilter)?.filterId !== undefined
}

function isFilterActionsFilter(
  filter: filterActionsFilter | timeSeriesGridActionsFilter | undefined,
): filter is filterActionsFilter {
  return (filter as filterActionsFilter)?.filterId !== undefined
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

function parsePiDateTime(dateTime: ActionsPeriodDate | undefined) {
  return dateTime ? `${dateTime.date}T${dateTime.time}Z` : dateTime
}

// use startTime and endTime if set, otherwise use the options from the store, otherwise use the period form the config
function determineViewPeriod() {
  const _options = toValue(viewPeriodFromStore)
  let startDate: Date | null | undefined = props.startTime
    ? props.startTime
    : _options?.startTime
  let endDate: Date | null | undefined = props.endTime
    ? props.endTime
    : _options?.endTime

  if (!startDate) {
    const parsedStartDate = parsePiDateTime(props.config?.period?.startDate)
    if (parsedStartDate) startDate = new Date(parsedStartDate)
  }
  if (!endDate) {
    const parsedEndDate = parsePiDateTime(props.config?.period?.endDate)
    if (parsedEndDate) endDate = new Date(parsedEndDate)
  }

  let startTime: string | null = null
  let endTime: string | null = null
  if (startDate || endDate) {
    // if either startTime or endTime is set, use it.
    if (startDate) {
      startTime = DateTime.fromJSDate(startDate, {
        zone: 'UTC',
      })
        .set({ millisecond: 0 })
        .toISO({ suppressMilliseconds: true })
    }
    if (endDate) {
      endTime = DateTime.fromJSDate(endDate, {
        zone: 'UTC',
      })
        .set({ millisecond: 0 })
        .toISO({ suppressMilliseconds: true })
    }
  }

  const result: Pick<TimeSeriesFilter, 'startTime' | 'endTime'> = {}

  if (startDate) {
    result.startTime = startTime ?? undefined
  }
  if (endDate) {
    result.endTime = endTime ?? undefined
  }

  return result
}

const downloadFile = (downloadFormat: DocumentFormat) => {
  const viewPeriod = determineViewPeriod()

  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  if (props.filter) {
    if (isDataDownloadFilter(props.filter)) {
      const url = piProvider.timeSeriesUrl({
        ...props.filter,
        documentFormat: downloadFormat,
        ...viewPeriod,
      })
      return downloadFileSafe(
        url.href,
        fileName.value,
        downloadFormat,
        authenticationManager.getAccessToken(),
      )
    }
  }
  if (props.filter) {
    if (isFilterActionsFilter(props.filter)) {
      const url = piProvider.timeSeriesFilterActionsUrl({
        ...props.filter,
        documentFormat: downloadFormat,
        ...viewPeriod,
      })
      return downloadFileSafe(
        url.href,
        fileName.value,
        downloadFormat,
        authenticationManager.getAccessToken(),
      )
    }
    if (isTimeSeriesGridActionsFilter(props.filter)) {
      const url = piProvider.timeSeriesGridUrl({
        ...props.filter,
        documentFormat: downloadFormat,
        ...viewPeriod,
      })
      return downloadFileSafe(
        url.href,
        fileName.value,
        downloadFormat,
        authenticationManager.getAccessToken(),
      )
    }
  }

  const timeSeriesFilter: TimeSeriesTopologyActionsFilter = {
    documentFormat: downloadFormat,
    nodeId: props.config?.nodeId ?? '',
    timeSeriesDisplayIndex: props.config?.index ?? 0,
    convertDatum: props.options.convertDatum,
    useDisplayUnits: props.options.useDisplayUnits,
    ...viewPeriod,
  }
  const url = piProvider.timeSeriesTopologyActionsUrl(timeSeriesFilter)
  return downloadFileSafe(
    url.href,
    fileName.value,
    downloadFormat,
    authenticationManager.getAccessToken(),
  )
}

async function downloadFileSafe(
  url: string,
  fileName: string,
  documentFormat: string,
  accessToken: string,
) {
  try {
    await downloadFileAttachment(url, fileName, documentFormat, accessToken)
  } catch (error) {
    if (error instanceof Error) {
      alertStore.addAlert({
        id: `data-download-error-${userId.value}`,
        type: 'error',
        message: error.message,
      })
      downloadDialogStore.showDialog = false
    }
  }
}
</script>
