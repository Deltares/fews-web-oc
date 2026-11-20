import { defineConfig } from 'vitest/config'
import {
  createWebOCConfig,
  federatedModuleFederationAdapter,
} from './vite.shared.js'

export default defineConfig(({ mode }) =>
  createWebOCConfig(mode, federatedModuleFederationAdapter),
)
