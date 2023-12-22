import { Ref, ref, MaybeRefOrGetter, toValue, watch } from 'vue'
import {
  type CircleLayer,
  type GeoJSONSourceRaw,
  type CirclePaint,
} from 'mapbox-gl'
import { Location } from '@deltares/fews-pi-requests'
import { FeatureCollection, Geometry } from 'geojson'

const defaultGeoJsonSource: GeoJSONSourceRaw = {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: [],
  },
}

const defaultLocationPaintOptions: Ref<CirclePaint> = ref({
  'circle-radius': 5,
  'circle-color': '#dfdfdf',
  'circle-stroke-color': 'black',
  'circle-stroke-width': 1,
})

const defaultLocationsLayerOptions: Ref<CircleLayer> = ref({
  id: 'locationsLayer',
  type: 'circle',
  source: defaultGeoJsonSource,
  layout: {
    visibility: 'visible',
  },
  paint: defaultLocationPaintOptions.value,
})

export default function useLocationsLayer(
  geojson: MaybeRefOrGetter<FeatureCollection<Geometry, Location>>,
) {
  const locationsLayerOptions: Ref<CircleLayer> = ref({
    ...defaultLocationsLayerOptions.value,
  })
  watch(geojson, () => {
    const _geojson = toValue(geojson)

    if (!_geojson) {
      return {
        locationsLayerOptions,
      }
    }
    const source = {
      ...defaultGeoJsonSource,
      data: _geojson,
    }
    locationsLayerOptions.value.source = source
  })

  return {
    locationsLayerOptions,
  }
}
