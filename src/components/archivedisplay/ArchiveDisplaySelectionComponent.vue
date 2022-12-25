<template>
  <v-container fluid>
    <v-row no-gutters>
      <v-col cols="6">
        <v-select
          v-model="selectedAreas"
          :items="areas"
          label="Area"
          multiple
          chips
        ></v-select>
      </v-col>
      <v-col cols="6">
        <v-select
          v-model="selectedModuleInstances"
          :items="moduleInstances"
          label="Module instance"
          multiple
          chips
        ></v-select>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="6">
        <v-select
          v-model="selectedSources"
          :items="sources"
          label="Source"
          multiple
          chips
        ></v-select>
      </v-col>
      <v-col cols="6">
        <v-select
          v-model="selectedTimeSeriesType"
          :items="timeSeriesTypes"
          label="Time series type"
          chips
        ></v-select>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="6">
        <v-select
          v-model="selectedLocations"
          :items="locations"
          item-text="locationName"
          label="Location"
          multiple
          chips
          return-object
        ></v-select>
      </v-col>
      <v-col cols="6">
        <v-select
          v-model="selectedParameters"
          :items="parameters"
          item-text="parameterId"
          label="Parameter"
          multiple
          chips
        ></v-select>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col cols="3">
        <v-menu
          ref="menuStartDate"
          v-model="menuStartDate"
          :close-on-content-click="false"
          :return-value.sync="startDate"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="startDate"
              label="Start date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="startDate"
            no-title
            scrollable
          >
            <v-spacer></v-spacer>
            <v-btn
              text
              color="primary"
              @click="menuStartDate = false"
            >
              Cancel
            </v-btn>
            <v-btn
              text
              color="primary"
              @click="$refs.menuStartDate.save(startDate)"
            >
              OK
            </v-btn>
          </v-date-picker>
        </v-menu>
      </v-col>
      <v-col cols="3">
        <v-dialog
          ref="menuStartTime"
          v-model="menuStartTime"
          :return-value.sync="startTime"
          persistent
          width="290px"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="startTime"
              label="start time"
              prepend-icon="mdi-clock-time-four-outline"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-time-picker
            v-if="menuStartTime"
            v-model="startTime"
            full-width
          >
            <v-spacer></v-spacer>
            <v-btn
              text
              color="primary"
              @click="menuStartTime = false"
            >
              Cancel
            </v-btn>
            <v-btn
              text
              color="primary"
              @click="$refs.menuStartTime.save(startTime)"
            >
              OK
            </v-btn>
          </v-time-picker>
        </v-dialog>
      </v-col>
      <v-col cols="3">
        <v-menu
          ref="menuEndDate"
          v-model="menuEndDate"
          :close-on-content-click="false"
          :return-value.sync="endDate"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="endDate"
              label="End date"
              prepend-icon="mdi-calendar"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="endDate"
            no-title
            scrollable
          >
            <v-spacer></v-spacer>
            <v-btn
              text
              color="primary"
              @click="menuEndDate = false"
            >
              Cancel
            </v-btn>
            <v-btn
              text
              color="primary"
              @click="$refs.menuEndDate.save(endDate)"
            >
              OK
            </v-btn>
          </v-date-picker>
        </v-menu>
      </v-col>
      <v-col cols="3">
        <v-dialog
          ref="menuEndTime"
          v-model="menuEndTime"
          :return-value.sync="endTime"
          persistent
          width="290px"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-text-field
              v-model="endTime"
              label="end time"
              prepend-icon="mdi-clock-time-four-outline"
              readonly
              v-bind="attrs"
              v-on="on"
            ></v-text-field>
          </template>
          <v-time-picker
            v-if="menuEndTime"
            v-model="endTime"
            full-width
          >
            <v-spacer></v-spacer>
            <v-btn
              text
              color="primary"
              @click="menuEndTime = false"
            >
              Cancel
            </v-btn>
            <v-btn
              text
              color="primary"
              @click="$refs.menuEndTime.save(endTime)"
            >
              OK
            </v-btn>
          </v-time-picker>
        </v-dialog>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="d-flex justify-center">
        <v-btn
          class="ma-2"
          color="primary"
        >
          Add to chart
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {LocationsResponse} from "@deltares/fews-pi-requests/src/response/locations/locationsResponse";
import {PiArchiveWebserviceProvider} from "@deltares/fews-pi-requests/src/piArchiveWebserviceProvider";
import {
  ArchiveLocationsFilter,
  DocumentFormat,
  ParametersFilter
} from "@deltares/fews-pi-requests/src/requestParameters";
import {FeatureCollection, Geometry} from "geojson";
import {Location, ParametersResponse} from "@deltares/fews-pi-requests/src/response";
import {Parameter} from "@deltares/fews-pi-requests/src/response/parameters/parameter";


@Component
export default class ArchiveDisplaySelectionComponent extends Vue {
  @Prop({
    default: () => {
      return {}
    }
  }) selectedLocations!: Location[]
  baseUrl!: string;
  archiveWebServiceProvider: PiArchiveWebserviceProvider = {} as PiArchiveWebserviceProvider;
  menuStartTime: boolean = false;
  menuStartDate: boolean = false;
  menuEndDate: boolean = false;
  menuEndTime: boolean = false;
  startDate: string = "";
  endDate: string = "";
  startTime: string = "00:00";
  endTime: string = "00:00";
  selectedAreas: string[] = [];
  areas: string[] = ["area1", "area2"];
  selectedModuleInstances: string[] = [];
  moduleInstances: string[] = ["moduleInstance1", "moduleInstance2"];
  selectedSources: string[] = [];
  sources: string[] = ["source1", "source2"];
  locations: Location[] = [];
  selectedParameters: string[] = [];
  parameters: Parameter[] = [];
  selectedTimeSeriesType: string = "";
  timeSeriesTypes: string[] = ["external historical", "external forecasting", "simulated forecasting", "simulated historical"];


  created(): void {
    this.baseUrl = this.$config.get('VUE_APP_FEWS_ARCHIVE_WEBSERVICES_URL')
  }

  @Watch('selectedLocations')
  onItemsChange(): void {
    this.$store.commit("archiveDisplayStore/setSelectedLocations", this.selectedLocations);
  }

  @Watch('$store.state.archiveDisplayStore.selectedLocations')
  onSelectedLocationsChange(): void {
    this.selectedLocations = this.$store.state.archiveDisplayStore.selectedLocations;
  }


  async mounted(): Promise<void> {
    this.archiveWebServiceProvider = new PiArchiveWebserviceProvider(this.baseUrl);
    const archiveLocationsFilter = {} as ArchiveLocationsFilter;
    archiveLocationsFilter.documentFormat = DocumentFormat.GEO_JSON;
    const locationsResponse: LocationsResponse = await this.archiveWebServiceProvider.getLocations(archiveLocationsFilter);
    const geoJsonResponse = (((await locationsResponse) as any) as FeatureCollection<Geometry, Location>);
    this.locations = geoJsonResponse.features.map((feature) => feature.properties);

    const archiveParametersFilter = {} as ParametersFilter;
    archiveParametersFilter.documentFormat = DocumentFormat.PI_JSON;
    const parametersResponse: ParametersResponse = await this.archiveWebServiceProvider.getParameters(archiveParametersFilter);
    this.parameters = parametersResponse.parameters;
  }

}
</script>

<style scoped>

</style>
