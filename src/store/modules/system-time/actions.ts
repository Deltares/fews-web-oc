import { ActionTree } from 'vuex'
import { RootState } from '../../types'
import { SystemTimeState } from './types'

export const actions: ActionTree<SystemTimeState, RootState>= {
  startClock: async (context, _payload: any ) => {
    context.commit('setSystemTime', new Date())
    const intervalTimer = setInterval(() => {
      context.commit('setSystemTime', new Date()) },
      1000)
    context.commit('setIntervalTimer', intervalTimer)
  },
}
