<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-toolbar v-if="locations.length" density="compact">
      <v-menu
        v-if="locations && locations.length > 1"
        v-model="locationMenuOpen"
        location="bottom"
        z-index="10000"
        width="360"
        min-width="0"
        max-width="calc(100vw - 32px)"
        max-height="400"
        :close-on-content-click="false"
        @update:model-value="locationSearch = ''"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            append-icon="mdi-chevron-down"
            :text="selectedLocation?.name"
          />
        </template>
        <v-card>
          <v-text-field
            v-model="locationSearch"
            :label="t('search.searchForLocations')"
            prepend-inner-icon="mdi-magnify"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="ma-2"
          />
          <v-list v-model="selectedLocation" density="compact">
            <v-virtual-scroll
              :items="filteredLocations"
              item-key="id"
              item-height="32"
              :height="Math.min(filteredLocations.length * 32, 320)"
            >
              <template #default="{ item: location }">
                <v-list-item
                  @click="selectLocation(location)"
                  :title="location.name"
                  :active="selectedLocation === location"
                />
              </template>
            </v-virtual-scroll>
          </v-list>
        </v-card>
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
import { useDateRegistry } from '@deltares/fews-web-oc-composables'
import { useI18n } from 'vue-i18n'
interface Props {
  topologyNode?: TopologyNode
  settings?: ComponentSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings(),
})

const { t } = useI18n()
const locationMenuOpen = ref(false)
const locationSearch = ref<string | null>('')
const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const selectedLocation = ref<{ id: string; name: string } | undefined>(
  undefined,
)
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
  filter,
)

const locations = computed(() => {
  return capabilities.value?.selectableLocations ?? []
})

const filteredLocations = computed(() => {
  const search = locationSearch.value?.trim().toLowerCase()
  if (!search) return locations.value
  return locations.value.filter(
    (location) =>
      location.name.toLowerCase().includes(search) ||
      location.id.toLowerCase().includes(search),
  )
})

function selectLocation(location: { id: string; name: string }) {
  selectedLocation.value = location
  locationMenuOpen.value = false
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

const { mobile } = useDisplay()
</script>
