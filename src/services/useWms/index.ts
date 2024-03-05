import {
  BoundingBox,
  GetCapabilitiesResponse,
  Layer,
  WMSProvider,
} from '@deltares/fews-wms-requests'
import { MaybeRefOrGetter, ref, Ref, toValue, watchEffect } from 'vue'
// @ts-ignore
import { toWgs84 } from '@turf/projection'
// @ts-ignore
import { point } from '@turf/helpers'
import { LngLatBounds } from 'maplibre-gl'
import { GetLegendGraphicResponse } from '@deltares/fews-wms-requests/src/response/getLegendGraphicResponse.ts'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { Style } from '@deltares/fews-wms-requests'

export interface UseWmsReturn {
  layerCapabilities: Ref<Layer | undefined>
  times: Ref<Date[] | undefined>
}
export function useWmsLayerCapabilities(
  baseUrl: string,
  layerName: MaybeRefOrGetter<string>,
): UseWmsReturn {
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const times = ref<Date[]>()
  const layerCapabilities = ref<Layer>()

  async function loadLayer(): Promise<void> {
    const _layers = toValue(layerName)
    if (_layers === '') {
      layerCapabilities.value = undefined
    } else {
      try {
        const capabilities = await wmsProvider.getCapabilities({
          layers: _layers,
          importFromExternalDataSource: false,
          onlyHeaders: false,
          forecastCount: 1,
        })
        if (capabilities.layers.length > 0) {
          layerCapabilities.value =
            capabilities.layers.find((l) => l.name === _layers) ??
            capabilities.layers[0]
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  function loadTimes(): void {
    let valueDates: Date[] = []
    if (layerCapabilities.value) {
      if (layerCapabilities.value.times) {
        const dates = layerCapabilities.value.times.map((time) => {
          return new Date(time)
        })
        let firstValueDate = dates[0]
        let lastValueDate = dates[dates.length - 1]
        if (layerCapabilities.value.firstValueTime) {
          firstValueDate = new Date(layerCapabilities.value.firstValueTime)
        }
        if (layerCapabilities.value.lastValueTime) {
          lastValueDate = new Date(layerCapabilities.value.lastValueTime)
        }
        valueDates = dates.filter(
          (d) => d >= firstValueDate && d <= lastValueDate,
        )
      }
    }
    times.value = valueDates
  }

  watchEffect(() => {
    loadLayer().then(() => {
      loadTimes()
    })
  })
  return { layerCapabilities, times }
}

export function useWmsLegend(
  baseUrl: string,
  layerName: MaybeRefOrGetter<string>,
  useDisplayUnits: MaybeRefOrGetter<boolean>,
  colorScaleRange?: MaybeRefOrGetter<string | undefined>,
  style?: MaybeRefOrGetter<Style>,
): Ref<GetLegendGraphicResponse | undefined> {
  const legendGraphic = ref<GetLegendGraphicResponse>()

  async function loadLegend(): Promise<void> {
    const _layers = toValue(layerName)
    const _useDisplayUnits = toValue(useDisplayUnits)
    const _colorScaleRange = toValue(colorScaleRange)
    const _style = toValue(style)

    if (_layers === '') {
      legendGraphic.value = undefined
      return
    }

    legendGraphic.value = await fetchWmsLegend(
      baseUrl,
      _layers,
      _useDisplayUnits,
      _colorScaleRange,
      _style,
    )
  }

  watchEffect(() => {
    loadLegend()
  })
  return legendGraphic
}

export function fetchWmsLegend(
  baseUrl: string,
  layerName: string,
  useDisplayUnits: boolean,
  colorScaleRange?: string,
  style?: Style,
): Promise<GetLegendGraphicResponse> {
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  try {
    return wmsProvider.getLegendGraphic({
      layers: layerName,
      colorscalerange: colorScaleRange,
      useDisplayUnits: useDisplayUnits,
      style: style?.name,
    })
  } catch (error) {
    console.error(error)
    return Promise.reject(error)
  }
}

export function useWmsCapilities(
  baseUrl: string,
): Ref<GetCapabilitiesResponse | undefined> {
  const capabilities = ref<GetCapabilitiesResponse>()
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  async function loadCapabilities(): Promise<void> {
    try {
      capabilities.value = await wmsProvider.getCapabilities({})
    } catch (error) {
      console.error(error)
    }
  }

  loadCapabilities()
  return capabilities
}

export function convertBoundingBoxToLngLatBounds(
  boundingBox: BoundingBox,
): LngLatBounds {
  const crs = boundingBox.crs

  const minx = parseFloat(boundingBox.minx)
  const miny = parseFloat(boundingBox.miny)
  const maxx = parseFloat(boundingBox.maxx)
  const maxy = parseFloat(boundingBox.maxy)

  const p1 = toWgs84(point([minx, miny], { crs: crs }))
  const p2 = toWgs84(point([maxx, maxy], { crs: crs }))
  return new LngLatBounds(
    [p1.geometry.coordinates[0], p1.geometry.coordinates[1]], // sw
    [p2.geometry.coordinates[0], p2.geometry.coordinates[1]], // ne
  )
}
