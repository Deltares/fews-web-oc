import { Module, Mutation, VuexModule } from 'vuex-module-decorators'
import { SystemTimeState } from './types'

@Module({ namespaced: true, name: 'systemTime' })
export default class SystemTime extends VuexModule<SystemTimeState> {
  systemTime: Date = new Date()
  startTime: Date | null = null
  endTime: Date | null = null

  @Mutation
  setStartTime(startTime: Date) {
    this.startTime = startTime
  }

  @Mutation
  setEndTime(endTime: Date) {
    this.endTime = endTime
  }

  @Mutation
  setInterval(payload: { startTime: Date, endTime: Date}) {
    console.log('system time store', payload.startTime, payload.endTime)
    this.startTime = payload.startTime
    this.endTime = payload.endTime
  }
}
