import { fetchActions } from '@/services/useDisplayConfig'
import { fetchTimeSeriesHeaders } from '@/services/useTimeSeries'
import { useParametersStore } from '@/stores/parameters'
import {
  ActionRequest,
  filterActionsFilter,
  Header,
  TimeSeriesDisplaySubplot,
} from '@deltares/fews-pi-requests'
import { FilterChart, FilterSubplot, FilterSubplotItem } from './types'
import { configManager } from '@/services/application-config'
import { absoluteUrl } from '../utils/absoluteUrl'
import { uniq } from 'lodash-es'

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')

export async function createNewChartsForFilters(
  filters: filterActionsFilter[],
) {
  const promises = filters.map(createNewChartForFilter)
  const charts = await Promise.all(promises)
  return charts.filter((chart) => chart !== undefined)
}

export async function createNewChartForFilter(filter: filterActionsFilter) {
  if (!filter.filterId) {
    throw new Error('Filter must have a filterId')
  }

  const promises = filter.filterId.split(',').map((id) =>
    fetchActions(baseUrl, {
      ...filter,
      filterId: id,
    }),
  )
  const actions = await Promise.all(promises)
  const result = actions[0].results[0]

  const requests = result.requests

  const subplot = result.config?.timeSeriesDisplay.subplots?.[0]
  if (!subplot) return

  actions.slice(1).forEach((action) => {
    const requestsToAdd = action.results[0].requests
    const subplotItemsToAdd =
      action.results[0].config?.timeSeriesDisplay.subplots?.[0].items ?? []
    requests.push(...requestsToAdd)
    subplot.items.push(...subplotItemsToAdd)
  })

  const filterId = filter.filterId
  if (!filterId) return

  const headers = await fetchTimeSeriesHeaders(baseUrl, requests, {})
  const filterSubplot = subplotToFilterSubplot(
    filterId,
    subplot,
    headers,
    requests,
  )

  const newCharts: FilterChart = {
    id: crypto.randomUUID(),
    type: 'filter',
    title: 'New Chart',
    subplot: filterSubplot,
    requests,
  }
  return newCharts
}

function subplotToFilterSubplot(
  filterId: string,
  item: TimeSeriesDisplaySubplot,
  headers: Record<string, Header[]>,
  requests: ActionRequest[],
): FilterSubplot {
  const newItems = item.items.flatMap((item) => {
    const header = headers[item.request ?? '']?.[0]
    const request = requests.find((req) => req.key === item.request)

    if (!request) return []
    if (!header) return []

    const requestUrl = absoluteUrl(`${baseUrl}/${request}`)

    const methodKey: keyof FilterSubplotItem['filter'] = 'resamplingMethods'
    const resamplingMethods = requestUrl.searchParams.get(methodKey)

    const timeStepIdKey: keyof FilterSubplotItem['filter'] =
      'resamplingTimeStepIds'
    const resamplingTimeStepIds = requestUrl.searchParams.get(timeStepIdKey)

    const omitMissingKey: keyof FilterSubplotItem['filter'] =
      'resamplingOmitMissing'
    const resamplingOmitMissing =
      requestUrl.searchParams.get(omitMissingKey) === 'true'

    const filter: FilterSubplotItem['filter'] = {
      filterId,
      locationIds: header.locationId,
      parameterIds: header.parameterId,
      moduleInstanceIds: header.moduleInstanceId,
    }

    if (resamplingMethods) {
      filter.resamplingMethods = resamplingMethods
    }

    if (resamplingTimeStepIds) {
      filter.resamplingTimeStepIds = resamplingTimeStepIds
    }

    if (resamplingOmitMissing) {
      filter.resamplingOmitMissing = resamplingOmitMissing
    }

    const filterItem: FilterSubplotItem = { ...item, filter }
    return filterItem
  })
  return { ...item, items: newItems }
}

export function getFilterChartTitle(chart: FilterChart) {
  return chart.title
}

export async function addFilterToChart(
  chart: FilterChart,
  filter: filterActionsFilter,
) {
  const parametersStore = useParametersStore()

  const filterParameter = filter.parameterIds?.split(',')[0]
  const filterParameterGroup =
    parametersStore.byId(filterParameter)?.parameterGroup
  if (!filterParameterGroup) {
    throw new Error('No parameter group found for filter')
  }

  const items = chart.subplot.items
  const leftItems = items.filter((item) => item.yAxis?.axisPosition === 'left')
  const rightItems = items.filter(
    (item) => item.yAxis?.axisPosition === 'right',
  )
  const leftParameterId = leftItems?.[0]?.filter.parameterIds
  const rightParameterId = rightItems?.[0]?.filter.parameterIds

  const leftParameterGroup =
    parametersStore.byId(leftParameterId)?.parameterGroup
  const rightParameterGroup =
    parametersStore.byId(rightParameterId)?.parameterGroup

  const addToLeft = filterParameterGroup === leftParameterGroup
  const addToRight = filterParameterGroup === rightParameterGroup
  const addLeft = leftParameterGroup === undefined
  const addRight = rightParameterGroup === undefined

  if (addToLeft) {
    await addFilterToChartPosition(
      chart,
      combineFilters(filter, leftItems),
      'left',
    )
    return
  }
  if (addToRight) {
    await addFilterToChartPosition(
      chart,
      combineFilters(filter, rightItems),
      'right',
    )
    return
  }
  if (addLeft) {
    await addFilterToChartPosition(chart, filter, 'left')
    return
  }
  if (addRight) {
    await addFilterToChartPosition(chart, filter, 'right')
    return
  }
}

function combineFilters(
  filter: FilterSubplotItem['filter'],
  items: FilterSubplotItem[],
): FilterSubplotItem['filter'] {
  const filterIds = getFilterIds(items)
  const locationIds = getLocationIds(items)
  const parameterIds = getParameterIds(items)
  const moduleInstanceIds = getModuleInstanceIds(items)
  const resamplingMethods = getResamplingMethods(items)
  const resamplingTimeStepIds = getResamplingTimeStepIds(items)
  return {
    filterId: uniq([filter.filterId?.split(',') ?? [], filterIds]).join(','),
    locationIds: uniq([filter.locationIds?.split(',') ?? [], locationIds]).join(
      ',',
    ),
    parameterIds: uniq([
      filter.parameterIds?.split(',') ?? [],
      parameterIds,
    ]).join(','),
    moduleInstanceIds: uniq([
      filter.moduleInstanceIds?.split(',') ?? [],
      moduleInstanceIds,
    ]).join(','),
    resamplingMethods: uniq([filter.resamplingMethods, resamplingMethods]).join(
      ',',
    ),
    resamplingTimeStepIds: uniq([
      filter.resamplingTimeStepIds,
      ...resamplingTimeStepIds,
    ]).join(','),
    // TODO: Do two requests if resamplingOmitMissing is different?
    resamplingOmitMissing: filter.resamplingOmitMissing,
  }
}

export function getLocationIds(items: FilterSubplotItem[]) {
  return uniq(items.flatMap((item) => item.filter.locationIds ?? []))
}

export function getParameterIds(items: FilterSubplotItem[]) {
  return uniq(items.flatMap((item) => item.filter.parameterIds ?? []))
}

export function getModuleInstanceIds(items: FilterSubplotItem[]) {
  return uniq(items.flatMap((item) => item.filter.moduleInstanceIds ?? []))
}

export function getFilterIds(items: FilterSubplotItem[]) {
  return uniq(items.flatMap((item) => item.filter.filterId ?? []))
}

export function getResamplingMethods(items: FilterSubplotItem[]) {
  return uniq(items.flatMap((item) => item.filter.resamplingMethods ?? []))
}

export function getResamplingTimeStepIds(items: FilterSubplotItem[]) {
  return uniq(items.flatMap((item) => item.filter.resamplingTimeStepIds ?? []))
}

async function addFilterToChartPosition(
  chart: FilterChart,
  filter: filterActionsFilter,
  position: 'left' | 'right',
) {
  const newChart = await createNewChartForFilter(filter)

  if (!newChart) return

  newChart.subplot.items.forEach((item) => {
    item.yAxis = {
      ...item.yAxis,
      axisPosition: position,
    }
  })

  const newItems = [...chart.subplot.items, ...newChart.subplot.items]
  chart.subplot.items = newItems.filter(
    (item, index, self) =>
      index === self.findIndex((i) => i.request === item.request),
  )

  const newRequests = [...chart.requests, ...newChart.requests]
  chart.requests = newRequests.filter(
    (request, index, self) =>
      index === self.findIndex((r) => r.request === request.request),
  )

  chart.title = getFilterChartTitle(chart)
}
