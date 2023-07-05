import { ActionTree } from 'vuex'
import { RootState } from '../../types'
import { UserSettingsState } from './types'

const parameterGroupKey = 'units.parameterGroup.'

export const actions: ActionTree<UserSettingsState, RootState>= {
  changeUseDisplayUnits: async (context, payload: string ) => {
    const unitSettings = []
    for ( const id of context.state.allIds) {
      if (id.startsWith(parameterGroupKey)) {
        unitSettings.push( context.state.byId[id])
      }
    }
    if (payload !== 'custom') {
      const i = payload === 'stored' ? 0 : 1
      for (const s of unitSettings) {
        const newValue = s.items ? s.items[i].value : ''
        s.value = newValue
        context.commit('add', s)
      }
    }
  },
}
