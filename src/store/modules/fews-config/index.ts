import type { Module } from 'vuex'
import { RootState } from '@/store/types';
import type { ConfigState, WebOCComponent } from './types';

export const fewsconfig: Module<ConfigState, RootState> = {
  namespaced: true,
  state: (): ConfigState => ({
    components: {}
  }),

  mutations: {
    addComponent (state: ConfigState, componentConfig: WebOCComponent) {
      state.components[componentConfig.id] = componentConfig
    },

    setComponents (state: ConfigState, webComponents: { [key: string]: WebOCComponent }) {
      state.components = webComponents
    }
  },

  getters: {
    getComponentByComponentName: (state: ConfigState) => (componentName: string): WebOCComponent | undefined => {
      return Object.values(state.components).find((webComponent: WebOCComponent) => webComponent.component === componentName)
    }
  },
}
