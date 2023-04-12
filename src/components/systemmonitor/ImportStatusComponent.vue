<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="importStatus"
      :footer-props="{
            'items-per-page-options': [100, 200, 300],
           }"
      class="elevation-1"

    >
      <template v-slot:[`item.lastImportTime`]="{ item }">
        <v-chip
          :color="item.lastImportTimeBackgroundColor"
          light
          small
        >
          {{ item.lastImportTime }}
        </v-chip>
      </template>
      <template v-slot:[`item.fileFailed`]="{ item }">
        <v-chip
          :color="getColor(item.fileFailed)"
          light
          small
        >
          {{ item.fileFailed }}
        </v-chip>
      </template>
    </v-data-table>

  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import {TableHeader} from "@/components/systemmonitor/lib/tableHeader";
import {PiWebserviceProvider} from "@deltares/fews-pi-requests";
import type { ImportStatus } from "@deltares/fews-pi-requests"

@Component
export default class ImportStatusComponent extends Vue {
  @Prop({default: ''})
  baseUrl!: string

  @Prop({default: 2000})
  timeOut!: number

  headers: TableHeader[] = [
    {text: 'Source', value: 'dataFeed',},
    {text: 'Directory', value: 'directory',},
    {text: 'Last import time', value: 'lastImportTime'},
    {text: 'Last file imported', value: 'lastFileImported'},
    {text: 'Files imported', value: 'fileRead'},
    {text: 'Failed imports', value: 'fileFailed'},
  ]
  importStatus: ImportStatus[] = []
  active: boolean = false;

  destroyed() {
    this.active = false;
  }

  async mounted(): Promise<void> {
    this.active = true;
    await this.loadRunningTasks();
  }

  getColor(failure: number): string {
    if (failure == 0) return "white";
    return "red";
  }

  async transformRequest(request: Request): Promise<Request> {
    const requestAuthHeaders = await this.$auth.getAuthorizationHeaders()
    const requestInit = {
      headers: requestAuthHeaders,
      cache: "no-cache"
    } as const
    const newRequest = new Request(request, requestInit)
    return newRequest
  }

  async loadRunningTasks() {
    try {
      if (!this.active) return
      const provider = new PiWebserviceProvider(this.baseUrl, {transformRequestFn: this.transformRequest});
      const res = await provider.getImportStatus();
      this.importStatus = res.importStatus;
    } catch (error) {
      console.log(error)
    } finally {
      setTimeout(this.loadRunningTasks, this.timeOut)
    }
  }
}
</script>
