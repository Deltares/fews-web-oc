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

    setComponents (state: ConfigState, components: { [key: string]: WebOCComponent }) {
      state.components = components
    }
  },
}
