import { MF_REGISTRY_KEY } from '@/composables/useMicroFrontEnd'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import {
  PiWebserviceProvider,
  WebOCMicroFrontEnds,
  WebOCMicroFrontEndsResponse,
} from '@deltares/fews-pi-requests'
import { getInstance } from '@module-federation/enhanced/runtime'
import { App } from 'vue'

export default {
  async install(app: App, options: { manifestUrl: string; baseUrl: string }) {
    if (!options || !options.manifestUrl) {
      console.error(
        'Module Federation Plugin: Missing manifest URL configuration.',
      )
      return
    }

    try {
      const response = await fetch(options.manifestUrl)
      const manifest = await response.json()
      const instance = getInstance()
      instance.registerRemotes(manifest.remotes)
      // const instance = getInstance()
      console.log('Module Federation Plugin: Instance created.', instance)
      const piProvider = new PiWebserviceProvider(options.baseUrl, {
        transformRequestFn: createTransformRequestFn(),
      })

      const config = await piProvider.getMicroFrontEnds({})
      if (isMicroFrontendConfig(config)) {
        app.provide(MF_REGISTRY_KEY, {
          config,
          options,
        })
      }
      console.log('Module Federation Plugin: Instance created and installed.')
    } catch (error) {
      console.error(
        'Module Federation Plugin: Failed to fetch or create instance.',
        error,
      )
    }
  },
}

function isMicroFrontendConfig(config: WebOCMicroFrontEndsResponse): config is {
  microFrontEnds: WebOCMicroFrontEnds[]
} {
  return (
    config &&
    Array.isArray(config.microFrontEnds) &&
    config.microFrontEnds.every((mf) => typeof mf.id === 'string')
  )
}
