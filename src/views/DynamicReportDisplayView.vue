<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-toolbar v-if="locations.length" density="compact">
      <v-menu
        v-if="locations && locations.length > 1"
        location="bottom"
        z-index="10000"
        max-height="400"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            class="text-capitalize"
            variant="text"
            append-icon="mdi-chevron-down"
            :text="selectedLocation?.name"
          />
        </template>
        <v-list v-model="selectedLocation" density="compact">
          <v-list-item
            v-for="location in locations"
            @click="selectedLocation = location"
            :title="location.id"
            :active="selectedLocation === location"
          />
        </v-list>
      </v-menu>
      <span class="mx-5">{{ selectedLocation?.name }}</span>
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
import { useSelectedDate } from '@/services/useSelectedDate'
import { useDateRegistry } from '@/services/useDateRegistry'
interface Props {
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const selectedLocation = ref<{ id: string; name: string } | undefined>(undefined)
const selectedDateOfSlider = ref<Date | undefined>(undefined)
const { selectedDate, dateTimeSliderEnabled } =
  useSelectedDate(selectedDateOfSlider)

const filter = computed(() => {
  return {
    locationId: selectedLocation.value?.id,
    time: selectedDate.value?.toISOString(),  
  }
})

const { reportHtml, capabilities } = useDynamicReport(
  baseUrl,
  () => props.topologyNode?.dynamicReportDisplay?.id,
  filter
)

const locations = computed(() => {
  return (
    capabilities.value?.selectableLocations ??
    []
  )
})

const times = computed(() => {
  if (!dateTimeSliderEnabled.value) return []
  const dimension =
    capabilities.value?.dimension
  if (!dimension) return []
  if (isDimensionWithPeriod(dimension)) return toDateArray(dimension.period)
})

useDateRegistry(() => times.value ?? [])

const maxValuesTimeSeries = ref<TimeSeriesData[]>([])

watch(locations, (newLocations) => {
  if (newLocations.findIndex((loc) => loc.id === selectedLocation.value?.id) === -1) {
    selectedLocation.value = newLocations[0]
  }
})

const { mobile } = useDisplay()
</script>
