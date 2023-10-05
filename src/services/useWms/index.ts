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
import { LngLatBounds } from 'mapbox-gl'
import { GetLegendGraphicResponse } from '@deltares/fews-wms-requests/src/response/getLegendGraphicResponse.ts'

export interface UseWmsReturn {
  legendGraphic: Ref<GetLegendGraphicResponse | undefined>
  times: Ref<Date[] | undefined>
}

export function useWmsLayer(
  baseUrl: string,
  layerName: MaybeRefOrGetter<string>,
): UseWmsReturn {
  const legendGraphic = ref<GetLegendGraphicResponse>()
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl)
  const times = ref<Date[]>()

  async function loadTimes(): Promise<void> {
    const _layers = toValue(layerName)
    try {
      const capabilities = await wmsProvider.getCapabilities({
        layers: _layers,
        importFromExternalDataSource: false,
        onlyHeaders: false,
        forecastCount: 1,
      })
      let valueDates: Date[]
      let selectedLayer: Layer
      if (capabilities.layers.length > 0) {
        selectedLayer = capabilities.layers[0]
        capabilities.layers.forEach((l) => {
          if (l.name === _layers) {
            selectedLayer = l
          }
        })
        if (selectedLayer.times) {
          const dates = selectedLayer.times.map((time) => {
            return new Date(time)
          })
          let firstValueDate = dates[0]
          let lastValueDate = dates[dates.length - 1]
          if (selectedLayer.firstValueTime) {
            firstValueDate = new Date(selectedLayer.firstValueTime)
          }
          if (selectedLayer.lastValueTime) {
            lastValueDate = new Date(selectedLayer.lastValueTime)
          }
          valueDates = dates.filter(
            (d) => d >= firstValueDate && d <= lastValueDate,
          )
        } else {
          valueDates = []
        }
        times.value = valueDates
      } else {
        times.value = []
      }
    } catch (error) {
      console.log(error)
    }
  }

  async function loadCapabilities(): Promise<void> {
    const _layers = toValue(layerName)
    if (_layers === '') return
    try {
      legendGraphic.value = await wmsProvider.getLegendGraphic({
        layers: _layers,
      })
    } catch (error) {
      console.log(error)
    }
  }

  watchEffect(() => {
    loadCapabilities()
    loadTimes()
  })
  return { legendGraphic, times }
}

export function useWmsCapilities(
  baseUrl: string,
): Ref<GetCapabilitiesResponse | undefined> {
  const capabilities = ref<GetCapabilitiesResponse>()
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl)

  async function loadCapabilities(): Promise<void> {
    try {
      capabilities.value = await wmsProvider.getCapabilities({})
    } catch (error) {
      console.log(error)
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
