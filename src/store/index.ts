import Vue from 'vue'
import Vuex from 'vuex'
import {ArchiveDisplayStoreState} from "@/store/archiveDisplayStoreState";
import {Location} from "@deltares/fews-pi-requests/src/response";

Vue.use(Vuex)

const archiveDisplayStore = {
  namespaced: true,
  state: (): ArchiveDisplayStoreState => ({
    selectedLocations: Array<Location>()
  }),
  mutations: {
    addSelectedLocation(state: ArchiveDisplayStoreState, newLocation: Location) {
      const index = state.selectedLocations.findIndex(location => location.locationId === newLocation.locationId);
      if (index >= 0) {
        state.selectedLocations.splice(index, 1);
        return;
      }
      state.selectedLocations.push(newLocation);
    },
    setSelectedLocations(state: ArchiveDisplayStoreState, newSelection: Location[]) {
      state.selectedLocations = newSelection;
    },
  }
};


export default new Vuex.Store({
  modules: {
    archiveDisplayStore: archiveDisplayStore
  }
})
