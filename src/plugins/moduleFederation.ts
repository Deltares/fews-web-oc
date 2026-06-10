import { createInstance } from '@module-federation/enhanced/runtime'
import { App } from 'vue'

export default {
  async install(app: App, options: { manifestUrl: string }) {
    if (!options || !options.manifestUrl) {
      console.error('Module Federation Plugin: Missing manifest URL configuration.')
      return
    }

    try {
      console.log(`Loading manifest from: ${options.manifestUrl}`)
      const response = await fetch(options.manifestUrl)
      const manifest = await response.json()
      const instance = createInstance(manifest)
      app.config.globalProperties.$moduleFederation = instance
      console.log('Module Federation Plugin: Instance created and installed.')
    } catch (error) {
      console.error(
        'Module Federation Plugin: Failed to fetch or create instance.',
        error,
      )
    }
  },
}
