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
      v-if="warningMessage.length!==0"
    >
      <v-card-text>
        <p class="text-h4 text--primary text-center">
          {{warningMessage}}
        </p>
      </v-card-text>
    </v-card>
    <v-toolbar v-if="$vuetify.breakpoint.mobile" dense>
      <v-spacer/>
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn text v-bind="attrs" v-on="on">{{ plots[selectedItem] }}<v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item-group v-model="selectedItem" mandatory color="primary">
            <v-list-item v-for="(plot, i) in plots" :key="i">
              <v-list-item-content>
                <v-list-item-title v-text="plot"></v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-menu>
      <v-spacer/>
    </v-toolbar>
    <div style="height: 100%; width: 100%; display: flex; flex-direction: row">
      <ComponentsPanel :displays="displays" :series="timeSeriesStore"/>
      <div style="width: 200px;" v-if="plots.length > 1 && !$vuetify.breakpoint.mobile">
        <v-navigation-drawer
          width="200"
          permanent
        >
          <v-subheader>Overview</v-subheader>
          <v-list>
            <v-list-item-group
              v-model="selectedItem"
              mandatory
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
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Mixins, Prop, Vue, Watch} from 'vue-property-decorator'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import {ColumnItem} from '@/components/ColumnItem'
import ComponentsPanel from '@/components/Layout/ComponentsPanel.vue'
import TimeSeriesMixin from '@/mixins/TimeSeriesMixin'
import {DisplayConfig, DisplayType} from '@/lib/Layout/DisplayConfig'
import {PiWebserviceProvider} from "@deltares/fews-pi-requests";
import type { DisplayGroupsFilter, DisplayGroupsResponse, TimeSeriesResponse, TopologyNode } from "@deltares/fews-pi-requests";
import { timeSeriesDisplayToChartConfig } from '@/lib/ChartConfig/timeSeriesDisplayToChartConfig'

@Component({
  components: {
    ColumnMenu,
    TreeMenu,
    ComponentsPanel
  }
})
export default class TimeSeriesDisplay extends Mixins(TimeSeriesMixin) {
  @Prop({default: '', type: String})
  nodeId!: string

  selectedItem: number = -1;
  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0
  warningMessage: string = "";
  baseUrl!: string
  allDisplays: DisplayConfig[][] = []
  displays: DisplayConfig[] = []
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
        name: 'Topology',
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
      const display: DisplayConfig[] = [];
      for (let i in result.config.timeSeriesDisplay.subplots) {
        const subPlot = result.config.timeSeriesDisplay.subplots[i]
        console.log(subPlot)
        const title = result.config.timeSeriesDisplay.title
        display.push({
          id: `${title}-${i}`,
          types: [DisplayType.TimeSeriesChart, DisplayType.TimeSeriesTable],
          class: 'single',
          title: result.config.timeSeriesDisplay.title,
          config: timeSeriesDisplayToChartConfig(subPlot, title)
        })
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
    this.updateTimeSeries(this.requests[index])
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

<style scoped>
.display-container {
  height: 100%;
}
</style>
