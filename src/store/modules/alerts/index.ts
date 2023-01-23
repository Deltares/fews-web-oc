import { Module, Mutation, VuexModule } from 'vuex-module-decorators'
import { Alert } from './types'

@Module({ namespaced: true })
export default class Alerts extends VuexModule {
  alerts: Alert[] = []

  @Mutation
  addAlert(alert: Alert) {
    this.alerts.push(alert)
  }

  get listActive() {
    return this.alerts.filter((alert : Alert) => { return alert.active })
  }
}
