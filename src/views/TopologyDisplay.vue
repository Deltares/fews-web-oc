<template>
  <div class="display-container">
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
        :items="columnItems"
        :open.sync="open"
      >
      </TreeMenu>
      <ColumnMenu
        v-else
        :active.sync="active"
        :items="columnItems"
        :open.sync="open"
      >
      </ColumnMenu>
    </portal>
    <v-tabs
      v-model="selectedTab"
      align-with-title
    >
      <v-tabs-slider></v-tabs-slider>
      <v-tab
        v-for="tab in tabs"
        :key="tab.id"
      >
        {{ tab.title }}
      </v-tab>
    </v-tabs>
    <splitpanes horizontal class="default-theme">
      <pane>
        <splitpanes class="default-theme">
          <pane v-if="showMap">
            <explorer-component :topology-node="topologyNode"
                                @updateLocations="updateLocations"></explorer-component>
          </pane>
          <pane v-if="showTimeSeries">
            <v-toolbar v-if="plots.length > 1" dense>
              <v-spacer/>
              <v-menu offset-y>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn text v-bind="attrs" v-on="on">{{ plots[selectedItem] }}
                    <v-icon>mdi-chevron-down</v-icon>
                  </v-btn>
                </template>
                <v-list dense>
                  <v-list-item-group v-model="selectedItem" mandatory color="primary">
                    <v-list-item v-for="(plot, i) in plots" :key="i">
                      <v-list-item-content>
                        <v-list-item-title>{{ plot }}</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </v-menu>
              <v-spacer/>
            </v-toolbar>
            <div style="height: 100%; width: 100%; display: flex; flex-direction: row">
              <ComponentsPanel :displays="displays" :series="timeSeriesStore"/>
            </div>
          </pane>
        </splitpanes>
      </pane>
    </splitpanes>
  </div>
</template>
<script lang="ts">

import {Component, Mixins, Prop, Watch} from "vue-property-decorator";
import TimeSeriesMixin from "@/mixins/TimeSeriesMixin";
import PiRequestsMixin from "@/mixins/PiRequestsMixin";
import {ColumnItem} from "@/components/ColumnItem";
import {
  ActionRequest,
  ActionsResponse, Location,
  PiWebserviceProvider,
  TopologyActionFilter,
  TopologyNode
} from "@deltares/fews-pi-requests";
import {DisplayConfig, DisplayType} from "@/lib/Layout/DisplayConfig";
import ColumnMenu from "@/components/ColumnMenu.vue";
import TreeMenu from "@/components/TreeMenu.vue";
import ComponentsPanel from "@/components/Layout/ComponentsPanel.vue";
import {TopologyDisplayTab} from "@/lib/TopologyDisplay/types";
import {TopologyNodeResponse} from "@deltares/fews-pi-requests/lib/types/response/topology";
import ExplorerComponent from "@/components/explorer/ExplorerComponent.vue";
import {Pane, Splitpanes} from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import {timeSeriesDisplayToChartConfig} from "@/lib/ChartConfig/timeSeriesDisplayToChartConfig";
import {namespace} from "vuex-class";
import {fetchTimeSeriesDisplaysAndRequests} from "@/lib/TopologyDisplay/timeseriesdisplay";

const sytemTimeModule = namespace('systemTime')

@Component({
  components: {
    ExplorerComponent,
    ColumnMenu,
    TreeMenu,
    ComponentsPanel,
    Splitpanes,
    Pane
  }
})

export default class TopologyDisplay extends Mixins(TimeSeriesMixin, PiRequestsMixin) {
  @Prop({default: '', type: String})
  nodeId!: string

  static TIME_SERIES_DIALOG_PANEL: string = "time series dialog";

  @sytemTimeModule.State('startTime')
  startTime!: Date
  @sytemTimeModule.State('endTime')
  endTime!: Date

  viewMode = 0
  active: string[] = []
  open: string[] = []
  columnItems: ColumnItem[] = []
  tabs: TopologyDisplayTab[] = []
  baseUrl!: string
  webServiceProvider: PiWebserviceProvider = {} as PiWebserviceProvider;
  urlTopologyNodeMap: Map<string, string> = new Map<string, string>()
  displays: DisplayConfig[] = []
  selectedTab = null;
  allDisplays: DisplayConfig[][] = []
  requests: ActionRequest[][] = [];
  plots: string[] = [];
  selectedItem: number = -1
  wmsLayerId: string | undefined = ''
  filterIds: string[] | undefined = []
  topologyNode: TopologyNode | undefined = undefined
  showMap = true
  showTimeSeries = false
  topologyMap: Map<string, TopologyNode> = new Map<string, TopologyNode>();


  created(): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
  }

  async mounted(): Promise<void> {
    const transformRequestFn = this.getTransformRequest()
    this.webServiceProvider = new PiWebserviceProvider(this.baseUrl, {transformRequestFn});
    let nodes: TopologyNodeResponse = await this.webServiceProvider.getTopologyNodes();
    this.createTopologyMap(nodes.topologyNodes, this.topologyMap)
    this.columnItems = await this.loadNodes(nodes)
    this.open = [this.columnItems[0].id]
    this.tabs = this.getTopologyTabs(nodes)

  }


  async updateLocations(locationIds: string[]) {
    if (this.filterIds === undefined) return
    if (locationIds.length === 0) {
      if (this.topologyNode?.displayGroups !== undefined) {
        await this.showDisplayGroupsTimeSeries()
      } else {
        this.showTimeSeries = false;
      }
      return
    }
    const [displays, requests] = await fetchTimeSeriesDisplaysAndRequests(this.webServiceProvider, this.filterIds, locationIds)
    this.displays = displays
    this.plots = []
    await this.updateTimeSeries(requests, {startTime: this.startTime, endTime: this.endTime, thinning: true})
    this.showTimeSeries = true
  }

  @Watch('selectedItem')
  async onPlotChanged(): Promise<void> {
    this.displays = this.allDisplays[this.selectedItem];
    await this.loadTimeSeries(this.selectedItem);
  }

  @Watch('nodeId')
  async onNodeChange(): Promise<void> {

    const topologyNode: TopologyNode | undefined = this.topologyMap.get(this.nodeId)
    if (topologyNode === undefined) return
    this.showMap = topologyNode?.gridDisplaySelection?.plotId !== undefined || topologyNode.filterIds !== undefined
    this.showTimeSeries = topologyNode?.displayGroups !== undefined

    this.$nextTick(function () {
      this.topologyNode = topologyNode //this is needed otherwise the property topologyNode is not passed to the explorer component when showMap was false
      this.filterIds = topologyNode?.filterIds
      this.wmsLayerId = topologyNode?.gridDisplaySelection?.plotId


      if (!this.showTimeSeries) return
      this.showDisplayGroupsTimeSeries();
    })


  }

  private async showDisplayGroupsTimeSeries() {
    const filter = {} as TopologyActionFilter;
    filter.nodeId = this.nodeId;
    const response: ActionsResponse = await this.webServiceProvider.getTopologyActions(filter);
    this.selectedItem = 0;
    this.allDisplays = [];
    this.requests = [];
    this.plots = [];
    this.displays = [];
    for (const result of response.results) {
      if (result.config === undefined) continue;
      const display: DisplayConfig[] = [];
      const title = result.config.timeSeriesDisplay.title ?? ''
      result.config.timeSeriesDisplay.subplots?.forEach((subPlot, index) => {
        display.push({
          id: `${title}-${index}`,
          types: [DisplayType.TimeSeriesChart, DisplayType.TimeSeriesTable],
          class: 'single',
          title: title,
          config: timeSeriesDisplayToChartConfig(subPlot, title)
        })
      })
      this.allDisplays.push(display);
      this.requests.push(result.requests);
      this.plots.push(title)
    }
    this.displays = this.allDisplays.length > 0 ? this.allDisplays[0] : [];
    await this.loadTimeSeries(0);
  }

  createTopologyMap(nodes: TopologyNode[] | undefined, topologyMap: Map<string, TopologyNode>) {
    if (nodes === undefined) return undefined;
    for (const node of nodes) {
      topologyMap.set(node.id, node)
      this.createTopologyMap(node.topologyNodes, topologyMap)
    }
  }

  private async loadTimeSeries(index: number) {
    await this.updateTimeSeries(this.requests[index], {startTime: this.startTime, endTime: this.endTime, thinning: true})
  }


  async loadNodes(topologyNodes: TopologyNodeResponse): Promise<ColumnItem[]> {
    const recursiveUpdateNode = (nodes: TopologyNode[]) => {
      return nodes.filter(node => this.topologyNodeIsVisible(node)).map((node) => {
        const result: ColumnItem = {
          id: node.id,
          name: node.name,
          icon: this.getIcon(node)
        }
        if (node.topologyNodes) {
          result.children = recursiveUpdateNode(node.topologyNodes)
        }
        if (node.url !== undefined && node.mainPanel !== TopologyDisplay.TIME_SERIES_DIALOG_PANEL) {
          result.href = node.url
          result.target = node.url
        } else {
          result.wmsLayerId = node.gridDisplaySelection !== undefined ? node.gridDisplaySelection.plotId : undefined
          result.filterIds = node.filterIds ?? []
          result.to = {
            name: 'TopologyDisplay',
            params: {
              nodeId: node.id
            }
          }
        }
        return result
      })
    }
    return [
      {
        id: 'root',
        name: 'Topology',
        children: recursiveUpdateNode(topologyNodes.topologyNodes)
      }
    ]
  }

  getTopologyTabs(topologyNodeResponse: TopologyNodeResponse): TopologyDisplayTab[] {
    const panels = []
    const hasGrid = this.hasApplicableNodes(topologyNodeResponse.topologyNodes, node => node.gridDisplaySelection !== undefined || node.filterIds != undefined)
    const hasTimeSeriesDisplay = this.hasApplicableNodes(topologyNodeResponse.topologyNodes, node => node.displayGroups !== undefined)
    if (hasGrid || hasTimeSeriesDisplay) {
      panels.push({id: "spatialDisplay", title: "Time Series Display"} as TopologyDisplayTab)
    }
    return panels;
  }


  hasApplicableNodes(nodes: TopologyNode[] | undefined, callback: (node: TopologyNode) => boolean): boolean {
    if (nodes === undefined) return false;
    for (const node of nodes) {
      if (callback(node)) return true;
      if (this.hasApplicableNodes(node.topologyNodes, callback)) {
        return true;
      }
    }
    return false;
  }

  getIcon(node: TopologyNode): string | undefined {
    if (node.url && node.mainPanel !== TopologyDisplay.TIME_SERIES_DIALOG_PANEL) return 'mdi-share';
    return undefined;
  }

  topologyNodeIsVisible(node: TopologyNode): boolean {
    if (node.url !== undefined) return true;
    if (node.filterIds !== undefined && node.filterIds.length > 0) return true
    if (node.gridDisplaySelection !== undefined) return true
    if (node.displayId !== undefined) return true;
    if (node.displayGroups !== undefined && node.displayGroups.length > 0) return true
    return this.anyChildNodeIsVisible(node.topologyNodes);
  }

  anyChildNodeIsVisible(nodes: TopologyNode[] | undefined): boolean {
    if (nodes === undefined) return false;
    for (const node of nodes) {
      if (this.topologyNodeIsVisible(node)) return true
    }
    return false;
  }
}
</script>
