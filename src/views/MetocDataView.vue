<template>
  <div class="display-container">
    <portal to="web-oc-sidebar">
      <MetocSidebar
        :categories="categories"
      />
    </portal>
    <div class="grid-root" :class="layoutClass">
      <div class="grid-map" v-show="showMap">
        <div class="map-container" style="height: calc(100% - 48px); position: relative;">
          <MapComponent>
            <MapboxLayer v-if="showLayer" :layer="layerOptions"/>
            <v-mapbox-layer
              v-if="showLocationsLayer"
              :options="locationsLayer"
              clickable
            />
            <!-- @click="onLocationClick" -->
          </MapComponent>
        </div>
        <div style="position: absolute; padding-left: 5px; left: 30px;">
          <v-chip-group>
            <!-- <WMSLayerControl
              v-if="currentLayers.length > 0"
              v-model="layerOptions"
              :showLayer.sync="showLayer"
              :time="externalForecastTime"
              :items="currentLayers"
              :timeIndex="currentTime"
              @change="updateActiveLayer">
            </WMSLayerControl> -->
            <LocationsLayerControl v-model="showLocationsLayer"/>
          </v-chip-group>
        </div>
        <DateTimeSlider
          class="date-time-slider"
          v-model="currentTime"
          :dates="times"
          @input="debouncedSetWMSLayerOptions"
          @update:now="setCurrentTime"
        />
      </div>
      <div class="grid-charts" ref="grid-charts" v-if="hasSelectedLocation && !$vuetify.breakpoint.mobile">
        <v-toolbar class="toolbar-charts" dense flat>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn icon plain @click="onDockModeChange('left')">
              <v-icon>mdi-dock-left</v-icon>
            </v-btn>
            <v-btn icon plain @click="onDockModeChange('bottom')">
              <v-icon>mdi-dock-bottom</v-icon>
            </v-btn>
            <v-btn icon plain @click="onDockModeChange('right')">
              <v-icon>mdi-dock-right</v-icon>
            </v-btn>
            <v-btn icon plain @click="closeCharts">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <router-view :displays="displays" :series="timeSeriesStore" @toggleFullscreen="toggleFullscreen"></router-view>
      </div>
      <div class="grid-charts fullscreen" ref="grid-charts" v-else-if="hasSelectedLocation">
        <v-toolbar class="toolbar-charts" dense flat>
          <v-toolbar-title>
          </v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn icon plain @click="closeCharts">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <router-view :displays="displays" @toggleFullscreen="toggleFullscreen"></router-view>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'

import type { Location } from "@deltares/fews-pi-requests";
import { ActionRequest, DocumentFormat, PiWebserviceProvider} from "@deltares/fews-pi-requests";
import type { Layer } from '@deltares/fews-wms-requests';
import { ColourMap } from '@deltares/fews-web-oc-charts';

import { FeatureCollection, Geometry } from 'geojson';
import { debounce, uniq, intersection } from 'lodash';

import PiRequestsMixin from '@/mixins/PiRequestsMixin';
import MapComponent from '@/components/MapComponent.vue'
import WMSMixin from '@/mixins/WMSMixin'
import { DateController } from '@/lib/TimeControl/DateController';
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import WMSLayerControl, { WMSLayerControlValue } from '@/components/WMSLayerControl.vue'
import LocationsLayerControl from '@/components/LocationsLayerControl.vue'
import MapboxLayer from '@/components/AnimatedMapboxLayer.vue';
import { timeSeriesDisplayToChartConfig } from '@/lib/ChartConfig/timeSeriesDisplayToChartConfig'
import TimeSeriesMixin from '@/mixins/TimeSeriesMixin'
import { DisplayConfig, DisplayType } from '@/lib/Layout/DisplayConfig';

import MetocSidebar from '@/components/MetocSidebar.vue';
import { Category, DataLayer, DataSource, fetchCategories, fetchLocationsAsGeoJson } from '@/lib/Topology';
import { convertGeoJsonToFewsPiLocation } from '@/lib/Topology/locations';

interface MapboxLayerOptions {
  name: string;
  time: Date;
}

@Component({
  components: {
    MapboxLayer,
    MapComponent,
    DateTimeSlider,
    LocationsLayerControl,
    WMSLayerControl,
    MetocSidebar
  }
})
export default class MetocDataView extends Mixins(WMSMixin, TimeSeriesMixin, PiRequestsMixin) {
  @Prop({ default: '', type: String }) categoryId!: string
  @Prop({ default: '', type: String }) dataLayerId!: string
  @Prop({ default: '', type: String }) dataSourceId!: string
  @Prop({ default: '', type: String }) locationId!: string

  webServiceProvider!: PiWebserviceProvider

  stateDockMode = 'right'
  layoutClass: string = 'map-only'
  isFullscreenGraph = false

  showLayer: boolean = true

  dateController!: DateController
  currentTime: Date = new Date()
  times: Date[] = []
  debouncedSetWMSLayerOptions!: () => void

  layerName: string = ''
  layerOptions: MapboxLayerOptions | null = null

  legend: ColourMap = []
  unit: string = ""

  locations: Location[] = []

  displays: DisplayConfig[] = []
  externalForecastTime = new Date()

  showLocationsLayer = true
  locationsLayer = {
    'id': 'locationsLayer',
    'type': 'circle',
    'source': {
      'type': 'geojson',
      'data': {}
    },
    'layout': {
      'visibility': 'visible'
    },
    'paint': {
      'circle-radius': 6,
      'circle-color': '#B42222'
    },
  }

  categories: Category[] = []

  created(): void {
    this.dateController = new DateController([])
    this.debouncedSetWMSLayerOptions = debounce(this.setWMSLayerOptions, 500, {
      leading: true,
      trailing: true
    })
  }

  async mounted() {
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const transformRequestFn = this.getTransformRequest()
    this.webServiceProvider = new PiWebserviceProvider(baseUrl, {transformRequestFn})

    this.categories = await fetchCategories(this.webServiceProvider)
    this.onDataSourceChange()

    /*
    this.setLayoutClass()
    await this.getFilters()
    this.getParameters()
    this.getCapabilities()
    */
    // Force resize to fix strange starting position of the map, caused by
    // the expandable navigation drawer.
    window.dispatchEvent(new Event('resize'))
  }

  @Watch('dataSourceId')
  async onDataSourceChange(): Promise<void> {
    // Get WMS layer times for the currently selected data source, then update the current WMS
    // layer.
    this.times = await this.getTimes(this.currentDataSource.wmsLayerId)

    // Select the WMS layer time closest to the currently selected time.
    // TODO: change interface of date controller with setter and return value from selectDate?
    this.dateController.dates = this.times
    this.dateController.selectDate(this.currentTime ?? new Date())
    this.currentTime = this.dateController.currentTime

    this.setWMSLayerOptions()

    const geojson = await fetchLocationsAsGeoJson(
      this.webServiceProvider, this.currentDataSource.filterIds
    )
    this.locationsLayer.source.data = geojson
    this.locations = convertGeoJsonToFewsPiLocation(geojson)
  }

  setWMSLayerOptions(): void {
    if (this.times.length === 0) {
      this.layerOptions = null
    } else {
      this.layerOptions = {
        name: this.currentDataSource.wmsLayerId,
        time: this.currentTime
      }
    }
  }

  onDockModeChange(dockMode: string) {
    this.dockMode = dockMode
    if (this.hasSelectedLocation) {
      this.layoutClass = this.dockMode
    }
    this.$nextTick(this.onResize)
  }

  closeCharts() {
    if (this.hasSelectedLocation) {
      const params = this.$route.params
      this.$router.push({
        name: 'MetocDataViewer',
        params: {
          filterId: params.filterId,
          categoryId: params.categoryId
        }
      })
    }
  }

  toggleFullscreen(isFullscreen: boolean) {
    this.isFullscreenGraph = isFullscreen
  }

  onResize() {
    window.dispatchEvent(new Event('resize'))
  }

  /**
   * Sets the WMS layer to the current time, if this is enabled.
   *
   * If tracking the current time is not enabled, this is a no-op.
   *
   * @param enabled Whether to set the WMS layer to the current time.
   */
  setCurrentTime(enabled: boolean): void {
    if (enabled) {
      this.dateController.selectDate(new Date())
      this.currentTime = this.dateController.currentTime
      this.setWMSLayerOptions()
    }
  }

  get currentCategory(): Category {
    const defaultCategory = this.categories[0]
    if (!this.categoryId) return defaultCategory
    return this.categories.find(category => category.id === this.categoryId) ?? defaultCategory
  }

  get currentDataLayer(): DataLayer {
    const defaultDataLayer = this.currentCategory.dataLayers[0]
    if (!this.dataLayerId) return defaultDataLayer
    return this.currentCategory.dataLayers.find(dataLayer => dataLayer.id === this.dataLayerId) ?? defaultDataLayer
  }

  get currentDataSource(): DataSource {
    const defaultDataSource = this.currentDataLayer.dataSources[0]
    if (!this.dataSourceId) return defaultDataSource
    return this.currentDataLayer.dataSources.find(dataSource => dataSource.id === this.dataSourceId) ?? defaultDataSource
  }

  get showMap() {
    const isMobileGraphOpen = this.hasSelectedLocation && this.$vuetify.breakpoint.mobile
    return !isMobileGraphOpen && !this.isFullscreenGraph
  }

  get hasSelectedLocation() {
    return this.locationId !== ''
  }

  get dockMode() {
    return this.stateDockMode
  }

  set dockMode(dockMode: string) {
    this.stateDockMode = dockMode
  }
}

</script>

<style scoped>
  .display-container {
    height: 100%;
  }

  .grid-root {
    display: flex;
    padding: 0px;
    width: 100%;
    height: 100%;
  }

  .grid-root.right {
    flex-direction: row;
  }

  .grid-root.left {
    flex-direction: row-reverse;
  }

  .grid-root.bottom {
    flex-direction: column;
  }

  .grid-map {
    display: flex;
    flex-basis: 400px;
    flex: 1 1 auto;
    flex-direction: column;
  }

  .grid-charts {
    display: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 50%;
    z-index: 1100;
  }

  .right>.grid-charts,
  .left>.grid-charts {
    height: 100%;
    width: 50%;
  }

  .bottom>.grid-charts {
    height: 50%;
    width: 100%;
  }

  .grid-charts.fullscreen {
    width: 100%;
    flex-basis: 100%;
    height: 100%;
  }

  .bottom>.grid-map {
    height: 50%;
    width: 100%;
  }

  .toolbar-charts {
    flex: 0 0 auto;
  }

  .colourbar {
    font-size: 0.825em;
    z-index: 1000;
    background-color: none;
    margin-top: -50px;
    width: 500px;
    height: 100px;
  }

  .wms-panel {
    position: absolute;
    display: flex;
    flex-direction: column;
  }

  .wms-layer-control-container {
    display: flex;
    padding: 15px 50px 15px 50px;
  }

  .map-only>.wms-panel>.wms-layer-control-container,
  .right>.wms-panel>.wms-layer-control-container {
    justify-content: flex-start;
  }

  .bottom>.wms-panel>.wms-layer-control-container,
  .left>.wms-panel>.wms-layer-control-container {
    justify-content: flex-end;
  }

  .mobile>.wms-panel>.wms-layer-control-container {
    padding: 10px 0px;
    width: 100%;
    justify-content: center;
  }

  .map-only>.wms-panel,
  .right>.wms-panel {
    left: 0px;
    bottom: 80px;
  }

  .left>.wms-panel {
    right: 0px;
    bottom: 80px;
  }

  .bottom>.wms-panel {
    top: 10px;
    right: 0px;
  }

  .mobile>.wms-panel {
    justify-content: center;
    bottom: 80px;
    width: 100%;
  }

  .map-container {
    display: flex;
    flex: 1 1;
    height: 100%;
  }

  .datetime-control-container {
    flex-grow: 0;
    z-index: 1000;
  }

.v-list-item--dense, .v-list--dense .v-list-item {
  min-height: 28px !important;
}

.v-treeview--dense .v-treeview-node__root {
  min-height: 28px !important;
}

.v-treeview-node__level {
  width: 12px !important;
}

</style>
