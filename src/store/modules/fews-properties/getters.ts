import type { GetterTree } from 'vuex';
import type { FewsPropertiesState } from './types';
import type { RootState } from '../../types';
import { flagColors } from '@/lib/FewsProperties/fewsProperties';

export const getters: GetterTree<FewsPropertiesState, RootState> = {
  getFlags: state => {
    return state.flags
  },

  getFlagSources: state => {
    return state.flagSources
  },

  getFlagColorByFlag: _state => (flagId: string): string | undefined => {
    return flagColors[flagId as keyof typeof flagColors]
  },

}
