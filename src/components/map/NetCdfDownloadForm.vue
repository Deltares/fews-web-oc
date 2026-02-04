<template>
  <DrawBoundingBoxControl
    v-if="dialogOpen && downloadType === 'pointCloud'"
    v-model="bbox"
  />
  <v-dialog v-model="showDialog" max-width="400">
    <v-card>
      <v-card-title class="text-h6">Download NetCDF</v-card-title>
      <v-card-text>
        <v-select
          v-model="downloadType"
          :items="downloadOptions"
          label="Download Type"
          item-title="title"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />

        <v-btn
          v-if="downloadType === 'pointCloud' && !bbox"
          color="primary"
          variant="outlined"
          block
          class="mb-3"
          @click="isDrawingBbox = true"
        >
          <v-icon start>mdi-vector-rectangle</v-icon>
          Draw Bounding Box
        </v-btn>

        <v-alert
          v-if="downloadType === 'pointCloud' && bbox"
          type="success"
          density="compact"
          class="mb-3"
        >
          Area selected
        </v-alert>

        <v-text-field
          v-model="startTimeInput"
          label="Start Time"
          type="datetime-local"
          density="compact"
          variant="outlined"
          hide-details
          class="mb-3"
        />

        <v-text-field
          v-model="endTimeInput"
          label="End Time"
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
        <v-btn variant="text" @click="dialogOpen = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isDownloading"
          :disabled="!canDownload"
          @click="download"
        >
          Download
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
const bbox = ref<BoundingBox | null>(null)
const downloadType = ref<'fullGrid' | 'pointCloud'>('fullGrid')
const startTimeInput = ref('')
const endTimeInput = ref('')
const isDownloading = ref(false)
const errorMessage = ref('')

const downloadOptions = [
  { title: 'Full Grid', value: 'fullGrid' },
  { title: 'Point Cloud', value: 'pointCloud' },
]

const isDrawingBbox = ref(false)

const showDialog = computed({
  get() {
    if (isDrawingBbox.value) {
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
  if (newBbox && isDrawingBbox.value) {
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
      startTime,
      endTime,
    }

    if (downloadType.value === 'pointCloud') {
      filter.pointCloud = true

      if (bbox.value) {
        const [minX, minY] = toMercator([bbox.value.lonMin, bbox.value.latMin])
        const [maxX, maxY] = toMercator([bbox.value.lonMax, bbox.value.latMax])
        filter.bbox = `${minX},${minY},${maxX},${maxY}`
        bbox.value = null // reset bbox after use
      }
    }

    const accessToken = authenticationManager.getAccessToken()

    const url = piProvider.timeSeriesGridUrl(filter)

    await downloadFileAttachment(
      url.toString(),
      `${props.layerName}_${startTime}_${endTime}`,
      // @ts-expect-error enum value should be added to fews-pi-requests
      'PI_NETCDF',
      accessToken,
    )
    dialogOpen.value = false
  } catch (error) {
    console.error('NetCDF download error:', error)
    errorMessage.value = 'Download failed'
  } finally {
    isDownloading.value = false
  }
}
</script>
