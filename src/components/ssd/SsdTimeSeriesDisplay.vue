<template>
  <div style="dislay: flex; flex-direction: column; height: 100%; width: 100%">
    <div style="flex: 1 1 100%; height: 100%">
      <WindowComponent>
        <template v-slot:toolbar>
          <v-menu offset-y z-index="10000">
            <template v-slot:activator="{ props }">
              <v-btn class="text-capitalize" variant="text" v-bind="props"
                >{{ plotIds[selectedPlot] }}<v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>
            <v-list v-model="selectedPlot" density="compact">
              <v-list-item
                v-for="(plot, i) in plotIds"
                v-bind:key="i"
                @click="selectedPlot = i"
              >
                <v-list-item-title>{{ plot }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn-toggle class="mr-5" v-model="displayType" mandatory>
            <v-btn
              v-for="item in displayTypeItems"
              :key="item.value"
              :value="item.value"
              :aria-label="item.label"
              :text="item.label"
              size="small"
              variant="text"
              class="text-capitalize"
            >
              <v-icon>{{ item.icon }}</v-icon>
            </v-btn>
          </v-btn-toggle>
        </template>
        <TimeSeriesComponent :config="displayConfig" :displayType="displayType">
        </TimeSeriesComponent>
      </WindowComponent>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { configManager } from '@/services/application-config'
import { useSsdPi } from '@/services/useSsdPi/index.ts'
import { computed } from 'vue'
import WindowComponent from '@/components/general/WindowComponent.vue'
import TimeSeriesComponent from '@/components/timeseries/TimeSeriesComponent.vue'
import { DisplayType } from '@/lib/display/DisplayConfig'

interface Props {
  panelId?: string
  objectId?: string
}

const props = withDefaults(defineProps<Props>(), {
  panelId: '',
  objectId: '',
})

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const selectedPlot = ref(0)

const { displays, displayConfig } = useSsdPi(
  baseUrl,
  () => props.panelId,
  () => props.objectId,
  selectedPlot,
)

const plotIds = computed(() => {
  if (displays.value?.length) {
    const ids = displays.value.map((d) => {
      return d.title
    })
    return ids
  } else {
    return []
  }
})

interface DisplayTypeItem {
  icon: string
  label: string
  value: DisplayType
}

const displayType = ref(DisplayType.TimeSeriesChart)
const displayTypeItems: DisplayTypeItem[] = [
  {
    icon: 'mdi-chart-line',
    label: 'Chart',
    value: DisplayType.TimeSeriesChart,
  },
  {
    icon: 'mdi-table',
    label: 'Table',
    value: DisplayType.TimeSeriesTable,
  },
]
</script>
