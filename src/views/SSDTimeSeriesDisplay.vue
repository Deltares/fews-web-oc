<template>
  <div class="display-container">
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
import SeriesStore from '@/mixins/SeriesStore'
import {Series, SeriesUrlRequest} from '@/lib/TimeSeries'
import {DisplayConfig, DisplayType} from '@/lib/Layout/DisplayConfig'
import {PiWebserviceProvider, TimeSeriesResponse} from "@deltares/fews-pi-requests";
import {ActionWithConfigRequest, ClickType, SsdWebserviceProvider} from "@deltares/fews-ssd-requests";
import { timeSeriesDisplayToChartConfig } from '@/lib/ChartConfig/timeSeriesDisplayToChartConfig'

@Component({
  components: {
    ColumnMenu,
    TreeMenu,
    ComponentsPanel
  }
})
export default class SSDTimeSeriesDisplay extends Mixins(SeriesStore) {
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
  baseUrl!: string
  allDisplays: DisplayConfig[][] = []
  displays: DisplayConfig[] = []
  requests: any[] = [];
  plots: string[] = [];
  webServiceProvider!: PiWebserviceProvider;
  ssdServiceProvider!: SsdWebserviceProvider
  action: any = ''

  created(): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
  }

  async mounted(): Promise<void> {
    console.log('mounted', this)
    this.webServiceProvider = new PiWebserviceProvider(this.baseUrl);
    this.ssdServiceProvider = new SsdWebserviceProvider(this.baseUrl)
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
      console.log(display[0].title, result.requests.map((r: any) => r.key))
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
      if ( piSeries.timeSeries === undefined) continue
      for (const timeSeries of piSeries.timeSeries) {
        if (timeSeries.events === undefined) continue
        const resourceId = `${request.key}`
        const resource = new SeriesUrlRequest('fews-pi', url.toString())
        const series = new Series(resource)
        const header = timeSeries.header
        if (header !== undefined) {
          series.header.name = `${header.stationName} - ${header.parameterId} (${header.moduleInstanceId})`
          series.header.unit = header.units
          series.header.parameter = header.parameterId
          series.header.location = header.stationName
          series.header.source = header.moduleInstanceId
          series.start = new Date(`${header.startDate.date}T${header.startDate.time}`)
          series.end = new Date(`${header.endDate.date}T${header.endDate.time}`)
        }
        series.data = timeSeries.events.map((event, index) => {
          if ( index === 0) console.log(resourceId, event.value, event.flag, parseFloat(event.value))
          return {
            x: new Date(`${event.date}T${event.time}`),
            y: event.flag === '8' ? null : parseFloat(event.value)
          }
        })
        Vue.set(this.timeSeriesStore, resourceId, series)
      }
    }
  }
}
</script>

<style scoped>
.display-container {
  height: 100%;
  background-color: aliceblue;
}
</style>
