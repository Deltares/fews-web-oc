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
  const leftItem = items.find((item) => item.yAxis?.axisPosition === 'left')
  const rightItem = items.find((item) => item.yAxis?.axisPosition === 'right')
  const leftParameterGroup = leftItem?.parameterGroup
  const rightParameterGroup = rightItem?.parameterGroup

  if (
    filterParameterGroup === leftParameterGroup ||
    leftParameterGroup === undefined
  ) {
    return 'left'
  }
  if (
    filterParameterGroup === rightParameterGroup ||
    rightParameterGroup === undefined
  ) {
    return 'right'
  }
}

export async function addFilterToChart(
  chart: FilterChart,
  filter: filterActionsFilter,
) {
  const position = getAddPositionForFilter(chart, filter)
  if (!position) return

  addFilterToChartPosition(chart, filter, position)
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

  const newItems = [...newChart.subplot.items, ...chart.subplot.items]
  chart.subplot.items = uniqBy(newItems, (item) => item.request)

  const newRequests = [...newChart.requests, ...chart.requests]
  chart.requests = uniqBy(newRequests, (req) => req.request)

  chart.title = getFilterSubplotTitle(chart.subplot)
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
