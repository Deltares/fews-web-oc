import Vue from 'vue'
import { MutationTree } from 'vuex';
import { UserSettingsItem, UserSettingsState } from './types';

export const mutations: MutationTree<UserSettingsState> = {
  add(state, item: UserSettingsItem) {
    Vue.set(state.byId, item.id, item);
    const index = state.allIds.findIndex((id: string) => {return id === item.id})
    if (index < 0) {
      state.allIds.push(item.id)
    } else {
      Vue.set(state.allIds, index, item.id)
    }
},
remove(state, item: UserSettingsItem) {
  const index = state.allIds.indexOf(item.id);
  if (index > -1) {
    Vue.delete(state.byId, item.id);
    state.allIds.splice(index, 1);
  }
},
removeById(state, id: string) {
  const index = state.allIds.indexOf(id);
  if (index > -1) {
    Vue.delete(state.byId, id);
    state.allIds.splice(index, 1);
  }
},


}
