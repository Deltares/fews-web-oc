import Vue from 'vue'
import Vuex from 'vuex'
import { RootState } from './types'
import Alerts from '@/store/modules/alerts'
import { fewsconfig } from '@/store/modules/fews-config'
import { systemTime } from '@/store/modules/system-time'
import { userSettings } from '@/store/modules/user-settings'
import createPersistedState from "vuex-persistedstate"
import {
  serializeState as serializeUserSettingsState,
  deserializeState as deserializeUserSettingsState,
  rehydrateState as rehydrateUserSettingsState
} from '@/store/modules/user-settings/serialize';

// FIXME: Storage definition from "vuex-persistedstate" is incompatiable with Typescript
interface Storage {
  getItem: (key: string) => any;
  setItem: (key: string, value: any) => void;
  removeItem: (key: string) => void;
}

const vuexUserSettings = createPersistedState<RootState>({
  key: 'delft-fews-webox:userSettings#1.0.0',
  paths: ['userSettings'],
  storage: window.localStorage,
  setState: (key: string, state: RootState, storage: Storage) => {
    if (state.userSettings) {
      storage.setItem(key, JSON.stringify(serializeUserSettingsState(state.userSettings)))
    }
  },
  getState: (key: string, storage: Storage) => {
    const state = deserializeUserSettingsState(storage.getItem(key))
    return state
  },
  rehydrated: (store) => {
    if ( store.state.userSettings ) {
      rehydrateUserSettingsState(store.state.userSettings)
    }
  }
})

Vue.use(Vuex)

const store = new Vuex.Store<RootState>({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    alerts: Alerts,
    systemTime,
    fewsconfig,
    userSettings
  },
  plugins: [ vuexUserSettings ]
})

store.dispatch('systemTime/startClock')
export default store
