<template>
  <div class="display-container">
    <portal to="web-oc-sidebar">
      <div class="sidebar-content">
        <v-divider></v-divider>
        <v-subheader>Filters</v-subheader>
        <v-list expand nav>
          <v-list-item v-for="filter in filters" :key="filter.id" link
            :to="{ name: 'DataViewer', params: { filterId: filter.id } }">
            <v-list-item-icon>
              <v-icon>{{ filter.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ filter.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-divider></v-divider>
        <v-subheader>Parameter Group</v-subheader>
        <v-list expand nav>
          <v-list-item v-for="(c, i) of categories" :key="i"
            :to="{ name: 'DataViewer', params: { filterId, categoryId: c } }">
            <v-list-item-content>
              <v-list-item-title>{{ c }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </div>
    </portal>
    <div class="grid-root" :class="layoutClass">
      <div class="grid-map" v-show="showMap">
        <div class="map-container" style="height: calc(100% - 48px); position: relative;">
          <MapComponent>
            <MapboxLayer :layer="layerOptions"></MapboxLayer>
            <v-mapbox-layer v-if="showLocationsLayer" :options="locationsLayer" clickable @click="onLocationClick"></v-mapbox-layer>
          </MapComponent>
        </div>
        <div style="position: absolute; z-index: 1200; padding-left: 5px;">
          <v-chip-group>
            <WMSLayerControl
              v-if="currentLayers.length > 0"
              v-model="layerOptions"
              :time="externalForecastTime"
              :items="currentLayers"
              :timeIndex="currentTime"
              @change="updateActiveLayer">
            </WMSLayerControl>
            <LocationsLayerControl v-model="showLocationsLayer"/>
          </v-chip-group>
        </div>
        <DateTimeSlider class="date-time-slider" v-model="currentTime" :dates="times" @update:now="setCurrentTime"
          @input="debouncedSetLayerOptions" @timeupdate="updateTime">
        </DateTimeSlider>
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
        <router-view @toggleFullscreen="toggleFullscreen"></router-view>
      </div>
      <div class="grid-charts fullscreen" ref="grid-charts" v-if="hasSelectedLocation && $vuetify.breakpoint.mobile">
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
        <router-view :message="currentParameters">
        </router-view>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { PiWebserviceProvider } from "@deltares/fews-pi-requests";
import { debounce, uniq, intersection } from 'lodash';
import { Location } from '@deltares/fews-pi-requests/src/response';
import MapComponent from '../components/MapComponent.vue'
import WMSMixin from '@/mixins/WMSMixin'
import { Layer } from '@/lib/wms';
import { DateController } from '@/lib/TimeControl/DateController';
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import { ColourMap } from 'wb-charts';
import WMSLayerControl, { WMSLayerControlValue } from '@/components/WMSLayerControl.vue'
import LocationsLayerControl from '@/components/LocationsLayerControl.vue'
import MapboxLayer from '@/components/AnimatedMapboxLayer.vue';

interface Filter {
  id: string;
  name: string;
  icon ? : string;
}

interface Parameter {
  id: string;
  name: string;
  icon ? : string;
  parameterGroup: string;
}

@Component({
  components: {
    MapboxLayer,
    MapComponent,
    DateTimeSlider,
    LocationsLayerControl,
    WMSLayerControl
  }
})
export default class DataView extends Mixins(WMSMixin) {
  @Prop({
    default: '',
    type: String
  })
  filterId!: string

  @Prop({
    default: '',
    type: String
  })
  categoryId!: string

  @Prop({
    default: '',
    type: String
  })
  locationId!: string

  stateDockMode = 'right'
  layoutClass: string = 'map-only'
  isFullscreenGraph = false

  filters: Filter[] = []
  webServiceProvider!: PiWebserviceProvider
  parameters: Parameter[] = []

  currentFilterId: string = ''
  currentCategoryId: string = ''
  currentParameters: Parameter[] = []
  currentLayers: Layer[] = []

  dateController!: DateController
  currentTime: Date = new Date()
  times: Date[] = []
  debouncedSetLayerOptions!: any

  layerName: string = ''
  layerOptions: any = {}

  legend: ColourMap = []
  unit: string = ""

  categories: string[] = []
  locations: Location[] = []

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

  created(): void {
    this.dateController = new DateController([])
    this.debouncedSetLayerOptions = debounce(this.setLayerOptions, 500, {
      leading: true,
      trailing: true
    })
  }

  async mounted() {
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    this.webServiceProvider = new PiWebserviceProvider(baseUrl)
    await this.getFilters()
    this.getParameters()
    this.getCapabilities()
    this.setLayoutClass()

    // Force resize to fix strange starting position of the map, caused by
    // the expandable navigation drawer.
    window.dispatchEvent(new Event('resize'))
  }

  async getFilters() {
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const response = await fetch(`${baseUrl}rest/fewspiservice/v1/filters?documentFormat=PI_JSON`)
    const filters = (await response.json()).filters.map((f: Filter) => {
      return {
        ...f,
        ...{
          icon: `mdi-alpha-${f.name[0].toLowerCase()}-circle-outline`
        }
      }
    })
    this.filters = filters
    const filterId =  filters[0].id
    if (this.filterId === '') {
      this.currentFilterId = filterId
      this.$router.replace({ name: 'DataViewer', params: { filterId } })
    } else {
      this.currentFilterId = this.filterId
    }
  }

  @Watch('filterId')
  async getParameters() {
    const filter = {
      filterId: this.currentFilterId
    }
    // const response = await this.webServiceProvider.getParameters(filter as any)
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const response = await fetch(
      `${baseUrl}rest/fewspiservice/v1/parameters?documentFormat=PI_JSON&filterId=${this.currentFilterId}`)
    const parameters: Parameter[] = (await response.json()).timeSeriesParameters
    this.parameters = parameters
    this.categories = uniq(parameters.map(p => p.parameterGroup))
    const categoryId = this.categories[0]
    if (this.categoryId === '') {
      this.currentCategoryId = categoryId
      this.$router.replace({ name: 'DataViewer', params: { filterId: this.filterId, categoryId } })
    } else {
      this.currentCategoryId = this.categoryId
    }
    console.log('cat', this.currentCategoryId)
    this.getLocations()
  }

  async getLocations() {
    const filter = {
      filterId: this.currentFilterId,
      parameterIds: 'H.obs'
    }
    // const response = await this.webServiceProvider.getParameters(filter as any)
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const response = await fetch(
      `${baseUrl}rest/fewspiservice/v1/locations?documentFormat=GEO_JSON&filterId=${this.currentFilterId}&parameterGroupId=${this.currentCategoryId}`)
    const locations: any = await response.json()
    this.locations = locations.features.map( (f: any) => { return f.properties })
    this.locationsLayer.source.data = locations
  }

  @Watch('categoryId')
  onCategoryChange(): void {
    this.layerOptions = {}
    this.currentCategoryId = this.categoryId
    this.currentParameters = this.parameters.filter((p) => p.parameterGroup === this.currentCategoryId)
    this.getLocations()
    this.updateLayers()
  }

  async updateLayers() {
    const currentParameterIds = this.currentParameters.map(p => p.id)
    const currentLayers = this.layers.filter(l => {
      const layerParameterIds = l.keywordList.filter(k => k.parameterId).map(k => k.parameterId)
      const intersect = intersection(currentParameterIds, layerParameterIds)
      return intersect.length > 0
    })
    this.currentLayers = currentLayers
    if (currentLayers.length > 0) {
      this.layerName = currentLayers[0].name
    } else {
      this.layerName = ''
    }
    this.onLayerChange()
  }

  setLayoutClass(): void {
    if (this.$vuetify.breakpoint.mobile) {
      this.layoutClass = 'mobile'
    } else if (this.locationId === '') {
      this.layoutClass = 'map-only'
      this.onResize()
    } else {
      this.onDockModeChange(this.dockMode)
    }
  }

  closeCharts() {
    if (this.hasSelectedLocation) {
      const params = this.$route.params
      this.$router.push({
        name: 'DataViewer',
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

  onLocationClick(e: any) {
    const locationId = e.features[0].properties.locationId
    this.$router.push({
      name: 'DataViewerWithLocation',
      params: {
        filterId: this.filterId,
        categoryId: this.categoryId,
        locationId
      }
    })
  }

  get hasSelectedLocation() {
    return this.locationId !== ''
  }

  get showMap() {
    const isMobileGraphOpen = this.hasSelectedLocation && this.$vuetify.breakpoint.mobile
    return !isMobileGraphOpen && !this.isFullscreenGraph
  }

  onDockModeChange(dockMode: string) {
    this.dockMode = dockMode
    if (this.hasSelectedLocation) {
      this.layoutClass = this.dockMode
    }
    this.$nextTick(this.onResize)
  }

  get dockMode() {
    return this.stateDockMode
  }

  set dockMode(dockMode: string) {
    this.stateDockMode = dockMode
  }

  setCurrentTime(enabled: boolean): void {
    if (enabled) {
      this.dateController.selectDate(new Date())
      this.currentTime = this.dateController.currentTime
      this.setLayerOptions()
    }
  }

  updateTime(date: Date): void {
    this.dateController.selectDate(date)
    this.currentTime = this.dateController.currentTime
  }

  async onLayerChange(): Promise <void> {
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

  async updateActiveLayer(value: WMSLayerControlValue): Promise<void> {
    if (value.name !== this.layerName && (value.active)) {
      this.layerName = value.name
      this.onLayerChange()
      this.setLayerOptions()
    }
    if (value.active === false) {
      this.layerOptions = null
    }
  }

  setLayerOptions(): void {
    if (this.layerName !== '') {
      this.layerOptions = {
        name: this.layerName,
        time: this.currentTime,
        active: true
      }
    } else {
      this.layerOptions = null
    }
  }
}

</script>

<style scoped>
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
    z-index: 1200;
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

</style>
