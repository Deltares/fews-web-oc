import { RootState } from '../../types'
import { UserSettingsItem, UserSettingsState } from './types'
import { state as emptyState } from './index'
import DefaultUserSettings from '@/assets/DefaultUserSettings.json'

export function serializeState(state: UserSettingsState): Partial<UserSettingsItem>[] {
    const serializedSettings: Partial<UserSettingsItem>[] = []
    for (const seriesId of state.allIds) {
      const rawState = state.byId[seriesId]
      const cleanState = {
        id: rawState.id,
        value: rawState.value,
        favorite: rawState.favorite
      }
      serializedSettings.push(cleanState)
    }
    return serializedSettings
}

export function deserializeState(json: string): Partial<RootState> {
    const defaultSettings = DefaultUserSettings as UserSettingsItem[]
    const defaultState = emptyState
    defaultState.allIds = defaultSettings.map( item => item.id)
    const byId: Record<string,UserSettingsItem>= {}
    for ( const item of defaultSettings) {
      byId[item.id] = item
    }
    defaultState.byId = byId
    const state: Partial<RootState> = { userSettings: defaultState }
    if ( json !== null ) {
        const deserializedSettings = JSON.parse(json)
        for (const settings of deserializedSettings) {
            if (state.userSettings !== undefined) {
              const id = settings.id
              if (state.userSettings.allIds.includes(id)) {
                const s = state.userSettings.byId[id]
                const defaultValue = s.value
                s.favorite = settings.favorite
                if ( state.userSettings.byId[id].type === 'oneOfMultiple' ) {
                  const items = state.userSettings.byId[id].items
                  const restoredValue = items?.map(i => i.value).includes(settings.value) ? settings.value : defaultValue
                  settings.value = restoredValue
                }
                const newSettings = {...settings, ...s}
                state.userSettings.byId[settings.id] = newSettings
              } else {
                console.warn('Unkown user setting', settings)
              }
            }
        }
    }
    return state
}

export function rehydrateState(state: UserSettingsState): void {
    for (const id of state.allIds) {
        const settings = state.byId[id]
        state.byId[id] = settings
    }
    state.convertDatum = state.byId['datum.verticalDatum'].value as boolean
    state.useDisplayUnits = state.byId['units.displayUnits'].value === 'display'
}
