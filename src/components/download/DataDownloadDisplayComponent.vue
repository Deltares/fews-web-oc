<template>
  <v-container>
    <v-card title="Make a selection to download data">
      <v-row align="start" class="ma-1">
        <v-col v-for="(item, index) in attributes">
          <v-autocomplete
            density="compact"
            :label="item.name"
            v-model="selectedAttributes[index]"
            multiple
            single-line
            hide-details
            rounded="0"
            @update:modelValue="updateLocations"
            :items="selectableAttributes[index]"
          />
        </v-col>
      </v-row>
      <v-row align="start" class="ma-1">
        <v-col>
          <v-autocomplete
            density="compact"
            :item-title="(item) => getParameterQualifierName(item)"
            return-object
            v-model="selectedParameterQualifiers"
            multiple
            single-line
            hide-details
            rounded="0"
            label="Parameters"
            :items="parameterQualifiers"
          >
            <template v-slot:selection="{ item, index }">
              <span v-if="index < 4">{{ item.title }}</span>
              <span v-if="index == 4"
                >... ({{ selectedParameterQualifiers.length }} selected)</span
              >
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>
      <v-row align="start" class="ma-1">
        <v-col>
          <v-autocomplete
            :item-title="(item) => getLocationName(item)"
            v-model="selectedLocations"
            multiple
            single-line
            hide-details
            rounded="0"
            return-object
            density="compact"
            label="locations"
            :items="locations"
          >
            <template v-slot:selection="{ item, index }">
              <span v-if="index < 3">{{ item.title }}</span>
              <span v-if="index == 3"
                >... ({{ selectedLocations.length }} selected)</span
              >
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>
      <v-row align="start" class="ma-1">
        <v-col>
          <v-text-field
            v-model="startDateString"
            label="Start"
            density="compact"
            :rules="[rules.required, rules.date]"
            variant="solo-filled"
            flat
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
            label="End"
            density="compact"
            :rules="[rules.required, rules.date]"
            variant="solo-filled"
            flat
          >
            <template v-slot:prepend>
              <v-menu offset-y :close-on-content-click="false">
                <template v-slot:activator="{ props }">
                  <v-icon v-bind="props">mdi-calendar-start</v-icon>
                </template>
                <v-date-picker v-model="endDate" no-title hide-actions>
                  <template #header></template>
                </v-date-picker>
              </v-menu>
            </template>
          </v-text-field>
        </v-col>
      </v-row>
      <v-card-actions>
        <v-row class="ma-1">
          <v-col>
            <v-btn
              prepend-icon="mdi-download"
              color="primary"
              @click="downloadData"
              block
              >Download
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
    <v-row>
      <v-col>
        <v-text-field v-for="error in errors" style="color: red" readonly
          >{{ error }}
        </v-text-field>
      </v-col>
    </v-row>
    <TimeSeriesFileDownloadComponent
      v-model="showFileDownloadDialog"
      :options="options"
      :startTime="downloadStartTime"
      :endTime="downloadEndTime"
      :filter="timeSeriesFilter"
    >
    </TimeSeriesFileDownloadComponent>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
import { isEqual } from 'lodash-es'
import { filterToParams } from '@/lib/download/downloadFiles.ts'
import { DataDownloadFilter } from '@/lib/download/types/DataDownloadFilter.ts'
import {uniqWith} from "lodash";

interface Props {
  nodeId?: string | string[]
  topologyNode: TopologyNode
}

const props = defineProps<Props>()
const showFileDownloadDialog = ref(false)
const settings = useUserSettingsStore()
const options = computed<UseDisplayConfigOptions>(() => {
  return {
    useDisplayUnits: settings.useDisplayUnits,
    convertDatum: settings.convertDatum,
  }
})
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
const attributes = props.topologyNode.dataDownloadDisplay?.attributes
const allLocations = ref<Location[]>([])
const allParameters = ref<TimeSeriesParameter[]>([])
const locations = ref<Location[]>([])
const selectedLocations = ref<Location[]>([])
const parameterQualifiers = ref<ParameterQualifiersHeader[]>([])
const selectedParameterQualifiers = ref<ParameterQualifiersHeader[]>([])
const selectableAttributes = ref<string[][]>([])

getLocations().then(locationsResponse => {
    allLocations.value = locationsResponse
    locations.value = locationsResponse
    selectedLocations.value = allLocations.value
    selectableAttributes.value = getAttributeValues(allLocations.value)
})

allParameters.value = await getParameters()
getTimeSeriesHeaders().then(headersResponse=>{
    const parameterQualifiersHeaders: ParameterQualifiersHeader[] = []
    headersResponse?.forEach((timeSeriesResult) => {
        const parameterQualifiersHeader: ParameterQualifiersHeader = {
            parameterId: timeSeriesResult.header?.parameterId,
            qualifiers: timeSeriesResult.header?.qualifierId,
        }
        parameterQualifiersHeaders.push(parameterQualifiersHeader)
    })
    parameterQualifiers.value = uniqWith(parameterQualifiersHeaders,isEqual)
    selectedParameterQualifiers.value = parameterQualifiers.value
})

let errors = ref<string[]>([])
const startDate = ref<Date>(getStartDateValue())
const endDate = ref<Date>(getEndDateValue())
const selectedAttributes = ref<string[][]>([])
const rules = {
  required: (value: string) => (value !== undefined && !!value) || 'Required',
  date: (value: string) => {
    const date = DateTime.fromFormat(value || '', DATE_FMT)
    return !isNaN(date.valueOf()) || 'Invalid date'
  },
}
attributes?.forEach((item) => selectedAttributes.value.push([]))

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

function updateLocations() {
  const attributeIds =
    props.topologyNode.dataDownloadDisplay?.attributes.map((item) => item.id) ??
    []
  locations.value = getNewLocationList(
    allLocations.value,
    attributeIds,
    selectedAttributes.value,
  )
  selectedLocations.value = locations.value
  for (let index = 0; index < selectableAttributes.value.length; index++) {
    const selectedAttributesForOtherAttributes = selectedAttributes.value.map(
      (item, itemIndex) => (index == itemIndex ? [] : item),
    )
    const locationsFor = getNewLocationList(
      allLocations.value,
      attributeIds,
      selectedAttributesForOtherAttributes,
    )
    const newAttributeValues = getAttributeValues(locationsFor)
    selectableAttributes.value[index] = newAttributeValues[index]
  }
  for (let index = 0; index < selectableAttributes.value.length; index++) {
    selectedAttributes.value[index] = selectedAttributes.value[index].filter(
      (item) => selectableAttributes.value[index].includes(item),
    )
  }
}

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

function validateUserInput(
  starTime: DateTimeMaybeValid,
  endTime: DateTimeMaybeValid,
): string[] {
  let newErrors = []

  if (!starTime.isValid) {
    newErrors.push('Start date is not valid')
  }

  if (!endTime.isValid) {
    newErrors.push('End date is not valid')
  }

  if (
    selectedLocations.value === undefined ||
    selectedLocations.value.length == 0
  )
    newErrors.push('Select one or more locations')
  if (
    selectedParameterQualifiers.value === undefined ||
    selectedParameterQualifiers.value.length == 0
  )
    newErrors.push('Select one or more parameters/qualifiers')
  if (endDate.value < startDate.value) {
    newErrors.push('The end date should be greater than the start date')
  }
  return newErrors
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
  errors.value = validateUserInput(startTimeRequest, endTimeRequest)
  if (errors.value.length !== 0) return

  const parameterIds = selectedParameterQualifiers.value.map(
    (parameterQualifier) => parameterQualifier.parameterId,
  )
  const qualifiersIds = selectedParameterQualifiers.value
    .filter((parameterQualifier) => parameterQualifier.qualifiers !== undefined)
    .map((parameterQualifier) => parameterQualifier.qualifiers)
    .flatMap((item) => item)

  timeSeriesFilter.value = {
    filterId: filterId,
    locationIds: selectedLocations.value
      .map((location) => location.locationId)
      .join(','),
    parameterIds: uniqWith(parameterIds).join(','),
    qualifierIds: uniqWith(qualifiersIds).join(','),
  }
  const queryParameters = filterToParams(timeSeriesFilter.value)
  if (queryParameters.length > 7500) {
    errors.value.push('Too many parameters or locations selected')
    return
  }

  downloadStartTime.value = startTimeRequest.toJSDate()
  downloadEndTime.value = endTimeRequest.toJSDate()

  showFileDownloadDialog.value = true
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
  return locationsResponse.locations
}

function getAttributeValues(locations: Location[]): string[][] {
  const attributeValuesMap: string[][] = []
  const configuredAttributeIds =
    props.topologyNode.dataDownloadDisplay?.attributes.map((item) => item.id)
  configuredAttributeIds?.forEach((item) => attributeValuesMap.push([]))
  if (configuredAttributeIds === undefined) return attributeValuesMap
  for (const newLocation of locations) {
    let attributes = newLocation.attributes
    if (attributes == undefined) continue
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i]
      if (attribute.id === undefined) continue
      if (attribute.value === undefined) continue
      const arrayForAttribute =
        attributeValuesMap[configuredAttributeIds.indexOf(attribute.id)]
      if (!arrayForAttribute.includes(attribute.value)) {
        arrayForAttribute.push(attribute.value)
      }
    }
  }
  attributeValuesMap.forEach((value, key) => value.sort())
  return attributeValuesMap
}

async function getParameters(): Promise<TimeSeriesParameter[]> {
  if (props.topologyNode?.filterIds === undefined) return []
  const filter: ParametersFilter = {
    filterId: filterId,
    documentFormat: DocumentFormat.PI_JSON,
  }
  const parametersResponse = await piProvider.getParameters(filter)
  return parametersResponse.timeSeriesParameters
}

function getNewLocationList(
  allLocations: Location[],
  attributes: string[],
  selectedAttributes: string[][],
): Location[] {
  const newLocationList = []
  for (const location of allLocations) {
    if (isSelected(location, selectedAttributes, attributes)) {
      newLocationList.push(location)
    }
  }
  return newLocationList
}

function isSelected(
  location: Location,
  selectedValues: string[][],
  attributes: string[],
): boolean {
  for (let i = 0; i < attributes.length; i++) {
    const selectedValue: string[] = selectedValues[i]
    if (
      selectedValue === undefined ||
      selectedValue.length === 0 ||
      location.attributes === undefined
    )
      continue
    const foundAttribute = location.attributes?.find(
      (attribute) => attribute.id === attributes[i],
    )
    if (foundAttribute === undefined || foundAttribute.value === undefined)
      return false
    const attributeValue = foundAttribute.value
    if (
      selectedValue.filter((item) => attributeValue.includes(item)).length === 0
    )
      return false
  }
  return true
}
</script>
