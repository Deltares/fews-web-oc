<template>
  <v-dialog v-model="showDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">{{
        t('download_timeseries')
      }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="fileName"
          :label="t('file_name')"
          variant="underlined"
          density="compact"
        >
          <template v-slot:append>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" size="small" variant="tonal">
                  {{ fileType.title }}
                  <v-icon>mdi-chevron-down</v-icon>
                </v-btn>
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
      <v-card-actions class="justify-end">
        <v-btn
          variant="flat"
          color="primary"
          @click="() => downloadFile(fileType.format)"
        >
          Download
        </v-btn>
        <v-btn @click="() => cancelDialog()">{{ t('cancel') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  CorrelationFilter,
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
import { computed, onUpdated, ref, toValue, watchEffect } from 'vue'
import { useSystemTimeStore } from '@/stores/systemTime.ts'
import { UseTimeSeriesOptions } from '@/services/useTimeSeries'
import { DateTime } from 'luxon'
import { DataDownloadFilter } from '@/lib/download/types/DataDownloadFilter.ts'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { useAlertsStore } from '@/stores/alerts'
import {
  isCorrelationFilter,
  isDataDownloadFilter,
  isFilterActionsFilter,
  isTimeSeriesFilter,
  isTimeSeriesGridActionsFilter,
} from '@/lib/filters'
import { convertFewsPiDateTimeToJsDate } from '@/lib/date'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
interface Props {
  config?: DisplayConfig | null
  options?: UseDisplayConfigOptions
  filter?:
    | filterActionsFilter
    | timeSeriesGridActionsFilter
    | DataDownloadFilter
    | CorrelationFilter
    | undefined
  startTime?: Date | undefined
  endTime?: Date | undefined
}

const props = defineProps<Props>()

const showDialog = defineModel<boolean>({
  default: false,
})

const store = useSystemTimeStore()
const viewPeriodFromStore = computed<UseTimeSeriesOptions>(() => {
  return {
    startTime: store.startTime,
    endTime: store.endTime,
  }
})

const alertStore = useAlertsStore()

const isOnlyHeadersDownload = computed(() => {
  return props.filter && isDataDownloadFilter(props.filter)
    ? props.filter.onlyHeaders
    : false
})

interface FileType {
  title: string
  format: DocumentFormat
  disabled?: boolean
}

const fileTypes = computed<FileType[]>(() => [
  {
    title: 'csv',
    format: DocumentFormat.PI_CSV_ID_AND_NAME,
    disabled:
      isOnlyHeadersDownload.value ||
      (props.filter && isCorrelationFilter(props.filter)),
  },
  {
    title: 'json',
    format: DocumentFormat.PI_JSON,
    disabled: false,
  },
  {
    title: 'xml',
    format: DocumentFormat.PI_XML,
    disabled: props.filter && isCorrelationFilter(props.filter),
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
const fileName = ref('timeseries')
onUpdated(() => {
  if (!showDialog.value) return
  const FILE_FORMAT_DATE_FMT = 'yyyyMMddHHmmss'
  const defaultDateTimeString = DateTime.now().toFormat(FILE_FORMAT_DATE_FMT)
  fileName.value = `timeseries_${defaultDateTimeString}`
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

// use startTime and endTime if set, otherwise use the options from the store, otherwise use the period form the config
function determineViewPeriod() {
  const _options = toValue(viewPeriodFromStore)
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

function getDownloadFileUrl(downloadFormat: DocumentFormat) {
  const viewPeriod = determineViewPeriod()

  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  if (props.filter) {
    if (
      isDataDownloadFilter(props.filter) ||
      isTimeSeriesFilter(props.filter)
    ) {
      return piProvider.timeSeriesUrl({
        ...props.filter,
        documentFormat: downloadFormat,
        ...viewPeriod,
      })
    }
    if (isFilterActionsFilter(props.filter)) {
      return piProvider.timeSeriesFilterActionsUrl({
        ...props.filter,
        documentFormat: downloadFormat,
        ...viewPeriod,
      })
    }
    if (isTimeSeriesGridActionsFilter(props.filter)) {
      return piProvider.timeSeriesGridUrl({
        ...props.filter,
        documentFormat: downloadFormat,
        ...viewPeriod,
      })
    }
    if (isCorrelationFilter(props.filter)) {
      return piProvider.correlationUrl({
        ...props.filter,
        ...viewPeriod,
      })
    }
  }

  const timeSeriesFilter: TimeSeriesTopologyActionsFilter = {
    documentFormat: downloadFormat,
    nodeId: props.config?.nodeId ?? '',
    timeSeriesDisplayIndex: props.config?.index ?? 0,
    convertDatum: props.options?.convertDatum,
    useDisplayUnits: props.options?.useDisplayUnits,
    ...viewPeriod,
  }
  return piProvider.timeSeriesTopologyActionsUrl(timeSeriesFilter)
}

async function downloadFile(downloadFormat: DocumentFormat) {
  const url = getDownloadFileUrl(downloadFormat)
  const accessToken = authenticationManager.getAccessToken()

  await downloadFileSafe(url.href, fileName.value, downloadFormat, accessToken)
}

async function downloadFileSafe(
  url: string,
  fileName: string,
  documentFormat: DocumentFormat,
  accessToken: string,
) {
  try {
    await downloadFileAttachment(url, fileName, documentFormat, accessToken)
  } catch (error) {
    if (error instanceof Error) {
      alertStore.addAlert({
        id: `data-download-error`,
        type: 'error',
        message: error.message,
      })
      showDialog.value = false
    }
  }
}
</script>
