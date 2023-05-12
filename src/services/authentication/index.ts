import { Log, UserManagerSettings } from 'oidc-client-ts'
import { authenticationManager, AuthenticationManager  } from './AuthenticationManager';

Log.setLogger(console)
Log.setLevel(Log.WARN)

declare module 'vue/types/vue' {
  interface Vue {
    $auth: AuthenticationManager;
  }
}

export default {
  install (Vue: any, settings: UserManagerSettings): void { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    Vue.prototype.$auth = authenticationManager
    authenticationManager.init(settings)
  }
}
