import { mapSymbol } from '@indoorequal/vue-maplibre-gl'
import { inject } from 'vue'

export function useMap() {
  const map = inject(mapSymbol)?.value
  return {
    map,
  }
}
