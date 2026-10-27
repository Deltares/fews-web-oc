<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-toolbar v-if="locations.length" density="compact">
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
      <span v-else class="mx-5">{{ selectedLocation?.name }}</span>
    </v-toolbar>
    <DynamicReportContent
      :html="reportHtml"
      :node-css="timeSeriesValueInputCss"
      class="flex-1-1"
    >
      <template #node="{ node }">
        <TimeSeriesValueInput :node="node" @change="onEdit" />
      </template>
    </DynamicReportContent>
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
import timeSeriesValueInputCss from '@/components/reports/dynamic/timeSeriesValueInput.css?inline'
import { type DynamicReportEdit, getEditKey } from '@/lib/dynamic-report/nodes'
import { useDynamicReport } from '@/services/useDynamicReport'
import DateTimeSliderValues from '@/components/general/DateTimeSliderValues.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { useDisplay } from 'vuetify'
import { TimeSeriesData } from '@/lib/timeseries/types/SeriesData'
import { toDateArray } from '@/lib/date'
import { useSelectedDate } from '@/services/useSelectedDate'
import { useDateRegistry } from '@deltares/fews-web-oc-composables'
import { useI18n } from 'vue-i18n'
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

const { reportHtml, capabilities, isReady, error } = useDynamicReport(
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
const edits = ref(new Map<string, DynamicReportEdit>())
watch(reportHtml, () => edits.value.clear())

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
