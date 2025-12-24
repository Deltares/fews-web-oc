import { createInstance } from '@module-federation/enhanced/runtime';

export default {
  install(app, options) {
    if (!options || !options.manifest) {
      console.error('Module Federation Plugin: Missing manifest configuration.');
      return;
    }

    try {
      const instance = createInstance(options.manifest);
      app.config.globalProperties.$moduleFederation = instance;
      console.log('Module Federation Plugin: Instance created and installed.');
    } catch (error) {
      console.error('Module Federation Plugin: Failed to create instance.', error);
    }
  },
};