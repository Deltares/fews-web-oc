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
            :item-title="(item) => getParameterName(item)"
            return-object
            v-model="selectedParameters"
            multiple
            single-line
            hide-details
            rounded="0"
            label="Parameters"
            :items="parameters"
          >
            <template v-slot:selection="{ item, index }">
              <span v-if="index < 4">{{ item.title }}</span>
              <span v-if="index == 4"
                >... ({{ selectedParameters.length }} selected)</span
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
      <v-row class="ma-1">
        <v-col cols="6">
          <v-btn-toggle
            color="primary"
            v-model="selectedFormat"
            rounded="0"
            group
          >
            <v-btn value="PI_XML"> XML</v-btn>
            <v-btn value="PI_JSON"> JSON</v-btn>
            <v-btn value="PI_CSV"> CSV</v-btn>
          </v-btn-toggle>
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  DocumentFormat,
  Location,
  LocationsFilter,
  ParametersFilter,
  PiWebserviceProvider,
  TimeSeriesParameter,
  TopologyNode,
} from '@deltares/fews-pi-requests'
import { DateTime, type DateTimeMaybeValid } from 'luxon'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.ts'
import { downloadFileAttachment } from '@/lib/download/downloadFiles.ts'
import { authenticationManager } from '@/services/authentication/AuthenticationManager.ts'

interface Props {
  nodeId?: string | string[]
  topologyNode: TopologyNode
}

const props = defineProps<Props>()

const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
const piProvider = new PiWebserviceProvider(baseUrl, {
  transformRequestFn: createTransformRequestFn(),
})

const filterId = props.topologyNode.filterIds
  ? props.topologyNode.filterIds[0]
  : undefined
const allLocations = ref<Location[]>([])
const locations = ref<Location[]>([])
const selectedLocations = ref<Location[]>([])

const parameters = ref<TimeSeriesParameter[]>([])
const selectedParameters = ref<TimeSeriesParameter[]>([])

allLocations.value = await getLocations()
selectedLocations.value = allLocations.value
parameters.value = await getParameters()
const selectableAttributes = ref<string[][]>([])
selectableAttributes.value = getAttributeValues(allLocations.value)

let selectedFormat = ref<string>('PI_XML')

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
const attributes = props.topologyNode.dataDownloadDisplay?.attributes
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

async function downloadData() {
  errors.value = []
  let newErrors = []
  let startTimeRequest: DateTimeMaybeValid = DateTime.fromFormat(
    startDateString.value,
    DATE_FMT,
  )
  const startTime = DateTime.fromJSDate(startTimeRequest.toJSDate(), {
    zone: 'UTC',
  })
  if (!startTime.isValid) {
    newErrors.push('Start date is not valid')
  }

  let endTimeRequest: DateTimeMaybeValid = DateTime.fromFormat(
    endDateString.value,
    DATE_FMT,
  )
  const endTime = DateTime.fromJSDate(endTimeRequest.toJSDate(), {
    zone: 'UTC',
  })
  if (!endTime.isValid) {
    newErrors.push('End date is not valid')
  }

  if (
    selectedLocations.value === undefined ||
    selectedLocations.value.length == 0
  )
    newErrors.push('Select one or more locations')
  if (
    selectedParameters.value === undefined ||
    selectedParameters.value.length == 0
  )
    newErrors.push('Select one or more parameters')
  if (endDate.value < startDate.value) {
    newErrors.push('The end date should be greater than the start date')
  }
  errors.value = newErrors
  if (newErrors.length !== 0) return

  let queryStartDateString =
    startTime.toISO({ suppressMilliseconds: true }) ?? ''
  queryStartDateString = 'startTime=' + encodeURI(queryStartDateString)

  let queryEndDateString = endTime.toISO({ suppressMilliseconds: true }) ?? ''
  queryEndDateString = 'endTime=' + encodeURI(queryEndDateString)

  let locationQuery = 'locationIds='
  selectedLocations.value.forEach((selectedLocation) => {
    locationQuery = locationQuery + selectedLocation.locationId + ','
  })
  locationQuery = encodeURI(locationQuery)

  let parameterQuery = 'parameterIds='
  selectedParameters.value.forEach((selectedParameter) => {
    parameterQuery = parameterQuery + selectedParameter.id + ','
  })
  parameterQuery = encodeURI(parameterQuery)

  const downloadFormat = selectedFormat.value

  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  let downloadUrl = `${baseUrl}rest/fewspiservice/v1/timeseries?filterId=${filterId}&${locationQuery}&${parameterQuery}&${queryStartDateString}&${queryEndDateString}&downloadAsFile=true&documentFormat=${downloadFormat}`
  if (downloadUrl.length > 8000) {
    errors.value.push('Too many locations or parameters selected')
    return
  }

  const url = new URL(downloadUrl)
  await downloadFileAttachment(
    url.href,
    'timeSeries',
    downloadFormat,
    authenticationManager.getAccessToken(),
  )
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

function getParameterName(parameter: TimeSeriesParameter): string {
  const showParameterName =
    props.topologyNode.dataDownloadDisplay?.showParameterName
  if (showParameterName === 'name') return parameter.name ?? parameter.id
  if (showParameterName === 'short name')
    return parameter.shortName ?? parameter.id
  return parameter.id
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
  const allLocations = locationsResponse.locations
  const allParentLocations = allLocations.map(
    (location) => location.parentLocationId,
  )
  return locationsResponse.locations.filter(
    (location) => !allParentLocations.includes(location.locationId),
  )
}

function getAttributeValues(locations: Location[]): string[][] {
  const attributeValuesMap: string[][] = []
  const configuredAttributeIds =
    props.topologyNode.dataDownloadDisplay?.attributes.map((item) => item.id)
  configuredAttributeIds?.forEach((item) => attributeValuesMap.push([]))
  if (configuredAttributeIds == undefined) return attributeValuesMap
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

async function getParameters() {
  if (props.topologyNode?.filterIds === undefined) return []
  const filter: ParametersFilter = {
    filterId: props.topologyNode.filterIds[0],
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
