import {
  MF_REGISTRY_KEY,
  type ModuleFederationOptions,
} from '@/composables/useMicroFrontEnd'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { PiWebserviceProvider } from '@deltares/fews-pi-requests'
import { registerRemotes } from '@module-federation/enhanced/runtime'
import { type RemoteWithEntry } from '@module-federation/sdk'
import { App } from 'vue'

export default {
  async install(app: App, options: ModuleFederationOptions) {
    if (!options?.manifestUrl) {
      console.error(
        'Module Federation Plugin: Missing manifest URL configuration.',
      )
      return
    }

    try {
      const response = await fetch(options.manifestUrl)
      const manifest = await response.json()

      const remotes: RemoteWithEntry[] = manifest.remotes ?? []
      registerRemotes(remotes)

      const piProvider = new PiWebserviceProvider(options.baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })

      const config = await piProvider.getMicroFrontEnds({})
      app.provide(MF_REGISTRY_KEY, {
        config,
        options,
        remotes,
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
