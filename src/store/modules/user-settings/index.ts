
import { Module } from 'vuex';
import { UserSettingsState } from './types'
import { RootState } from '../../types';
import { getters } from './getters';
import { actions } from './actions';
import { mutations } from './mutations';

export const state: UserSettingsState = {
  settings: [
    { type: 'oneOfMultiple' , label: 'Wind speed', value: 'm/s', items: ['m/s', 'km/h', 'Bft', 'kts'], group: 'Units'},
    { type: 'oneOfMultiple',  label: 'Wind direction', value: 'degree', items: ['degree', 'cardinal'], group: 'Units'},
    { type: 'oneOfMultiple',  label: 'Theme', value: 'auto', items: ['auto', 'light', 'dark'], group: 'Theme'},
    { type: 'oneOfMultiple',  label: 'Language', value: 'en', items: ['en', 'nl'], group: 'Locale'},
  ],
  groups: ['Units', 'Theme', 'Locale']
};

const namespaced: boolean = true;

export const userSettings: Module<UserSettingsState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
