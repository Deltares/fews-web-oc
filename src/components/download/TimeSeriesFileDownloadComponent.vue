<template>
    <v-dialog v-model="model" max-width="400">
    <v-card>
      <v-card-title class="headline">Download timeseries</v-card-title>
      <v-card-text v-if="(props?.config?.index ?? -1) != -1">
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
import {DisplayConfig} from "@/lib/display/DisplayConfig.ts";
import type {UseDisplayConfigOptions} from "@/services/useDisplayConfig";

interface Props {
  config: DisplayConfig | undefined
  options: UseDisplayConfigOptions
}

const props = defineProps<Props>()

const model = defineModel()

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
    nodeId: props.config?.nodeId ?? '',
    timeSeriesDisplayIndex: props.config?.index ?? 0,
    convertDatum: props.options.convertDatum,
    useDisplayUnits: props.options.useDisplayUnits,
    downloadAsFile: true
  }

  webServiceProvider.getTimeSeriesTopologyActions(filter);
}
</script>


