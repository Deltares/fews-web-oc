import {
  PiWebserviceProvider,
  type TimeSeriesGridMaxValuesFilter,
} from '@deltares/fews-pi-requests'
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
import { styleToId } from '@/lib/legend'
import { TimeSeriesData } from '@/lib/timeseries/types/SeriesData'
import { convertFewsPiDateTimeToJsDate } from '@/lib/date'

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
  activeStyles?: MaybeRefOrGetter<Style[]>,
): Ref<GetLegendGraphicResponse | undefined> {
  const legendGraphic = ref<GetLegendGraphicResponse>()

  async function loadLegend(): Promise<void> {
    const _layers = toValue(layerName)
    const _useDisplayUnits = toValue(useDisplayUnits)
    const _colorScaleRange = toValue(colorScaleRange)
    const _style = toValue(style)
    const _activeStyles = toValue(activeStyles)

    if (_layers === '') {
      legendGraphic.value = undefined
      return
    }

    if (
      _activeStyles &&
      _style &&
      !_activeStyles.some((s) => styleToId(s) === styleToId(_style))
    ) {
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

export function useWmsMaxValuesTimeSeries(
  baseUrl: string,
  layerName: MaybeRefOrGetter<string>,
  start: MaybeRefOrGetter<Date | null>,
  end: MaybeRefOrGetter<Date | null>,
): Ref<TimeSeriesData[]> {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const timeSeries = ref<TimeSeriesData[]>([])
  watchEffect(async () => {
    const _layerName = toValue(layerName)
    const _start = toValue(start)
    const _end = toValue(end)
    if (_layerName !== '' && _start && _end) {
      const filter: TimeSeriesGridMaxValuesFilter = {
        startTime: _start.toISOString(),
        endTime: _end.toISOString(),
        layers: toValue(layerName),
      }
      const response = await piProvider.getTimeSeriesGridMaxValues(filter)
      if (response && response.timeSeries && response.timeSeries.length > 0) {
        // We will always have only one series of maximum values for a layer.
        const series = response.timeSeries[0]
        if (series.events) {
          const missingValue = series.header?.missVal ?? ''
          // If we successfully fetched, update the time series to the fetched
          // values.
          timeSeries.value = series.events.map((event) => {
            const date = convertFewsPiDateTimeToJsDate(
              { date: event.date, time: event.time },
              'Z',
            )
            const value = event.value === missingValue ? null : +event.value
            return {
              x: date,
              y: value,
              flag: event.flag,
            }
          })
          return
        }
      }
    }
    // In all other cases, reset the time series.
    timeSeries.value = []
  })

  return timeSeries
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
