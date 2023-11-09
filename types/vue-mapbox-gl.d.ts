import { Ref } from 'vue'

declare module '@studiometa/vue-mapbox-gl' {
  import { AllGeoJSON, Position } from '@turf/helpers'
  export const MapboxMap: any
  export const MapboxMarker: any
  export const MapboxCluster: any
  export const MapboxGeocoder: any
  export const MapboxGeolocateControl: any
  export const MapboxImage: any
  export const MapboxImages: any
  export const MapboxLayer: any
  export const MapboxNavigationControl: any
  export const MapboxPopup: any
  export const MapboxSource: any
  export const StoreLocator: any

  export const useMap: () => { map: Ref<Map> }
  export const useControl: (control: any, options: any) => { control: Ref<any> }

  declare module 'turf/projection' {
    export declare function toMercator<G = AllGeoJSON | Position>(
      geojson: G,
      options?: {
        mutate?: boolean
      },
    ): G
  }
}
