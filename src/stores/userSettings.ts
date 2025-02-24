import { defineStore } from 'pinia'
import DefaultUserSettings from '@/assets/DefaultUserSettings.json'
import { LayerKind } from '@/lib/streamlines'

export const UserSettingsType = {
  oneOfMultiple: 'oneOfMultiple',
  boolean: 'boolean',
} as const

export type UserSettingsType =
  (typeof UserSettingsType)[keyof typeof UserSettingsType]

export interface UserSettingsWithIcon {
  value: string
  title: string
  disabled?: boolean
  icon?: string
}

export interface UserSettingsItemBoolean {
  id: string
  type: 'boolean'
  label: string
  value: boolean
  disabled?: boolean
  favorite?: boolean
  group: string
}

export interface UserSettingsItemOneOf {
  id: string
  type: 'oneOfMultiple'
  label: string
  value: string
  initialStorageValue?: string
  disabled?: boolean
  items?: UserSettingsWithIcon[]
  favorite?: boolean
  group: string
}

export type UserSettingsItem = UserSettingsItemBoolean | UserSettingsItemOneOf

export interface UserSettingsState {
  items: UserSettingsItem[]
  groups: string[]
  convertDatum: boolean
  useDisplayUnits: boolean
  preferredLayerKind: LayerKind | null
}

const defaultUserSettings = DefaultUserSettings as UserSettingsItem[]
const parameterGroupKey = 'units.parameterGroup.'

export const useUserSettingsStore = defineStore('userSettings', {
  state: (): UserSettingsState => ({
    groups: ['Units', 'Datum', 'UI', 'Map'],
    items: defaultUserSettings,
    convertDatum: false,
    useDisplayUnits: true,
    preferredLayerKind: null,
  }),
  getters: {
    listGroups: (state) => {
      return state.groups
    },
    listByGroup: (state) => (group: string) => {
      return state.items.filter((item) => item.group === group)
    },
    listFavorite: (state) => {
      return state.items.filter((item) => item.favorite)
    },
    get: (state) => (id: string) => {
      return state.items.find((item) => item.id === id)
    },
  },
  actions: {
    add(item: UserSettingsItem) {
      // Logic to add or update the item
      const index = this.items.findIndex((i) => i.id === item.id)
      if (index === -1) {
        this.items.push(item)
      } else {
        this.items[index] = item
      }
      switch (item.id) {
        case 'units.displayUnits':
          this.changeUseDisplayUnits(item.value as string)
          break
        case 'datum.verticalDatum':
          this.convertDatum = item.value as boolean
          break
        default:
          break
      }
    },
    updateSettingItems(id: string, items: UserSettingsWithIcon[]) {
      const current = this.get(id)
      if (current?.type !== 'oneOfMultiple') return

      current.items = items
      if (
        current.initialStorageValue &&
        current.items.find((item) => item.value === current.initialStorageValue)
      ) {
        current.value = current.initialStorageValue
      }
    },
    changeUseDisplayUnits(payload: string) {
      const unitSettings: UserSettingsItemOneOf[] = []
      for (const item of this.items) {
        if (
          item.id.startsWith(parameterGroupKey) &&
          item.type === 'oneOfMultiple'
        ) {
          unitSettings.push(item)
        }
      }
      this.useDisplayUnits = payload === 'display'
      if (payload !== 'custom') {
        const i = payload === 'system' ? 0 : 1
        for (const s of unitSettings) {
          const newValue = s.items ? s.items[i].value : ''
          s.value = newValue
          this.add(s)
        }
      }
    },
  },
  persist: [
    {
      key: 'weboc-user-settings-v1.0.0',
      storage: window.localStorage,
      pick: ['items'],
      afterHydrate: (context) => {
        const specialActionItems = ['units.displayUnits', 'datum.verticalDatum']
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
        deserialize: (data) => {
          const parsedState = JSON.parse(data)
          const newState = [...defaultUserSettings]
          for (const prop of newState) {
            const storedProp = parsedState.items.find(
              (item: UserSettingsItem) => item.id === prop.id,
            )
            if (storedProp) {
              if (
                prop.type === 'oneOfMultiple' &&
                !prop.items
                  ?.map((i: UserSettingsWithIcon) => i.value)
                  .includes(storedProp.value)
              ) {
                const index = storedProp.items?.findIndex(
                  (i: UserSettingsWithIcon) => i.value === storedProp.value,
                )
                const newValue = prop.items?.[index ?? -1]?.value
                if (newValue) prop.value = newValue
                prop.initialStorageValue = storedProp.value
              } else {
                prop.value = storedProp.value
              }
              prop.favorite = storedProp.favorite
            }
          }
          return newState
        },
      },
    },
  ],
})
