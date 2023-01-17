<template>
  <splitpanes horizontal class="default-theme">
    <pane>
      <splitpanes class="default-theme">
        <pane>
          <ArchiveDisplaySelectionComponent :selected-locations.sync="selectedLocations"></ArchiveDisplaySelectionComponent>
        </pane>
        <pane>
          <v-mapbox
            :access-token="accessToken"
            map-style='https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
            :pitch="0"
            :bearing="0"
            :min-zoom="0"
            :zoom="4"
            :interactive="true"
            :drag-pan="true"
            :scroll-zoom="true"
            class="map"
            ref="map"
          >
            <v-mapbox-layer :options="locationsLayer" @click="selectLocation" clickable></v-mapbox-layer>
            <v-mapbox-layer :options="selectedLocationsLayer"></v-mapbox-layer>
          </v-mapbox>
        </pane>
      </splitpanes>
    </pane>
    <pane>
      <ArchiveTimeSeriesComponent></ArchiveTimeSeriesComponent>
    </pane>
  </splitpanes>
</template>
<script lang="ts">

import {Component, Vue, Watch} from "vue-property-decorator";
import {Location} from "@deltares/fews-pi-requests/src/response";
import ArchiveDisplaySelectionComponent from "@/components/archivedisplay/ArchiveDisplaySelectionComponent.vue";
import ArchiveTimeSeriesComponent from "@/components/archivedisplay/ArchiveTimeSeriesComponent.vue";
import {Pane, Splitpanes} from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import {PiArchiveWebserviceProvider} from "@deltares/fews-pi-requests/src/piArchiveWebserviceProvider";
import {ArchiveLocationsFilter, DocumentFormat} from "@deltares/fews-pi-requests/src/requestParameters";
import {LocationsResponse} from "@deltares/fews-pi-requests/src/response/locations/locationsResponse";
import {FeatureCollection, Geometry} from "geojson";

@Component({
  components: {
    ArchiveDisplaySelectionComponent,
    ArchiveTimeSeriesComponent,
    Splitpanes,
    Pane,
  }
})

export default class DisplayComponent extends Vue {

  archiveWebServiceProvider!: PiArchiveWebserviceProvider;
  baseUrl!: string;
  locations: Location[] = [];
  accessToken = this.$config.get('VUE_APP_MAPBOX_TOKEN');
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
      'circle-radius': 5,
      'circle-color': '#139f3f'
    },
  }
  selectedLocationsLayer = {
    'id': 'selectedLocationsLayer',
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
      'circle-color': '#0c1e38'
    }
  }
  selectedLocations: Location[] = [];


  created(): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_ARCHIVE_WEBSERVICES_URL')
  }

  async mounted(): Promise<void> {
    this.archiveWebServiceProvider = new PiArchiveWebserviceProvider(this.baseUrl);
    const archiveLocationsFilter: ArchiveLocationsFilter = {
      documentFormat: DocumentFormat.GEO_JSON,
    };

    const response: LocationsResponse = await this.archiveWebServiceProvider.getLocations(archiveLocationsFilter);
    const geoJsonResponse = (((await response) as any) as FeatureCollection<Geometry, Location>);
    this.locations = this.locations = geoJsonResponse.features.map((feature) => feature.properties);
    this.locationsLayer.source.data = (((await response) as any) as FeatureCollection<Geometry, Location>);
  }


  @Watch('selectedLocations')
  selectedLocationsUpdated(): void {
    this.updateLocationSelectionOnMap();
  }

  selectLocation(e: any): void {
    const locationId = e.features[0].properties.locationId;
    const selectedLocation: Location | undefined = this.locations.find(location => location.locationId == locationId);
    if (selectedLocation === undefined) return;
    this.addSelectedLocation(selectedLocation)
  }

  addSelectedLocation(newLocation: Location): void {
    if (newLocation === undefined) return;
    const index = this.selectedLocations.findIndex(location => location.locationId === newLocation.locationId);
    if (index >= 0) {
      this.selectedLocations.splice(index, 1);
    } else {
      this.selectedLocations.push(newLocation);
    }
    this.updateLocationSelectionOnMap();
  }

  updateLocationSelectionOnMap() {
    const selectedLocations: FeatureCollection<Geometry, Location> = {} as FeatureCollection<Geometry, Location>;
    selectedLocations.features = [];
    selectedLocations.type = "FeatureCollection";
    const currentSelection = this.selectedLocations;
    const existingLocations: FeatureCollection<Geometry, Location> = this.locationsLayer.source.data as FeatureCollection<Geometry, Location>;
    for (let feature of existingLocations.features) {
      const locationId = feature.properties.locationId;
      if (!currentSelection.find(location => location.locationId === locationId)) continue;
      selectedLocations.features.push(feature);
    }
    this.selectedLocationsLayer.source.data = selectedLocations;

  }
}
</script>

<style scoped>

.map {
  height: 100%;
  width: 100%;
}
</style>
