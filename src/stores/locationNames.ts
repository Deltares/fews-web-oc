import { shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { Location } from '@deltares/fews-pi-requests'

export const useLocationNamesStore = defineStore('locationNames', () => {
  const locationNames = shallowRef<Map<string, string>>(new Map())

  function byId(locationId: string) {
    return locationNames.value.get(locationId)
  }

  function addLocationNames(locations: Location[]) {
    locations.forEach((location) => {
      locationNames.value.set(
        location.locationId,
        location.locationName ?? location.shortName ?? location.locationId,
      )
    })
  }

  return {
    byId,
    addLocationNames,
  }
})
