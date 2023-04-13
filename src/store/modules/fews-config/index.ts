import Vue from 'vue'
import type { ActionContext, Module } from 'vuex'
import type { RootState } from '@/store/types';
import type { ConfigState, WebOcComponent } from './types';
import { getFewsConfig } from '@/lib/FewsConfig/fewsConfig'

export const fewsconfig: Module<ConfigState, RootState> = {
  namespaced: true,

  state: (): ConfigState  => ({
    components: {}
  }),

  mutations: {
    addComponent (state: ConfigState, componentConfig: WebOcComponent) {
      Vue.set(state.components, componentConfig.id, componentConfig)
    },

    setComponents (state: ConfigState, components: { [key: string]: WebOcComponent }) {
      state.components = components
    }
  },

  actions: {
    saveComponents (context: ActionContext<ConfigState, RootState>) {
      sessionStorage.setItem('weboccomponents', JSON.stringify(context.state.components))
    },

    loadComponents (context: ActionContext<ConfigState, RootState>) {
      const webOcComponents = sessionStorage.getItem('weboccomponents')
      if (webOcComponents && typeof webOcComponents === 'string' && webOcComponents !== '') {
        const components = JSON.parse(webOcComponents)
        context.commit('setComponents', components)
      }
    },

    deleteComponents (context: ActionContext<ConfigState, RootState>) {
      sessionStorage.removeItem('weboccomponents')
      context.commit('setComponents', {})
    },

    async setFewsConfig (context: ActionContext<ConfigState, RootState>) {
      context.dispatch('loadComponents')
      if (Object.keys(context.state.components).length === 0) {
        const webOcComponents = await getFewsConfig()
        for (const webOcComponent of webOcComponents) {
          context.commit('addComponent', webOcComponent)
        }
        context.dispatch('saveComponents')
      }
    }
  }
}
