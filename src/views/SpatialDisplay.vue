<template>
  <div>
    <portal to="web-oc-sidebar">
      <v-toolbar v-if="!$vuetify.breakpoint.mobile" dense flat>
        <v-btn-toggle v-model="viewMode" color="primary" dense group mandatory>
          <v-btn text>
            <v-icon>mdi-file-tree</v-icon>
          </v-btn>
          <v-btn text>
            <v-icon>mdi-view-week</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-toolbar>
      <v-divider />
      <TreeMenu v-if="viewMode === 0 && !$vuetify.breakpoint.mobile" :active.sync="active" :items="items"
        :open.sync="open">
      </TreeMenu>
      <ColumnMenu v-else :active.sync="active" :items="items" :open.sync="open">
      </ColumnMenu>
    </portal>
    <div style="height: calc(100% - 48px); position: relative">
      <MapComponent>
        <MapboxLayer :layer="layerOptions" />
      </MapComponent>
      <div class="colourbar">
        <ColourBar v-model="legend" v-if="legend.length > 0"/>
      </div>
    </div>
    <DateTimeSlider class="date-time-slider" v-model="currentTime" :dates="times" @update:now="setCurrentTime"
      @input="debouncedSetLayerOptions" @timeupdate="updateTime">
    </DateTimeSlider>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import debounce from 'lodash/debounce'
import WMSMixin from '@/mixins/WMSMixin'
import MapComponent from '@/components/MapComponent.vue'
import MapboxLayer from '@/components/AnimatedMapboxLayer.vue'
import { ColumnItem } from '@/components/ColumnItem'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import { DateController } from '@/lib/TimeControl/DateController'
import { ColourMap } from '@deltares/fews-web-oc-charts'
import ColourBar from '@/components/ColourBar.vue'
import { Layer } from '@deltares/fews-wms-requests'
import {LayerGroup} from "@deltares/fews-wms-requests/src/response/getCapabilitiesResponse";

interface MapboxLayerOptions {
  name: string;
  time: Date;
}

@Component({
  components: {
    ColourBar,
    ColumnMenu,
    TreeMenu,
    DateTimeSlider,
    MapboxLayer,
    MapComponent,
  }
})
export default class SpatialDisplay extends Mixins(WMSMixin) {
  @Prop({ default: '' })
    layerName!: string

  active: string[] = []
  open: string[] = []
  items: ColumnItem[] = []
  viewMode = 0
  dateController!: DateController
  currentTime: Date = new Date()
  times: Date[] = []
  debouncedSetLayerOptions!: () => void
  layerOptions: MapboxLayerOptions | null = null
  legend: ColourMap = []
  unit: string = ""

  created (): void {
    this.dateController = new DateController([])
    this.debouncedSetLayerOptions = debounce(this.setLayerOptions, 500, { leading: true, trailing: true })
  }

  mounted (): void {
    this.loadCapabilities()
    this.onLayerChange()
  }

  async loadCapabilities (): Promise<void> {
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const response = await fetch(`${baseUrl}/wms?request=GetCapabilities&format=application/json&onlyHeaders=false`)
    const capabilities = await response.json()
    const layers = capabilities.layers
    const groups = capabilities.groups
    this.fillMenuItems(layers, groups)
  }

  fillMenuItems (layers: Layer[], groups: LayerGroup[]): void {
    const items: ColumnItem[] = [
      {
        id: 'root',
        name: 'Layers'
      }
    ]
    // build menu structure from the layer groups
    const rootNode = items[0]
    let groupNodes = new Map<string, ColumnItem>();
    for (const group of groups) {
      const item: ColumnItem = {
        id: group.path.toString(),
        name: group.title,
        children: []
      }
      groupNodes.set(group.path.toString(), item)
    }
    rootNode.children = []
    // attach layers to menu using the group path.
    for (const group of groups) {
      const groupNode = groupNodes.get(group.path.toString())
      if (group.groupName === undefined && groupNode !== undefined) {
        rootNode.children.push(groupNode)
      } else {
        if (groupNode !== undefined && group.groupName !== undefined && group.path.length > 0) {
          const parentPath = group.path.slice(0,-1)
          if (parentPath !== undefined) {
            const parentNode = groupNodes.get(parentPath.toString())
            parentNode?.children?.push(groupNode)
          }
        }
      }
    }

    for (const layer of layers) {
      const groupNode = groupNodes.get(layer.path.toString())
      const item: ColumnItem = {
        id: layer.name,
        name: layer.title || layer.name,
        nodata: layer.completelyMissing || false,
        to: {
          name: 'SpatialDisplay',
          params: {
            layerName: layer.name,
          }
        }
      }
      groupNode?.children?.push(item)
    }
    this.items = items
    this.open = [items[0].id]
  }

  setCurrentTime (enabled: boolean): void {
    if (enabled) {
      this.dateController.selectDate(new Date())
      this.currentTime = this.dateController.currentTime
      this.setLayerOptions()
    }
  }

  updateTime (date: Date): void {
    this.dateController.selectDate(date)
    this.currentTime = this.dateController.currentTime
  }

  @Watch('layerName')
  async onLayerChange (): Promise<void> {
    try {
      this.times = await this.getTimes(this.layerName)
    } catch {
      console.log('no times')
      this.times = []
    }
    this.dateController.dates = this.times
    this.dateController.selectDate(this.currentTime)
    this.currentTime = this.dateController.currentTime
    try {
      const response = await this.getLegendGraphic(this.layerName)
      this.legend = response.legend
      this.unit = response.unit
    } catch {
      console.log('no legend')
      this.legend = []
      this.unit = ""
    }
    this.setLayerOptions()
  }

  setLayerOptions (): void {
    if (this.layerName) { this.layerOptions = { name: this.layerName, time: this.currentTime } }
  }
}
</script>

<style scoped>
  .colourbar {
    font-size: 0.825em;
    z-index: 1000;
    background-color: none;
    width: 500px;
    height: 100px;
    position: absolute;
    bottom: 10px;
  }
</style>
