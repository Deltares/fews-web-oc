
import { Module } from 'vuex';
import { UserSettingsState } from './types'
import { RootState } from '../../types';
import { getters } from './getters';
import { actions } from './actions';
import { mutations } from './mutations';

export const state: UserSettingsState = {
  byId: {},
  allIds: [],
  groups: ['Units', 'UI', 'Locale']
};

const namespaced: boolean = true;

export const userSettings: Module<UserSettingsState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
