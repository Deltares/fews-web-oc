import { createInstance } from '@module-federation/enhanced/runtime'
import { UserOptions } from '@module-federation/runtime-core'
import { App } from 'vue'

export default {
  install(app: App, options: UserOptions) {
    if (!options) {
      console.error('Module Federation Plugin: Missing manifest configuration.')
      return
    }

    try {
      const instance = createInstance(options)
      app.config.globalProperties.$moduleFederation = instance
      console.log('Module Federation Plugin: Instance created and installed.')
    } catch (error) {
      console.error(
        'Module Federation Plugin: Failed to create instance.',
        error,
      )
    }
  },
}
