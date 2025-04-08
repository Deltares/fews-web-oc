<template>
  <div v-if="hasLoadedCss" class="display-container pa-1 ga-1">
    <div class="dashboard-container flex-1-1 ga-1">
      <template v-for="group in groups">
        <template v-for="element in group.elements">
          <v-card
            :style="{ gridArea: element.gridTemplateArea }"
            class="d-flex flex-column"
            density="compact"
            flat
            :rounded="false"
          >
            <DashboardItem
              v-if="element.items"
              :item="getDashboardItem(element.items)"
              :slider-enabled="sliderEnabled"
              :settings="settings"
              @dashboardAction="onDashboardAction"
            />
          </v-card>
        </template>
      </template>
    </div>
    <v-card
      v-if="sliderEnabled"
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
import { WebOCDashboardItem, type WebOCDashboard } from '@deltares/fews-pi-requests'
import { computed, ref } from 'vue'
import DashboardItem from '@/components/general/DashboardItem.vue'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import DateTimeSlider from './DateTimeSlider.vue'
import { useDisplay } from 'vuetify'
import { createDateRegistry } from '@/services/useDateRegistry'
import { provideSelectedDate } from '@/services/useSelectedDate'
import type { ComponentSettings } from '@/lib/topology/componentSettings'
import { useDynamicCss } from '@/services/useDynamicCss'
import { SsdActionResult } from '@deltares/fews-ssd-requests'

interface Props {
  dashboard: WebOCDashboard
  settings?: ComponentSettings
}

const props = defineProps<Props>()

const { mobile } = useDisplay()

const selectedDate = ref<Date>(new Date())
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

const actionId = ref<string>()
function onDashboardAction(action: SsdActionResult) {
  actionId.value = action.actionId
}

function getDashboardItem(items: WebOCDashboardItem[]) {
  return (
    items.find((item) => item.actionIds?.includes(actionId.value)) ?? items[0]
  )
}

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
