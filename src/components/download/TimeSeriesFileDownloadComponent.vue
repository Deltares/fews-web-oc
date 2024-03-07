<template>
    <v-dialog v-model="model" max-width="400">
    <v-card>
      <v-card-title class="headline">Download timeseries</v-card-title>
      <v-card-text v-if="props.timeSeriesDisplayIndex != -1">
        <v-btn @click="() => downloadFile('PI_CSV')">CSV</v-btn>
        <v-btn @click="() => downloadFile('PI_JSON')">JSON</v-btn>
        <v-btn @click="() => downloadFile('PI_XML')">XML</v-btn>
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

interface Props {
  nodeId: string | undefined,
  timeSeriesDisplayIndex: number
}

const model = defineModel()

const props = withDefaults(defineProps<Props>(), {
  nodeId: '',
  timeSeriesDisplayIndex: 0
  });

const cancelDialog = () => {
   model.value = false
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const downloadFile = (downloadFormat: string) => {


  console.log("Index " + props.config?.index)
  // Make sure transform request is used to pass bearer token.
  const webServiceProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const filter: TimeSeriesTopologyActionsFilter = {
    documentFormat: downloadFormat,
    nodeId: props.nodeId,
    timeSeriesDisplayIndex: props.timeSeriesDisplayIndex,
    downloadAsFile: true
  }

  webServiceProvider.getTimeSeriesTopologyActions(filter);
}
</script>


