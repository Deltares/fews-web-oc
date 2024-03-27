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
        <v-btn color="primary" @click="() => downloadFile(fileTypes[fileType])"
          >Download</v-btn
        >
        <v-btn @click="() => cancelDialog()">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  DocumentFormat,
  filterActionsFilter,
  timeSeriesGridActionsFilter,
  TimeSeriesTopologyActionsFilter,
} from '@deltares/fews-pi-requests'
import { configManager } from '@/services/application-config'
import { DisplayConfig } from '@/lib/display/DisplayConfig.ts'
import type { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'
import { filterToParams } from '@deltares/fews-wms-requests'
import { downloadFileAttachment } from '@/lib/download/downloadFiles.ts'
import { ref } from 'vue'
import { useSystemTimeStore } from '@/stores/systemTime.ts'
import { computed } from 'vue'
import { UseTimeSeriesOptions } from '@/services/useTimeSeries'
import { toValue } from 'vue'
import { DateTime } from 'luxon'

const store = useSystemTimeStore()
const viewPeriodFromStore = computed<UseTimeSeriesOptions>(() => {
  return {
    startTime: store.startTime,
    endTime: store.endTime,
  }
})

interface Props {
  config: DisplayConfig | undefined
  options: UseDisplayConfigOptions
  filter?: filterActionsFilter | timeSeriesGridActionsFilter | undefined
}

const fileTypes = {
  csv: DocumentFormat.PI_CSV,
  json: DocumentFormat.PI_JSON,
  xml: DocumentFormat.PI_XML,
} as const

const props = defineProps<Props>()

const model = defineModel<boolean>()

const fileType = ref<keyof typeof fileTypes>('csv')
const fileName = ref('timeseries')

const cancelDialog = () => {
  model.value = false
}

function isTimeSeriesGridActionsFilter(
  filter: filterActionsFilter | timeSeriesGridActionsFilter | undefined,
): filter is timeSeriesGridActionsFilter {
  return (filter as timeSeriesGridActionsFilter).x !== undefined
}

function isFilterActionsFilter(
  filter: filterActionsFilter | timeSeriesGridActionsFilter | undefined,
): filter is filterActionsFilter {
  return (filter as filterActionsFilter).filterId !== undefined
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const downloadFile = (downloadFormat: string) => {
  const _options = toValue(viewPeriodFromStore)
  let viewPeriod: string = ''
  if (_options?.startTime || _options?.endTime) {
    // if either startTime or endTime is set, use it.
    if (_options?.startTime) {
      const startTime = DateTime.fromJSDate(_options.startTime, {
        zone: 'UTC',
      })
        .set({ millisecond: 0 })
        .toISO({ suppressMilliseconds: true })
      viewPeriod = `&startTime=${startTime}`
    }
    if (_options?.endTime) {
      const endTime = DateTime.fromJSDate(_options.endTime, {
        zone: 'UTC',
      })
        .set({ millisecond: 0 })
        .toISO({ suppressMilliseconds: true })
      viewPeriod = `${viewPeriod}&endTime=${endTime}`
    }
  }
  if (props.filter) {
    if (isFilterActionsFilter(props.filter)) {
      const queryParameters = filterToParams(props.filter)
      const encodedFileName = encodeURIComponent(fileName.value)
      const url = new URL(
        `${baseUrl}rest/fewspiservice/v1/timeseries/filters/actions${queryParameters}&downloadAsFile=${encodedFileName}&documentFormat=${downloadFormat}${viewPeriod}`,
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
    downloadAsFile: true,
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
