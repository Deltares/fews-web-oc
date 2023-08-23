import { App } from 'vue'
import { ApplicationConfig } from './ApplicationConfig'
import { ApplicationConfigManager } from './ApplicationConfigManager'

export const configManager = new ApplicationConfigManager()

export default {
  install: (app: App<Element>, config: ApplicationConfig) => {    
    configManager.update(config)
    app.config.globalProperties.$config =  configManager
  }
}