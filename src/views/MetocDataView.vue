<template>
  <div class="display-container">
    <portal to="web-oc-sidebar">
      <MetocSidebar :categories="categories"/>
    </portal>
    <div class="grid-root" :class="layoutClass">
      <div class="grid-map" v-show="showMap">
        <div class="map-container">
          <MapComponent>
            <MapboxLayer v-if="showLayer" :layer="wmsLayerOptions" @doubleClick="onLayerDoubleClick">
              <ElevationSlider
                v-if="currentElevation !== null"
                v-model="currentElevation"
                :minValue="minElevation"
                :maxValue="maxElevation"
                @input="debouncedSetWMSLayerOptions"
              />
            </MapboxLayer>
            <v-mapbox-layer
              v-if="showLocationsLayer"
              :options="locationsLayerOptions"
              clickable
              @click="onLocationClick"
            />
            <v-mapbox-layer
              v-if="showLocationsLayer"
              :options="selectedLocationsLayerOptions"
            />
            <Regridder
            :firstValueTime="firstValueTime"
            :lastValueTime="lastValueTime"
            />
          </MapComponent>
          <div class="control-container">
            <DataSourceControl
                v-model="selectedDataSource"
                :items="dataSources"
                @input="onSelectDataSource"
                />
            <LocationsLayerSearchControl
                :showLocations.sync="showLocationsLayer"
                :locationId.sync="selectedLocationId"
                :locations="locations"
                />
          </div>
          <div class="colourbar">
            <ColourBar v-model="legend" :title="legendTitle" v-if="legend.length > 0"/>
          </div>
        </div>
        <DateTimeSlider
          class="date-time-slider"
          v-model="currentTime"
          :dates="times"
          @input="debouncedSetWMSLayerOptions"
          @update:now="setCurrentTime"
        />
      </div>
      <div class="grid-charts" v-if="(hasSelectedLocation || hasSelectedCoordinates) && !$vuetify.breakpoint.mobile">
        <v-toolbar class="toolbar-charts" dense flat>
          <v-spacer/>
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
        <router-view :displays="displays" :series="timeSeriesStore" @toggleFullscreen="setChartFullscreen"/>
      </div>
      <div class="grid-charts fullscreen" v-else-if="(hasSelectedLocation || hasSelectedCoordinates)">
        <v-toolbar class="toolbar-charts" dense flat>
          <v-toolbar-title/>
          <v-spacer/>
          <v-toolbar-items>
            <v-btn icon plain @click="closeCharts">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <router-view :displays="displays" @toggleFullscreen="setChartFullscreen"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { FeatureCollection, Geometry } from 'geojson';
import { debounce } from 'lodash';
import { type MapLayerMouseEvent, type CircleLayer, type GeoJSONSourceRaw, type CirclePaint, type Expression, LngLatBounds } from 'mapbox-gl'
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'

import type { Location } from "@deltares/fews-pi-requests";
import { PiWebserviceProvider} from "@deltares/fews-pi-requests";
import { timeSeriesGridActionsFilter } from "@deltares/fews-pi-requests";
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

import TimeSeriesMixin from '@/mixins/TimeSeriesMixin'
import WMSMixin from '@/mixins/WMSMixin'

import ColourBar from '@/components/ColourBar.vue';
import DataSourceControl from '@/components/DataSourceControl.vue';
import MapboxLayer, { MapboxLayerOptions, convertBoundingBoxToLngLatBounds } from '@/components/AnimatedMapboxLayer.vue';
import DateTimeSlider from '@/components/DateTimeSlider.vue'
import ElevationSlider from '@/components/ElevationSlider.vue'
import MetocSidebar from '@/components/MetocSidebar.vue';
import LocationsLayerSearchControl from '@/components/LocationsLayerSearchControl.vue'
import MapComponent from '@/components/MapComponent.vue'
import { Layer } from '@deltares/fews-wms-requests';
import Regridder from '@/components/Regridder.vue'
import { toMercator } from '@turf/projection'
import { point } from "@turf/helpers"

const defaultGeoJsonSource: GeoJSONSourceRaw = {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: []
  }
}

const defaultLocationPaintOptions: CirclePaint = {
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1
}

const selectedLocationPaintOptions: CirclePaint = {
  'circle-radius': 8,
  'circle-color': '#1976d2',
  'circle-stroke-color': 'white',
  'circle-stroke-width': 2
}

const defaultLocationsLayerOptions: CircleLayer = {
  id: 'locationsLayer',
  type: 'circle',
  source: defaultGeoJsonSource,
  layout: {
    visibility: 'visible'
  },
  paint: defaultLocationPaintOptions
}
const selectedLocationsLayerOptions: CircleLayer = {
  ...defaultLocationsLayerOptions,
  id: 'selected-locationslayer',
  paint: selectedLocationPaintOptions,
  filter: ['literal', false]
}

@Component({
  components: {
    ColourBar,
    DataSourceControl,
    DateTimeSlider,
    ElevationSlider,
    LocationsLayerSearchControl,
    MapboxLayer,
    MapComponent,
    MetocSidebar,
    Regridder
  }
})
export default class MetocDataView extends Mixins(WMSMixin, TimeSeriesMixin) {
  @Prop({ default: '', type: String }) categoryId!: string
  @Prop({ default: '', type: String }) dataLayerId!: string
  @Prop({ default: '', type: String }) dataSourceId!: string
  @Prop({ default: '', type: String }) locationId!: string
  @Prop({ default: '', type: String }) xCoord!: string
  @Prop({ default: '', type: String }) yCoord!: string

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
  unit: string = ''
  legendTitle: string = ''

  dateController: DateController = new DateController([])
  currentTime: Date = new Date()
  times: Date[] = []
  debouncedSetWMSLayerOptions = debounce(
    this.setWMSLayerOptions, 500, { leading: true, trailing: true }
  )

  currentElevation: number|null = 0
  minElevation: number|null = 0
  maxElevation: number|null = 0

  selectedLocationId: string | null = null
  locations: Location[] = []
  showLocationsLayer = true
  locationsLayerOptions: CircleLayer = {...defaultLocationsLayerOptions}
  selectedLocationsLayerOptions: CircleLayer = {...selectedLocationsLayerOptions}

  coordinates: [number, number] | null = null

  async mounted() {
    // Create FEWS PI Webservices provider.
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const transformRequestFn = this.getTransformRequest()
    this.webServiceProvider = new PiWebserviceProvider(baseUrl, {transformRequestFn})

    // Fetch category hierarchy from topology.
    this.categories = await fetchCategories(this.webServiceProvider)

    // Check whether we need to set the default route (i.e. if categoryId and/or dataLayerId are
    // missing).
    if (this.categoryId === '' || this.dataLayerId === '') this.setDefaultRoute()

    // Perform WMS getCapabilities request to obtain WMS layer metadata (e.g. titles).
    await this.getCapabilities()

    // Perform the necessary updates for the currently selected category, data layer and
    // potentially data source.
    await this.onDataSourceChange()
    await this.onLocationChange()

    // Force resize to fix strange starting position of the map, caused by the expandable navigation
    // drawer.
    window.dispatchEvent(new Event('resize'))
  }

  /**
   * Sets the default parameters for this route.
   *
   * This selects for first category, the first data layer in this category, and the first data
   * source in this data layer.
   */
  setDefaultRoute(): void {
    // Remove the locationId from the parameters.
    const defaultCategory = this.categories[0]
    const defaultDataLayer = defaultCategory.dataLayers[0]
    const defaultDataSource = defaultDataLayer.dataSources[0]
    this.$router.push({
      name: 'MetocDataViewer',
      params: {
        categoryId: defaultCategory.id,
        dataLayerId: defaultDataLayer.id,
        dataSourceId: defaultDataSource.id
      }
    })
  }

  /**
   * Sets WMS layer options to pass to Mapbox.
   */
  setWMSLayerOptions(): void {
    if (this.times.length === 0 || !this.currentDataSource) {
      this.wmsLayerOptions = null
    } else {
      const boundingBoxWms = this.currentWMSLayer?.boundingBox
      const boundingBox = boundingBoxWms ? convertBoundingBoxToLngLatBounds(boundingBoxWms) : new LngLatBounds()
      this.wmsLayerOptions = {
        bbox: boundingBox,
        name: this.currentDataSource.wmsLayerId,
        time: this.currentTime
      }

        this.maxElevation = this.currentWMSLayer?.elevation?.upperValue ?? null
        this.minElevation = this.currentWMSLayer?.elevation?.lowerValue ?? null
        this.wmsLayerOptions.elevation = this.currentElevation
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
    if (this.hasSelectedLocation || this.hasSelectedCoordinates) {
      this.layoutClass = this.dockMode
    }
    // Call the resize handler to force a map update.
    this.$nextTick(this.onResize)
  }

  /**
   * Enables/disables fullscreen mode for the current chart.
   *
   * @param isFullscreen whether the chart should be fullscreen.
   */
  setChartFullscreen(isFullscreen: boolean) {
    this.isFullscreenGraph = isFullscreen
  }

  /**
   * Sets the location to navigate to, opening the appropriate chart panel.
   *
   * This updates the route, thus spawning the chart panel.
   *
   * @param locationId locationId to navigate to.
   */
  setLocation(locationId: string | null): void {
    // We don't need to do anything if we are already at this locationId.
    if (this.locationId === locationId) return

    if (!locationId) {
      this.closeCharts()
    } else {
      this.$router.push({
        name: 'MetocDataViewerWithLocation',
        params: {
          ...this.$route.params,
          locationId
        }
      })
    }
  }

  /**
   * Sets the coordinates to navigate to, opening the appropriate chart panel.
   *
   * This updates the route, thus spawning the chart panel.
   *
   * @param coordinates coordinates to navigate to.
   */
  setCoordinates() {
    if (!this.coordinates) {
      this.closeCharts()
    } else {
      const xCoord: string = this.coordinates[0].toString()
      const yCoord: string = this.coordinates[1].toString()
      this.$router.push({
        name: 'MetocDataViewerWithCoordinates',
        params: {
          ...this.$route.params,
          xCoord,
          yCoord
        }
      })
    }
    }

  /**
   * Updates the locations layers with new GeoJSON data.
   *
   * @param geojson GeoJSON object to set for the locations layers.
   */
  setLocationsLayerData(geojson: FeatureCollection<Geometry, Location>): void {
    const source = {
      ...defaultGeoJsonSource,
      'data': geojson
    }
    this.locationsLayerOptions.source = source
    this.selectedLocationsLayerOptions.source = source
  }

  /**
   * Clears data from the locations layers.
   */
  clearLocationsLayerData(): void {
    this.locationsLayerOptions.source = defaultGeoJsonSource
    this.selectedLocationsLayerOptions.source = defaultGeoJsonSource
  }

  /**
   * Sets filters on the locations layer to highlight the currently selected location.
   */
  setLocationsLayerFilters(): void {
    if (this.hasSelectedLocation) {
      this.selectedLocationsLayerOptions.filter = ['==', ['get', 'locationId'], this.locationId]
    } else {
      this.selectedLocationsLayerOptions.filter = ['literal', false]
    }
  }

  /**
   * Closes the chart panel.
   *
   * This updates the route to remove the locationId from it, effectively rerendering the component
   * without the chart panel.
   */
  closeCharts(): void {
    if (!this.hasSelectedCoordinates && !this.hasSelectedLocation) {
      return
    }

    const params = { ...this.$route.params }
    if (this.hasSelectedLocation) {
      // Remove the locationId from the parameters.
      delete params.locationId
    }
    if(this.hasSelectedCoordinates) {
      this.coordinates = null
      delete params.xCoord
      delete params.yCoord
    }
    this.$router.push({
        name: 'MetocDataViewer',
        params
      })
    this.onResize()
  }

  /**
   * Updates the WMS layer, WMS layer times and locations for a new data source.
   */
  @Watch('currentDataSource')
  async onDataSourceChange(): Promise<void> {
    if (!this.currentDataSource) {
      // Remove locations and WMS layer.
      this.times = []
      this.externalForecast = new Date('invalid')
      this.legend = []
      this.legendTitle = ''
      this.unit = ''
      this.locations = []
      this.currentElevation = null
      this.clearLocationsLayerData()
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

    // Select the elevation if present
    this.currentElevation = this.currentWMSLayer?.elevation?.upperValue ?? null

    this.setWMSLayerOptions()

    // Update the WMS layer legend.
    const legend = await this.getLegendGraphic(this.currentDataSource.wmsLayerId)
    this.unit = legend.unit ?? '—'
    this.legend = legend.legend
    this.legendTitle = `${this.currentWMSLayer?.title} [${this.unit}]`

    // Update locations for the current data source.
    const geojson = await fetchLocationsAsGeoJson(
      this.webServiceProvider, this.currentDataSource.filterIds
    )
    this.setLocationsLayerData(geojson)
    this.locations = convertGeoJsonToFewsPiLocation(geojson)

    // Make sure that the data source selection control matches the URL.
    this.$nextTick(() => {
      this.selectedDataSource = this.currentDataSource
    })
  }

  /**
   * Updates the view a user selects a data source with the data source control.
   *
   * This changes the route to reflect the new data source, which will result in onDataSourceChange
   * being called after the route has been updated.
   */
  onSelectDataSource(): void {
    // We should close the chart panel if we select a different data source.
    this.closeCharts()

    const dataSourceMatches = this.dataSourceId === ''
      ? this.selectedDataSource === null
      : this.selectedDataSource?.id === this.dataSourceId
    if (!dataSourceMatches) {
      let params = {}
      if (this.selectedDataSource) {
        params = { ...this.$route.params, dataSourceId: this.selectedDataSource.id }
      } else {
        params = { ...this.$route.params, dataSourceId: undefined }
      }

      let routeName: string
      if (this.locationId) {
        params = { ...params, locationId: this.locationId }
        routeName = 'MetocDataViewerWithLocation'
      } else if (this.coordinates) {
        params = { ...params, xCoord: this.coordinates[0].toString(), yCoord: this.coordinates[1].toString() }
        routeName = 'MetocDataViewerWithCoordinates'
      } else {
        routeName = 'MetocDataViewer'
      }

      this.$router.push({
        name: routeName,
        params
      })
    }
  }

  /**
   * Updates the chart panel for a newly selected location.
   */
  @Watch('locationId')
  async onLocationChange(): Promise<void> {
    this.setLocationsLayerFilters()

    if (this.locationId === '' || !this.currentDataSource) {
      this.selectedLocationId = null
      this.closeCharts()
      return
    }

    this.selectedLocationId = this.locationId

    const locationFilters = this.currentDataSource.filterIds.map(filterId => {
      return {
        filterId: filterId,
        locationIds: this.locationId
      }
    })

    const [displays, requests] = await fetchTimeSeriesDisplaysAndRequests(
      this.webServiceProvider, locationFilters
    )
    this.displays = displays

    // Fetch time series for all displays.
    await this.updateTimeSeries(requests)

    this.onResize()
  }
  /**
   * Updates the chart panel for newly selected coordinates.
   */

  @Watch('xCoordyCoordcurrentElevation')
  async onCoordinatesChange(): Promise<void> {

    if (!this.coordinates || !this.currentDataSource || !this.firstValueTime || !this.lastValueTime || !this.currentWMSLayer?.boundingBox) {
      this.closeCharts()
      return
    }
    // convert BoundingBox to bbox
    const bbox = [
      Number(this.currentWMSLayer?.boundingBox.minx),
      Number(this.currentWMSLayer?.boundingBox.miny),
      Number(this.currentWMSLayer?.boundingBox.maxx),
      Number(this.currentWMSLayer?.boundingBox.maxy)
  ]
    const coordsFilter: timeSeriesGridActionsFilter = {
      layers: this.currentDataSource.filterIds[0],
      x: this.coordinates[0],
      y: this.coordinates[1],
      startTime: this.firstValueTime,
      endTime: this.lastValueTime,
      bbox: bbox,
      documentFormat: "PI_JSON",
      showVerticalProfile: this.currentWMSLayer?.elevation ? true : false
    }
    const [displays, requests] = await fetchTimeSeriesDisplaysAndRequests(
      this.webServiceProvider, [coordsFilter]
    )
    this.displays = displays

    // Fetch time series for all displays.
    await this.updateTimeSeries(requests, undefined ,this.currentElevation ? this.currentElevation : undefined)

    this.onResize()
  }

  /**
   * Updates the chart panel for a location selected from the locations control.
   */
  @Watch('selectedLocationId')
  onSelectLocation(locationId: string | null): void {
    this.setLocation(locationId)
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
    const locationId: string | null = event.features[0].properties?.locationId ?? null

    this.setLocation(locationId)
  }

  /**
   * Updates the route upon double clicking a location.
   *
   * This effectively rerenders this component with the coordinates set.
   *
   * @param event location layer double click event.
   */
  onLayerDoubleClick(event: MapLayerMouseEvent) {
    const mercator = toMercator(point([event.lngLat.lng, event.lngLat.lat]))
    this.coordinates = [mercator.geometry.coordinates[0], mercator.geometry.coordinates[1]]
    this.setCoordinates()
  }

  /**
   * Dispatches a resize event to make sure the map is updated to the new size.
   */
   onResize() {
    window.dispatchEvent(new Event('resize'))
  }

  get currentCategory(): Category | null {
    if (this.categories.length === 0) return null
    return this.categories.find(category => category.id === this.categoryId) ?? null
  }

  get currentDataLayer(): DataLayer | null {

    if (!this.currentCategory) return null

    return this.currentCategory.dataLayers.find(dataLayer => dataLayer.id === this.dataLayerId) ?? null
  }

  get currentDataSource(): DataSource | null {
    if (!this.currentDataLayer || !this.dataSourceId) return null
    return this.currentDataLayer.dataSources.find(dataSource => dataSource.id === this.dataSourceId) ?? null
  }

  get currentWMSLayer(): Layer | null {
    const layer = this.layers.find(layer => layer.name === this.currentDataSource?.wmsLayerId)
    return layer ?? null
  }

  get firstValueTime(): string |  null {
    if (this.times.length === 0) return null
    return this.times[0].toISOString()
   }

  get lastValueTime(): string | null {
    if (this.times.length === 0) return null
    return this.times[this.times.length - 1].toISOString()
  }

  get dataSources(): DataSource[] {
    return this.currentDataLayer?.dataSources ?? []
  }

  get layerTitle(): string {
    return this.currentWMSLayer?.title ?? '—'
  }

  get showMap(): boolean {
    const isMobileGraphOpen = this.hasSelectedLocation && this.$vuetify.breakpoint.mobile
    return !isMobileGraphOpen && !this.isFullscreenGraph
  }

  get hasSelectedLocation(): boolean {
    return this.locationId !== ''
  }

  get hasSelectedCoordinates(): boolean {
    return this.coordinates !== null
  }

  get selectedLocationFilter(): Expression {
    return ['==', 1, 0]
  }

  get xCoordyCoordcurrentElevation(): string {
    return `${this.xCoord}, ${this.yCoord}, ${this.currentElevation}`
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
  height: 100%;
}

.control-container {
  position: absolute;
  padding: 10px 5px;
  width: 80%;
  left: 30px;
  z-index: 1200;
  display: flex;
  gap: 5px;
}

.colourbar {
  font-size: 0.825em;
  z-index: 1000;
  width: 90%;
  position: absolute;
  bottom: 10px;
  left: 10px;
}
</style>
