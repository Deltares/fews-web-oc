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
  value: string | boolean
  disabled?: boolean
  icon?: string
}

export interface UserSettingsItem {
  id: string
  type: UserSettingsType
  label: string
  value: string | boolean
  disabled?: boolean
  items?: UserSettingsWithIcon[]
  favorite?: boolean
  group: string
}

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
      console.log('getter listGroup', state.groups)
      return state.groups
    },
    listByGroup: (state) => (group: string) => {
      console.log('getter listByGroup', group, state.items)
      return state.items.filter((item) => item.group === group)
    },
    listFavorite: (state) => {
      return state.items.filter((item) => item.favorite)
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
    },
    changeUseDisplayUnits(payload: string) {
      const unitSettings = []
      for (const item of this.items) {
        if (item.id.startsWith(parameterGroupKey)) {
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
