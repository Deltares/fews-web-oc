import type { MutationTree } from 'vuex';
import type { FewsPropertiesState } from './types';
import type { TimeSeriesFlag, TimeSeriesFlagSource } from '@deltares/fews-pi-requests';

export const mutations: MutationTree<FewsPropertiesState> = {
  setFlags(state, flags: Record<string,TimeSeriesFlag>) {
    state.flags = flags
  },

  setFlagSources(state, flagSources: Record<string,TimeSeriesFlagSource>) {
    state.flagSources = flagSources
  }
}
