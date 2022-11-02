<template>
  <div>
    <portal to="web-oc-sidebar">
      <v-toolbar dense flat>
        <v-btn-toggle
          v-model="viewMode"
          color="primary"
          dense
          group
          mandatory
        >
          <v-btn text>
            <v-icon>mdi-file-tree</v-icon>
          </v-btn>
          <v-btn text>
            <v-icon>mdi-view-week</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-toolbar>
      <v-divider/>
      <TreeMenu
        v-if="viewMode === 0"
        :active.sync="active"
        :items="items"
        :open.sync="open"
      >
      </TreeMenu>
      <ColumnMenu
        v-else
        :active.sync="active"
        :items="items"
        :open.sync="open"
      >
      </ColumnMenu>
    </portal>
    <v-card
      class="my-auto mx-auto"
      max-width="800"
      v-if="this.warningMessage.length!==0"
    >
      <v-card-text>
        <p class="text-h4 text--primary text-center">
          {{this.warningMessage}}
        </p>
      </v-card-text>
    </v-card>
    <v-row>
      <v-col :md="this.plots.length===1?12:10">
        <div v-for="(display, index) in displays" :key="index">
          <time-series-component :value="display" :series="timeSeriesStore"/>
        </div>
      </v-col>
      <v-col md="2" v-if="this.plots.length>1">
        <v-navigation-drawer
          floating
        >
          <v-list dense rounded>
            <v-list-item-group
              v-model="selectedItem"
              color="primary"
            >
              <v-list-item
                v-for="(plot, i) in plots"
                :key="i"
              >
                <v-list-item-content>
                  <v-list-item-title v-text="plot"></v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-navigation-drawer>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import {Component, Mixins, Prop, Vue, Watch} from 'vue-property-decorator'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import {ColumnItem} from '@/components/ColumnItem'
import TimeSeriesComponent from '@/components/TimeSeriesComponent/ConfigurableChart.vue'
import SeriesStore from '@/mixins/SeriesStore'
import {Series, SeriesUrlRequest} from '@/lib/TimeSeries'
import {ChartConfig} from '@/components/TimeSeriesComponent/lib/ChartConfig'
import {ChartSeries} from '@/components/TimeSeriesComponent/lib/ChartSeries'
import {cloneDeep} from 'lodash'
import {PiWebserviceProvider, Event} from "@deltares/fews-pi-requests";
import {TopologyNode} from "@deltares/fews-pi-requests/src/response/topology/topologyNode";
import {DisplayGroupsFilter} from "@deltares/fews-pi-requests/src/requestParameters/DisplayGroupsFilter";
import {TimeSeriesResponse} from "@deltares/fews-pi-requests/src/response";
import {DisplayGroupsResponse} from "@deltares/fews-pi-requests/src/response/displaygroups/displayGroupsResponse";
import { timeSeriesDisplayToChartConfig } from '@/lib/ChartConfig/timeSeriesDisplayToChartConfig'

@Component({
  components: {
    ColumnMenu,
    TreeMenu,
    TimeSeriesComponent
  }
})
export default class TimeSeriesDisplay extends Mixins(SeriesStore) {
  @Prop({default: '', type: String})
  nodeId!: string
  selectedItem: number = -1;
  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0
  warningMessage: string = "";
  baseUrl!: string
  allDisplays: ChartConfig[][] = []
  displays: ChartConfig[] = []
  requests: any[] = [];
  plots: string[] = [];
  webServiceProvider: PiWebserviceProvider = {} as PiWebserviceProvider;

  created(): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
  }

  async mounted(): Promise<void> {
    this.webServiceProvider = new PiWebserviceProvider(this.baseUrl);
    await this.loadNodes()
    await this.onNodeChange()
  }

  async loadNodes(): Promise<void> {
    let nodes = await this.webServiceProvider.getTopologyNodes();

    const recursiveUpdateNode = (nodes: TopologyNode[]) => {
      return nodes.map((node) => {
        const result: ColumnItem = {
          id: node.id,
          name: node.name,
          icon: node.workflowId ? 'mdi-restart' : undefined
        }
        if (node.topologyNodes) {
          result.children = recursiveUpdateNode(node.topologyNodes)
        } else {
          result.to = {
            name: 'TimeSeriesDisplay',
            params: {
              nodeId: node.id
            }
          }
        }
        return result
      })
    }
    const items: ColumnItem[] = [
      {
        id: 'root',
        name: 'Topologie',
        children: recursiveUpdateNode(nodes.topologyNodes)
      }
    ]

    this.items = items
    this.open = [items[0].id]
  }

  @Watch('selectedItem')
  async onPlotChanged(): Promise<void> {
    this.displays = this.allDisplays[this.selectedItem];
    await this.loadTimeSeries(this.selectedItem);
  }

  @Watch('nodeId')
  async onNodeChange(): Promise<void> {
    const filter = {} as DisplayGroupsFilter;
    filter.nodeId = this.nodeId;
    const response: DisplayGroupsResponse = await this.webServiceProvider.getDisplayGroupsTimeSeriesInfo(filter);
    this.selectedItem = 0;
    this.allDisplays = [];
    this.requests = [];
    this.plots = [];
    this.displays = [];
    this.warningMessage = "";
    if (response.resultsNotAvailableForRequest) {
      this.warningMessage = "There are no plots configured for this node"
      return
    }

    for (const result of response.results) {
      if (result.config === undefined) continue;
      let display = [];
      for (const subPlot of result.config.timeSeriesDisplay.subplots) {
        display.push(convertTimeSeriesDisplayToWbCharts(subPlot, result.config.timeSeriesDisplay.title));
      }
      this.allDisplays.push(display);
      this.requests.push(result.requests);
      this.plots.push(result.config.timeSeriesDisplay.title)
    }
    if (this.plots.length === 0) {
      this.warningMessage = "It was not possible to show plots for this node. Please check your config"
      return
    }
    this.displays = this.allDisplays[0];
    await this.loadTimeSeries(0);
  }

  private async loadTimeSeries(index: number) {
    for (const request of this.requests[index]) {
      const url = new URL(`${this.baseUrl}/${request.request}`)
      const piSeries: TimeSeriesResponse = await this.webServiceProvider.getTimeSeriesWithRelativeUrl(request.request);
      for (const index in piSeries.timeSeries) {
        const timeSeries = piSeries.timeSeries[index]
        if (timeSeries.events === undefined) continue
        const resourceId = `${request.key}[${index}]`
        const resource = new SeriesUrlRequest('fews-pi', url.toString())
        const series = new Series(resource)
        series.header.name = `${timeSeries.header.stationName} - ${timeSeries.header.parameterId} (${timeSeries.header.moduleInstanceId})`
        series.header.unit = timeSeries.header.units
        series.header.parameter = timeSeries.header.parameterId
        series.header.location = timeSeries.header.stationName
        series.header.source = timeSeries.header.moduleInstanceId
        series.start = new Date(`${timeSeries.header.startDate.date}T${timeSeries.header.startDate.time}`)
        series.end = new Date(`${timeSeries.header.endDate.date}T${timeSeries.header.endDate.time}`)
        series.data = timeSeries.events.map((event: Event) => {
          return {
            x: new Date(`${event.date}T${event.time}`),
            y: event.flag === '8' ? null : parseFloat(event.value)
          }
        })
        Vue.set(this.timeSeriesStore, resourceId, series)
      }
    }
  }

  @Watch('active')
  onActiveChange(): void {
    console.log('update:active', this.active)
  }

  @Watch('open')
  onOpenChange(): void {
    console.log('update:open', this.open)
  }

}
</script>
