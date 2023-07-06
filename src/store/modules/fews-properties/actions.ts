import type { ActionTree } from 'vuex'
import type { RootState } from '../../types'
import type { FewsPropertiesState } from './types'
import { loadTimeSeriesFlagSources, loadTimeSeriesFlags } from '@/lib/FewsProperties/fewsProperties'
import type{ TimeSeriesFlag, TimeSeriesFlagSource } from '@deltares/fews-pi-requests'

export const actions: ActionTree<FewsPropertiesState, RootState>= {
  loadFlags: async (context) => {
    const flagsArray = await loadTimeSeriesFlags()
    const flags: Record<string, TimeSeriesFlag> = {}
    flagsArray.forEach(flag => flags[flag.flag] = flag)
    context.commit('setFlags', flags)
  },

  loadFlagSources: async (context) => {
    const flagSourcesArray = await loadTimeSeriesFlagSources()
    const flagSources: Record<string, TimeSeriesFlagSource> = {}
    flagSourcesArray.forEach(flagSource => { flagSources[flagSource.id ?? 'null'] = flagSource })
    context.commit('setFlagSources', flagSources)
  }
}
