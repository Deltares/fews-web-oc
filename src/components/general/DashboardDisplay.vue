<template>
  <div class="display-container pa-2 ga-2">
    <div class="dashboard-container flex-1-1 ga-2">
      <template v-for="group in groups">
        <template v-for="element in group.elements">
          <v-card
            :style="{ gridArea: element.gridTemplateArea }"
            class="d-flex flex-column"
            density="compact"
          >
            <!-- TODO: For now we only support one item per element -->
            <!--       to prevent UI clutter. -->
            <DashboardItem
              v-if="element.items"
              :item="element.items[0]"
              :settings
            />
          </v-card>
        </template>
      </template>
    </div>
    <v-card
      v-if="settings.dateTimeSliderEnabled"
      class="flex-0-0 overflow-visible"
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
import { computed, ref, watch } from 'vue'
import DashboardItem from '@/components/general/DashboardItem.vue'
import { getResourcesStaticUrl } from '@/lib/fews-config'
import DateTimeSlider from './DateTimeSlider.vue'
import { useDisplay } from 'vuetify'
import { createDateRegistry } from '@/services/useDateRegistry'
import { provideSelectedDate } from '@/services/useSelectedDate'
import {
  type DashboardSettings,
  getDefaultSettings,
} from '@/lib/topology/componentSettings'

interface Props {
  dashboard: WebOCDashboard
  settings?: DashboardSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => getDefaultSettings('dashboard'),
})

const { mobile } = useDisplay()

const selectedDate = ref<Date>(new Date())
const { combinedDates } = setupDates()

// Provide date data only when the date slider is enabled
function setupDates() {
  if (!props.settings.dateTimeSliderEnabled) {
    return {
      combinedDates: [],
    }
  }

  provideSelectedDate(selectedDate)
  return createDateRegistry()
}

const groups = computed(() => props.dashboard.groups)

function loadCss(url: string) {
  if (!document.querySelector(`link[href="${url}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
  }
}

function removeCss(url: string) {
  const link = document.querySelector(`link[href="${url}"]`)
  if (link) {
    link.remove()
  }
}

const cssUrl = computed(() =>
  getResourcesStaticUrl(props.dashboard.cssTemplate),
)
watch(
  cssUrl,
  (newCss, oldCss) => {
    if (oldCss) removeCss(oldCss)
    loadCss(newCss)
  },
  { immediate: true },
)
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
  background-color: color-mix(
    in srgb,
    rgb(var(--v-theme-on-surface-variant)) 90%,
    rgb(var(--v-theme-on-surface))
  );
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
