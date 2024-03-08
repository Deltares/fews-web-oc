<template>
    <v-dialog v-model="model" max-width="400">
    <v-card>
      <v-card-title class="headline">Download timeseries</v-card-title>
      <v-card-text>
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
import {filterActionsFilter, timeSeriesGridActionsFilter, TimeSeriesTopologyActionsFilter} from "@deltares/fews-pi-requests";
import {configManager} from "@/services/application-config";
import {DisplayConfig} from "@/lib/display/DisplayConfig.ts";
import type {UseDisplayConfigOptions} from "@/services/useDisplayConfig";
import {authenticationManager} from "@/services/authentication/AuthenticationManager.ts";
import {filterToParams} from "@deltares/fews-wms-requests";

interface Props {
  config: DisplayConfig | undefined
  options: UseDisplayConfigOptions
  filter?: filterActionsFilter | timeSeriesGridActionsFilter | undefined
}

const props = defineProps<Props>()

const model = defineModel()

const cancelDialog = () => {
   model.value = false
}

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const downloadFile = (downloadFormat: string) => {
  if (props.filter) {
    // not supported yet.
    console.log(props.filter)
    return
  }
  const timeSeriesFilter: TimeSeriesTopologyActionsFilter = {
    documentFormat: downloadFormat,
    nodeId: props.config?.nodeId ?? '',
    timeSeriesDisplayIndex: props.config?.index ?? 0,
    convertDatum: props.options.convertDatum,
    useDisplayUnits: props.options.useDisplayUnits,
    downloadAsFile: true
  }
  const queryParameters = filterToParams(timeSeriesFilter)
  const url = new URL(`${baseUrl}rest/fewspiservice/v1/timeseries/topology/actions${queryParameters}`)
  return downloadFileAttachment(url.href, downloadFormat)
}

const downloadFileAttachment = async (url: string, documentFormat: string) => {
  try {
    const headers = new Headers();
    if (authenticationManager && authenticationManager.getAccessToken()) {
      headers.append('Authorization', `Bearer ${authenticationManager.getAccessToken()}`);
    }
    const response = await fetch(url, {
      method: 'GET', headers: headers,
    });
    if (response.ok) {
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      var extension: string = "csv"
      if (documentFormat === 'PI_JSON') extension = "json"
      if (documentFormat === 'PI_XML') extension = "xml"
      if (documentFormat === 'PI_CSV') extension = "csv"
      link.setAttribute('download', 'timeseries.' + extension);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('Error downloading file');
    }
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

</script>


