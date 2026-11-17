// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type App, createApp, h, nextTick, reactive } from 'vue'
import { createI18n } from 'vue-i18n'
import LocationsLegend from '@/components/wms/LocationsLegend.vue'
import en from '@/locales/en.json'

vi.mock('vuetify/lib/components/VList/index.js', () => ({
  VListItem: {
    template: `
      <div>
        <div class="v-list-item__prepend"><slot name="prepend" /></div>
        <slot />
        <div class="v-list-item__append"><slot name="append" /></div>
      </div>
    `,
  },
  VListItemTitle: { template: '<div class="v-list-item-title"><slot /></div>' },
}))

vi.mock('vuetify/lib/components/VBtn/index.js', () => ({
  VBtn: { template: '<button><slot /></button>' },
}))

vi.mock('vuetify/lib/components/VIcon/index.js', () => ({
  VIcon: {
    props: ['icon'],
    template: '<img :src="icon" />',
  },
}))

const defaultCategory = {
  category: 'station',
  value: 'station',
  iconLabel: 'Stations',
  iconName: 'station.svg',
  isPointCategory: true,
  hasPointFeatures: true,
  hasNonPointFeatures: false,
}

function category(
  overrides: Partial<typeof defaultCategory> & {
    thresholdIconName?: string
  } = {},
) {
  return { ...defaultCategory, ...overrides }
}

describe('LocationsLegend', () => {
  let app: App | undefined
  let container: HTMLDivElement

  function mountLegend(items: ReturnType<typeof category>[]) {
    const props = reactive({
      items,
      modelValue: items.map((item) => item.value),
      isDark: false,
    })
    app = createApp({
      render: () =>
        h(LocationsLegend, {
          ...props,
          'onUpdate:modelValue': (value) => (props.modelValue = value),
        }),
    })
    app.use(createI18n({ legacy: false, locale: 'en', messages: { en } }))
    app.mount(container)
    return props
  }

  beforeEach(() => {
    container = document.createElement('div')
  })

  afterEach(() => {
    app?.unmount()
    app = undefined
  })

  it('uses the location icon for the row and hides single-category controls', () => {
    mountLegend([category()])

    expect(
      container.querySelector('.v-list-item__prepend img')?.getAttribute('src'),
    ).toBe('fews:station.svg')
    expect(container.querySelector('.v-list-item__prepend circle')).toBeNull()
    expect(
      container.querySelector<HTMLButtonElement>('.v-list-item__append button')
        ?.style.display,
    ).toBe('none')
  })

  it('keeps the location icon separate from threshold category icons', () => {
    mountLegend([
      category({ value: 'warning', thresholdIconName: 'warning.svg' }),
      category({ value: 'alarm', thresholdIconName: 'alarm.svg' }),
    ])

    expect(
      container.querySelector('.v-list-item__prepend img')?.getAttribute('src'),
    ).toBe('fews:station.svg')
    expect(
      Array.from(
        container.querySelectorAll('.v-list-item__append img'),
        (icon) => icon.getAttribute('src'),
      ),
    ).toEqual(['fews:warning.svg', 'fews:alarm.svg'])
    expect(
      Array.from(
        container.querySelectorAll<HTMLButtonElement>('button'),
        (button) => button.style.display,
      ),
    ).toEqual(['', ''])
  })

  it('finds the location icon even when a non-point category comes first', () => {
    mountLegend([
      category({
        value: 'area',
        iconName: undefined,
        isPointCategory: false,
        hasPointFeatures: false,
        hasNonPointFeatures: true,
      }),
      category(),
    ])

    expect(
      container.querySelector('.v-list-item__prepend img')?.getAttribute('src'),
    ).toBe('fews:station.svg')
  })

  it('falls back to point geometry when no location icon is configured', () => {
    mountLegend([category({ iconName: undefined })])

    expect(
      container.querySelector('.v-list-item__prepend circle'),
    ).not.toBeNull()
    expect(container.querySelector('.v-list-item__prepend img')).toBeNull()
  })

  it('retains the polygon fallback for non-point groups', () => {
    mountLegend([
      category({
        iconName: undefined,
        isPointCategory: false,
        hasPointFeatures: false,
        hasNonPointFeatures: true,
      }),
    ])

    expect(
      container.querySelector('.v-list-item__prepend polygon'),
    ).not.toBeNull()
    expect(container.querySelector('.v-list-item__prepend circle')).toBeNull()
  })

  it('disables the extra prepend gap for resource and geometry icons', () => {
    mountLegend([
      category(),
      category({ iconLabel: 'Points', iconName: undefined }),
      category({
        iconLabel: 'Areas',
        iconName: undefined,
        isPointCategory: false,
        hasPointFeatures: false,
        hasNonPointFeatures: true,
      }),
    ])

    expect(container.querySelectorAll('[prepend-gap="0"]')).toHaveLength(3)
  })

  it('still toggles the group when its location icon is clicked', async () => {
    const props = mountLegend([category()])
    container.querySelector<HTMLElement>('.v-list-item__prepend img')!.click()
    await nextTick()

    expect(props.modelValue).toEqual([])
    expect(
      container.querySelector('.v-list-item__prepend .location-icon-selected'),
    ).toBeNull()
  })

  it('groups by label first, then icon name, and reserves Other locations for neither', () => {
    mountLegend([
      category({ value: 'labeled-one' }),
      category({ value: 'labeled-two', iconName: 'other.svg' }),
      category({ value: 'unlabeled-one', iconLabel: undefined }),
      category({ value: 'unlabeled-two', iconLabel: undefined }),
      category({
        value: 'other-icon',
        iconLabel: undefined,
        iconName: 'other.svg',
      }),
      category({
        value: 'other-location',
        iconLabel: undefined,
        iconName: undefined,
      }),
      category({
        value: 'other-threshold',
        iconLabel: undefined,
        iconName: undefined,
        thresholdIconName: 'warning.svg',
      }),
    ])

    expect(
      Array.from(container.querySelectorAll('.v-list-item-title'), (label) =>
        label.textContent?.trim(),
      ),
    ).toEqual([
      'Stations',
      'station.svg',
      'other.svg',
      en.search.otherLocations,
    ])
    expect(
      Array.from(
        container.querySelectorAll('.v-list-item__append'),
        (append) => append.querySelectorAll('button').length,
      ),
    ).toEqual([2, 2, 1, 2])
  })

  it('toggles and dims only the matching icon-name or Other locations group', async () => {
    const props = mountLegend([
      category({ value: 'station-one', iconLabel: undefined }),
      category({ value: 'station-two', iconLabel: undefined }),
      category({
        value: 'other-icon',
        iconLabel: undefined,
        iconName: 'other.svg',
      }),
      category({
        value: 'other-location',
        iconLabel: undefined,
        iconName: undefined,
      }),
    ])
    const labels = container.querySelectorAll<HTMLElement>('.v-list-item-title')
    labels[0].click()
    await nextTick()

    expect(props.modelValue).toEqual(['other-icon', 'other-location'])
    expect(labels[0].parentElement?.classList.contains('text-disabled')).toBe(
      true,
    )
    expect(labels[1].parentElement?.classList.contains('text-disabled')).toBe(
      false,
    )

    labels[2].click()
    await nextTick()
    expect(props.modelValue).toEqual(['other-icon'])

    labels[0].click()
    await nextTick()
    expect(props.modelValue).toEqual([
      'other-icon',
      'station-one',
      'station-two',
    ])
  })
})
