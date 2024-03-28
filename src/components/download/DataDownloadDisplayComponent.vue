<template>
  <v-container>
    <v-card title="Make a selection to download data">
      <v-row align="start" class="ma-1">
        <v-col>
          <v-autocomplete
            :item-title="(item) => getLocationName(item)"
            v-model="selectedLocations"
            multiple
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
          <v-autocomplete
            density="compact"
            :item-title="(item) => getParameterName(item)"
            return-object
            v-model="selectedParameters"
            multiple
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
        <v-col v-for="(item, index) in attributes">
          <v-combobox
            density="compact"
            :label="item.name"
            v-model="selectedAttributes[index]"
            multiple
            :items="getAttributes(item.id)"
          />
        </v-col>
      </v-row>
      <v-row align="start" class="ma-1">
        <v-col>
          <v-text-field
            v-model="startDateString"
            label="Start"
            density="compact"
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
              >Download</v-btn
            >
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
    <v-row>
      <v-col>
        <v-text-field v-for="error in errors" style="color: red" readonly>{{
          error
        }}</v-text-field>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  DocumentFormat,
  PiWebserviceProvider,
  TopologyNode,
} from '@deltares/fews-pi-requests'
import { DateTime, type DateTimeMaybeValid } from 'luxon'
import { configManager } from '@/services/application-config'
import { createTransformRequestFn } from '@/lib/requests/transformRequest.ts'
import {
  LocationsFilter,
  TimeSeriesParameter,
  Location,
  ParametersFilter,
} from '@deltares/fews-pi-requests'
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
const locations = ref<Location[]>([])
const selectedLocations = ref<Location[]>([])

const parameters = ref<TimeSeriesParameter[]>([])
const selectedParameters = ref<TimeSeriesParameter[]>([])

locations.value = await getLocations()
parameters.value = await getParameters()
const attributeValues = getAttributeValues(locations.value)
let selectedFormat = ref<string>('PI_XML')

let errors = ref<string[]>([])
const startDate = ref<Date>(getStartDateValue())
const endDate = ref<Date>(getEndDateValue())
const selectedAttributes = ref<string[][]>([])
const attributes = props.topologyNode.dataDownloadDisplay?.attributes

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

watch(
  () => selectedAttributes.value,
  async (currentValue) => {
    const attributeIds =
      props.topologyNode.dataDownloadDisplay?.attributes.map(
        (item) => item.id,
      ) ?? []
    selectedLocations.value = getSelectedLocations(
      locations.value,
      attributeIds,
      selectedAttributes.value,
    )
  },
  { deep: true },
)

async function downloadData() {
  errors.value = []
  let newErrors = []
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
  errors.value = newErrors
  if (newErrors.length !== 0) return

  let startDateValue = startDate.value
  const startTime = DateTime.fromJSDate(startDateValue, {
    zone: 'UTC',
  })

  let queryStartDateString =
    startTime.toISO({ suppressMilliseconds: true }) ?? ''
  queryStartDateString = 'startTime=' + encodeURI(queryStartDateString)

  let endDateValue = endDate.value
  const endTime = DateTime.fromJSDate(endDateValue, {
    zone: 'UTC',
  })

  let queryEndDateString = endTime.toISO({ suppressMilliseconds: true }) ?? ''
  queryEndDateString = 'endTime=' + encodeURI(queryEndDateString)

  let locationQuery = ''
  selectedLocations.value.forEach((selectedLocation) => {
    if (locationQuery.length > 0) locationQuery = locationQuery + '&'
    locationQuery = locationQuery + 'locationIds=' + selectedLocation.locationId
  })
  locationQuery = encodeURI(locationQuery)

  let parameterQuery = ''
  selectedParameters.value.forEach((selectedParameter) => {
    if (parameterQuery.length > 0) parameterQuery = parameterQuery + '&'
    parameterQuery = parameterQuery + 'parameterIds=' + selectedParameter.id
  })
  parameterQuery = encodeURI(parameterQuery)

  const downloadFormat = selectedFormat.value

  const baseUrl = configManager.get('VITE_FEWS_WEBSERVICES_URL')
  const url = new URL(
    `${baseUrl}rest/fewspiservice/v1/timeseries?filterId=${filterId}&${locationQuery}&${parameterQuery}&${queryStartDateString}&${queryEndDateString}&downloadAsFile=true&documentFormat=${downloadFormat}`,
  )
  await downloadFileAttachment(
    url.href,
    'timeSeries',
    downloadFormat,
    authenticationManager.getAccessToken(),
  )
}

function getAttributes(attributeId: string): string[] {
  let attributes = attributeValues.get(attributeId)
  return attributes ?? []
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
    filterId: filterId,
    documentFormat: DocumentFormat.PI_JSON,
  }
  const locationsResponse = await piProvider.getLocations(filter)
  return locationsResponse.locations
}

function getAttributeValues(locations: Location[]): Map<string, []> {
  const attributeValuesMap = new Map()
  const configuredAttributeIds =
    props.topologyNode.dataDownloadDisplay?.attributes.map((item) => item.id)
  if (configuredAttributeIds === undefined) return attributeValuesMap
  for (const newLocation of locations) {
    let attributes = newLocation.attributes
    if (attributes == undefined) continue
    for (const attribute of attributes) {
      if (attribute.id === undefined) continue
      if (attribute.value === undefined) continue
      if (configuredAttributeIds.includes(attribute.id)) {
        if (!attributeValuesMap.has(attribute.id)) {
          attributeValuesMap.set(attribute.id, [])
        }
        const arrayForAttribute = attributeValuesMap.get(attribute.id)
        if (!arrayForAttribute.includes(attribute.value)) {
          arrayForAttribute.push(attribute.value)
        }
      }
    }
  }
  attributeValuesMap.forEach((value, key) => value.sort())
  return attributeValuesMap
}

async function getParameters() {
  if (props.topologyNode == undefined) return []
  if (props.topologyNode.filterIds == undefined) return []
  const filter: ParametersFilter = {
    filterId: props.topologyNode.filterIds[0],
    documentFormat: DocumentFormat.PI_JSON,
  }
  const parametersResponse = await piProvider.getParameters(filter)
  return parametersResponse.timeSeriesParameters
}

function getSelectedLocations(
  allLocations: Location[],
  attributes: String[],
  selectedAttributes: String[][],
): Location[] {
  const newLocationSelection = []
  for (const location of allLocations) {
    if (isSelected(location, selectedAttributes, attributes)) {
      newLocationSelection.push(location)
    }
  }
  return newLocationSelection
}

function isSelected(
  location: Location,
  selectedValues: String[][],
  attributes: String[],
) {
  for (let i = 0; i < attributes.length; i++) {
    if (selectedValues[i] === undefined || location.attributes == undefined)
      continue
    const foundAttribute = location.attributes?.find(
      (attribute) => attribute.id === attributes[i],
    )
    if (foundAttribute === undefined || foundAttribute.value === undefined)
      continue
    if (selectedValues[i].includes(foundAttribute.value)) return true
  }
  return false
}
</script>
