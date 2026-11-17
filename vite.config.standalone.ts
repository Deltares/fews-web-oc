import { defineConfig, type Plugin } from 'vite'
import { createWebOCConfig } from './vite.config.shared.js'

export function forbidModuleFederation(): Plugin {
  function checkModule(id: string): void {
    const normalized = id.replace(/\\/g, '/')
    if (
      normalized.startsWith('@module-federation/') ||
      normalized.includes('/node_modules/@module-federation/') ||
      normalized.includes('/.__mf__temp/') ||
      normalized.includes('_virtual_mf_') ||
      normalized.includes('virtual:mf')
    ) {
      throw new Error(
        `Standalone builds must not import Module Federation: ${id}`,
      )
    }
  }

  return {
    name: 'weboc-forbid-module-federation',
    enforce: 'pre',
    resolveId(source) {
      checkModule(source)
      return null
    },
    load(id) {
      checkModule(id)
      return null
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        for (const id of Object.keys(output.modules)) checkModule(id)
        for (const id of [...output.imports, ...output.dynamicImports]) {
          checkModule(id)
        }
        if (
          /@module-federation\/|__FEDERATION__|__mf_init|_virtual_mf_/.test(
            output.code,
          )
        ) {
          this.error(
            `Standalone output contains Module Federation references: ${output.fileName}`,
          )
        }
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const config = createWebOCConfig(
    mode,
    './src/lib/moduleFederation/standalone.ts',
    [forbidModuleFederation()],
  )
  return {
    ...config,
    build: {
      ...config.build,
      outDir: 'dist-standalone',
    },
  }
})
