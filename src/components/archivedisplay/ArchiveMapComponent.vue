<template>
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
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {PiArchiveWebserviceProvider} from "@deltares/fews-pi-requests/src/piArchiveWebserviceProvider";
import {ArchiveLocationsFilter, DocumentFormat} from "@deltares/fews-pi-requests/src/requestParameters";
import {LocationsResponse} from "@deltares/fews-pi-requests/src/response/locations/locationsResponse";
import {FeatureCollection, Geometry} from "geojson";
import {Location} from "@deltares/fews-pi-requests/src/response";

@Component
export default class ArchiveMapComponent extends Vue {
  @Prop({
    default: () => {
      return {}
    }
  }) selectedLocations!: Location[]
  baseUrl!: string;
  locations: Location[] = [];
  archiveWebServiceProvider: PiArchiveWebserviceProvider = {} as PiArchiveWebserviceProvider;
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
    },
  }

  created(): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_ARCHIVE_WEBSERVICES_URL')
  }

  selectLocation(e: any) {
    const locationId = e.features[0].properties.locationId;
    const selectedLocation: Location | undefined = this.locations.find(location => location.locationId == locationId);
    this.$store.commit("archiveDisplayStore/addSelectedLocation", selectedLocation);
  }

  async mounted(): Promise<void> {

    this.archiveWebServiceProvider = new PiArchiveWebserviceProvider(this.baseUrl);
    const archiveLocationsFilter = {} as ArchiveLocationsFilter;
    archiveLocationsFilter.documentFormat = DocumentFormat.GEO_JSON;

    const response: LocationsResponse = await this.archiveWebServiceProvider.getLocations(archiveLocationsFilter);
    const geoJsonResponse = (((await response) as any) as FeatureCollection<Geometry, Location>);
    this.locations =  this.locations = geoJsonResponse.features.map((feature) => feature.properties);
    this.locationsLayer.source.data = (((await response) as any) as FeatureCollection<Geometry, Location>);
  }

  @Watch('$store.state.archiveDisplayStore.selectedLocations')
  onItemsChange(): void {
    const selectedLocations: FeatureCollection<Geometry, Location> = {} as FeatureCollection<Geometry, Location>;
    selectedLocations.features = [];
    selectedLocations.type = "FeatureCollection";
    const currentSelection = this.$store.state.archiveDisplayStore.selectedLocations as Location[];
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
