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
          <v-chip-group>
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

import MapboxLayer from '@/components/AnimatedMapboxLayer.vue';
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import MetocSidebar from '@/components/MetocSidebar.vue';
import LocationsLayerControl from '@/components/LocationsLayerControl.vue'
import MapComponent from '@/components/MapComponent.vue'

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
    MetocSidebar
  }
})
export default class MetocDataView extends Mixins(WMSMixin, TimeSeriesMixin, PiRequestsMixin) {
  @Prop({ default: '', type: String }) categoryId!: string
  @Prop({ default: '', type: String }) dataLayerId!: string
  @Prop({ default: '', type: String }) dataSourceId!: string
  @Prop({ default: '', type: String }) locationId!: string

  webServiceProvider!: PiWebserviceProvider

  dockMode = 'right'
  layoutClass: string = 'map-only'
  isFullscreenGraph = false

  showLayer: boolean = true

  dateController!: DateController
  currentTime: Date = new Date()
  times: Date[] = []
  debouncedSetWMSLayerOptions!: () => void

  layerName: string = ''
  wmsLayerOptions: MapboxLayerOptions | null = null

  legend: ColourMap = []
  unit: string = ""

  locations: Location[] = []

  displays: DisplayConfig[] = []
  externalForecastTime = new Date()

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
    this.onLocationChange()

    // Force resize to fix strange starting position of the map, caused by
    // the expandable navigation drawer.
    window.dispatchEvent(new Event('resize'))
  }

  setWMSLayerOptions(): void {
    if (this.times.length === 0) {
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
   @Watch('dataSourceId')
  async onDataSourceChange(): Promise<void> {
    // Get WMS layer times for the currently selected data source.
    this.times = await this.getTimes(this.currentDataSource.wmsLayerId)

    // Select the WMS layer time closest to the currently selected time.
    // TODO: change interface of date controller with setter and return value from selectDate?
    this.dateController.dates = this.times
    this.dateController.selectDate(this.currentTime ?? new Date())
    this.currentTime = this.dateController.currentTime
    this.setWMSLayerOptions()

    // Get locations for the current data source.
    const geojson = await fetchLocationsAsGeoJson(
      this.webServiceProvider, this.currentDataSource.filterIds
    )
    this.locationsLayerOptions.source.data = geojson
    this.locations = convertGeoJsonToFewsPiLocation(geojson)
  }

  @Watch('locationId')
  async onLocationChange(): Promise<void> {
    if (this.locationId === '') return

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
  padding-left: 5px;
  left: 30px;
}
</style>
