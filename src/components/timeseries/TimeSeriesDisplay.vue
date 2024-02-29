<template>
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
      <v-spacer />
      <v-btn-toggle
        v-model="displayType"
        mandatory
        variant="tonal"
        divided
        density="compact"
        class="ma-2"
      >
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
        <v-btn @click="openFileDownloadDialog" size="small" class="text-capitalize" variant="text" v-bind="props"><v-icon>mdi-download</v-icon></v-btn>
        <v-dialog v-model="fileDownloadDialog" max-width="400">
          <v-card>
            <v-card-title class="headline">Download timeseries</v-card-title>
            <v-card-text>
              <v-btn @click="() => downloadFile('PI_CSV')">CSV</v-btn>
              <v-btn @click="() => downloadFile('PI_JSON')">JSON</v-btn>
              <v-btn @click="() => downloadFile('PI_XML')">XML</v-btn>
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn @click="fileDownloadDialog = false">Cancel</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
    </template>
    <TimeSeriesComponent :config="displayConfig" :displayType="displayType">
    </TimeSeriesComponent>
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
import {ActionRequest, DocumentFormat, PiWebserviceProvider} from "@deltares/fews-pi-requests";
import {createTransformRequestFn} from "@/lib/requests/transformRequest.ts";
import {TimeSeriesTopologyActionsFilter} from "@deltares/fews-pi-requests/lib/types/requestParameters";

interface Props {
  nodeId?: string | string[]
}

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
})

const settings = useUserSettingsStore()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

const selectedPlot = ref(0)

const fileDownloadDialog = ref(false);
const openFileDownloadDialog = () => {
  fileDownloadDialog.value = true;
};

const downloadFile = (downloadFormat: string) => {
  console.log("Downloading file. Make sure to pass bearer token. " + downloadFormat);
  console.log(displayConfig)
  // Make sure transform request is used to pass bearer token.
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const displayConfigValue = displayConfig.value;
  const filter: TimeSeriesTopologyActionsFilter = {
    documentFormat: DocumentFormat.PI_JSON,
    nodeId: displayConfigValue?.nodeId,
    timeSeriesDisplayIndex: displayConfigValue?.index ?? 0,
    downloadAsFile: true
  }

  webServiceProvider.getTimeSeriesTopologyActions(filter);
}


const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: settings.useDisplayUnits,
    convertDatum: settings.convertDatum,
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
  }
]
</script>
