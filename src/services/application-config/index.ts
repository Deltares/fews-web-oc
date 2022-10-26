import { ApplicationConfig } from './ApplicationConfig'
import { ApplicationConfigManager } from './ApplicationConfigManager'

declare module 'vue/types/vue' {
  interface Vue {
    $config: ApplicationConfigManager;
  }
}

export const configManager = new ApplicationConfigManager()

export default {
  install (Vue: any, config: ApplicationConfig): void { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    configManager.update(config)
    Vue.prototype.$config = configManager
  }
}
