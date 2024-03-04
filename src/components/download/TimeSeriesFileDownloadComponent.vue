<template>
    <v-dialog v-model="model" max-width="400">
    <v-card>
      <v-card-title class="headline">Download timeseries</v-card-title>
      <v-card-text v-if="props.config.index">>
        <v-btn @click="() => downloadFile('PI_CSV')">CSV</v-btn>
        <v-btn @click="() => downloadFile('PI_JSON')">JSON</v-btn>
        <v-btn @click="() => downloadFile('PI_XML')">XML</v-btn>
      </v-card-text>
      <v-card-text v-else>
        Downloading timeseries not supported with the current web service version
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn @click="() => cancelDialog()">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {PiWebserviceProvider, TimeSeriesTopologyActionsFilter} from "@deltares/fews-pi-requests";
import {createTransformRequestFn} from "@/lib/requests/transformRequest.ts";
import {configManager} from "@/services/application-config";
import {type DisplayConfig, DisplayType} from "@/lib/display/DisplayConfig.ts";

interface Props {
  config?: DisplayConfig
}

const model = defineModel()

const props = withDefaults(defineProps<Props>(), {
  config: () => {
    return {
      title: '',
      id: '',
      nodeId: '',
      index: 0,
      displayType: DisplayType.TimeSeriesChart,
      class: '',
      requests: [],
      subplots: [],
    }
  }});

const cancelDialog = () => {
   model.value = false
}

  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const downloadFile = (downloadFormat: string) => {
  // Make sure transform request is used to pass bearer token.
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const filter: TimeSeriesTopologyActionsFilter = {
    documentFormat: downloadFormat,
    nodeId: props.config.nodeId || "",
    timeSeriesDisplayIndex: props.config?.index || 0,
    downloadAsFile: true
  }
  webServiceProvider.getTimeSeriesTopologyActions(filter);
}
</script>


