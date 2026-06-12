import {
  PiWebserviceProvider,
  type TimeSeriesGridMaxValuesFilter,
} from '@deltares/fews-pi-requests'
import {
  BoundingBox,
  GetCapabilitiesFilter,
  GetCapabilitiesResponse,
  Layer,
  WMSProvider,
} from '@deltares/fews-wms-requests'
import {
  inject,
  InjectionKey,
  MaybeRefOrGetter,
  onUnmounted,
  provide,
  ref,
  Ref,
  toValue,
  watchEffect,
} from 'vue'
// @ts-ignore
import { toWgs84 } from '@turf/projection'
// @ts-ignore
import { point } from '@turf/helpers'
import { LngLatBounds } from 'maplibre-gl'
import type {
  GetLegendGraphicResponse,
  Style,
} from '@deltares/fews-wms-requests'
import { createTransformRequestFn } from '@/lib/requests/transformRequest'
import { styleToId } from '@/lib/legend'
import { TimeSeriesData } from '@/lib/timeseries/types/SeriesData'
import { convertFewsPiDateTimeToJsDate } from '@/lib/date'
import { getTimesFromCapabilities } from '@/lib/capabilities'

const WMS_LAYER_CAPABILITIES_KEY: InjectionKey<UseWmsReturn> = Symbol(
  'wmsLayerCapabilities',
)

export interface UseWmsReturn {
  layerCapabilities: Ref<Layer | undefined>
  times: Ref<Date[] | undefined>
  fetchLayerCapabilities: () => Promise<void>
}

export interface UseWmsLayerCapabilitiesOptions {
  baseUrl: string
  layerName: MaybeRefOrGetter<string>
  taskRunId: MaybeRefOrGetter<string | undefined>
  refreshInterval?: MaybeRefOrGetter<number | undefined>
  enabled?: MaybeRefOrGetter<boolean | undefined>
}

type LayerFetchRefreshMetadata = {
  autoRefreshInterval?: unknown
  autorefreshinterval?: unknown
}

type LayerRefreshMetadata = Layer & {
  autoRefreshInterval?: unknown
  autorefreshinterval?: unknown
  fetch?: LayerFetchRefreshMetadata
}

function toPositiveMs(value: unknown): number | undefined {
  if (typeof value !== 'number') {
    return
  }
  if (!Number.isFinite(value) || value <= 0) {
    return
  }
  return value
}

function hasLayerRefreshMetadata(layer: Layer): layer is LayerRefreshMetadata {
  return (
    'autoRefreshInterval' in layer ||
    'autorefreshinterval' in layer ||
    'fetch' in layer
  )
}

export function useWmsLayerCapabilities(
  options: UseWmsLayerCapabilitiesOptions,
): UseWmsReturn {
  // If a parent component has already provided WMS layer capabilities, use those instead of fetching them again.
  const parent = inject(WMS_LAYER_CAPABILITIES_KEY, undefined)
  if (parent) {
    return parent
  }

  const { baseUrl, layerName, taskRunId, refreshInterval, enabled } = options
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl, {
    transformRequestFn: createTransformRequestFn(),
  })
  const times = ref<Date[]>()
  const layerCapabilities = ref<Layer>()
  let interval: ReturnType<typeof setInterval> | undefined

  function getCapabilitiesRefreshInterval(): number | undefined {
    const capabilities = layerCapabilities.value
    if (!capabilities || !hasLayerRefreshMetadata(capabilities)) {
      return
    }

    return (
      toPositiveMs(capabilities.autoRefreshInterval) ??
      toPositiveMs(capabilities.autorefreshinterval) ??
      toPositiveMs(capabilities.fetch?.autoRefreshInterval) ??
      toPositiveMs(capabilities.fetch?.autorefreshinterval)
    )
  }

  async function fetchLayerCapabilities() {
    const _layerName = toValue(layerName)

    if (_layerName === '') {
      layerCapabilities.value = undefined
      return
    }

    const filter: GetCapabilitiesFilter = {
      layers: _layerName,
      importFromExternalDataSource: false,
      onlyHeaders: false,
      forecastCount: 1,
    }

    const _taskRunId = toValue(taskRunId)
    if (_taskRunId) {
      // @ts-expect-error taskRunId is not yet in the type definition
      filter.taskRunId = _taskRunId
    }

    try {
      const capabilities = await wmsProvider.getCapabilities(filter)

      if (!capabilities.layers) {
        layerCapabilities.value = undefined
        return
      }

      layerCapabilities.value =
        capabilities.layers.find((l) => l.name === _layerName) ??
        capabilities.layers[0]
    } catch (error) {
      console.error(error)
    }

    times.value = getTimesFromCapabilities(layerCapabilities.value)
  }

  watchEffect(() => {
    void fetchLayerCapabilities()
  })

  watchEffect((onCleanup) => {
    if (interval) {
      clearInterval(interval)
      interval = undefined
    }

    const _refreshInterval =
      toPositiveMs(toValue(refreshInterval)) ?? getCapabilitiesRefreshInterval()
    const _enabled = toValue(enabled) ?? _refreshInterval !== undefined
    if (!_enabled || !_refreshInterval) {
      return
    }

    interval = setInterval(() => {
      void fetchLayerCapabilities()
    }, _refreshInterval)

    onCleanup(() => {
      if (interval) {
        clearInterval(interval)
        interval = undefined
      }
    })
  })

  onUnmounted(() => {
    if (interval) {
      clearInterval(interval)
      interval = undefined
    }
  })

  const result = { layerCapabilities, times, fetchLayerCapabilities }
  provide(WMS_LAYER_CAPABILITIES_KEY, result)
  return result
}

export function useWmsLegend(
  baseUrl: string,
  layerName: MaybeRefOrGetter<string>,
  useDisplayUnits: MaybeRefOrGetter<boolean>,
  colorScaleRange: MaybeRefOrGetter<string | undefined>,
  style: MaybeRefOrGetter<Style>,
  activeStyles: MaybeRefOrGetter<Style[]>,
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

    if (!_activeStyles.some((s) => styleToId(s) === styleToId(_style))) {
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
  doShowAggregated: MaybeRefOrGetter<boolean>,
  aggregationLabel: MaybeRefOrGetter<string | null>,
  taskRunId: MaybeRefOrGetter<string | undefined>,
) {
  const piProvider = new PiWebserviceProvider(baseUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  const timeSeries = ref<TimeSeriesData[]>([])
  watchEffect(async () => {
    const _layerName = toValue(layerName)
    const _start = toValue(start)
    const _end = toValue(end)
    const _doShowAggregated = toValue(doShowAggregated)
    const _aggregationLabel = toValue(aggregationLabel)
    const _taskRunId = toValue(taskRunId)
    if (_layerName !== '' && _start && _end) {
      const filter: TimeSeriesGridMaxValuesFilter = {
        startTime: _start.toISOString(),
        endTime: _end.toISOString(),
        layers: _layerName,
      }
      if (_doShowAggregated && _aggregationLabel !== null) {
        filter.aggregation = _aggregationLabel
      }
      if (_taskRunId) {
        // @ts-expect-error taskRunId is not yet in the type definition
        filter.taskRunId = _taskRunId
      }
      const response = await piProvider.getTimeSeriesGridMaxValues(filter)
      if (response?.timeSeries && response.timeSeries.length > 0) {
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

  return { timeSeries }
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

  return wmsProvider
    .getLegendGraphic({
      layers: layerName,
      colorscalerange: colorScaleRange,
      useDisplayUnits: useDisplayUnits,
      style: style?.name,
    })
    .catch((error) => {
      console.error(error)
      throw error
    })
}

export function useWmsCapabilities(
  baseUrl: string,
  filter: GetCapabilitiesFilter,
) {
  const capabilities = ref<GetCapabilitiesResponse>()
  const wmsUrl = `${baseUrl}/wms`
  const wmsProvider = new WMSProvider(wmsUrl, {
    transformRequestFn: createTransformRequestFn(),
  })

  async function loadCapabilities(): Promise<void> {
    try {
      capabilities.value = await wmsProvider.getCapabilities(filter)
    } catch (error) {
      console.error(error)
    }
  }

  loadCapabilities()

  return { capabilities }
}

export function convertBoundingBoxToLngLatBounds(
  boundingBox: BoundingBox,
): LngLatBounds {
  const crs = boundingBox.crs

  const minx = Number.parseFloat(boundingBox.minx)
  const miny = Number.parseFloat(boundingBox.miny)
  const maxx = Number.parseFloat(boundingBox.maxx)
  const maxy = Number.parseFloat(boundingBox.maxy)

  const p1 = toWgs84(point([minx, miny], { crs: crs }))
  const p2 = toWgs84(point([maxx, maxy], { crs: crs }))
  return new LngLatBounds(
    [p1.geometry.coordinates[0], p1.geometry.coordinates[1]], // sw
    [p2.geometry.coordinates[0], p2.geometry.coordinates[1]], // ne
  )
}
