import Vue from 'vue'
import Vuex from 'vuex'
import { RootState } from './types';
import Alerts from '@/store/modules/alerts';
Vue.use(Vuex)

const store = new Vuex.Store<RootState>({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    alerts: Alerts
  }
})
export default store
