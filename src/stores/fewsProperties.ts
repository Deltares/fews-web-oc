import { defineStore } from 'pinia'
import type {
  TimeSeriesFlag,
  TimeSeriesFlagSource,
} from '@deltares/fews-pi-requests'
import {
  loadTimeSeriesFlagSources,
  loadTimeSeriesFlags,
} from '@/lib/fews-properties/fewsProperties.js'

interface FewsPropertiesState {
  flags?: TimeSeriesFlag[]
  flagSources?: TimeSeriesFlagSource[]
}

const useFewsPropertiesStore = defineStore('fewsProperties', {
  state: (): FewsPropertiesState => ({
    flags: [],
    flagSources: [],
  }),

  actions: {
    async loadFlags() {
      const flags = await loadTimeSeriesFlags()
      this.flags = flags
    },

    async loadFlagSources() {
      const flagSources = await loadTimeSeriesFlagSources()
      this.flagSources = flagSources
    },
  },

  getters: {
    getFlagByFlagId: (
      state,
    ): ((flagId: string) => TimeSeriesFlag | undefined) => {
      return (flagId: string) => {
        if (state.flags === undefined) return
        const flag = state.flags.find((value) => value.flag === flagId)
        return flag
      }
    },

    getFlagName(): (flagId: string) => string | undefined {
      return (flagId: string) => {
        const flag = this.getFlagByFlagId(flagId)
        if (flag === undefined) return
        return flag.name
      }
    },

    getFlagSourceName(
      state,
    ): (flagSource: string | null | undefined) => string {
      return (flagSource: string | null | undefined) => {
        if (flagSource === undefined || state.flagSources === undefined)
          return ''
        const timeSeriesFlagSource = state.flagSources.find(
          (value) => value.id === flagSource,
        )
        return timeSeriesFlagSource !== undefined
          ? timeSeriesFlagSource.name
          : ''
      }
    },
  },
})

export { useFewsPropertiesStore }
