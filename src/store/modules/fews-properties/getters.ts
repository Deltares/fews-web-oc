import type { GetterTree } from 'vuex';
import type { FewsPropertiesState } from './types';
import type { RootState } from '../../types';
import { flagColors } from '@/lib/FewsProperties/fewsProperties';
import type { TimeSeriesFlag } from '@deltares/fews-pi-requests';

export const getters: GetterTree<FewsPropertiesState, RootState> = {
  getFlags: state => {
    return state.flags
  },

  getFlagSources: state => {
    return state.flagSources
  },

  getFlagByFlag: state => (flagId: string): TimeSeriesFlag | undefined => {
    if (state.flags === undefined) return
    const flag = state.flags.find(value => value.flag === flagId)
    return flag
  },

  getFlagNameByFlag: (_state, getters, _rootState: RootState, _rootGetters) => (flagId: string): string => {
    const timeSeriesFlag = getters['getFlagByFlag'](flagId)
    return timeSeriesFlag !== undefined ? timeSeriesFlag.name : ''
  },

  getFlagSourceNameByFlag: state => (flagSource: string | null | undefined): string => {
    if (flagSource === undefined || state.flagSources === undefined) return ''
    const timeSeriesFlagSource = state.flagSources.find(value => value.id === flagSource)
    return timeSeriesFlagSource !== undefined ? timeSeriesFlagSource.name : ''
  },

  getFlagColorByFlag: _state => (flagId: string): string | undefined => {
    return flagColors[flagId as keyof typeof flagColors]
  }
}
