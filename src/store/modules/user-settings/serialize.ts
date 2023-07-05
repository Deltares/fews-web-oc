import { RootState } from '../../types'
import { UserSettingsItem, UserSettingsState } from './types'
import { state as emptyState } from './index'

export function serializeState(state: UserSettingsState): Partial<UserSettingsItem>[] {
    const serializedSettings: Partial<UserSettingsItem>[] = []
    for (const seriesId of state.allIds) {
      const rawState = state.byId[seriesId]
      const cleanState = {
        id: rawState.id,
        value: rawState.value,
        favor: rawState.favorite
      }
      serializedSettings.push(cleanState)
    }
    return serializedSettings
}

export function deserializeState(json: string): Partial<RootState> {
    const defaultSettings: UserSettingsItem[] = [
      { id: 'units.displayUnits',  type: 'oneOfMultiple',  label: 'Display Units', value: 'display', items: [
        { value: 'stored', icon: 'mdi-database'},
        { value: 'display', icon: 'mdi-monitor'},
        { value: 'custom' , icon: 'mdi-monitor-edit', disabled: true}
      ], group: 'Units'},
      { id: 'units.parameterGroup.Discharge', type: 'oneOfMultiple', label: 'Discharge', value: 'ML/d', disabled: true, items: [
        { value: 'm³/s' },
        { value: 'ML/d'}
      ], group: 'Units'},
      { id: 'units.parameterGroup.Volume', type: 'oneOfMultiple', label: 'Volume', value: 'ML',  disabled: true, items: [
        { value: 'm³' },
        { value: 'ML' }
      ], group: 'Units'},
      { id: 'datum.water-level', type: 'boolean', label: 'Absolute vertical datum', value: true , group: 'Datum'},
      { id: 'ui.theme',  type: 'oneOfMultiple',  label: 'Theme', value: 'auto', items: [
        { value: 'auto', icon: 'mdi-theme-light-dark'},
        { value: 'light', icon: 'mdi-weather-sunny'},
        { value: 'dark' , icon: 'mdi-weather-night'}
      ], group: 'UI'},
      { id: 'locale.language', type: 'oneOfMultiple', label: 'Language', value: 'en-au', items: [
        { icon: 'fi-au', value: 'en-au' },
        { icon: 'fi-nl', value: 'nl-nl' }
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
                const s = state.userSettings.byId[id]
                const defaultValue = s.value

                if ( state.userSettings.byId[id].type === 'oneOfMultiple' ) {
                  const items = state.userSettings.byId[id].items
                  const restoredValue = items?.map(i => i.value).includes(settings.value) ? settings.value : defaultValue
                  settings.value = restoredValue
                }
                state.userSettings.byId[settings.id] = {...settings, ...s}
              } else {
                console.warn('Old user setting', settings)
              }
            }
        }
    }
    return state
}

// export function rehydrateState(state: UserSettingsState): void {
//     for (const id of state.allIds) {
//         const settings = state.byId[id]
//         console.log('rehydrateState', settings)
//         state.byId[id] = settings
//     }
// }
