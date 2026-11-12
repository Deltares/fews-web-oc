<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-toolbar
      v-if="locations.length || settings.report.downloadReport || reportHtml"
      density="compact"
    >
      <v-autocomplete
        v-if="locations.length > 1"
        v-model="selectedLocation"
        :items="locations"
        item-title="name"
        item-value="id"
        return-object
        :filter-keys="['title', 'value']"
        :custom-filter="filterLocation"
        :aria-label="t('search.searchForLocations')"
        density="compact"
        variant="plain"
        hide-details
        menu-icon="mdi-chevron-down"
        min-width="200"
        width="max-content"
        max-width="100%"
        class="location-select ms-1 flex-grow-0"
        :menu-props="{ width: 360 }"
        :list-props="{ density: 'compact' }"
      />
      <span v-else-if="locations.length" class="mx-5">{{
        selectedLocation?.name
      }}</span>
      <v-spacer />
      <v-btn
        v-if="reportHtml && !editing"
        :disabled="isLoading || !isReady || !!error"
        @click="startEditing"
      >
        {{ t('dynamicReport.editReport') }}
      </v-btn>
      <template v-if="editing">
        <v-btn @click="showScreenshotDialog = true">
          {{ t('dynamicReport.addScreenshot') }}
        </v-btn>
        <v-btn @click="editing = false">{{
          t('dynamicReport.previewReport')
        }}</v-btn>
      </template>
      <DownloadReportButton
        v-if="
          settings.report.downloadReport && topologyNode?.dynamicReportDisplay
        "
        :displayId="topologyNode.dynamicReportDisplay.id"
        :locationId="filter.locationId"
        :time="filter.time"
        :disabled="!reportHtml || isLoading || !isReady || !!error"
      />
    </v-toolbar>
    <v-alert v-if="editing || editedHtml" type="info" density="compact">
      {{ t('dynamicReport.unsavedReport') }}
    </v-alert>
    <DynamicReportContent
      v-if="reportHtml"
      ref="reportContent"
      :html="displayHtml"
      :initial-editor-html="editedHtml || undefined"
      :editable="editing"
      :node-css="timeSeriesValueInputCss"
      class="flex-1-1"
      @update="onDocumentUpdate"
    >
      <template #node="{ node }">
        <TimeSeriesValueInput :node="node" @change="onEdit" />
      </template>
    </DynamicReportContent>
    <v-alert v-if="screenshotError" type="error">{{ screenshotError }}</v-alert>
    <span v-if="!reportHtml && error" class="mx-auto mt-2">{{
      t('reports.loadFailed')
    }}</span>
    <span v-else-if="!reportHtml && isReady" class="mx-auto mt-2">{{
      t('reports.noReportAvailable')
    }}</span>
    <NodeScreenshotDialog
      v-if="editing"
      v-model="showScreenshotDialog"
      :settings="settings"
      :initial-node-id="topologyNode?.id"
      @capture="onScreenshot"
    />
    <DateTimeSlider
      v-if="dateTimeSliderEnabled && times?.length"
      v-model:selectedDate="selectedDateOfSlider"
      :dates="times"
      :hide-speed-controls="mobile"
    >
      <template #below-track>
        <DateTimeSliderValues
          :values="maxValuesTimeSeries ?? []"
          :colour-scale="null"
          height="6px"
          class="mb-1"
          style="margin-top: -7px"
        />
      </template>
    </DateTimeSlider>
  </div>
</template>

<script setup lang="ts">
import {
  type DynamicReportDisplayCapabilitiesResponse,
  type TopologyNode,
  isDimensionWithPeriod,
} from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'
import { configManager } from '@/services/application-config'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import DynamicReportContent from '@/components/reports/DynamicReportContent.vue'
import TimeSeriesValueInput from '@/components/reports/dynamic/TimeSeriesValueInput.vue'
import NodeScreenshotDialog from '@/components/reports/dynamic/NodeScreenshotDialog.vue'
import timeSeriesValueInputCss from '@/components/reports/dynamic/timeSeriesValueInput.css?inline'
import { type DynamicReportEdit, getEditKey } from '@/lib/dynamic-report/nodes'
import DownloadReportButton from '@/components/reports/DownloadReportButton.vue'
import { useDynamicReport } from '@/services/useDynamicReport'
import DateTimeSliderValues from '@/components/general/DateTimeSliderValues.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { useDisplay } from 'vuetify'
import { TimeSeriesData } from '@/lib/timeseries/types/SeriesData'
import { toDateArray } from '@/lib/date'
import { useSelectedDate } from '@/services/useSelectedDate'
import { useDateRegistry } from '@deltares/fews-web-oc-composables'
import { useI18n } from 'vue-i18n'
import { sanitizeDynamicReport } from '@/lib/dynamic-report/sanitize'
type SelectableLocation = NonNullable<
  DynamicReportDisplayCapabilitiesResponse['dynamicReportDisplayCapabilities']['selectableLocations']
>[number]

interface Props {
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const { t } = useI18n()
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const selectedLocation = ref<SelectableLocation>()
const selectedDateOfSlider = ref<Date | undefined>(undefined)
const { selectedDate, dateTimeSliderEnabled } =
  useSelectedDate(selectedDateOfSlider)

const filter = computed(() => {
  return {
    locationId: selectedLocation.value?.id,
    time: selectedDate.value?.toISOString(),
  }
})

const { reportHtml, capabilities, isReady, isLoading, error } =
  useDynamicReport(
    baseUrl,
    () => props.topologyNode?.dynamicReportDisplay?.id,
    filter,
  )

const locations = computed(() => {
  return capabilities.value?.selectableLocations ?? []
})

function filterLocation(value: string, query: string) {
  return value.toLowerCase().includes(query.trim().toLowerCase())
}

const times = computed(() => {
  if (!dateTimeSliderEnabled.value) return []
  const dimension = capabilities.value?.dimension
  if (!dimension) return []
  if (isDimensionWithPeriod(dimension)) return toDateArray(dimension.period)
})

useDateRegistry(() => times.value ?? [])

const maxValuesTimeSeries = ref<TimeSeriesData[]>([])

watch(locations, (newLocations) => {
  if (!newLocations.some((loc) => loc.id === selectedLocation.value?.id)) {
    selectedLocation.value = newLocations[0]
  }
})

// Edits are discarded when a new report is loaded
// submit the edits to the FEWS web services
const edits = ref(new Map<string, DynamicReportEdit>())
const editing = ref(false)
const editedHtml = ref('')
const showScreenshotDialog = ref(false)
const screenshotError = ref('')
const reportContent = ref<InstanceType<typeof DynamicReportContent>>()

const displayHtml = computed(() => {
  if (editing.value || !editedHtml.value) return reportHtml.value
  const document = new DOMParser().parseFromString(
    reportHtml.value,
    'text/html',
  )
  document.body.replaceChildren(
    sanitizeDynamicReport(editedHtml.value).fragment,
  )
  return document.documentElement.outerHTML
})

let reportVersion = 0
function resetEdits() {
  reportVersion++
  edits.value.clear()
  editedHtml.value = ''
  editing.value = false
  showScreenshotDialog.value = false
  screenshotError.value = ''
}

watch(
  [
    reportHtml,
    () => props.topologyNode?.dynamicReportDisplay?.id,
    () => filter.value.locationId,
    () => filter.value.time,
  ],
  resetEdits,
  { flush: 'sync' },
)

function startEditing() {
  const content = document.createElement('div')
  content.appendChild(
    sanitizeDynamicReport(editedHtml.value || reportHtml.value).fragment,
  )
  content
    .querySelectorAll<HTMLElement>('[data-input-type]')
    .forEach((element) => {
      const { timeSeriesIndex, time } = element.dataset
      if (!timeSeriesIndex || !time) return
      const edit = edits.value.get(getEditKey({ timeSeriesIndex, time }))
      if (edit) element.textContent = edit.value
    })
  editedHtml.value = content.innerHTML
  editing.value = true
}

function onDocumentUpdate(html: string) {
  if (!editing.value) return
  editedHtml.value = html
  edits.value.clear()
  const content = document.createElement('div')
  content.appendChild(sanitizeDynamicReport(html).fragment)
  content
    .querySelectorAll<HTMLElement>('[data-input-type]')
    .forEach((element) => {
      const { timeSeriesIndex, time } = element.dataset
      if (!timeSeriesIndex || !time) return
      const edit = {
        timeSeriesIndex,
        time,
        value: element.textContent?.trim() ?? '',
      }
      edits.value.set(getEditKey(edit), edit)
    })
}

async function onScreenshot(image: Blob, label: string) {
  const version = reportVersion
  screenshotError.value = ''
  try {
    if (!reportContent.value) throw new Error('The report editor is not ready')
    await reportContent.value.insertScreenshot(image, label)
  } catch (cause) {
    console.error('Failed to insert screenshot into dynamic report', cause)
    if (version === reportVersion) {
      screenshotError.value = t('dynamicReport.screenshotInsertFailed')
    }
  }
}

function onEdit(edit: DynamicReportEdit) {
  edits.value.set(getEditKey(edit), edit)
}

const { mobile } = useDisplay()
</script>

<style scoped>
.location-select :deep(.v-field) {
  border-radius: 4px;
  padding-inline: 8px;
}

.location-select :deep(.v-field:hover),
.location-select :deep(.v-field--focused) {
  background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}

.location-select :deep(.v-field__input) {
  min-height: 36px;
  padding-block: 0;
}

.location-select :deep(.v-autocomplete__selection) {
  max-width: 100%;
}

.location-select :deep(.v-field__append-inner) {
  align-items: center;
  padding-top: 0;
}
</style>
