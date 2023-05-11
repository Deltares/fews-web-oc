
import { Module } from 'vuex';
import { SystemTimeState } from './types'
import { RootState } from '../../types';
import { getters } from './getters';
import { actions } from './actions';
import { mutations } from './mutations';

export const state: SystemTimeState = {
  systemTime: new Date(),
  startTime: null,
  endTime: null,
  intervalTimer: null,
};

const namespaced: boolean = true;

export const systemTime: Module<SystemTimeState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
