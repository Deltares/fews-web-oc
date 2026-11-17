import { describe, expect, it } from 'vitest'
import { build, type Plugin } from 'vite'
import { forbidModuleFederation } from '../../../vite.config.standalone'

async function buildFixture(dependency?: string, code?: string) {
  const fixture: Plugin = {
    name: 'standalone-test-fixture',
    resolveId(source) {
      if (source === 'fixture') return '\0fixture'
      if (source === 'dependency') return dependency
      return null
    },
    load(id) {
      if (id === '\0fixture') {
        if (code) return code
        return dependency
          ? 'import "dependency"; export const value = 1'
          : 'export const value = 1'
      }
      return null
    },
  }
  return build({
    configFile: false,
    logLevel: 'silent',
    plugins: [forbidModuleFederation(), fixture],
    build: {
      write: false,
      rolldownOptions: { input: 'fixture' },
    },
  })
}

describe('standalone build exclusion guard', () => {
  it('allows a federation-free module graph', async () => {
    await expect(buildFixture()).resolves.toBeDefined()
  })

  it('rejects federation references embedded in emitted code', async () => {
    await expect(
      buildFixture(undefined, 'console.log("@module-federation/runtime")'),
    ).rejects.toThrow('Standalone output contains Module Federation references')
  })

  it.each([
    'C:/project/node_modules/@module-federation/runtime/dist/index.js',
    'C:\\project\\node_modules\\@module-federation\\runtime\\dist\\index.js',
    'C:/project/.__mf__temp/bootstrap.js',
    'virtual:mf-bootstrap',
    '\0_virtual_mf_bootstrap',
    '@module-federation/enhanced/runtime',
  ])('rejects federation module %s', async (dependency) => {
    await expect(buildFixture(dependency)).rejects.toThrow(
      'Standalone builds must not import Module Federation',
    )
  })
})
