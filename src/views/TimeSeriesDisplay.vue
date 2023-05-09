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
    <v-toolbar v-if="plots.length > 1 && $vuetify.breakpoint.mobile" dense>
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
                  <v-list-item-title>{{ plot }}</v-list-item-title>
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
import {Component, Mixins, Prop, Watch} from 'vue-property-decorator'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import {ColumnItem} from '@/components/ColumnItem'
import ComponentsPanel from '@/components/Layout/ComponentsPanel.vue'
import TimeSeriesMixin from '@/mixins/TimeSeriesMixin'
import {DisplayConfig, DisplayType} from '@/lib/Layout/DisplayConfig'
import {PiWebserviceProvider, ActionRequest} from "@deltares/fews-pi-requests";
import PiRequestsMixin from "@/mixins/PiRequestsMixin"
import type { TopologyActionFilter, ActionsResponse, TopologyNode } from "@deltares/fews-pi-requests";
import { timeSeriesDisplayToChartConfig } from '@/lib/ChartConfig/timeSeriesDisplayToChartConfig'

@Component({
  components: {
    ColumnMenu,
    TreeMenu,
    ComponentsPanel
  }
})
export default class TimeSeriesDisplay extends Mixins(TimeSeriesMixin, PiRequestsMixin) {
  @Prop({default: '', type: String})
  nodeId!: string

  urlTopologyNodeMap: Map<string,string> = new Map<string, string>()
  selectedItem: number = -1
  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0
  url: string | undefined = "";
  baseUrl!: string
  allDisplays: DisplayConfig[][] = []
  displays: DisplayConfig[] = []
  requests: ActionRequest[][] = [];
  plots: string[] = [];
  webServiceProvider: PiWebserviceProvider = {} as PiWebserviceProvider;

  created(): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
  }

  async mounted(): Promise<void> {
    this.webServiceProvider = new PiWebserviceProvider(this.baseUrl, {transformRequestFn: this.transformRequest});
    await this.loadNodes()
    await this.onNodeChange()
  }

  anyChildNodeIsVisible(nodes: TopologyNode[] | undefined): boolean {
    if (nodes === undefined) return false;
    for (const node of nodes) {
      if (this.topologyNodeIsVisible(node)) return true
    }
    return false;
  }

  topologyNodeIsVisible(node: TopologyNode): boolean {
    if (node.url !== undefined) return true;
    if (node.displayId !== undefined) return true;
    if (node.displayGroups !== undefined && node.displayGroups.length > 0) return true
    return this.anyChildNodeIsVisible(node.topologyNodes);
  }

  fillNodeMap(node: TopologyNode, map: Map<string, string>) {
    if (node.url !== undefined) {
      map.set(node.id, node.url)
    }
    node.topologyNodes?.forEach(childNode => this.fillNodeMap(childNode, map));
  }

  getIcon(node: TopologyNode): string | undefined {
    if (node.url) return 'mdi-share';
    return undefined;
  }
  async loadNodes(): Promise<void> {
    let nodes = await this.webServiceProvider.getTopologyNodes();
    this.urlTopologyNodeMap.clear();
    nodes.topologyNodes.forEach(node => this.fillNodeMap(node, this.urlTopologyNodeMap));

    const recursiveUpdateNode = (nodes: TopologyNode[]) => {
      return nodes.filter(node => this.topologyNodeIsVisible(node)).map((node) => {
        const result: ColumnItem = {
          id: node.id,
          name: node.name,
          icon: this.getIcon(node)
        }
        if (node.topologyNodes) {
          result.children = recursiveUpdateNode(node.topologyNodes)
        } else {
          if(node.url !== undefined) {
            result.href = node.url
            result.target = node.url
          } else {
            result.to = {
              name: 'TimeSeriesDisplay',
              params: {
                nodeId: node.id
              }
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
