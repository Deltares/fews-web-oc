<template>
  <WindowComponent :hideToolbar="settings.general.hideToolbar">
    <template v-slot:toolbar>
      <v-toolbar-items class="me-10">
        <v-btn
          v-for="item in displayTypeItems"
          :key="item.value"
          :value="item.value"
          :aria-label="item.label"
          :text="item.label"
          @click="displayType = item.value"
          :active="displayType === item.value"
        >
          <v-icon>{{ item.icon }}</v-icon>
        </v-btn>
      </v-toolbar-items>
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
      <v-spacer />
      <v-btn size="small" icon>
        <v-icon>mdi-dots-horizontal</v-icon>
        <v-menu activator="parent" density="compact">
          <v-list>
            <v-list-item
              prepend-icon="mdi-download"
              @click="downloadDialogStore.showDialog = true"
              :disabled="downloadDialogStore.disabled"
              >Download time series ...</v-list-item
            >
          </v-list>
        </v-menu>
      </v-btn>
    </template>
    <TimeSeriesComponent :config="displayConfig" :displayType="displayType">
    </TimeSeriesComponent>
    <TimeSeriesFileDownloadComponent :config="displayConfig" :options="options">
    </TimeSeriesFileDownloadComponent>
  </WindowComponent>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { configManager } from '@/services/application-config'
import {
  useDisplayConfig,
  type UseDisplayConfigOptions,
} from '@/services/useDisplayConfig/index.ts'
import { computed } from 'vue'
import WindowComponent from '@/components/general/WindowComponent.vue'
import TimeSeriesComponent from '@/components/timeseries/TimeSeriesComponent.vue'
import { DisplayType } from '@/lib/display/DisplayConfig'
import { useUserSettingsStore } from '@/stores/userSettings'
import TimeSeriesFileDownloadComponent from '@/components/download/TimeSeriesFileDownloadComponent.vue'
import { useSystemTimeStore } from '@/stores/systemTime'
import { useDownloadDialogStore } from '@/stores/downloadDialog'
import { getDefaultSettings, type ChartSettings } from '@/lib/topology/componentSettings'

interface Props {
  nodeId?: string | string[]
  settings?: ChartSettings
}

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
  settings: () => getDefaultSettings('charts'),
})

const userSettings = useUserSettingsStore()
const systemTimeStore = useSystemTimeStore()
const downloadDialogStore = useDownloadDialogStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const selectedPlot = ref(0)

const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: userSettings.useDisplayUnits,
    convertDatum: userSettings.convertDatum,
  }
})

const { displays, displayConfig } = useDisplayConfig(
  baseUrl,
  () => {
    if (typeof props.nodeId === 'string') {
      return props.nodeId
    } else {
      return props.nodeId[props.nodeId.length - 1]
    }
  },
  selectedPlot,
  () => systemTimeStore.startTime,
  () => systemTimeStore.endTime,
  options,
)

const plotIds = computed(() => {
  if (displays.value && displays.value.length > 0) {
    return displays.value.map((d) => {
      return d.title
    })
  }
  return []
})

watch(props, () => (selectedPlot.value = 0))

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
