<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-toolbar v-if="hasSelectableLocations" density="compact">
      <v-btn
        prepend-icon="mdi-map-marker"
        append-icon="mdi-chevron-down"
        variant="text"
        v-if="hasSelectableLocations"
        class="locations-search text-capitalize"
        hide-details
        @click="showLocationsSearch"
      >
        {{ searchState.selectedItem?.name ?? 'Search locations' }}
      </v-btn>
    </v-toolbar>
    <ShadowFrame :htmlContent="reportHtml" />
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
import { type TopologyNode } from '@deltares/fews-pi-requests'
import { computed, ref, watchEffect } from 'vue'
import { configManager } from '@/services/application-config'
import {
  type ComponentSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'
import ShadowFrame from '@/components/general/ShadowFrame.vue'
import { useDynamicReport } from '@/services/useDynamicReport'
import DateTimeSliderValues from '@/components/general/DateTimeSliderValues.vue'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { useDisplay } from 'vuetify'
import { TimeSeriesData } from '@/lib/timeseries/types/SeriesData'
import { toDateArray } from '@/lib/date'
import { useGlobalSearchState } from '@/stores/globalSearch'
interface Props {
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const selectedLocation = ref<string | undefined>(undefined)
const selectedDateOfSlider = ref<Date | undefined>(undefined)

const { reportHtml, capabilities } = useDynamicReport(
  baseUrl,
  () => props.topologyNode?.dynamicReportDisplay?.id,
  () => selectedDateOfSlider.value?.toISOString(),
  () => selectedLocation.value,
  () => undefined,
)

const locations = computed(() => {
  return (
    capabilities.value?.dynamicReportDisplayCapabilities.selectableLocations ??
    []
  )
})

const times = computed(() => {
  if (!dateTimeSliderEnabled.value) return []
  return toDateArray(
    capabilities.value?.dynamicReportDisplayCapabilities.dimension
      ?.period as string,
  )
})
const maxValuesTimeSeries = ref<TimeSeriesData[]>([])
const dateTimeSliderEnabled = computed(() => {
  console.log(capabilities.value)
  console.log(capabilities.value?.dynamicReportDisplayCapabilities.dimension)
  return (
    capabilities.value?.dynamicReportDisplayCapabilities.dimension?.name ===
    'time'
  )
})

const hasSelectableLocations = computed(() => {
  return (
    capabilities.value?.dynamicReportDisplayCapabilities.selectableLocations
      ?.length ?? 0 > 0
  )
})

const { mobile } = useDisplay()
const searchState = useGlobalSearchState()

function showLocationsSearch() {
  searchState.active = true
}

watchEffect(() => {
  searchState.items = locations.value
})

watchEffect(() => {
  selectedLocation.value = searchState.selectedItem?.id ?? undefined
})
</script>
