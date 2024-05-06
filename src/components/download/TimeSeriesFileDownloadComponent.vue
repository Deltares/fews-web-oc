<template>
  <v-dialog v-model="model" max-width="400">
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
  TimeSeriesFilter,
  timeSeriesGridActionsFilter,
  TimeSeriesTopologyActionsFilter,
} from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { DisplayConfig } from '@/lib/display/DisplayConfig.ts'
import type { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'
import { filterToParams } from '@deltares/fews-wms-requests'
import { downloadFileAttachment } from '@/lib/download/downloadFiles.ts'
import { computed, onUpdated, ref, toValue } from 'vue'
import { useSystemTimeStore } from '@/stores/systemTime.ts'
import { UseTimeSeriesOptions } from '@/services/useTimeSeries'
import { DateTime } from 'luxon'
import { DataDownloadFilter } from '@/lib/download/types/DataDownloadFilter.ts'

const store = useSystemTimeStore()
const viewPeriodFromStore = computed<UseTimeSeriesOptions>(() => {
  return {
    startTime: store.startTime,
    endTime: store.endTime,
  }
})

interface Props {
  config?: DisplayConfig | undefined
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

const model = defineModel<boolean>()

const fileType = ref<keyof typeof fileTypes>('csv')

const cancelDialog = () => {
  model.value = false
}
const fileName = ref('timeseries')
onUpdated(() => {
  if (!model.value) return
  let dateValue = new Date()
  const FILE_FORMAT_DATE_FMT = 'yyyyMMddHHmmss'
  const defaultDateTimeString =
    DateTime.fromJSDate(dateValue).toFormat(FILE_FORMAT_DATE_FMT)
  fileName.value = `timeseries_${defaultDateTimeString}`
})

function isTimeSeriesGridActionsFilter(
  filter: filterActionsFilter | timeSeriesGridActionsFilter | undefined,
): filter is timeSeriesGridActionsFilter {
  return (filter as timeSeriesGridActionsFilter).x !== undefined
}

function isDataDownloadFilter(
  filter:
    | filterActionsFilter
    | timeSeriesGridActionsFilter
    | TimeSeriesFilter
    | undefined,
): filter is DataDownloadFilter {
  return (filter as DataDownloadFilter).filterId !== undefined
}

function isFilterActionsFilter(
  filter: filterActionsFilter | timeSeriesGridActionsFilter | undefined,
): filter is filterActionsFilter {
  return (filter as filterActionsFilter).filterId !== undefined
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

function parsePiDateTime(dateTime: ActionsPeriodDate | undefined) {
  if (!dateTime) {
    return undefined
  }
  return `${dateTime.date}T${dateTime.time}Z`
}

// use startTime and endTime if set, otherwise use the options from the store, otherwise use the period form the config
function determineViewPeriod(): string {
  const _options = toValue(viewPeriodFromStore)
  let viewPeriod: string = ''
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

  if (startDate || endDate) {
    // if either startTime or endTime is set, use it.
    if (startDate) {
      const startTime = DateTime.fromJSDate(startDate, {
        zone: 'UTC',
      })
        .set({ millisecond: 0 })
        .toISO({ suppressMilliseconds: true })
      viewPeriod = `&startTime=${startTime}`
    }
    if (endDate) {
      const endTime = DateTime.fromJSDate(endDate, {
        zone: 'UTC',
      })
        .set({ millisecond: 0 })
        .toISO({ suppressMilliseconds: true })
      viewPeriod = `${viewPeriod}&endTime=${endTime}`
    }
  }
  return viewPeriod
}

const downloadFile = (downloadFormat: string) => {
  let viewPeriod = determineViewPeriod()
  if (props.filter) {
    if (isDataDownloadFilter(props.filter)) {
      const queryParameters = filterToParams(props.filter)
      const url = new URL(
        `${baseUrl}rest/fewspiservice/v1/timeseries${queryParameters}&documentFormat=${downloadFormat}${viewPeriod}`,
      )
      return downloadFileAttachment(
        url.href,
        fileName.value,
        downloadFormat,
        authenticationManager.getAccessToken(),
      )
    }
  }
  if (props.filter) {
    if (isFilterActionsFilter(props.filter)) {
      const queryParameters = filterToParams(props.filter)
      const url = new URL(
        `${baseUrl}rest/fewspiservice/v1/timeseries/filters/actions${queryParameters}&documentFormat=${downloadFormat}${viewPeriod}`,
      )
      return downloadFileAttachment(
        url.href,
        fileName.value,
        downloadFormat,
        authenticationManager.getAccessToken(),
      )
    }
    if (isTimeSeriesGridActionsFilter(props.filter)) {
      console.log('Not implemented')
      return
    }
  }

  const timeSeriesFilter: TimeSeriesTopologyActionsFilter = {
    documentFormat: downloadFormat,
    nodeId: props.config?.nodeId ?? '',
    timeSeriesDisplayIndex: props.config?.index ?? 0,
    convertDatum: props.options.convertDatum,
    useDisplayUnits: props.options.useDisplayUnits,
  }
  const queryParameters = filterToParams(timeSeriesFilter)
  const url = new URL(
    `${baseUrl}rest/fewspiservice/v1/timeseries/topology/actions${queryParameters}${viewPeriod}`,
  )
  return downloadFileAttachment(
    url.href,
    fileName.value,
    downloadFormat,
    authenticationManager.getAccessToken(),
  )
}
</script>
