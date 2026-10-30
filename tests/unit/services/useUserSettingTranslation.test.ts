// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createI18n } from 'vue-i18n'
import { useUserSettingTranslation } from '@/services/useUserSettingTranslation'

const messages = {
  de: {
    userSettings: {
      groups: { Charts: 'Diagramme' },
      items: {
        charts: {
          scrollZoomMode: {
            label: 'Scrollrad-Zoommodus',
            options: { xy: 'X und Y' },
          },
        },
        ui: {
          'hierarchical-menu-style': { label: 'Menüstil' },
          'sidebar-style': { options: { 'full labels': 'Vollständig' } },
        },
      },
    },
  },
}

function withTranslation(locale: string) {
  let result!: ReturnType<typeof useUserSettingTranslation>
  const app = createApp(
    defineComponent({
      setup() {
        result = useUserSettingTranslation()
        return () => h('div')
      },
    }),
  )
  app.use(createI18n({ legacy: false, locale, messages }))
  app.mount(document.createElement('div'))
  return result
}

const scrollZoomMode = {
  id: 'charts.scrollZoomMode',
  label: 'Scroll wheel zoom mode',
}

describe('useUserSettingTranslation', () => {
  it('translates labels, option titles and group titles', () => {
    const { label, optionTitle, groupTitle } = withTranslation('de')

    expect(label(scrollZoomMode)).toBe('Scrollrad-Zoommodus')
    expect(
      optionTitle(scrollZoomMode, { value: 'xy', title: 'Both X and Y' }),
    ).toBe('X und Y')
    expect(groupTitle({ id: 'Charts', title: 'Charts' })).toBe('Diagramme')
  })

  it('resolves ids with hyphens and option values with spaces', () => {
    const { label, optionTitle } = withTranslation('de')

    expect(
      label({ id: 'ui.hierarchical-menu-style', label: 'Menu style' }),
    ).toBe('Menüstil')
    expect(
      optionTitle(
        { id: 'ui.sidebar-style' },
        { value: 'full labels', title: 'Full labels' },
      ),
    ).toBe('Vollständig')
  })

  it('falls back to the setting definition without a translation', () => {
    const { label, optionTitle, groupTitle } = withTranslation('de')

    expect(label({ id: 'charts.brush', label: 'Show brush chart' })).toBe(
      'Show brush chart',
    )
    expect(optionTitle(scrollZoomMode, { value: 'off', title: 'Off' })).toBe(
      'Off',
    )
    expect(groupTitle({ id: 'Map', title: 'Map' })).toBe('Map')
  })

  it('uses option titles set in the FEWS config', () => {
    const { optionTitle } = withTranslation('de')

    expect(
      optionTitle(scrollZoomMode, {
        value: 'xy',
        title: 'Horizontal and vertical',
        configuredTitle: true,
      }),
    ).toBe('Horizontal and vertical')
  })

  it('falls back for option values containing dots', () => {
    const { optionTitle } = withTranslation('de')

    expect(
      optionTitle({ id: 'ui.scale' }, { value: '0.8', title: '80%' }),
    ).toBe('80%')
  })

  it('falls back for a locale without messages', () => {
    const { label } = withTranslation('fr')

    expect(label(scrollZoomMode)).toBe('Scroll wheel zoom mode')
  })
})
