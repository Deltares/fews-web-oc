<template>
  <div>
    <v-data-table
      :headers="headers"
      :items="runningTasks"
      :footer-props="{
            'items-per-page-options': [50, 100, 150],
           }"
      class="elevation-1"

    >
      <template v-slot:[`item.status`]="{ item }">
        <v-chip
          :color="getColor(item.status)"
        >
          {{ item.status }}
        </v-chip>
      </template>
    </v-data-table>

  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import {TableHeader} from "@/components/systemmonitor/lib/tableHeader";

@Component
export default class RunningTasks extends Vue {
  @Prop({ default: '' })
  baseUrl!: string

  @Prop({default: 2000})
  timeOut!: number

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
  runningTasks: string[] = []
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
      const url = this.baseUrl + "/rest/fewspiservice/v1/taskruns?taskRunStatusIds=R&taskRunStatusIds=P&documentFormat=PI_JSON&onlyForecasts=false";
      const res = await fetch(url, {
        cache: "no-store",
        method: "GET"
      });
      const json = await res.json();
      this.runningTasks = json.taskRuns;
    } catch (error) {
      console.log(error)
    } finally {
      setTimeout(this.loadRunningTasks, this.timeOut)
    }
  }
}
</script>
