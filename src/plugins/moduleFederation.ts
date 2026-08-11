import { MF_REGISTRY_KEY } from '@/composables/useMicroFrontEnd'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { registerRemotes } from '@module-federation/enhanced/runtime'
import { App } from 'vue'

export default {
  async install(app: App, options: { manifestUrl: string; baseUrl: string }) {
    if (!options?.manifestUrl) {
      console.error(
        'Module Federation Plugin: Missing manifest URL configuration.',
      )
      return
    }

    try {
      const response = await fetch(options.manifestUrl)
      const manifest = await response.json()

      registerRemotes(manifest.remotes)

      const piProvider = new PiWebserviceProvider(options.baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })

      const config = await piProvider.getMicroFrontEnds({})
      app.provide(MF_REGISTRY_KEY, {
        config,
        options,
      })
      console.log('Module Federation Plugin: Instance created and installed.')
    } catch (error) {
      console.error(
        'Module Federation Plugin: Failed to fetch or create instance.',
        error,
      )
    }
  },
}
