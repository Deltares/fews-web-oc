import { WheelMode } from '@deltares/fews-web-oc-charts'
import { defineStore } from 'pinia'
import DefaultUserSettings from '@/assets/DefaultUserSettings.json'
import { LayerKind } from '@/lib/streamlines'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  deserializeUserSettings,
  type UserSettingsOverride,
} from '@/lib/user-settings/deserializeUserSettings'
import { fetchWebResourcesDefaultUserSettings } from '@/services/useDefaultUserSettings'

export { deserializeUserSettings } from '@/lib/user-settings/deserializeUserSettings'
export type { UserSettingsOverride } from '@/lib/user-settings/deserializeUserSettings'

export interface UserSettingsWithIcon {
  value: string
  title: string
  disabled?: boolean
  icon?: string
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
}

const defaultUserSettings = DefaultUserSettings as UserSettingsItem[]
const parameterGroupKey = 'units.parameterGroup.'
const STORAGE_KEY = 'weboc-user-settings-v1.0.0'

const defaultGroups: UserSettingsGroup[] = [
  { id: 'Units', title: 'Units', icon: 'mdi-ruler' },
  { id: 'Datum', title: 'Datum', icon: 'mdi-arrow-expand-vertical' },
  { id: 'UI', title: 'UI', icon: 'mdi-palette' },
  { id: 'Map', title: 'Map', icon: 'mdi-map' },
  { id: 'Charts', title: 'Charts', icon: 'mdi-chart-line' },
]

export const useUserSettingsStore = defineStore(
  'userSettings',
  () => {
    const groups = ref<UserSettingsGroup[]>(defaultGroups)
    const items = ref<UserSettingsItem[]>([...defaultUserSettings])
    const convertDatum = ref(false)
    const useDisplayUnits = ref(true)
    const preferredLayerKind = ref<LayerKind | null>(null)
    const webResourcesOverrides = ref<UserSettingsOverride[]>([])

    const route = useRoute()

    const listFavorite = computed(() =>
      items.value.filter((item) => item.favorite),
    )
    const scrollZoomMode = computed<WheelMode>(() => {
      const item = items.value.find(
        (item) => item.id === 'charts.scrollZoomMode',
      )
      switch (item?.value) {
        case 'x':
          return WheelMode.X
        case 'y':
          return WheelMode.Y
        case 'xy':
          return WheelMode.XY
        case 'off':
          return WheelMode.NONE
        default:
          return WheelMode.X
      }
    })

    function listByGroup(group: string) {
      return items.value.filter((item) => item.group === group)
    }

    function get(id: string) {
      if (route.query[id]) {
        const item = items.value.find((item) => item.id === id)
        if (item) {
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
      const current = get(id)
      if (current?.type !== 'oneOfMultiple') return

      current.items = newItems
      if (
        current.initialStorageValue &&
        current.items.find((item) => item.value === current.initialStorageValue)
      ) {
        current.value = current.initialStorageValue
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

    async function initializeWithWebResources(): Promise<void> {
      const overrides = await fetchWebResourcesDefaultUserSettings()
      webResourcesOverrides.value = overrides

      const rawData = globalThis.localStorage.getItem(STORAGE_KEY) ?? '{}'
      items.value = deserializeUserSettings(
        rawData,
        defaultUserSettings,
        overrides,
      )

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
      listByGroup,
      listFavorite,
      get,
      scrollZoomMode,
      add,
      updateSettingItems,
      initializeWithWebResources,
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
          serialize: (context) => {
            return JSON.stringify(context)
          },

          deserialize: (data) =>
            deserializeUserSettings(data, defaultUserSettings),
        },
      },
    ],
  },
)
