import { h } from 'vue'
import { VList } from 'vuetify/components'
import LocationsLegend from './LocationsLegend.vue'
import { configManager } from '@/services/application-config'

export const MixedIcons = () => {
  configManager.update({
    VITE_FEWS_WEBSERVICES_URL: `${window.location.origin}/test-fews`,
  })
  const items = [
    {
      category: 'station',
      value: 'station',
      iconLabel: 'Stations',
      iconName: 'station.svg',
      isPointCategory: true,
      hasPointFeatures: true,
      hasNonPointFeatures: false,
    },
    {
      category: 'point',
      value: 'point',
      iconLabel: 'Points',
      isPointCategory: true,
      hasPointFeatures: true,
      hasNonPointFeatures: false,
    },
    {
      category: 'area',
      value: 'area',
      iconLabel: 'Areas',
      isPointCategory: false,
      hasPointFeatures: false,
      hasNonPointFeatures: true,
    },
  ]

  return h(VList, { density: 'compact', width: 280 }, () =>
    h(LocationsLegend, {
      items,
      modelValue: items.map((item) => item.value),
      isDark: false,
    }),
  )
}
