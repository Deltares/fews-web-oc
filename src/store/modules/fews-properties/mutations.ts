import type { MutationTree } from 'vuex';
import type { FewsPropertiesState } from './types';
import type { TimeSeriesFlag, TimeSeriesFlagSource } from '@deltares/fews-pi-requests';

export const mutations: MutationTree<FewsPropertiesState> = {
  setFlags(state, flags: TimeSeriesFlag[]) {
    state.flags = flags
  },

  setFlagSources(state, flagSources: TimeSeriesFlagSource[]) {
    state.flagSources = flagSources
  }
}
