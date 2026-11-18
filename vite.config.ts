import { defineConfig } from 'vite'
import { federation } from '@module-federation/vite'
import {
  createWebOCConfig,
  federatedModuleFederationAdapter,
} from './vite.shared.js'

export default defineConfig(({ mode }) =>
  createWebOCConfig(mode, federatedModuleFederationAdapter, [
    federation({
      name: 'delft-fews-weboc',
      shared: {
        vue: { singleton: true },
        '@deltares/fews-web-oc-composables': { singleton: true },
      },
    }),
  ]),
)
