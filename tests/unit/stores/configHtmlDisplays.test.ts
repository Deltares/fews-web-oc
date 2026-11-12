// @vitest-environment jsdom
import { createPinia, setActivePinia } from 'pinia'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getFewsConfig } from '@/lib/fews-config'
import type { WebOcComponent } from '@/lib/fews-config/types'
import { useConfigStore } from '@/stores/config'
import HtmlDisplayView from '@/views/HtmlDisplayView.vue'

vi.mock('@/lib/fews-config', () => ({
  getFewsConfig: vi.fn(),
  getResourcesStaticUrl: (resource: string) => `/static/${resource}`,
  getLocalOrRemoteFileUrl: vi.fn(),
}))

vi.mock('vuetify/lib/components/VAlert/index.mjs', () => ({
  VAlert: { render: () => h('div') },
}))

const manual: Extract<WebOcComponent, { type: 'HtmlDisplay' }> = {
  id: 'manualDisplay',
  type: 'HtmlDisplay',
  title: 'Manual',
  path: 'manual',
  url: 'manual.html',
  icon: '',
  iconId: '',
  showInNavigationMenu: true,
}
const terms = {
  ...manual,
  id: 'termsDisplay',
  title: 'Terms',
  path: 'terms-and-conditions',
  url: 'terms.html',
}
const sharedIdTerms = { ...terms, id: manual.id }

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('HTML display configuration', () => {
  it('retains displays with unique ids and loads the configuration only once', async () => {
    vi.mocked(getFewsConfig).mockResolvedValue({
      general: { defaultComponent: 'termsDisplay' },
      webOcComponents: [manual, terms],
    })
    const store = useConfigStore()

    await store.setFewsConfig()
    await store.setFewsConfig()

    expect(getFewsConfig).toHaveBeenCalledTimes(1)
    expect(store.getComponentsByType('HtmlDisplay')).toEqual([manual, terms])
    expect(store.getComponentById('manualDisplay')).toEqual(manual)
    expect(store.getComponentById('termsDisplay')).toEqual(terms)
    expect(store.defaultComponent).toEqual(terms)
    expect(
      store.activeComponents.map(({ title, to }) => ({ title, to })),
    ).toEqual([
      {
        title: 'Manual',
        to: { name: 'HtmlDisplay', params: { path: 'manual' } },
      },
      {
        title: 'Terms',
        to: { name: 'HtmlDisplay', params: { path: 'terms-and-conditions' } },
      },
    ])
  })

  it('replaces the same display without affecting other paths', () => {
    const store = useConfigStore()
    store.addComponent(manual)
    store.addComponent(sharedIdTerms)
    store.addComponent({
      ...manual,
      url: 'updated.html',
      showInNavigationMenu: false,
    })

    expect(
      store.getComponentsByType('HtmlDisplay').map((item) => item.url),
    ).toEqual(['updated.html', 'terms.html'])
    expect(store.activeComponents.map((item) => item.title)).toEqual(['Terms'])
  })

  it('retains displays with the same id and distinguishes their paths', async () => {
    vi.mocked(getFewsConfig).mockResolvedValue({
      general: { defaultComponent: manual.id },
      webOcComponents: [manual, sharedIdTerms],
    })
    const store = useConfigStore()

    await store.setFewsConfig()
    expect(store.getComponentsByType('HtmlDisplay')).toEqual([
      manual,
      sharedIdTerms,
    ])
    expect(store.getComponentById(manual.id)).toEqual(sharedIdTerms)
    expect(store.defaultComponent).toEqual(sharedIdTerms)
    expect(store.activeComponents.map((item) => item.to)).toEqual([
      { name: 'HtmlDisplay', params: { path: 'manual' } },
      { name: 'HtmlDisplay', params: { path: 'terms-and-conditions' } },
    ])
  })

  it('does not collide when ids or paths contain separators or encoded keys', () => {
    const store = useConfigStore()
    store.addComponent({ ...manual, id: 'a,b', path: 'c' })
    store.addComponent({ ...manual, id: 'a', path: 'b,c' })
    store.addComponent({ ...manual, id: '["a,b","c"]', path: 'other' })
    store.addComponent({
      id: '["a,b","c"]',
      type: 'TopologyDisplay',
      title: 'Topology',
    })

    expect(store.getComponentsByType('HtmlDisplay')).toHaveLength(3)
    expect(store.getComponentByType('TopologyDisplay')?.title).toBe('Topology')
  })

  it('keeps topology lookup and navigation independent of hidden HTML displays', () => {
    const store = useConfigStore()
    const topology: Extract<WebOcComponent, { type: 'TopologyDisplay' }> = {
      id: 'topologyDisplay',
      type: 'TopologyDisplay',
      title: 'Overview',
    }
    store.addComponent(topology)
    store.addComponent({ ...manual, showInNavigationMenu: false })
    store.addComponent({ ...terms, showInNavigationMenu: false })
    store.setGeneral({ defaultComponent: 'topologyDisplay' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/topology/:topologyId',
          name: 'TopologyDisplay',
          component: {},
        },
      ],
    })

    expect(
      store.getComponentByRoute(router.resolve('/topology/topologyDisplay'))
        ?.id,
    ).toBe('topologyDisplay')
    expect(store.defaultComponent?.id).toBe('topologyDisplay')
    expect(store.activeComponents).toHaveLength(1)
    expect(store.activeComponents[0].to).toEqual({
      name: 'TopologyDisplay',
      params: { topologyId: 'topologyDisplay' },
    })
    expect(
      store.getComponentsByType('HtmlDisplay').map((item) => item.path),
    ).toEqual(['manual', 'terms-and-conditions'])
  })

  it('selects the active display by path and does not mistake unknown paths for another display', () => {
    const store = useConfigStore()
    store.addComponent(manual)
    store.addComponent(sharedIdTerms)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/resources/:path?',
          name: 'HtmlDisplay',
          component: HtmlDisplayView,
        },
      ],
    })

    expect(
      store.getComponentByRoute(router.resolve('/resources/manual'))?.title,
    ).toBe('Manual')
    expect(
      store.getComponentByRoute(
        router.resolve('/resources/terms-and-conditions'),
      )?.title,
    ).toBe('Terms')
    expect(
      store.getComponentByRoute(router.resolve('/resources/missing')),
    ).toBeUndefined()
    expect(store.getComponentByRoute(router.resolve('/resources'))?.title).toBe(
      'Manual',
    )
  })

  it('updates rendered content when navigating between displays with the same id', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useConfigStore()
    store.addComponent(manual)
    store.addComponent(sharedIdTerms)
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      text: async () => `<p>${url}</p>`,
    }))
    vi.stubGlobal('fetch', fetchMock)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/resources/:path?',
          name: 'HtmlDisplay',
          component: HtmlDisplayView,
        },
      ],
    })
    const element = document.createElement('div')
    const app = createApp({ render: () => h(RouterView) })
    app.component('v-alert', { render: () => h('div') })
    app.use(pinia).use(router)

    try {
      await router.push('/resources/manual')
      await router.isReady()
      app.mount(element)
      await vi.waitFor(() =>
        expect(element.textContent).toContain('/static/manual.html'),
      )

      await router.push('/resources/terms-and-conditions')
      await nextTick()
      await vi.waitFor(() =>
        expect(element.textContent).toContain('/static/terms.html'),
      )
      expect(element.textContent).not.toContain('/static/manual.html')
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally {
      app.unmount()
    }
  })
})
