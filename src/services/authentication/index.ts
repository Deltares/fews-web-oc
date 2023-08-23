import { Log, UserManagerSettings } from 'oidc-client-ts'
import { App } from 'vue'
import { authenticationManager } from './AuthenticationManager'

Log.setLogger(console)
Log.setLevel(Log.WARN)

export default {
  install: (app: App<Element>, settings: UserManagerSettings) => {
    app.config.globalProperties.$auth = authenticationManager
    authenticationManager.init(settings)
  },
}
