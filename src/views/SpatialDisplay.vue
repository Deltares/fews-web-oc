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
import { MapboxLayerOptions, convertBoundingBoxToLngLatBounds } from '@/components/AnimatedMapboxLayer.vue'
import { ColumnItem } from '@/components/ColumnItem'
import ColumnMenu from '@/components/ColumnMenu.vue'
import TreeMenu from '@/components/TreeMenu.vue'
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import { DateController } from '@/lib/TimeControl/DateController'
import { ColourMap } from '@deltares/fews-web-oc-charts'
import ColourBar from '@/components/ColourBar.vue'
import { Layer } from '@deltares/fews-wms-requests'
import {LayerGroup} from "@deltares/fews-wms-requests/src/response/getCapabilitiesResponse";
import { LngLatBounds } from 'mapbox-gl'

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
  layersBbox: {[key: string]: LngLatBounds} = {}

  created (): void {
    this.dateController = new DateController([])
    this.debouncedSetLayerOptions = debounce(this.setLayerOptions, 500, { leading: true, trailing: true })
  }

  mounted (): void {
    this.loadCapabilities()
    this.onLayerChange()
  }

  loadLayersBbox (layers: Layer[]): void {
    for (const layer of layers) {
      if (layer.boundingBox) {
        this.layersBbox[layer.name] = convertBoundingBoxToLngLatBounds(layer.boundingBox)
      }
    }
  }

  async loadCapabilities (): Promise<void> {
    const capabilities = await this.wmsProvider.getCapabilities({})
    const layers = capabilities.layers
    const groups = capabilities.groups
    this.fillMenuItems(layers, groups)
    this.loadLayersBbox(layers)
  }

  fillMenuItems (layers: Layer[], groups: LayerGroup[]): void {
    const items: ColumnItem[] = [
      {
        id: 'root',
        name: 'Layers'
      }
    ]
    const rootNode = items[0]
    rootNode.children = []
    let groupNodesMenuItemsMap = this.determineGroupNodesMap(groups);
    this.buildMenuFromGroups(groups, groupNodesMenuItemsMap, rootNode);
    this.attachLayersToMenu(layers, groupNodesMenuItemsMap);
    this.items = items
    this.open = [items[0].id]
  }

  private attachLayersToMenu(layers: Layer[], groupNodes: Map<string, ColumnItem>) {
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
  }

  private buildMenuFromGroups(groups: LayerGroup[], groupNodes: Map<string, ColumnItem>, rootNode: ColumnItem) {
    for (const group of groups) {
      const groupNode = groupNodes.get(group.path.toString())
      if (group.groupName === undefined && groupNode !== undefined) {
        rootNode?.children?.push(groupNode)
      } else {
        if (groupNode !== undefined && group.groupName !== undefined && group.path.length > 0) {
          const parentPath = group.path.slice(0, -1)
          if (parentPath !== undefined) {
            const parentNode = groupNodes.get(parentPath.toString())
            parentNode?.children?.push(groupNode)
          }
        }
      }
    }
  }

  private determineGroupNodesMap(groups: LayerGroup[]): Map<string, ColumnItem> {
    let groupNodes = new Map<string, ColumnItem>();
    for (const group of groups) {
      const item: ColumnItem = {
        id: group.path.toString(),
        name: group.title,
        children: []
      }
      groupNodes.set(group.path.toString(), item)
    }
    return groupNodes;
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
      this.legend = []
      this.unit = ""
    }
    this.setLayerOptions()
  }

  setLayerOptions (): void {
    if (this.layerName) { 
      this.layerOptions = { name: this.layerName, time: this.currentTime, bbox: this.layersBbox[this.layerName] } }
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
