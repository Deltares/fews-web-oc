import { Log } from 'oidc-client-ts'
import { AuthenticationManager } from './AuthenticationManager';

Log.setLogger(console)
Log.setLevel(Log.WARN)

declare module 'vue/types/vue' {
  interface Vue {
    $auth: AuthenticationManager;
  }
}

export default {
  install (Vue: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    Vue.prototype.$auth = new AuthenticationManager()
  }
}
