import { defineConfig } from 'vitest/config'
import { createWebOCConfig } from './webocConfig.shared.js'

export default defineConfig(({ mode }) =>
  createWebOCConfig(mode, './src/lib/moduleFederation/index.ts'),
)
