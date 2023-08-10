import Vue from 'vue'
import type { ActionContext, Module } from 'vuex'
import type { RootState } from '@/store/types';
import type { ConfigState, WebOcComponent } from './types';
import { getFewsConfig } from '@/lib/FewsConfig/fewsConfig'
import {
  WebOcGeneralConfig
} from "@deltares/fews-pi-requests/lib/types/response/configuration/WebOcConfigurationResponse";

const WEBOC_CONFIG_PREFIX = 'delft-fews-weboc:config#'

export const fewsconfig: Module<ConfigState, RootState> = {
  namespaced: true,

  state: (): ConfigState  => ({
    version: "0.1.0",
    components: {},
    general: {}
  }),

  mutations: {
    addComponent (state: ConfigState, componentConfig: WebOcComponent) {
      Vue.set(state.components, componentConfig.id, componentConfig)
    },

    setComponents (state: ConfigState, components: { [key: string]: WebOcComponent }) {
      state.components = components
    },

    setGeneral (state: ConfigState, generalConfig: WebOcGeneralConfig) {
      state.general = generalConfig
    }
  },

  actions: {
    saveConfig (context: ActionContext<ConfigState, RootState>) {
      sessionStorage.setItem(`${WEBOC_CONFIG_PREFIX}${context.state.version}`, JSON.stringify(context.state))
    },

    loadConfig (context: ActionContext<ConfigState, RootState>) {
      const webOcConfig = sessionStorage.getItem(`${WEBOC_CONFIG_PREFIX}${context.state.version}`)
      if (webOcConfig && typeof webOcConfig === 'string' && webOcConfig !== '') {
        const config = JSON.parse(webOcConfig)
        context.commit('setComponents', config.components)
        context.commit('setGeneral', config.general)
      }
    },

    deleteComponents (context: ActionContext<ConfigState, RootState>) {
      sessionStorage.removeItem(`${WEBOC_CONFIG_PREFIX}${context.state.version}`)
      context.commit('setComponents', {})
      context.commit('setGeneral', {})
    },

    async setFewsConfig (context: ActionContext<ConfigState, RootState>) {
      context.dispatch('loadConfig')
      if (Object.keys(context.state.components).length === 0) {
        const webOcConfiguration = await getFewsConfig()
        for (const webOcComponent of webOcConfiguration.webOcComponents) {
          context.commit('addComponent', webOcComponent)
        }
        context.commit("setGeneral", webOcConfiguration.general)
        context.dispatch('saveConfig')
      }
    }
  }
}
