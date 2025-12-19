<template>
  <div v-if="hasLoadedCss" class="display-container pa-1 ga-1">
    <div class="dashboard-container flex-1-1 ga-1">
      <DashboardGroup
        v-for="group in groups"
        :group="group"
        :settings="props.settings"
      />
    </div>
    <v-card
      v-if="sliderEnabled && combinedDates.length > 0"
      class="flex-0-0 overflow-visible"
      flat
      :rounded="false"
    >
      <DateTimeSlider
        v-model:selectedDate="selectedDate"
        :dates="combinedDates"
        :hide-speed-controls="mobile"
      />
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { type WebOCDashboard } from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import DateTimeSlider from '@/components/general/DateTimeSlider.vue'
import { useDisplay } from 'vuetify'
import { createDateRegistry } from '@/services/useDateRegistry'
import { provideSelectedDate } from '@/services/useSelectedDate'
import { provideChartHandlers } from '@/services/useChartHandlers'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { useDynamicCss } from '@/services/useDynamicCss'
import DashboardGroup from './DashboardGroup.vue'
import { provideSelectedElevation } from '@/services/useSelectedElevation'

interface Props {
  dashboard: WebOCDashboard
  settings?: ComponentSettings
}

const props = defineProps<Props>()

const { mobile } = useDisplay()

const selectedDate = ref<Date>()
const { combinedDates } = setupDates()
const sliderEnabled = true

// Provide date data only when the date slider is enabled
function setupDates() {
  // TODO: Enable the slider based on the dashboard backend
  if (!sliderEnabled) {
    return {
      combinedDates: [],
    }
  }

  provideSelectedDate(selectedDate)
  return createDateRegistry()
}

provideSelectedElevation()
provideChartHandlers()

const groups = computed(() => props.dashboard.groups)
const cssUrl = computed(() =>
  getResourcesStaticUrl(props.dashboard.cssTemplate),
)
const { hasLoadedCss } = useDynamicCss(cssUrl)
</script>

<style scoped>
.dashboard-container {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.display-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
