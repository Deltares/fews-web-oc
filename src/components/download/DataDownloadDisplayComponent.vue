<template>
  <v-container>
    <v-card title="Make a selection to download data" flat>
      <v-form v-model="selectionIsValid">
        <v-row align="start" class="ma-1">
          <v-col v-for="(item, index) in nodeAttributes">
            <v-autocomplete
              v-model="selectedAttributes[index]"
              :items="selectableAttributes[index]"
              :label="item.name"
              multiple
              density="compact"
              variant="outlined"
              clearable
              chips
              prepend-icon="mdi-filter"
              @update:modelValue="updateLocations(index)"
            />
          </v-col>
        </v-row>
        <v-row align="start" class="ma-1">
          <v-col>
            <v-autocomplete
              v-model="selectedParameterQualifiers"
              :items="parameterQualifiers"
              :item-title="(item) => getParameterQualifierName(item)"
              label="Parameters"
              multiple
              return-object
              density="compact"
              variant="outlined"
              clearable
              prepend-icon="mdi-scale"
            >
              <template v-slot:selection="{ item, index }">
                <span v-if="index < 4">{{ item.title }}</span>
                <span v-else-if="index === 4"
                  >... ({{ selectedParameterQualifiers.length }} selected)</span
                >
              </template>
              <template v-slot:append-inner>
                <v-chip>{{ parameterQualifiers.length }}</v-chip>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>
        <v-row align="start" class="ma-1">
          <v-col>
            <v-autocomplete
              v-model="selectedLocations"
              :items="locations"
              :item-title="(item) => item.title"
              label="Locations"
              multiple
              return-object
              density="compact"
              variant="outlined"
              clearable
              prepend-icon="mdi-map-marker-multiple"
            >
              <template v-slot:selection="{ item, index }">
                <span v-if="index < 3">{{ item.title }}</span>
                <span v-else-if="index === 3"
                  >... ({{ selectedLocations.length }} selected)</span
                >
              </template>
              <template v-slot:append-inner>
                <v-chip>{{ locations.length }}</v-chip>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>
        <v-row align="start" class="ma-1">
          <v-col>
            <v-text-field
              v-model="startDateString"
              label="Start date"
              density="compact"
              :rules="[rules.required, rules.date]"
              variant="outlined"
            >
              <template v-slot:prepend>
                <v-menu offset-y :close-on-content-click="false">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props">mdi-calendar-start</v-icon>
                  </template>
                  <v-date-picker v-model="startDate" no-title hide-actions>
                    <template #header></template>
                  </v-date-picker>
                </v-menu>
              </template>
            </v-text-field>
          </v-col>
          <v-col>
            <v-text-field
              v-model="endDateString"
              label="End date"
              density="compact"
              :rules="[rules.required, rules.date]"
              variant="outlined"
            >
              <template v-slot:prepend>
                <v-menu offset-y :close-on-content-click="false">
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props">mdi-calendar-end</v-icon>
                  </template>
                  <v-date-picker v-model="endDate" no-title hide-actions>
                    <template #header></template>
                  </v-date-picker>
                </v-menu>
              </template>
            </v-text-field>
          </v-col>
        </v-row>
      </v-form>
      <v-card-actions>
        <v-checkbox
          v-model="onlyDownloadMetaData"
          label="Only download meta-data"
          hide-details
          density="compact"
          class="mb-2"
        />
        <v-spacer />
        <v-btn
          variant="flat"
          prepend-icon="mdi-download"
          color="primary"
          @click="downloadData"
          :disabled="!selectionIsValid"
        >
          Download
        </v-btn>
      </v-card-actions>
    </v-card>
    <TimeSeriesFileDownloadComponent
      v-model="showDownloadDialog"
      :options="options"
      :startTime="downloadStartTime"
      :endTime="downloadEndTime"
      :filter="timeSeriesFilter"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeMount, onMounted } from 'vue'
import {
  DocumentFormat,
  Location,
  LocationsFilter,
  ParametersFilter,
  PiWebserviceProvider,
  TimeSeriesFilter,
  TimeSeriesParameter,
  TopologyNode,
} from '@deltares/fews-pi-requests'
import { DateTime, type DateTimeMaybeValid } from 'luxon'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.ts'
import TimeSeriesFileDownloadComponent from '@/components/download/TimeSeriesFileDownloadComponent.vue'
import { UseDisplayConfigOptions } from '@/services/useDisplayConfig'
import { useUserSettingsStore } from '@/stores/userSettings.ts'
import { TimeSeriesResult } from '@deltares/fews-pi-requests'
import { ParameterQualifiersHeader } from '@/lib/download/types'
import { isEqual, uniqWith } from 'lodash-es'
import { filterToParams } from '@/lib/download/downloadFiles.ts'
import { DataDownloadFilter } from '@/lib/download/types/DataDownloadFilter.ts'
import loki from 'lokijs'
import { onMounted } from 'vue'

interface Props {
  nodeId?: string | string[]
  topologyNode: TopologyNode
}

interface FlattendLocation {
  locationId: string
  title: string
  [key: string]: string
}

const props = defineProps<Props>()
const settings = useUserSettingsStore()

const db = new loki('download.db')
let locationColl!: Collection<FlattendLocation>

const locationsLoading = ref(false)
const parametersLoading = ref(false)

const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: settings.useDisplayUnits,
    convertDatum: settings.convertDatum,
  }
})

const showDownloadDialog = ref(false)
const selectionIsValid = ref(false)
const downloadStartTime = ref<Date>()
const downloadEndTime = ref<Date>()
const timeSeriesFilter = ref<DataDownloadFilter>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const piProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

const filterId = props.topologyNode.filterIds
  ? props.topologyNode.filterIds[0]
  : undefined
const nodeAttributes = props.topologyNode.dataDownloadDisplay?.attributes ?? []

const allParameters = ref<TimeSeriesParameter[]>([])
const locations = ref<FlattendLocation[]>([])
const selectedLocations = ref<FlattendLocation[]>([])
const parameterQualifiers = ref<ParameterQualifiersHeader[]>([])
const selectedParameterQualifiers = ref<ParameterQualifiersHeader[]>([])
const selectableAttributes = ref<string[][]>([])
const onlyDownloadMetaData = ref(false)
const errors = ref<string[]>([])

onBeforeMount(() => {
  const nodeIds = nodeAttributes.map((item) => item.id)
  locationColl = db.addCollection('locations', {
    indices: ['locationId', ...nodeIds],
  })
})

onMounted(async () => {
  await init()
})

const init = async () => {
  console.time('init')
  locationsLoading.value = true
  getLocations().then((locationsResponse) => {
    // flatten locations
    const flattenedLocations = locationsResponse.map((location) => {
      let result = {
        locationId: location.locationId,
        title: getLocationName(location),
      }
      if (location.attributes) {
        const attributes = Object.fromEntries(
          location.attributes?.map((item) => [item.id, item.value]),
        )
        result = {
          ...result,
          ...attributes,
        }
      }
      locationColl.insert(result)
      return result
    })

    locations.value = locationColl
      .chain([
        { type: 'simplesort', property: 'title', desc: false },
        {
          type: 'limit',
          value: 1000,
        },
      ])
      .data()
    selectedLocations.value = flattenedLocations
    locationsLoading.value = false
    selectableAttributes.value = getAttributeValues(flattenedLocations)
  })

  // get parameters
  parametersLoading.value = true
  allParameters.value = await getParameters()
  parametersLoading.value = false

  console.time('get time series headers')
  getTimeSeriesHeaders().then((headersResponse) => {
    const parameterQualifiersHeaders: ParameterQualifiersHeader[] = []
    headersResponse?.forEach((timeSeriesResult) => {
      const parameterQualifiersHeader: ParameterQualifiersHeader = {
        parameterId: timeSeriesResult.header?.parameterId,
        qualifiers: timeSeriesResult.header?.qualifierId,
      }
      parameterQualifiersHeaders.push(parameterQualifiersHeader)
    })
    parameterQualifiers.value = uniqWith(parameterQualifiersHeaders, isEqual)
    selectedParameterQualifiers.value = parameterQualifiers.value
  })
  console.timeEnd('get time series headers')
  console.timeEnd('init')
}

let errors = ref<string[]>([])
const startDate = ref<Date>(getStartDateValue())
const endDate = ref<Date>(getEndDateValue())
const selectedAttributes = ref<string[][]>([])
nodeAttributes.forEach(() => selectedAttributes.value.push([]))

const rules = {
  required: (value: string) => (value !== undefined && !!value) || 'Required',
  date: (value: string) => {
    const date = DateTime.fromFormat(value || '', DATE_FMT)
    return !isNaN(date.valueOf()) || 'Invalid date'
  },
}

const DATE_FMT = 'yyyy-MM-dd HH:mm'
const startDateString = ref<string>(
  DateTime.fromJSDate(getStartDateValue()).toFormat(DATE_FMT),
)
const endDateString = ref<string>(
  DateTime.fromJSDate(getEndDateValue()).toFormat(DATE_FMT),
)

watch(startDateString, (newValue) => {
  let newDateTime: DateTimeMaybeValid = DateTime.fromFormat(newValue, DATE_FMT)
  if (!newDateTime.isValid) {
    return
  }
  startDate.value = newDateTime.toJSDate()
})

watch(endDateString, (newValue) => {
  let newDateTime: DateTimeMaybeValid = DateTime.fromFormat(newValue, DATE_FMT)
  if (!newDateTime.isValid) {
    return
  }
  endDate.value = newDateTime.toJSDate()
})

watch(startDate, (newValue) => {
  let currentDisplayTime: DateTimeMaybeValid = DateTime.fromFormat(
    startDateString.value,
    DATE_FMT,
  )
  copyCurrentHoursAndMinutesToNewDateValue(currentDisplayTime, newValue)
  startDateString.value = DateTime.fromJSDate(newValue).toFormat(DATE_FMT)
})

watch(endDate, (newValue) => {
  let currentDisplayTime: DateTimeMaybeValid = DateTime.fromFormat(
    endDateString.value,
    DATE_FMT,
  )
  copyCurrentHoursAndMinutesToNewDateValue(currentDisplayTime, newValue)
  endDateString.value = DateTime.fromJSDate(newValue).toFormat(DATE_FMT)
})

function updateLocations(index: number) {
  // no filter set select all locations

  const resetAll = selectedAttributes.value.every((item) => item.length === 0)

  if (resetAll) {
    console.time('resetAll')
    locations.value = locationColl
      .chain([
        { type: 'simplesort', property: 'title', desc: false },
        {
          type: 'limit',
          value: 1000,
        },
      ])
      .data()
    selectedLocations.value = locationColl
      .chain([{ type: 'simplesort', property: 'title', desc: false }])
      .data()
    console.timeEnd('resetAll')
  } else {
    locations.value = filterLocations(selectedAttributes.value)
    selectedLocations.value = locations.value
  }

  // update selectable attributes
  console.time('update selectable attributes')
  const newAttributeValues = getAttributeValues(locations.value)
  console.timeEnd('update selectable attributes')

  console.time('update selected attributes')
  for (let i = 0; i < selectableAttributes.value.length; i++) {
    if (!resetAll && i === index) continue
    selectableAttributes.value[i] = newAttributeValues[i]
    selectedAttributes.value[i] = selectedAttributes.value[i].filter((item) =>
      selectableAttributes.value[i].includes(item),
    )
  }
  console.timeEnd('update selected attributes')
}

// function endIntersect(_entries, _observer, isIntersecting: boolean) {
//   if (isIntersecting) {
//     const moreLocations = locationColl
//       .chain([
//         {
//           type: 'offset',
//           value: locations.value.length,
//         },
//         {
//           type: 'limit',
//           value: 100,
//         },
//       ])
//       .data()
//     locations.value = [...locations.value, ...moreLocations]
//   }
// }

function copyCurrentHoursAndMinutesToNewDateValue(
  currentDisplayTime: DateTimeMaybeValid,
  newValue: Date,
) {
  if (currentDisplayTime.isValid) {
    let currentJSDate = currentDisplayTime.toJSDate()
    const currentHour = currentJSDate.getHours()
    const currentMinutes = currentJSDate.getMinutes()
    newValue.setHours(currentHour)
    newValue.setMinutes(currentMinutes)
  }
}

function getStartDateValue() {
  let startDateValue = new Date()
  startDateValue.setMilliseconds(
    startDateValue.getMilliseconds() - 1000 * 60 * 60 * 24 * 14,
  )
  startDateValue.setHours(0)
  startDateValue.setMinutes(0)
  startDateValue.setMilliseconds(0)
  return startDateValue
}

function getEndDateValue() {
  let endDateValue = new Date()
  endDateValue.setHours(0)
  endDateValue.setMinutes(0)
  endDateValue.setMilliseconds(0)
  return endDateValue
}

function downloadData() {
  let startTimeRequest: DateTimeMaybeValid = DateTime.fromFormat(
    startDateString.value,
    DATE_FMT,
  )
  let endTimeRequest: DateTimeMaybeValid = DateTime.fromFormat(
    endDateString.value,
    DATE_FMT,
  )

  const selectedParameterIds = selectedParameterQualifiers.value
    .map((parameterQualifier) => parameterQualifier.parameterId)
    .filter((parameterId) => parameterId !== undefined)

  const selectedQualifierIds = selectedParameterQualifiers.value
    .map((parameterQualifier) => parameterQualifier.qualifiers)
    .flatMap((item) => item)
    .filter((qualifier) => qualifier !== undefined)

  const selectedLocationIds = selectedLocations.value.map(
    (location) => location.locationId,
  )

  const joinUniqueStrings = (stringArray: string[]) =>
    stringArray.length > 0 ? uniqWith(stringArray).join(',') : undefined

  timeSeriesFilter.value = {
    filterId: filterId,
    locationIds: joinUniqueStrings(selectedLocationIds),
    parameterIds: joinUniqueStrings(selectedParameterIds),
    qualifierIds: joinUniqueStrings(selectedQualifierIds),
    onlyHeaders: onlyDownloadMetaData.value,
  }
  const queryParameters = filterToParams(timeSeriesFilter.value)
  if (queryParameters.length > 7500) {
    errors.value.push('Too many parameters or locations selected')
    return
  }

  downloadStartTime.value = startTimeRequest.toJSDate()
  downloadEndTime.value = endTimeRequest.toJSDate()

  showDownloadDialog.value = true
}

function getLocationName(location: Location): string {
  const showLocationName =
    props.topologyNode.dataDownloadDisplay?.showLocationName
  if (showLocationName === 'name')
    return location.locationName ?? location.locationId
  if (showLocationName === 'short name')
    return location.shortName ?? location.locationId
  return location.locationId
}

function getParameterName(
  parameters: TimeSeriesParameter[],
  parameterQualifiersHeader: ParameterQualifiersHeader,
  showParameterName?: 'name' | 'short name' | 'id',
) {
  const parameter = parameters.find(
    (item) => item.id === parameterQualifiersHeader.parameterId,
  )
  if (parameter === undefined) return ''
  if (showParameterName === 'name') return parameter.name ?? parameter.id
  if (showParameterName === 'short name')
    return parameter.shortName ?? parameter.id
  return parameter.id
}

function getParameterQualifierName(
  parameterQualifiersHeader: ParameterQualifiersHeader,
): string {
  const showParameterName =
    props.topologyNode.dataDownloadDisplay?.showParameterName
  const parameterName = getParameterName(
    allParameters.value,
    parameterQualifiersHeader,
    showParameterName,
  )
  if (parameterQualifiersHeader.qualifiers === undefined) return parameterName
  const qualifiers = ' (' + parameterQualifiersHeader.qualifiers.join(',') + ')'
  return parameterName + qualifiers
}

async function getTimeSeriesHeaders(): Promise<TimeSeriesResult[] | undefined> {
  const filter: TimeSeriesFilter = {
    onlyHeaders: true,
    filterId: filterId,
    documentFormat: DocumentFormat.PI_JSON,
  }
  const timeSeriesResponse = await piProvider.getTimeSeries(filter)
  return timeSeriesResponse.timeSeries
}

async function getLocations(): Promise<Location[]> {
  console.time('getLocations')
  const filter: LocationsFilter = {
    showAttributes: true,
    showParentLocations: false,
    attributeIds: props.topologyNode.dataDownloadDisplay?.attributes.map(
      (item) => item.id,
    ),
    filterId: filterId,
    documentFormat: DocumentFormat.PI_JSON,
  }
  const locationsResponse = await piProvider.getLocations(filter)
  console.timeEnd('getLocations')
  return locationsResponse.locations
}

function getAttributeValues(locations: FlattendLocation[]): string[][] {
  console.time('getAttributeValues')
  if (nodeAttributes.length === 0) return []
  const attributeValuesMap: string[][] = nodeAttributes.map(() => [])
  const configuredAttributeIds = nodeAttributes.map((item) => item.id)

  for (const newLocation of locations) {
    for (let i = 0; i < configuredAttributeIds.length; i++) {
      const id = configuredAttributeIds[i]
      const arrayForAttribute = attributeValuesMap[i]
      if (newLocation[id] && !arrayForAttribute.includes(newLocation[id])) {
        arrayForAttribute.push(newLocation[id])
      }
    }
  }
  attributeValuesMap.forEach((value) => value.sort())
  console.timeEnd('getAttributeValues')
  return attributeValuesMap
}

async function getParameters(): Promise<TimeSeriesParameter[]> {
  console.time('getParameters')
  if (props.topologyNode?.filterIds === undefined) return []
  const filter: ParametersFilter = {
    filterId: filterId,
    documentFormat: DocumentFormat.PI_JSON,
  }
  const parametersResponse = await piProvider.getParameters(filter)
  console.timeEnd('getParameters')
  return parametersResponse.timeSeriesParameters
}

function filterLocations(selectedAttributes: string[][]): FlattendLocation[] {
  console.time('filterLocations')
  const filter: any = {}
  selectedAttributes.forEach((item, index) => {
    if (item.length === 0) return
    filter[nodeAttributes[index].id] = { $in: item }
  })
  const result = locationColl
    .chain([
      { type: 'find', value: filter },
      { type: 'simplesort', property: 'title', desc: false },
    ])
    .data()
  console.timeEnd('filterLocations')
  return result
}
</script>
