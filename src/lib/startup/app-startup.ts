import type { App as VueApp } from 'vue'
import { configManager } from '../../services/application-config'
import { authenticationManager } from '../../services/authentication/AuthenticationManager.js'
import router from '../../router/index.js'
import { i18n, setI18nLanguage } from '../../plugins/i18n.js'
import { loadApplicationConfig } from './config-loader.js'
import { appendConfiguredHeadLinks } from './resource-links.js'
import { handleStartupError } from './startup-error.js'
import moduleFederationPlugin from '@/plugins/moduleFederation'

export { loadApplicationConfig } from './config-loader.js'
export {
  appendConfiguredHeadLinks,
  createHeadLink,
  resolveConfiguredResource,
} from './resource-links.js'
export { handleStartupError, logConfigLoadReason } from './startup-error.js'

async function bootstrapApp(app: VueApp<Element>): Promise<void> {
  const data = await loadApplicationConfig()
  configManager.update(data)

  appendConfiguredHeadLinks()

  if (configManager.authenticationIsEnabled) {
    authenticationManager.init(configManager.getUserManagerSettings())
  }

  const locale = configManager.getWithDefault('VITE_I18N_LOCALE', 'en')
  await setI18nLanguage(i18n, locale)
  app.use(i18n)

  const mfManifestUrl = configManager.get('VITE_FEWS_WEBOC_MF_MANIFEST_URL')
  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  if (mfManifestUrl) {
    app.use(moduleFederationPlugin, { manifestUrl: mfManifestUrl, baseUrl })
  }

  app.use(router)
  app.mount('#app')
}

export async function runAppBootstrap(app: VueApp<Element>): Promise<void> {
  try {
    await bootstrapApp(app)
  } catch (err) {
    handleStartupError(err)
  }
}
