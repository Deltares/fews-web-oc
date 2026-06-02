<template>
  <DrawBoundingBoxControl
    v-if="dialogOpen && downloadType === 'pointCloud'"
    v-model="bbox"
  />
  <v-dialog v-model="showDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">{{
        t('download.downloadNetCdf')
      }}</v-card-title>
      <v-card-text>
        <v-select
          v-model="downloadType"
          :items="downloadOptions"
          :label="t('download.downloadType')"
          item-title="title"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />

        <v-select
          v-model="netcdfFormat"
          :items="netcdfFormatOptions"
          label="NetCDF format"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />

        <div v-if="downloadType === 'pointCloud'" class="mb-3">
          <div class="d-flex align-center gap-2 mb-1">
            <span class="text-body-2 text-medium-emphasis flex-grow-1">
              {{
                bbox
                  ? t('download.boundingBox')
                  : t('download.selectBoundingBox')
              }}
            </span>
            <v-tooltip location="top">
              <template v-slot:activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon="mdi-selection-drag"
                  variant="tonal"
                  density="comfortable"
                  :aria-label="t('download.drawBoundingBox')"
                  :active="isDrawingBbox"
                  @click="toggleDrawingMode"
                />
              </template>
              <span>{{ t('download.selectBoundingBox') }}</span>
            </v-tooltip>
          </div>
          <div v-if="bbox" class="d-flex flex-column gap-3 mt-2">
            <div class="d-flex gap-3 py-2">
              <v-text-field
                type="number"
                :model-value="Math.round(bbox.lonMin * 10000) / 10000"
                @update:model-value="bbox = { ...bbox!, lonMin: +$event }"
                label="Longitude"
                suffix="°E"
                density="compact"
                variant="outlined"
                hide-details
                style="padding-right: 4px"
              />
              <v-text-field
                type="number"
                :model-value="Math.round(bbox.lonMax * 10000) / 10000"
                @update:model-value="bbox = { ...bbox!, lonMax: +$event }"
                label="Longitude"
                suffix="°E"
                density="compact"
                variant="outlined"
                hide-details
              />
            </div>
            <div class="d-flex gap-3">
              <v-text-field
                type="number"
                :model-value="Math.round(bbox.latMin * 10000) / 10000"
                @update:model-value="bbox = { ...bbox!, latMin: +$event }"
                label="Latitude"
                suffix="°N"
                density="compact"
                variant="outlined"
                hide-details
                style="padding-right: 4px"
              />
              <v-text-field
                type="number"
                :model-value="Math.round(bbox.latMax * 10000) / 10000"
                @update:model-value="bbox = { ...bbox!, latMax: +$event }"
                label="Latitude"
                suffix="°N"
                density="compact"
                variant="outlined"
                hide-details
              />
            </div>
          </div>
        </div>

        <v-text-field
          v-model="startTimeInput"
          :label="t('download.startTime')"
          type="datetime-local"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />

        <v-text-field
          v-model="endTimeInput"
          :label="t('download.endTime')"
          type="datetime-local"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />

        <v-alert
          v-if="errorMessage"
          type="error"
          density="compact"
          class="mb-3"
        >
          {{ errorMessage }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialogOpen = false">{{
          t('common.cancel')
        }}</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isDownloading"
          :disabled="!canDownload"
          @click="download"
        >
          {{ t('download.download') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { configManager } from '@/services/application-config'
import { downloadFileAttachment } from '@/lib/download/downloadFiles'
import { authenticationManager } from '@/services/authentication/AuthenticationManager'
import { convertDateToDateTimeString } from '@/lib/date'
import { toMercator } from '@turf/projection'
import DrawBoundingBoxControl from './DrawBoundingBoxControl.vue'
import type { BoundingBox } from '@/services/useBoundingBox'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'

interface Props {
  layerName?: string
  defaultStartTime?: string | null
  defaultEndTime?: string | null
}

const props = defineProps<Props>()
const dialogOpen = defineModel<boolean>({ default: false })
const { t } = useI18n()
const bbox = ref<BoundingBox | null>(null)
const downloadType = ref<'fullGrid' | 'pointCloud'>('fullGrid')
const netcdfFormat = ref<'netcdf3' | 'netcdf4'>('netcdf4')
const startTimeInput = ref('')
const endTimeInput = ref('')
const isDownloading = ref(false)
const errorMessage = ref('')

const downloadOptions = computed(() => [
  { title: t('download.fullGrid'), value: 'fullGrid' },
  { title: t('download.pointCloud'), value: 'pointCloud' },
])

const netcdfFormatOptions = [
  { title: 'netcdf4', value: 'netcdf4' },
  { title: 'netcdf3', value: 'netcdf3' },
]

const isDrawingBbox = ref(false)

const showDialog = computed({
  get() {
    // Hide dialog when actively drawing
    if (isDrawingBbox.value && !bbox.value) {
      return false
    }
    return dialogOpen.value
  },
  set(value: boolean) {
    dialogOpen.value = value
    if (!value) {
      isDrawingBbox.value = false
    }
  },
})

// Reset bbox and drawing state when switching away from point cloud
watch(downloadType, (newType) => {
  if (newType !== 'pointCloud') {
    bbox.value = null
    isDrawingBbox.value = false
  }
})

watch(bbox, (newBbox) => {
  if (newBbox) {
    isDrawingBbox.value = false
  }
})

watch(
  () => [props.defaultStartTime, props.defaultEndTime],
  () => {
    if (props.defaultStartTime && props.defaultStartTime !== null) {
      startTimeInput.value = convertDateToDateTimeString(
        new Date(props.defaultStartTime),
      )
    }
    if (props.defaultEndTime && props.defaultEndTime !== null) {
      endTimeInput.value = convertDateToDateTimeString(
        new Date(props.defaultEndTime),
      )
    }
  },
  { immediate: true },
)

const canDownload = computed(() => {
  const basicRequirements =
    !!props.layerName &&
    !!startTimeInput.value &&
    !!endTimeInput.value &&
    !isDownloading.value

  // For point cloud, also require a bounding box
  if (downloadType.value === 'pointCloud') {
    return basicRequirements && !!bbox.value
  }

  return basicRequirements
})

function toggleDrawingMode() {
  if (bbox.value && !isDrawingBbox.value) {
    bbox.value = null
  }
  isDrawingBbox.value = !isDrawingBbox.value
}

async function download() {
  if (!props.layerName) return

  errorMessage.value = ''
  isDownloading.value = true

  try {
    const startTime = new Date(startTimeInput.value).toISOString()
    const endTime = new Date(endTimeInput.value).toISOString()

    const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

    const piProvider = new PiWebserviceProvider(baseUrl)

    // Build the filter for the grid timeseries request
    const filter: Record<string, any> = {
      documentFormat: 'PI_NETCDF',
      layers: props.layerName,
      importFromExternalDataSource: false,
      useDisplayUnits: false,
      netcdfFormat:
        netcdfFormat.value === 'netcdf3' ? netcdfFormat.value : undefined,
      startTime,
      endTime,
    }

    if (downloadType.value === 'pointCloud') {
      filter.pointCloud = true

      if (bbox.value) {
        const [minX, minY] = toMercator([bbox.value.lonMin, bbox.value.latMin])
        const [maxX, maxY] = toMercator([bbox.value.lonMax, bbox.value.latMax])
        filter.bbox = [minX, minY, maxX, maxY]
      }
    }

    const headers = await authenticationManager.getAuthorizationHeaders()

    const url = piProvider.timeSeriesGridUrl(filter)

    await downloadFileAttachment(
      url.toString(),
      `${props.layerName}_${startTime}_${endTime}`,
      // @ts-expect-error enum value should be added to fews-pi-requests
      'PI_NETCDF',
      headers,
    )
    dialogOpen.value = false
  } catch (error) {
    console.error('NetCDF download error:', error)
    errorMessage.value = t('download.downloadFailed')
  } finally {
    isDownloading.value = false
  }
}
</script>
