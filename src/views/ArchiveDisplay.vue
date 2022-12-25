<template>
  <splitpanes horizontal class="default-theme">
    <pane>
      <splitpanes class="default-theme">
        <pane>
          <ArchiveDisplaySelectionComponent @locationUpdate="updateLocations" :selected-locations="selectedLocations" ></ArchiveDisplaySelectionComponent>
        </pane>
        <pane>
          <ArchiveMapComponent :selected-locations="selectedLocations"
                               @selectLocation="locationSelectedOnMap"></ArchiveMapComponent>
        </pane>
      </splitpanes>
    </pane>
    <pane>
      <ArchiveTimeSeriesComponent></ArchiveTimeSeriesComponent>
    </pane>
  </splitpanes>
</template>
<script lang="ts">

import {Component, Vue} from "vue-property-decorator";
import {Location} from "@deltares/fews-pi-requests/src/response";
import ArchiveMapComponent from "@/components/archivedisplay/ArchiveMapComponent.vue";
import ArchiveDisplaySelectionComponent from "@/components/archivedisplay/ArchiveDisplaySelectionComponent.vue";
import ArchiveTimeSeriesComponent from "@/components/archivedisplay/ArchiveTimeSeriesComponent.vue";
import {Splitpanes, Pane} from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

@Component({
  components: {
    ArchiveMapComponent,
    ArchiveDisplaySelectionComponent,
    ArchiveTimeSeriesComponent,
    Splitpanes,
    Pane,
  }
})

export default class DisplayComponent extends Vue {
  selectedLocations: Location[] = [];
  selectedOnMap: string = "";

  locationSelectedOnMap(locationId: string): void {
    this.selectedOnMap = locationId;
  }

  updateLocations(locations: Location[]): void {
    this.selectedLocations = locations;
  }
}
</script>

<style scoped>
</style>
