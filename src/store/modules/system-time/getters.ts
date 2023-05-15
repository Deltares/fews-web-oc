
import { GetterTree } from 'vuex';
import { SystemTimeState } from './types';
import { RootState } from '../../types';

export const getters: GetterTree<SystemTimeState, RootState> = {
  getSystemTime: (state, _getters, _rootState: RootState, rootGetters) => () => {
    return state.systemTime
  },
}
