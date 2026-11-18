// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type App, createApp, h, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import IntervalSelector from '@/components/time-control/IntervalSelector.vue'
import type { Interval } from '@/lib/TimeControl/interval'
import en from '@/locales/en.json'

vi.mock('vuetify/lib/components/VList/index.js', () => ({
  VList: { template: '<div><slot /></div>' },
  VListSubheader: { template: '<div><slot /></div>' },
  VListItem: {
    props: ['title'],
    emits: ['click'],
    template:
      '<button class="v-list-item" @click="$emit(\'click\')">{{ title }}</button>',
  },
}))

vi.mock('vuetify/lib/components/VDivider/index.js', () => ({
  VDivider: { template: '<hr />' },
}))

const preset = {
  label: 'Last day',
  start: { days: -1 },
  end: { hours: 6 },
} as unknown as Interval

describe('IntervalSelector', () => {
  let app: App | undefined
  let container: HTMLDivElement

  function mountSelector(modelValue: Interval) {
    const state = reactive({
      modelValue,
      selected: [] as Interval[],
    })
    app = createApp({
      render: () =>
        h(IntervalSelector, {
          items: [preset],
          modelValue: state.modelValue,
          'onUpdate:modelValue': (value: Interval) =>
            (state.modelValue = value),
          onSelect: (value: Interval) => state.selected.push(value),
        }),
    })
    app.use(createI18n({ legacy: false, locale: 'en', messages: { en } }))
    app.mount(container)
    return state
  }

  function click(title: string) {
    const item = Array.from(container.querySelectorAll('.v-list-item')).find(
      (element) => element.textContent === title,
    )
    item?.dispatchEvent(new MouseEvent('click'))
  }

  beforeEach(() => {
    container = document.createElement('div')
  })

  afterEach(() => {
    app?.unmount()
    app = undefined
  })

  it('emits select for another interval', () => {
    const state = mountSelector('default')
    click('Last day')
    expect(state.modelValue).toEqual(preset)
    expect(state.selected).toEqual([preset])
  })

  it('emits select when the selected interval is selected again', () => {
    const state = mountSelector(preset)
    click('Last day')
    click(en.common.default)
    click(en.common.default)
    expect(state.selected).toEqual([preset, 'default', 'default'])
  })
})
