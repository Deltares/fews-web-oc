<template>
  <div class="display-container">
    <div style="height: calc(100% - 100px); position: relative">
      <MapComponent>
        <MapboxLayer :layer="wmsLayerOptions"/>
        <v-mapbox-layer
          v-if="showLocationsLayer && filterIds.length > 0"
          :options="locationsLayerOptions"
          clickable
          @click="onLocationClick"
        />
        <v-mapbox-layer
          v-if="showLocationsLayer && filterIds.length > 0"
          :options="selectedLocationsLayerOptions"
        />
      </MapComponent>
      <div class="colourbar">
        <ColourBar v-model="legend" v-if="legend.length > 0"/>
      </div>
      <div class="locations-switch">
        <v-switch label="Locations" v-model="showLocationsLayer" v-if="filterIds.length > 0 && wmsLayerId !=''"></v-switch>
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
</template>

<script lang="ts">
import {Feature, FeatureCollection, Geometry} from 'geojson';
import type {Location} from "@deltares/fews-pi-requests";
import {PiWebserviceProvider, TopologyNode} from "@deltares/fews-pi-requests";
import {Component, Mixins, Prop, Watch} from 'vue-property-decorator'
import PiRequestsMixin from "@/mixins/PiRequestsMixin";
import type {CircleLayer, CirclePaint, GeoJSONSourceRaw, MapLayerMouseEvent} from 'mapbox-gl'
import MapboxLayer, {MapboxLayerOptions} from '@/components/AnimatedMapboxLayer.vue';
import WMSMixin from "@/mixins/WMSMixin";
import TimeSeriesMixin from "@/mixins/TimeSeriesMixin";
import MapComponent from "@/components/MapComponent.vue";
import debounce from "lodash/debounce";
import {TopologyNodeResponse} from "@deltares/fews-pi-requests/lib/types/response/topology";
import {DateController} from "@/lib/TimeControl/DateController";
import ColourBar from "@/components/ColourBar.vue";
import DateTimeSlider from "@/components/DateTimeSlider.vue";
import {ColourMap} from "@deltares/fews-web-oc-charts";
import {convertGeoJsonToFewsPiLocation, fetchLocationsAsGeoJson,} from '@/lib/TopologyDisplay';

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
  type: 'circle',
  source: defaultGeoJsonSource,
  layout: {
    visibility: 'visible'
  },
  paint: selectedLocationPaintOptions,
}
@Component({
  components: {
    DateTimeSlider,
    ColourBar,
    MapboxLayer,
    MapComponent,
  }
})
export default class ExplorerComponent extends Mixins(WMSMixin, TimeSeriesMixin, PiRequestsMixin) {
  @Prop({ default: () => { return {} } })
  topologyNode!: TopologyNode

  @Prop({ default: () => { return "" } })
  nodeId:string = ""

  selectedLocations: Location[] = []
  filterIds: string[]  = []
  wmsLayerId: string | undefined = ''

  showLocationsLayer = true
  wmsLayerOptions: MapboxLayerOptions | null = null
  currentTime: Date = new Date()
  times: Date[] = []
  locationsLayerOptions: CircleLayer = {...defaultLocationsLayerOptions}
  selectedLocationsLayerOptions: CircleLayer = {...selectedLocationsLayerOptions}
  webServiceProvider!: PiWebserviceProvider
  debouncedSetWMSLayerOptions = debounce(
    this.setWMSLayerOptions, 500, {leading: true, trailing: true}
  )
  dateController: DateController = new DateController([])
  legend: ColourMap = []
  unit: string = ""
  locations: Location[] = []



  async mounted(): Promise<void> {
    const baseUrl = this.$config.get('VUE_APP_FEWS_WEBSERVICES_URL')
    const transformRequestFn = this.getTransformRequest()
    this.webServiceProvider = new PiWebserviceProvider(baseUrl, {transformRequestFn})

    await this.getCapabilities()
    const topologyResponse: TopologyNodeResponse = await this.webServiceProvider.getTopologyNodes();
    const nodes = topologyResponse.topologyNodes;

    window.dispatchEvent(new Event('resize'))
  }

  @Watch('topologyNode', {deep: true})
  async onTopologyNodeChange(): Promise<void> {
    this.filterIds = this.topologyNode.filterIds ?? []
    this.wmsLayerId = this.topologyNode.gridDisplaySelection?.plotId
    this.selectedLocations = []
    this.locations = []
    this.setSelectedLocations([])
    if (this.filterIds.length > 0) {
      const geojson = await fetchLocationsAsGeoJson(this.webServiceProvider, this.filterIds)
      this.setLocationsLayerData(geojson)
      this.locations = convertGeoJsonToFewsPiLocation(geojson)
    }
    this.legend = []
    this.wmsLayerOptions = null
    if (this.wmsLayerId !== undefined) {
      this.times = await this.getTimes(this.wmsLayerId)
      this.dateController.dates = this.times
      this.dateController.selectDate(this.currentTime ?? new Date())
      this.currentTime = this.dateController.currentTime
      this.setWMSLayerOptions()
      const legend = await this.getLegendGraphic(this.wmsLayerId)
      this.unit = legend.unit ?? '—'
      this.legend = legend.legend
    }
  }

  setLocationsLayerData(geojson: FeatureCollection<Geometry, Location>): void {
    this.locationsLayerOptions.source = {
      ...defaultGeoJsonSource,
      'data': geojson
    }

  }

  setCurrentTime(enabled: boolean): void {
    if (enabled) {
      this.dateController.selectDate(new Date())
      this.currentTime = this.dateController.currentTime
      this.setWMSLayerOptions()
    }
  }

  async onLocationClick(event: MapLayerMouseEvent): Promise<void> {
    if (!event.features) return
    const locationId: string = event.features[0].properties?.locationId
    if (locationId == null) return;
    const ctrlKey = event.originalEvent.ctrlKey
    this.addLocation(locationId, ctrlKey)
    await this.$emit('updateLocations', this.selectedLocations.map(location => location.locationId))
  }

  addLocation(locationId: string, ctrlKey: boolean): void {
    const selectedLocation = this.locations.find(location => location.locationId == locationId);
    if (selectedLocation === undefined) return
    this.selectedLocations = this.createArrayWithSelectedLocations(locationId, ctrlKey, selectedLocation);
    let geoJSONSourceRaw = this.locationsLayerOptions.source as GeoJSONSourceRaw
    let featureCollection = geoJSONSourceRaw.data as FeatureCollection
    const selectedFeatures: Feature[] = []
    for (let feature of featureCollection.features) {
      const locationId = feature.properties?.locationId;
      if (!this.selectedLocations.find(location => location.locationId === locationId)) continue;
      selectedFeatures.push(feature);
    }
    this.setSelectedLocations(selectedFeatures);
  }


  private createArrayWithSelectedLocations(locationId: string, ctrlKey: boolean, selectedLocation: Location): Location[] {
    const index = this.selectedLocations.findIndex(location => location.locationId === locationId);
    if (!ctrlKey) {
      return index == -1 || this.selectedLocations.length > 1 ? [selectedLocation] : []
    }
    let selectedLocations: Location[] = this.selectedLocations
    if (index >= 0) {
      this.selectedLocations.splice(index, 1);
    } else {
      selectedLocations.push(selectedLocation);
    }
    return selectedLocations
  }

  private setSelectedLocations(selectedFeatures: Feature[]) {
    const geoJSONSourceRaw = this.selectedLocationsLayerOptions.source as GeoJSONSourceRaw
    const featureCollection = geoJSONSourceRaw.data as FeatureCollection
    featureCollection.features = selectedFeatures
  }


  setWMSLayerOptions(): void {
    if (this.times.length === 0 || !this.wmsLayerId) {
      this.wmsLayerOptions = null
    } else {
      this.wmsLayerOptions = {
        name: this.wmsLayerId,
        time: this.currentTime
      }
    }
  }


}
</script>
<style scoped>
.display-container {
  height: 100%;
}


.locations-switch {
  font-size: 0.825em;
  z-index: 1000;
  background-color: none;
  width: 1000px;
  height: 100px;
  position: absolute;
  top: 5px;
  left: 15px;
}

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

