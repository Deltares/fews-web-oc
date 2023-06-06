
import { GetterTree } from 'vuex';
import { UserSettingsState } from './types';
import { RootState } from '../../types';

export const getters: GetterTree<UserSettingsState, RootState> = {
  settingsForGroup: (state, _getters, _rootState: RootState, rootGetters) => (id: string) => {
    return state.settings.filter((s) => s.group === id)
  },
}
