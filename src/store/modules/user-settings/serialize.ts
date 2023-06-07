import { RootState } from '../../types'
import { UserSettingsItem, UserSettingsState } from './types'
import { state as emptyState } from './index'

export function serializeState(state: UserSettingsState): UserSettingsItem[] {
    const serializedSettings: UserSettingsItem[] = []
    for (const seriesId of state.allIds) {
      serializedSettings.push(state.byId[seriesId])
    }
    return serializedSettings
}

export function deserializeState(json: string): Partial<RootState> {
    const defaultSettings: UserSettingsItem[] = [
      { id: 'units.wind-speed', type: 'oneOfMultiple', label: 'Wind speed', value: 'm/s', items: [
        { value: 'm/s' },
        { value: 'km/h'},
        { value: 'Bft' },
        { value: 'kts' }
      ], group: 'Units'},
      { id: 'units.wind-direction', type: 'oneOfMultiple', label: 'Wind direction', value: 'degree', items: [
        { value: 'degree' },
        { value: 'cardinal' }
      ], group: 'Units'},
      { id: 'ui.theme',  type: 'oneOfMultiple',  label: 'Theme', value: 'auto', items: [
        { value: 'auto', icon: 'mdi-theme-light-dark'},
        { value: 'light', icon: 'mdi-weather-sunny'},
        { value: 'dark' , icon: 'mdi-weather-night'}
      ], group: 'UI'},
      { id: 'locale.language', type: 'oneOfMultiple', label: 'Language', value: 'en-au', items: [
        { icon: 'fi-au', value: 'en-au' },
        { icon: 'fi-nl', value: 'nl' }
      ], group: 'Locale'},
    ]
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
                console.log('defaultState', id, state.userSettings.byId[id])
                const defaultValue = state.userSettings.byId[id].value
                const items = state.userSettings.byId[id].items
                const restoredValue = items.map(i => i.value).includes(settings.value) ? settings.value : defaultValue
                settings.value =restoredValue
                state.userSettings.byId[settings.id] = settings
              } else {
                console.warn('Old user setting', settings)
              }
            }
        }
    }
    return state
}

export function rehydrateState(state: UserSettingsState): void {
    for (const id of state.allIds) {
        const settings = state.byId[id]
        console.log(settings)
        state.byId[id] = settings
    }
}