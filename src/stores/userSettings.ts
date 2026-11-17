import { defineStore } from 'pinia'
import DefaultUserSettings from '@/assets/DefaultUserSettings.json'
import { LayerKind } from '@/lib/streamlines'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  deserializeUserSettings,
  serializeUserSettings,
  type UserSettingsOverride,
} from '@/lib/user-settings/deserializeUserSettings'
import { fetchWebResourcesDefaultUserSettings } from '@/services/useDefaultUserSettings'

export { deserializeUserSettings } from '@/lib/user-settings/deserializeUserSettings'
export type { UserSettingsOverride } from '@/lib/user-settings/deserializeUserSettings'
import type { ColorContrast } from '@deltares/fews-web-oc-charts'
import type {
  ChartEngine,
  ChartWheelMode,
} from '@/lib/charts/types/TimeSeriesChartProps'
import { ModifierKey } from '@deltares/fews-web-oc-charts'

export interface UserSettingsWithIcon {
  value: string
  title: string
  /** Whether the title is set in the FEWS config, so it is not translated. */
  configuredTitle?: boolean
  disabled?: boolean
  icon?: string
  /** Short text shown instead of an icon, e.g. a language code. */
  abbreviation?: string
}

interface UserSettingsItemBase {
  id: string
  label: string
  disabled?: boolean
  favorite: boolean
  group: string
}

export interface UserSettingsItemBoolean extends UserSettingsItemBase {
  type: 'boolean'
  value: boolean
}

export interface UserSettingsItemOneOf extends UserSettingsItemBase {
  type: 'oneOfMultiple'
  value: string
  initialStorageValue?: string
  items: UserSettingsWithIcon[]
}

export type UserSettingsItem = UserSettingsItemBoolean | UserSettingsItemOneOf

export interface UserSettingsGroup {
  id: string
  title: string
  icon: string
}

export interface UserSettingsState {
  items: UserSettingsItem[]
  groups: UserSettingsGroup[]
  convertDatum: boolean
  useDisplayUnits: boolean
  preferredLayerKind: LayerKind | null
  chartEngine: ChartEngine
}

const defaultUserSettings = DefaultUserSettings as UserSettingsItem[]
const parameterGroupKey = 'units.parameterGroup.'
const STORAGE_KEY = 'weboc-user-settings-v1.0.0'

// Defaults with the FEWS config applied; only differences are persisted.
let baselineItems = deserializeUserSettings('[]', defaultUserSettings)

const defaultGroups: UserSettingsGroup[] = [
  { id: 'Units', title: 'Units', icon: 'mdi-ruler' },
  { id: 'Datum', title: 'Datum', icon: 'mdi-arrow-expand-vertical' },
  { id: 'UI', title: 'UI', icon: 'mdi-palette' },
  { id: 'Map', title: 'Map', icon: 'mdi-map' },
  { id: 'Charts', title: 'Charts', icon: 'mdi-chart-line' },
]

function toModifierKey(value: unknown): ModifierKey {
  switch (value) {
    case ModifierKey.None:
      return ModifierKey.None
    case ModifierKey.Ctrl:
      return ModifierKey.Ctrl
    case ModifierKey.Shift:
      return ModifierKey.Shift
    default:
      return ModifierKey.Shift
  }
}

export const useUserSettingsStore = defineStore(
  'userSettings',
  () => {
    const groups = ref<UserSettingsGroup[]>(defaultGroups)
    // Copies, so that runtime changes do not modify the built-in defaults.
    const items = ref<UserSettingsItem[]>(
      defaultUserSettings.map((item) => ({ ...item })),
    )
    const convertDatum = ref(false)
    const useDisplayUnits = ref(true)
    const preferredLayerKind = ref<LayerKind | null>(null)
    const webResourcesOverrides = ref<UserSettingsOverride[]>([])
    // Option lists updated at runtime (e.g. base maps), by setting id.
    const runtimeOptions = new Map<string, UserSettingsWithIcon[]>()

    const route = useRoute()
    const chartEngine = computed<ChartEngine>(() =>
      get('charts.engine')?.value === 'v5' ? 'v5' : 'v4',
    )
    const chartColorContrast = computed<ColorContrast>(() =>
      get('charts.colorContrast')?.value === 'none' ? 'none' : 'auto',
    )

    // Settings disabled in the FEWS config are hidden from the user.
    const visibleItems = computed(() =>
      items.value.filter((item) => !item.disabled),
    )

    const listFavorite = computed(() =>
      visibleItems.value.filter((item) => item.favorite),
    )
    const scrollZoomMode = computed<ChartWheelMode>(() => {
      const item = items.value.find(
        (item) => item.id === 'charts.scrollZoomMode',
      )
      switch (item?.value) {
        case 'x':
          return 'x'
        case 'y':
          return 'y'
        case 'xy':
          return 'xy'
        case 'off':
          return 'none'
        default:
          return 'x'
      }
    })
    const panModifierKey = computed<ModifierKey>(() =>
      toModifierKey(get('charts.panModifierKey')?.value),
    )
    const scrollZoomModifierKey = computed<ModifierKey>(() =>
      toModifierKey(get('charts.scrollZoomModifierKey')?.value),
    )

    function listByGroup(group: string) {
      return visibleItems.value.filter((item) => item.group === group)
    }

    function get(id: string) {
      if (route.query[id]) {
        const item = items.value.find((item) => item.id === id)
        if (item && !item.disabled) {
          if (item.type === 'boolean') {
            return { ...item, value: route.query[id] === 'true' }
          } else {
            return { ...item, value: route.query[id] }
          }
        }
      }

      return items.value.find((item) => item.id === id)
    }

    function add(item: UserSettingsItem) {
      // An explicit choice replaces a stored value that was not yet available.
      if (item.type === 'oneOfMultiple') delete item.initialStorageValue
      const index = items.value.findIndex((i) => i.id === item.id)
      if (index === -1) {
        items.value.push(item)
      } else {
        items.value[index] = item
      }
      switch (item.id) {
        case 'units.displayUnits':
          changeUseDisplayUnits(item.value as string)
          break
        case 'datum.verticalDatum':
          convertDatum.value = item.value as boolean
          break
        default:
          break
      }
    }

    function updateSettingItems(id: string, newItems: UserSettingsWithIcon[]) {
      runtimeOptions.set(id, newItems)
      // Not get(id): with a route query that returns a copy.
      const current = items.value.find((item) => item.id === id)
      if (current?.type !== 'oneOfMultiple') return

      current.items = newItems
      if (
        current.initialStorageValue &&
        current.items.some((item) => item.value === current.initialStorageValue)
      ) {
        current.value = current.initialStorageValue
        delete current.initialStorageValue
      }
    }

    function changeUseDisplayUnits(payload: string) {
      const unitSettings: UserSettingsItemOneOf[] = []
      for (const item of items.value) {
        if (
          item.id.startsWith(parameterGroupKey) &&
          item.type === 'oneOfMultiple'
        ) {
          unitSettings.push(item)
        }
      }
      useDisplayUnits.value = payload === 'display'
      if (payload !== 'custom') {
        const i = payload === 'system' ? 0 : 1
        for (const s of unitSettings) {
          const newValue = s.items ? s.items[i].value : ''
          s.value = newValue
          add(s)
        }
      }
    }

    // The built-in defaults with the option lists that were updated at
    // runtime, so these survive rebuilding the settings.
    function defaultsWithRuntimeOptions(): UserSettingsItem[] {
      return defaultUserSettings.map((item) => {
        const options = runtimeOptions.get(item.id)
        return item.type === 'oneOfMultiple' && options !== undefined
          ? { ...item, items: options }
          : item
      })
    }

    async function initializeWithWebResources(): Promise<void> {
      const overrides = await fetchWebResourcesDefaultUserSettings()
      webResourcesOverrides.value = overrides

      const defaults = defaultsWithRuntimeOptions()
      baselineItems = deserializeUserSettings('[]', defaults, overrides)
      const rawData = globalThis.localStorage.getItem(STORAGE_KEY) ?? '{}'
      items.value = deserializeUserSettings(rawData, defaults, overrides)
      applySpecialActions()
    }

    function restoreDefaults(): void {
      const restored = deserializeUserSettings(
        '[]',
        defaultsWithRuntimeOptions(),
        webResourcesOverrides.value,
      )
      // Also drop stored choices for settings that are currently disabled.
      globalThis.localStorage.removeItem(STORAGE_KEY)
      items.value = restored
      applySpecialActions()
    }

    function applySpecialActions(): void {
      const specialActionIds = ['units.displayUnits', 'datum.verticalDatum']
      for (const id of specialActionIds) {
        const item = items.value.find((i) => i.id === id)
        if (item) add(item)
      }
    }

    return {
      groups,
      items,
      convertDatum,
      useDisplayUnits,
      preferredLayerKind,
      webResourcesOverrides,
      chartEngine,
      chartColorContrast,
      listByGroup,
      listFavorite,
      get,
      scrollZoomMode,
      panModifierKey,
      scrollZoomModifierKey,
      add,
      updateSettingItems,
      initializeWithWebResources,
      restoreDefaults,
    }
  },
  {
    persist: [
      {
        key: STORAGE_KEY,
        storage: window.localStorage,
        pick: ['items'],
        afterHydrate: (context) => {
          const specialActionItems = [
            'units.displayUnits',
            'datum.verticalDatum',
          ]
          specialActionItems.forEach((id) => {
            const item = context.store.items.find(
              (item: UserSettingsItem) => item.id === id,
            )
            if (item) {
              context.store.add(item)
            }
          })
        },
        serializer: {
          serialize: (state) =>
            serializeUserSettings(
              (state as Pick<UserSettingsState, 'items'>).items,
              baselineItems,
              globalThis.localStorage.getItem(STORAGE_KEY),
            ),

          deserialize: (data) => ({
            items: deserializeUserSettings(data, defaultUserSettings),
          }),
        },
      },
    ],
  },
)
