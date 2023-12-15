// src/store/userSettings.ts
import { defineStore } from 'pinia'
import DefaultUserSettings from '@/assets/DefaultUserSettings.json'

export const UserSettingsType = {
  oneOfMultiple: 'oneOfMultiple',
  boolean: 'boolean',
} as const

export type UserSettingsType =
  (typeof UserSettingsType)[keyof typeof UserSettingsType]

export interface UserSettingsWithIcon {
  value: string
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
}

const defaultUserSettings = DefaultUserSettings as UserSettingsItem[]
const parameterGroupKey = 'units.parameterGroup.'

export const useUserSettingsStore = defineStore({
  id: 'userSettings',
  state: (): UserSettingsState => ({
    groups: ['Units', 'Datum', 'UI'],
    items: defaultUserSettings,
    convertDatum: false,
    useDisplayUnits: true,
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
        const i = payload === 'stored' ? 0 : 1
        for (const s of unitSettings) {
          const newValue = s.items ? s.items[i].value : ''
          s.value = newValue
          this.add(s)
        }
      }
    },
  },
  persist: true,
})
