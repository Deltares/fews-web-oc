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
import { uniq, uniqBy } from 'lodash-es'

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
    title: getFilterSubplotTitle(filterSubplot),
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
  const parametersStore = useParametersStore()

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

    const parameter = parametersStore.byId(header.parameterId)
    const parameterGroup = parameter?.parameterGroup
    const locationName = header.stationName ?? header.locationId

    const filterItem: FilterSubplotItem = {
      ...item,
      filter,
      locationName,
      parameterGroup,
    }
    return filterItem
  })
  return { ...item, items: newItems }
}

export function getFilterSubplotTitle(subplot: FilterSubplot) {
  const uniqueParameterGroups = getParameterGroups(subplot.items)
  const uniqueLocationNames = getLocationNames(subplot.items)

  const format = (items: string[]) => {
    const displayed = items.slice(0, 2).join(', ')
    const extra = items.length > 2 ? `, +${items.length - 2} more` : ''
    return displayed + extra
  }

  return `${format(uniqueParameterGroups)} at ${format(uniqueLocationNames)}`
}

function isLeftItem(item: FilterSubplotItem) {
  return item.yAxis?.axisPosition === 'left'
}
function isRightItem(item: FilterSubplotItem) {
  return item.yAxis?.axisPosition === 'right'
}

export function canAddFilterToChart(
  chart: FilterChart,
  filter: filterActionsFilter,
): boolean {
  const addPosition = getAddPositionForFilter(chart, filter)
  return addPosition !== undefined
}

function getAddPositionForFilter(
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
  const leftItem = items.find(isLeftItem)
  const rightItem = items.find(isRightItem)
  const leftParameterGroup = leftItem?.parameterGroup
  const rightParameterGroup = rightItem?.parameterGroup

  if (filterParameterGroup === leftParameterGroup) {
    return 'addToLeft'
  }
  if (filterParameterGroup === rightParameterGroup) {
    return 'addToRight'
  }
  if (leftParameterGroup === undefined) {
    return 'addLeft'
  }
  if (rightParameterGroup === undefined) {
    return 'addRight'
  }
}

export async function addFilterToChart(
  chart: FilterChart,
  filter: filterActionsFilter,
) {
  const addPosition = getAddPositionForFilter(chart, filter)

  switch (addPosition) {
    case 'addToLeft':
      const leftItems = chart.subplot.items.filter(isLeftItem)
      const leftFilter = combineFilters(filter, leftItems)
      return addFilterToChartPosition(chart, leftFilter, 'left')
    case 'addToRight':
      const rightItems = chart.subplot.items.filter(isRightItem)
      const rightFilter = combineFilters(filter, rightItems)
      return addFilterToChartPosition(chart, rightFilter, 'right')
    case 'addLeft':
      return addFilterToChartPosition(chart, filter, 'left')
    case 'addRight':
      return addFilterToChartPosition(chart, filter, 'right')
  }
}

function combineFilters(
  filter: FilterSubplotItem['filter'],
  items: FilterSubplotItem[],
): FilterSubplotItem['filter'] {
  const filterIdsFilter = filter.filterId?.split(',') ?? []
  const locationIdsFilter = filter.locationIds?.split(',') ?? []
  const parameterIdsFilter = filter.parameterIds?.split(',') ?? []
  const moduleInstanceIdsFilter = filter.moduleInstanceIds?.split(',') ?? []
  const resamplingMethodsFilter = filter.resamplingMethods?.split(',') ?? []
  const resamplingTimeStepIdsFilter =
    filter.resamplingTimeStepIds?.split(',') ?? []

  const filterIdsItems = getFilterIds(items)
  const locationIdsItems = getLocationIds(items)
  const parameterIdsItems = getParameterIds(items)
  const moduleInstanceIdsItems = getModuleInstanceIds(items)
  const resamplingMethodsItems = getResamplingMethods(items)
  const resamplingTimeStepIdsItems = getResamplingTimeStepIds(items)

  const filterId = uniq([filterIdsFilter, filterIdsItems])
  const locationIds = uniq([locationIdsFilter, locationIdsItems])
  const parameterIds = uniq([parameterIdsFilter, parameterIdsItems])
  const moduleInstanceIds = uniq([
    moduleInstanceIdsFilter,
    moduleInstanceIdsItems,
  ])
  const resamplingMethods = uniq([
    resamplingMethodsFilter,
    resamplingMethodsItems,
  ])
  const resamplingTimeStepIds = uniq([
    resamplingTimeStepIdsFilter,
    resamplingTimeStepIdsItems,
  ])

  return {
    filterId: filterId.length ? filterId.join(',') : undefined,
    locationIds: locationIds.length ? locationIds.join(',') : undefined,
    parameterIds: parameterIds.length ? parameterIds.join(',') : undefined,
    moduleInstanceIds: moduleInstanceIds.length
      ? moduleInstanceIds.join(',')
      : undefined,
    resamplingMethods: resamplingMethods.length
      ? resamplingMethods.join(',')
      : undefined,
    resamplingTimeStepIds: resamplingTimeStepIds.length
      ? resamplingTimeStepIds.join(',')
      : undefined,
    // TODO: Do two requests if resamplingOmitMissing is different?
    resamplingOmitMissing: filter.resamplingOmitMissing,
  }
}

export function getLocationNames(items: FilterSubplotItem[]) {
  return uniq(items.map((item) => item.locationName ?? ''))
}

export function getLocationIds(items: FilterSubplotItem[]) {
  return uniq(items.flatMap((item) => item.filter.locationIds ?? []))
}

export function getParameterIds(items: FilterSubplotItem[]) {
  return uniq(items.flatMap((item) => item.filter.parameterIds ?? []))
}

export function getParameterGroups(items: FilterSubplotItem[]) {
  return uniq(items.flatMap((item) => item.parameterGroup ?? []))
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
    if (!item.yAxis) return
    item.yAxis.axisPosition = position
  })

  const newItems = [...chart.subplot.items, ...newChart.subplot.items]
  chart.subplot.items = uniqBy(newItems, (item) => item.request)

  const newRequests = [...chart.requests, ...newChart.requests]
  chart.requests = uniqBy(newRequests, (req) => req.request)

  chart.title = getFilterSubplotTitle(chart.subplot)
}
