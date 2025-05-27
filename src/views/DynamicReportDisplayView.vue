<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-toolbar v-if="hasSelectableLocations" density="compact">
      <v-select
        v-model="selectedLocation"
        :items="locations"
        item-title="name"
        item-value="id"
        density="compact"
        variant="plain"
        hide-details
        class="locations-select"
        :placeholder="
          locations.length ? 'Select location' : 'No locations available'
        "
      />
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
import {
  type TopologyNode,
  isDimensionWithPeriod,
} from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'
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
  const dimension =
    capabilities.value?.dynamicReportDisplayCapabilities.dimension
  if (!dimension) return []
  if (isDimensionWithPeriod(dimension)) return toDateArray(dimension.period)
})
const maxValuesTimeSeries = ref<TimeSeriesData[]>([])
const dateTimeSliderEnabled = computed(() => {
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

watch(locations, (newLocations) => {
  if (newLocations.length > 0 && !selectedLocation.value) {
    selectedLocation.value = newLocations[0].id
  }
})

const { mobile } = useDisplay()
</script>

<style scoped>
.locations-select {
  max-width: 20%;
  min-width: 16em;
  padding-left: 0.75em;
}
</style>
