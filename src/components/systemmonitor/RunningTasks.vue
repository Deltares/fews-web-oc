<template>
  <div>
    <v-data-table
      :headers="headers"
      :no-data-text="noDataText"
      :items="runningTasks"
      :footer-props="{
            'items-per-page-options': [50, 100, 150],
           }"
      class="elevation-1"

    >
      <template v-slot:[`item.status`]="{ item }">
        <v-chip
          :color="getColor(item.status)"
          light
          small
        >
          {{ item.status }}
        </v-chip>
      </template>
    </v-data-table>

  </div>
</template>

<script lang="ts">
import {Component, Mixins, Prop} from 'vue-property-decorator'
import {TableHeader} from "@/components/systemmonitor/lib/tableHeader";
import { DocumentFormat, PiWebserviceProvider } from "@deltares/fews-pi-requests";
import PiRequestsMixin from "@/mixins/PiRequestsMixin"
import type { TaskRun, TaskRunsFilter, TaskRunsResponse } from "@deltares/fews-pi-requests";

@Component
export default class RunningTasks extends Mixins(PiRequestsMixin) {
  @Prop({ default: '' })
  baseUrl!: string

  @Prop({default: 2000})
  timeOut!: number

  private noDataText = "Loading data..";

  headers: TableHeader[] = [
    {
      text: 'Task run id', value: 'id',
    },
    {text: 'Description', value: 'description'},
    {text: 'Workflow id', value: 'workflowId'},
    {text: 'Dispatch Time', value: 'dispatchTime'},
    {text: 'FSS id', value: 'fssId'},
    {text: 'Status', value: 'status'},
    {text: 'FDO', value: 'user'},
  ]
  runningTasks: TaskRun[] = []
  active: boolean = false;

  destroyed() {
    this.active = false;
  }

  async mounted(): Promise<void> {
    this.active = true;
    await this.loadRunningTasks();
  }

  getColor(status: string): string {
    switch (status) {
      case "pending":
        return "light-gray"
      case "running":
        return "#d0e9c6";
      default:
        return "white";
    }
  }


  async loadRunningTasks() {
    try {
      if (!this.active) return
      const provider = new PiWebserviceProvider(this.baseUrl, {transformRequestFn: this.transformRequest});
      const taskRunFilter: TaskRunsFilter = {
        taskRunStatusIds: ["R", "P"],
        documentFormat: DocumentFormat.PI_JSON,
        onlyForecasts: false,
      };
      const res: TaskRunsResponse = await provider.getTaskRuns(taskRunFilter);
      this.runningTasks = res.taskRuns;
      this.noDataText = "There are no running or pending tasks";
    } catch (error) {
      console.log(error)
    } finally {
      setTimeout(this.loadRunningTasks, this.timeOut)
    }
  }
}
</script>
