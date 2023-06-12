import type { ActionTree } from 'vuex'
import type { RootState } from '../../types'
import type { FewsPropertiesState } from './types'
import { loadTimeSeriesFlagSources, loadTimeSeriesFlags } from '@/lib/FewsProperties/fewsProperties'

export const actions: ActionTree<FewsPropertiesState, RootState>= {
  loadFlags: async (context) => {
    const flags = await loadTimeSeriesFlags()
    context.commit('setFlags', flags)
  },

  loadFlagSources: async (context) => {
    const flagSources = await loadTimeSeriesFlagSources()
    context.commit('setFlagSources', flagSources)
  }
}
