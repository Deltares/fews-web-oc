import Oidc, { UserManager } from 'oidc-client'
import oidcSettings from './config'

Oidc.Log.logger = console
Oidc.Log.level = Oidc.Log.WARN

declare module 'vue/types/vue' {
  interface Vue {
    $auth: UserManager;
  }
}

export default {
  install (Vue: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    Vue.prototype.$auth = new Oidc.UserManager(oidcSettings)
  }
}
