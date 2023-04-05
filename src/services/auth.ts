import { Log, UserManager } from 'oidc-client-ts'
import { configManager } from './application-config/'

Log.setLogger(console)
Log.setLevel(Log.WARN)

declare module 'vue/types/vue' {
  interface Vue {
    $auth: UserManager;
  }
}

export default {
  install (Vue: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    const settings = configManager.getUserManagerSettings()
    Vue.prototype.$auth = new UserManager(settings)
  }
}
