import { defineStore } from 'pinia'
import type {
  TimeSeriesFlag,
  TimeSeriesFlagSource,
} from '@deltares/fews-pi-requests'
import {
  loadTimeSeriesFlagSources,
  loadTimeSeriesFlags,
} from '@/lib/fews-properties/fewsProperties.js'
import { uniq } from 'lodash-es'
interface FewsPropertiesState {
  flags?: TimeSeriesFlag[]
  flagSources?: TimeSeriesFlagSource[]
  flagQualities?: TimeSeriesFlag['quality'][]
}

const useFewsPropertiesStore = defineStore('fewsProperties', {
  state: (): FewsPropertiesState => ({
    flags: [],
    flagSources: [],
    flagQualities: [],
  }),

  actions: {
    async loadFlags() {
      if (this.flags !== undefined && this.flags.length > 0) return
      const flags = await loadTimeSeriesFlags()
      this.flags = flags
    },

    async loadFlagSources() {
      if (this.flagSources !== undefined && this.flagSources.length > 0) return
      const flagSources = await loadTimeSeriesFlagSources()
      this.flagSources = flagSources
    },

    setFlagQualities() {
      const qualities: TimeSeriesFlag['quality'][] = [null]
      if (this.flags !== undefined) {
        for (const flag of this.flags) {
          qualities.push(flag.quality)
        }
      }
      this.flagQualities = uniq(qualities)
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
