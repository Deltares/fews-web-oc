import {
  MF_REGISTRY_KEY,
  type MicroFrontendRegistry,
} from '@/composables/useMicroFrontEnd'
import type { App } from 'vue'

export default {
  install(app: App, registry: MicroFrontendRegistry) {
    app.provide(MF_REGISTRY_KEY, registry)

    console.log('Module Federation Plugin: Instance created and installed.')
  },
}
