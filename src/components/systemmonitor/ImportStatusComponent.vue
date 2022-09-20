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
        >
          {{ item.lastImportTime }}
        </v-chip>
      </template>
      <template v-slot:[`item.fileFailed`]="{ item }">
        <v-chip
          :color="getColor(item.fileFailed)"
        >
          {{ item.fileFailed }}
        </v-chip>
      </template>
    </v-data-table>

  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import {Header} from "@/components/systemmonitor/lib/header";

@Component
export default class ImportStatusComponent extends Vue {
  @Prop({default: ''})
  baseUrl!: string

  headers: Header[] = [
    {text: 'Source', value: 'dataFeed',},
    {text: 'Directory', value: 'directory',},
    {text: 'Last import time', value: 'lastImportTime'},
    {text: 'Last file imported', value: 'lastFileImported'},
    {text: 'Files imported', value: 'fileRead'},
    {text: 'Failed imports', value: 'fileFailed'},
  ]
  importStatus: string[] = []
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

  async loadRunningTasks() {
    try {
      if (!this.active) return
      const url = this.baseUrl + "/rest/fewspiservice/v1/import/status?documentFormat=PI_JSON";
      const res = await fetch(url, {
        cache: "no-store",
        method: "GET"
      });
      const json = await res.json();
      this.importStatus = json.importStatus;
    } catch (error) {
      console.log(error)
    } finally {
      setTimeout(this.loadRunningTasks, 2000)
    }
  }
}
</script>
