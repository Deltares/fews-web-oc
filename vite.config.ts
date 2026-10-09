import { defineConfig } from 'vite'
import { federation } from '@module-federation/vite'
import { createWebOCConfig } from './vite.config.shared.js'

export default defineConfig(({ mode }) =>
  createWebOCConfig(mode, './src/lib/moduleFederation/index.ts', [
    federation({
      name: 'delft-fews-weboc',
      shared: {
        vue: { singleton: true },
        '@deltares/fews-web-oc-composables': { singleton: true },
      },
    }),
  ]),
)
