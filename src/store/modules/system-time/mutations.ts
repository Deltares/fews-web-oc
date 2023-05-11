import { MutationTree } from 'vuex';
import { SystemTimeState } from './types';

export const mutations: MutationTree<SystemTimeState> = {
  setSystemTime(state, systemTime: Date) {
    state.systemTime = systemTime
  },
  setStartTime(state, startTime: Date) {
    state.startTime = startTime
  },
  setEndTime(state, endTime: Date) {
    state.endTime = endTime
  },
  setInterval(state, payload: { startTime: Date, endTime: Date}) {
    state.startTime = payload.startTime
    state.endTime = payload.endTime
  },
  setIntervalTimer(state, intervalTimer: number) {
    if (state.intervalTimer) {
      clearInterval(state.intervalTimer)
    }
    state.intervalTimer = intervalTimer
  }
}
