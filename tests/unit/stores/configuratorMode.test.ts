// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { configManager } from '@/services/application-config'
import {
  isConfiguratorModeAllowed,
  useConfiguratorModeStore,
} from '@/stores/configuratorMode'

const STORAGE_KEY = 'weboc-configurator-mode-v1.0.0'

function createStore() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  createApp({}).use(pinia)
  setActivePinia(pinia)
  return useConfiguratorModeStore()
}

beforeEach(() => {
  localStorage.clear()
  configManager.update({})
})

afterEach(() => {
  vi.unstubAllEnvs()
  configManager._config = {} as typeof configManager._config
})

describe('isConfiguratorModeAllowed', () => {
  it('is allowed in development builds', () => {
    vi.stubEnv('DEV', true)
    expect(isConfiguratorModeAllowed()).toBe(true)
  })

  it('is not allowed in other builds by default', () => {
    vi.stubEnv('DEV', false)
    expect(isConfiguratorModeAllowed()).toBe(false)
  })

  it.each([true, 'true', 'TRUE'])(
    'is allowed when the application config allows it (%s)',
    (value) => {
      vi.stubEnv('DEV', false)
      configManager.update({ VITE_FEWS_WEBOC_CONFIGURATOR_MODE_ALLOWED: value })
      expect(isConfiguratorModeAllowed()).toBe(true)
    },
  )

  it.each([false, 'false', ''])(
    'is not allowed when the application config disallows it (%s)',
    (value) => {
      vi.stubEnv('DEV', false)
      configManager.update({ VITE_FEWS_WEBOC_CONFIGURATOR_MODE_ALLOWED: value })
      expect(isConfiguratorModeAllowed()).toBe(false)
    },
  )
})

describe('useConfiguratorModeStore', () => {
  it('is disabled by default', () => {
    vi.stubEnv('DEV', true)
    const store = createStore()
    expect(store.isAllowed).toBe(true)
    expect(store.isEnabled).toBe(false)
  })

  it('can be enabled and toggled when allowed', () => {
    vi.stubEnv('DEV', true)
    const store = createStore()

    store.setEnabled(true)
    expect(store.isEnabled).toBe(true)

    store.toggle()
    expect(store.isEnabled).toBe(false)
  })

  it('is never enabled when not allowed', () => {
    vi.stubEnv('DEV', false)
    const store = createStore()

    store.setEnabled(true)
    expect(store.isAllowed).toBe(false)
    expect(store.isEnabled).toBe(false)
  })

  it('restores the choice of the user from local storage', () => {
    vi.stubEnv('DEV', true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabledByUser: true }))

    const store = createStore()
    expect(store.isEnabled).toBe(true)
  })

  it('does not enable a stored choice when not allowed', () => {
    vi.stubEnv('DEV', false)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabledByUser: true }))

    const store = createStore()
    expect(store.isEnabled).toBe(false)
  })
})
