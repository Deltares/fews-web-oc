import { Module } from 'vuex';
import type { FewsPropertiesState } from './types'
import { RootState } from '../../types';
import { getters } from './getters';
import { actions } from './actions';
import { mutations } from './mutations';

export const state: FewsPropertiesState = {
  flags: [],
  flagSources: []
};

const namespaced: boolean = true;

export const fewsProperties: Module<FewsPropertiesState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
