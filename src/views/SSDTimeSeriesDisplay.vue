<template>
  <div class="display-container">
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
    <div style="height: 100%; width: 100%; display: flex; flex-direction: row">
      <ComponentsPanel :displays="displays" :series="timeSeriesStore"/>
      <div style="width: 200px;" v-if="plots.length === 0">
        No plots
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
import {ActionWithConfigRequest, ClickType, SsdWebserviceProvider} from "@deltares/fews-ssd-requests";
import { timeSeriesDisplayToChartConfig } from '@/lib/ChartConfig/timeSeriesDisplayToChartConfig'

@Component({
  components: {
    ColumnMenu,
    TreeMenu,
    ComponentsPanel
  }
})
export default class SSDTimeSeriesDisplay extends Mixins(TimeSeriesMixin) {
  @Prop({default: '', type: String})
  groupId!: string

  @Prop({default: '', type: String})
  panelId!: string

  @Prop({default: '', type: String})
  objectId!: string

  selectedItem: number = -1;
  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0
  warningMessage: string = "";
  allDisplays: DisplayConfig[][] = []
  displays: DisplayConfig[] = []
  requests: any[] = [];
  plots: string[] = [];
  ssdServiceProvider!: SsdWebserviceProvider
  action: any = ''

  async mounted(): Promise<void> {
    this.ssdServiceProvider = new SsdWebserviceProvider(this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL'))
    this.onObjectIdChange()
  }

  @Watch('selectedItem')
  async onPlotChanged(): Promise<void> {
    this.displays = this.allDisplays[this.selectedItem];
    await this.loadTimeSeries(this.selectedItem);
  }


  @Watch('objectId')
  async onObjectIdChange() {
    const filter: ActionWithConfigRequest = {
      panelId: this.panelId,
      objectId: this.objectId,
      clickType: ClickType.LEFTSINGLECLICK,
      config: true
    }
    const action = await this.ssdServiceProvider.getAction(filter)
    this.onNodeChange(action)
  }


  async onNodeChange(action: any): Promise<void> {
    this.selectedItem = 0;
    this.timeSeriesStore = {}
    this.requests = [];
    this.plots = [];
    this.allDisplays = [];
    this.displays = [];
    this.warningMessage = "";
    for (const result of action.results) {
      if (result.config === undefined) continue;
      const display: DisplayConfig[] = [];
      for (let i in result.config.timeSeriesDisplay.subplots) {
        const subPlot = result.config.timeSeriesDisplay.subplots[i]
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
}
</script>

<style scoped>
.display-container {
  height: 100%;
  background-color: aliceblue;
}
</style>
