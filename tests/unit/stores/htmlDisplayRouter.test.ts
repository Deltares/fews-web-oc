// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { useConfigStore } from '@/stores/config'

vi.mock('@/views/AboutView.vue', () => ({ default: {} }))
vi.mock('@/views/auth/LoginView.vue', () => ({ default: {} }))
vi.mock('@/views/auth/Callback.vue', () => ({ default: {} }))
vi.mock('@/views/auth/Logout.vue', () => ({ default: {} }))
vi.mock('@/views/auth/Silent.vue', () => ({ default: {} }))
vi.mock('@/views/HtmlDisplayView.vue', () => ({ default: {} }))
vi.mock('@/services/application-config', () => ({
  configManager: { authenticationIsEnabled: false },
}))
vi.mock('@/services/authentication/AuthenticationManager', () => ({
  authenticationManager: {},
}))
vi.mock('@/services/useCustomStyleSheet/index.ts', () => ({
  loadCustomStyleSheet: vi.fn(),
}))

describe('HTML display routing', () => {
  it('initializes one route and redirects to the configured default display', async () => {
    setActivePinia(createPinia())
    const store = useConfigStore()
    store.addComponent({
      id: 'manualDisplay',
      type: 'HtmlDisplay',
      title: 'Manual',
      path: 'manual',
      url: 'manual.html',
      icon: '',
      iconId: '',
      showInNavigationMenu: true,
    })
    store.addComponent({
      id: 'manualDisplay',
      type: 'HtmlDisplay',
      title: 'Terms',
      path: 'terms-and-conditions',
      url: 'terms.html',
      icon: '',
      iconId: '',
      showInNavigationMenu: true,
    })
    store.setGeneral({ defaultComponent: 'manualDisplay' })
    const { default: router } = await import('@/router')

    await router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('HtmlDisplay')
    expect(router.currentRoute.value.params.path).toBe('terms-and-conditions')
    expect(store.getComponentByRoute(router.currentRoute.value)?.title).toBe(
      'Terms',
    )
    expect(
      router.getRoutes().filter((route) => route.name === 'HtmlDisplay'),
    ).toHaveLength(1)

    await router.push({ name: 'HtmlDisplay', params: { path: 'manual' } })
    expect(store.getComponentByRoute(router.currentRoute.value)?.title).toBe(
      'Manual',
    )
  })
})
