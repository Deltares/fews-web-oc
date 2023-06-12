import Vue from 'vue'
import Vuex from 'vuex'
import { RootState } from './types'
import Alerts from '@/store/modules/alerts'
import { fewsconfig } from '@/store/modules/fews-config'
import { systemTime } from '@/store/modules/system-time'
import { fewsProperties } from '@/store/modules/fews-properties'

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
    fewsProperties
  }
})

store.dispatch('systemTime/startClock')
export default store
