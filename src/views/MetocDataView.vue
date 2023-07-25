<template>
  <div class="display-container">
    <portal to="web-oc-sidebar">
      <MetocSidebar
        :categories="categories"
      />
    </portal>
    <div class="grid-root" :class="layoutClass">
      <div class="grid-map" v-show="showMap">
        <div class="map-container">
          <MapComponent>
            <MapboxLayer v-if="showLayer" :layer="wmsLayerOptions"/>
            <v-mapbox-layer
              v-if="showLocationsLayer"
              :options="locationsLayerOptions"
              clickable
              @click="onLocationClick"
            />
          </MapComponent>
        </div>
        <div class="control-container">
          <DataSourceControl
            v-model="selectedDataSource"
            :items="dataSources"
            @input="onSelectDataSource"
          />
          <WMSInfoPanel
            :layerName="layerName"
            :externalForecastTime="externalForecast"
            :unit="unit"
          />
          <LocationsLayerControl v-model="showLocationsLayer"/>
        </div>
        <DateTimeSlider
          class="date-time-slider"
          v-model="currentTime"
          :dates="times"
          @input="debouncedSetWMSLayerOptions"
          @update:now="setCurrentTime"
        />
        <div class="colourbar">
          <ColourBar v-model="legend" v-if="legend.length > 0"/>
        </div>
      </div>
      <div class="grid-charts" v-if="hasSelectedLocation && !$vuetify.breakpoint.mobile">
        <v-toolbar class="toolbar-charts" dense flat>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn icon plain @click="setDockMode('left')">
              <v-icon>mdi-dock-left</v-icon>
            </v-btn>
            <v-btn icon plain @click="setDockMode('bottom')">
              <v-icon>mdi-dock-bottom</v-icon>
            </v-btn>
            <v-btn icon plain @click="setDockMode('right')">
              <v-icon>mdi-dock-right</v-icon>
            </v-btn>
            <v-btn icon plain @click="closeCharts">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <router-view :displays="displays" :series="timeSeriesStore" @toggleFullscreen="toggleFullscreen"></router-view>
      </div>
      <div class="grid-charts fullscreen" v-else-if="hasSelectedLocation">
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
        <router-view :displays="displays" @toggleFullscreen="toggleFullscreen"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { debounce } from 'lodash';
import type { MapLayerMouseEvent } from 'mapbox-gl'

import type { Location } from "@deltares/fews-pi-requests";
import { PiWebserviceProvider} from "@deltares/fews-pi-requests";
import { ColourMap } from '@deltares/fews-web-oc-charts';

import { DateController } from '@/lib/TimeControl/DateController';
import type { DisplayConfig } from '@/lib/Layout/DisplayConfig';
import {
  convertGeoJsonToFewsPiLocation,
  Category,
  DataLayer,
  DataSource,
  fetchCategories,
  fetchLocationsAsGeoJson,
  fetchTimeSeriesDisplaysAndRequests
} from '@/lib/Topology';

import PiRequestsMixin from '@/mixins/PiRequestsMixin';
import TimeSeriesMixin from '@/mixins/TimeSeriesMixin'
import WMSMixin from '@/mixins/WMSMixin'

import ColourBar from '@/components/ColourBar.vue';
import DataSourceControl from '@/components/DataSourceControl.vue';
import MapboxLayer from '@/components/AnimatedMapboxLayer.vue';
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import MetocSidebar from '@/components/MetocSidebar.vue';
import LocationsLayerControl from '@/components/LocationsLayerControl.vue'
import MapComponent from '@/components/MapComponent.vue'
import WMSInfoPanel from '@/components/WMSInfoPanel.vue';
import { Route } from 'vue-router';

interface MapboxLayerOptions {
  name: string;
  time: Date;
}

@Component({
  components: {
    ColourBar,
    DataSourceControl,
    DateTimeSlider,
    LocationsLayerControl,
    MapboxLayer,
    MapComponent,
    MetocSidebar,
    WMSInfoPanel
  }
})
export default class MetocDataView extends Mixins(WMSMixin, TimeSeriesMixin, PiRequestsMixin) {
  @Prop({ default: '', type: String }) categoryId!: string
  @Prop({ default: '', type: String }) dataLayerId!: string
  @Prop({ default: '', type: String }) dataSourceId!: string
  @Prop({ default: '', type: String }) locationId!: string

  webServiceProvider!: PiWebserviceProvider
  categories: Category[] = []
  selectedDataSource: DataSource | null = null

  dockMode = 'right'
  layoutClass: string = 'map-only'
  isFullscreenGraph = false
  displays: DisplayConfig[] = []

  showLayer: boolean = true
  wmsLayerOptions: MapboxLayerOptions | null = null
  legend: ColourMap = []
  unit: string = ""

  dateController!: DateController
  currentTime: Date = new Date()
  times: Date[] = []
  debouncedSetWMSLayerOptions!: () => void

  locations: Location[] = []
  showLocationsLayer = true
  locationsLayerOptions = {
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
    }
  }

  created(): void {
    this.dateController = new DateController([])
    this.debouncedSetWMSLayerOptions = debounce(this.setWMSLayerOptions, 500, {
      leading: true,
      trailing: true
    })
  }

  async mounted() {
    // Create FEWS PI Webservices provider.
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const transformRequestFn = this.getTransformRequest()
    this.webServiceProvider = new PiWebserviceProvider(baseUrl, {transformRequestFn})

    // Perform WMS getCapabilities request to obtain WMS layer metadata (e.g. titles).
    await this.getCapabilities()

    // Fetch categories and update WMS layer for the default selection.
    this.categories = await fetchCategories(this.webServiceProvider)
    await this.onDataSourceChange()
    this.onLocationChange()

    // Force resize to fix strange starting position of the map, caused by
    // the expandable navigation drawer.
    window.dispatchEvent(new Event('resize'))
  }

  setWMSLayerOptions(): void {
    if (this.times.length === 0 || !this.currentDataSource) {
      this.wmsLayerOptions = null
    } else {
      this.wmsLayerOptions = {
        name: this.currentDataSource.wmsLayerId,
        time: this.currentTime
      }
    }
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

  /**
   * Sets the chart panel dock mode.
   *
   * @param dockMode dock mode to set to, can be 'left', 'right', or 'bottom'.
   */
   setDockMode(dockMode: string) {
    this.dockMode = dockMode
    if (this.hasSelectedLocation) {
      this.layoutClass = this.dockMode
    }
    // Call the resize handler to force a map update.
    this.$nextTick(this.onResize)
  }

  /**
   * Closes the chart panel.
   *
   * This updates the route to remove the locationId from it, effectively rerendering the component
   * without the chart panel.
   */
  closeCharts(): void {
    if (this.hasSelectedLocation) {
      const params = { ...this.$route.params }
      // Remove the locationId from the parameters.
      delete params.locationId
      this.$router.push({
        name: 'MetocDataViewer',
        params
      })
    }
  }

  toggleFullscreen(isFullscreen: boolean) {
    this.isFullscreenGraph = isFullscreen
  }

  /**
   * Updates the WMS layer, WMS layer times and locations for a new data source.
   */
  @Watch('currentDataSource')
  async onDataSourceChange(): Promise<void> {
    // Make sure that the data source selection control matches the URL.
    this.selectedDataSource = this.currentDataSource

    // Always close chart panel; data sources will in general not have the same locations, or we
    // might have deselected a data source.
    this.closeCharts()

    if (!this.currentDataSource) {
      // Remove locations and WMS layer.
      this.times = []
      this.externalForecast = new Date('invalid')
      this.legend = []
      this.locations = []
      this.locationsLayerOptions.source.data = []
      this.setWMSLayerOptions()
      return
    }

    // Get WMS layer times for the currently selected data source.
    this.times = await this.getTimes(this.currentDataSource.wmsLayerId)

    // Select the WMS layer time closest to the currently selected time.
    // TODO: change interface of date controller with setter and return value from selectDate?
    this.dateController.dates = this.times
    this.dateController.selectDate(this.currentTime ?? new Date())
    this.currentTime = this.dateController.currentTime
    this.setWMSLayerOptions()

    // Update the WMS layer legend.
    const legend = await this.getLegendGraphic(this.currentDataSource.wmsLayerId)
    this.unit = legend.unit ?? '—'
    this.legend = legend.legend

    // Update locations for the current data source.
    const geojson = await fetchLocationsAsGeoJson(
      this.webServiceProvider, this.currentDataSource.filterIds
    )
    this.locationsLayerOptions.source.data = geojson
    this.locations = convertGeoJsonToFewsPiLocation(geojson)
  }

  @Watch('locationId')
  async onLocationChange(): Promise<void> {
    if (this.locationId === '' || !this.currentDataSource) return

    const [displays, requests] = await fetchTimeSeriesDisplaysAndRequests(
      this.webServiceProvider, this.currentDataSource.filterIds, this.locationId
    )
    this.displays = displays

    // Fetch time series for all displays.
    await this.updateTimeSeries(requests)
  }

  onResize() {
    window.dispatchEvent(new Event('resize'))
  }

  onSelectDataSource(): void {
    if (this.dataSourceId !== this.selectedDataSource?.id) {
      let params = {}
      if (this.selectedDataSource) {
        params = { ...this.$route.params, dataSourceId: this.selectedDataSource.id }
      } else {
        params = { ...this.$route.params, dataSourceId: undefined }
      }

      this.$router.push({
        name: this.locationId ? 'MetocDataViewerWithLocation' : 'MetocDataViewer',
        params
      })
    }
  }

  /**
   * Updates the route upon clicking a location.
   *
   * This effectively rerenders this component with the locationId set.
   *
   * @param event location layer click event.
   */
  onLocationClick(event: MapLayerMouseEvent): void {
    if (!event.features) return
    const locationId: string | undefined = event.features[0].properties?.locationId

    // We don't need to do anything if we are already at this locationId.
    if (!locationId || this.locationId === locationId) return

    this.$router.push({
      name: 'MetocDataViewerWithLocation',
      params: {
        ...this.$route.params,
        locationId
      }
    })
  }

  get currentCategory(): Category | null {
    if (this.categories.length === 0) return null

    const defaultCategory = this.categories[0]
    if (!this.categoryId) return defaultCategory
    return this.categories.find(category => category.id === this.categoryId) ?? defaultCategory
  }

  get currentDataLayer(): DataLayer | null {
    if (!this.currentCategory) return null

    const defaultDataLayer = this.currentCategory.dataLayers[0]
    if (!this.dataLayerId) return defaultDataLayer
    return this.currentCategory.dataLayers.find(dataLayer => dataLayer.id === this.dataLayerId) ?? defaultDataLayer
  }

  get currentDataSource(): DataSource | null {
    if (!this.currentDataLayer || !this.dataSourceId) return null
    const defaultDataSource = this.currentDataLayer.dataSources[0]
    return this.currentDataLayer.dataSources.find(dataSource => dataSource.id === this.dataSourceId) ?? defaultDataSource
  }

  get dataSources(): DataSource[] {
    return this.currentDataLayer?.dataSources ?? []
  }

  get layerName(): string {
    const layer = this.layers.find(layer => layer.name === this.currentDataSource?.wmsLayerId)
    return layer?.title ?? '—'
  }

  get showMap() {
    const isMobileGraphOpen = this.hasSelectedLocation && this.$vuetify.breakpoint.mobile
    return !isMobileGraphOpen && !this.isFullscreenGraph
  }

  get hasSelectedLocation() {
    return this.locationId !== ''
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

.right > .grid-charts,
.left > .grid-charts {
  height: 100%;
  width: 50%;
}

.bottom > .grid-charts {
  height: 50%;
  width: 100%;
}

.grid-charts.fullscreen {
  width: 100%;
  flex-basis: 100%;
  height: 100%;
}

.bottom > .grid-map {
  height: 50%;
  width: 100%;
}

.toolbar-charts {
  flex: 0 0 auto;
}

.map-container {
  position: relative;
  display: flex;
  flex: 1 1;
  height: calc(100% - 48px);
}

.control-container {
  position: absolute;
  padding: 10px 5px;
  left: 30px;
  z-index: 1200;
}

.colourbar {
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  width: 500px;
  height: 100px;
  position: absolute;
  top: 0px;
  left: -15px;
}
</style>
