<template>
  <v-sheet>
    <v-select v-model="currentWorkflowIds" label="Select workflows" chips multiple :items="workflowIds">
      <template v-slot:selection="data">
        <v-chip
          v-bind="data.attrs"
          :input-value="data.selected"
          close
          @click="data.select"
          @click:close="remove(data.item)"
        >
          {{ data.item }}
        </v-chip>
      </template>
    </v-select>
    <TimeLine :data="filteredTasks" xkey="date" ykey="values" />
    <v-data-table
      :headers="headers"
      :no-data-text="noDataText"
      :items="filteredTaskRuns"
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

  </v-sheet>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import {TableHeader} from "@/components/systemmonitor/lib/tableHeader";
import {DocumentFormat, PiWebserviceProvider, TaskRunsFilter} from "@deltares/fews-pi-requests";
import {TaskRunsResponse} from "@deltares/fews-pi-requests/src/response";
import {TaskRun} from "@deltares/fews-pi-requests/src/response/tasks/taskRun";
import {DateTime, Interval} from 'luxon'
import TimeLine from '@/components/TimeLine.vue'
import { uniq } from 'lodash';
import * as d3 from 'd3';

@Component({
  components: {
    TimeLine
  }
})
export default class RunningTasks extends Vue {
  @Prop({ default: '' })
  baseUrl!: string

  @Prop({default: 2000})
  timeOut!: number

  private noDataText = "Loading data..";

  headers: TableHeader[] = [
    {
      text: 'Task run id', value: 'id',
    },
    {text: 'Workflow id', value: 'workflowId'},
    {text: 'Dispatch Time', value: 'dispatchTime'},
    {text: 'Completion Time', value: 'completionTime'},
  ]
  active: boolean = false;
  tasks: any[] = []
  taskRuns:TaskRun[] = []
  workflowIds: string[] = []
  currentWorkflowIds: string[] = []

  destroyed() {
    this.active = false;
  }

  async mounted(): Promise<void> {
    this.active = true;
    await this.loadTasks();
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

  get filteredTasks() {
    return this.tasks.filter( t => this.currentWorkflowIds.includes(t.workflowId))
  }

  get filteredTaskRuns() {
    return this.taskRuns.filter( t => this.currentWorkflowIds.includes(t.workflowId))
  }

  async loadTasks() {
    try {
      if (!this.active) return
      const provider = new PiWebserviceProvider(this.baseUrl);
      const endDate = DateTime.now()
        .plus({ days: 1 })
        .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      const startDate = endDate.minus({ days: 30 })
      const taskRunFilter: TaskRunsFilter = {
        documentFormat: DocumentFormat.PI_JSON,
        startDispatchTime: startDate.toUTC().toISO({ suppressMilliseconds: true }),
        endDispatchTime: endDate.toUTC().toISO({ suppressMilliseconds: true }),
        onlyForecasts: true,
      };
      console.log(taskRunFilter)
      const res: TaskRunsResponse = await provider.getTaskRuns(taskRunFilter);
      console.log(res)
      this.taskRuns = res.taskRuns
      this.workflowIds = uniq(res.taskRuns.map((taskRun) => { return taskRun.workflowId}))
      const range =  this.workflowIds.keys()
      const colorMap = d3.scaleOrdinal(range).domain(this.workflowIds)
      this.tasks = res.taskRuns
        .map((taskRun) => {
          // const end = DateTime.fromMillis(taskRun.completionTime)
          const start = DateTime.fromISO(taskRun.dispatchTime)
          if (taskRun.completionTime === null || taskRun.completionTime === undefined) {
            console.log(taskRun)
          }
          let end = DateTime.fromISO(taskRun.completionTime)
          const minimumEnd= start.plus({ minutes: 10})
          if ( end < minimumEnd) end = minimumEnd
          const interval = Interval.fromDateTimes(start, end)

          const date = [
            start.set({ hour: 1, minute: 0, second: 0 }).toJSDate(),
            start.set({ hour: 23, minute: 0, second: 0 }).toJSDate(),
          ]

          const timeOfDay = [
            start.set({ year: 1970, month: 1, day: 1 }).toJSDate(),
            end.set({ year: 1970, month: 1, day: 1 }).toJSDate(),
          ]
          return {
            dispatchTime: start.toJSDate(),
            date,
            values: timeOfDay,
            duration: interval,
            workflowId: taskRun.workflowId,
            color: colorMap(taskRun.workflowId),
            status: taskRun.status,
            fss: taskRun.fssId,
          }
        })
        .sort((a, b) => {
          return a.dispatchTime.getTime() - b.dispatchTime.getTime()
        })

      this.noDataText = "There are no running or pending tasks";
    } catch (error) {
      console.log(error)
    }
  }

  remove(id: string) {
    const index = this.currentWorkflowIds.indexOf(id)
    if (index >= 0) this.currentWorkflowIds.splice(index, 1)
  }

}
</script>
