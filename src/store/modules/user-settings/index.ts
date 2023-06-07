
import { Module } from 'vuex';
import { UserSettingsState } from './types'
import { RootState } from '../../types';
import { getters } from './getters';
import { actions } from './actions';
import { mutations } from './mutations';

export const state: UserSettingsState = {
  settings: [
    { type: 'oneOfMultiple' , label: 'Wind speed', value: 'm/s', items: [
      { value: 'm/s' },
      { value: 'km/hl'},
      { value: 'Bft' },
      { value: 'kts' }
    ], group: 'Units'},
    { type: 'oneOfMultiple',  label: 'Wind direction', value: 'degree', items: [
      { value: 'degree' },
      { value: 'cardinal' }
    ], group: 'Units'},
    { type: 'oneOfMultiple',  label: 'Theme', value: 'auto', items: [
      { value: 'auto', icon: 'mdi-theme-light-dark'},
      { value: 'light', icon: 'mdi-weather-sunny'},
      { value: 'dark' , icon: 'mdi-weather-night'}
    ], group: 'Theme'},
    { type: 'oneOfMultiple',  label: 'Language', value: 'en', items: [
      { icon: 'fi-au', value: 'en-au' },
      { icon: 'fi-nl', value: 'nl' }
    ], group: 'Locale'},
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
