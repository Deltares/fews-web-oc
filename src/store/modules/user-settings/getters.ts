
import { GetterTree } from 'vuex';
import { UserSettingsItem, UserSettingsState } from './types';
import { resolveRelations } from '../../helpers';
import { RootState } from '../../types';

export const getters: GetterTree<UserSettingsState, RootState> = {
  find: (state: UserSettingsState, _getters, _rootState: RootState, rootGetters) => (id: string) => {
    return resolveRelations(state.byId[id], [], rootGetters)
  },
  list: (state: UserSettingsState, getters) => {
    const result = state.allIds.map(id => getters.find(id))
    return result
  },
  listFavorite: (state: UserSettingsState, getters) => {
    const result = state.allIds.map(id => getters.find(id))
    function isFavorite(item: UserSettingsItem): boolean {
        return ( item.favorite === true )
    }
    return result.filter((item) => { return isFavorite(item) } )
  },
  listByGroup: (state, getters, _rootState: RootState, rootGetters) => (id: string) => {
    const result = state.allIds.map(id => getters.find(id))
    return result.filter((s) => s.group === id)
  },
}
