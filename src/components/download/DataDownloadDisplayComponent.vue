<template>
  <v-container>
    <v-card title="Make a selection to download data" flat>
      <v-form v-model="selectionIsValid">
        <v-row class="ma-1">
          <v-col v-for="(item, index) in attributes">
            <v-autocomplete
              v-model="selectedAttributes[index]"
              :items="selectableAttributes[index]"
              :label="item.name"
              multiple
              density="compact"
              variant="outlined"
              clearable
              chips
              closable-chips
              prepend-icon="mdi-filter"
              @update:modelValue="updateLocations"
            />
          </v-col>
        </v-row>
        <v-row class="ma-1">
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
              :rules="[rules.noEmptySelection]"
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
        <v-row class="ma-1">
          <v-col>
            <v-autocomplete
              v-model="selectedLocations"
              :items="locations"
              :item-title="(item) => getLocationName(item)"
              label="Locations"
              multiple
              return-object
              density="compact"
              variant="outlined"
              clearable
              prepend-icon="mdi-map-marker-multiple"
              :rules="[rules.noEmptySelection]"
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
        <v-row class="ma-1">
          <v-col>
            <v-text-field
              v-model="startDateString"
              label="Start date"
              density="compact"
              :rules="[
                rules.required,
                rules.date,
                rules.startDateBeforeEndDate,
              ]"
              variant="outlined"
              :key="endDateString"
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
              :rules="[rules.required, rules.date, rules.endDateAfterStartDate]"
              variant="outlined"
              :key="startDateString"
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
import { ref, computed, watch, onMounted } from 'vue'
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

interface Props {
  nodeId?: string | string[]
  topologyNode: TopologyNode
}

const props = defineProps<Props>()
const settings = useUserSettingsStore()

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
const attributes = props.topologyNode.dataDownloadDisplay?.attributes

const allLocations = ref<Location[]>([])
const locations = ref<Location[]>([])
const selectedLocations = ref<Location[]>([])

const allParameters = ref<TimeSeriesParameter[]>([])

const parameterQualifiers = ref<ParameterQualifiersHeader[]>([])
const selectedParameterQualifiers = ref<ParameterQualifiersHeader[]>([])
const selectableAttributes = ref<string[][]>([])
const onlyDownloadMetaData = ref(false)
const errors = ref<string[]>([])

const selectedAttributes = ref<string[][]>([])

const DATE_FMT = 'yyyy-MM-dd HH:mm'

const startDate = ref<Date>(getStartDateValue())
const startDateString = ref<string>(
  DateTime.fromJSDate(startDate.value).toFormat(DATE_FMT),
)

const endDate = ref<Date>(getEndDateValue())
const endDateString = ref<string>(
  DateTime.fromJSDate(endDate.value).toFormat(DATE_FMT),
)

const parameterQualifiersHeaders: ParameterQualifiersHeader[] = []

const rules = {
  noEmptySelection: (value: any[]) => {
    return (
      (value !== undefined && value.length > 0) || 'Select one or more items'
    )
  },
  required: (value: string) => (value !== undefined && !!value) || 'Required',
  date: (value: string) => {
    const date = DateTime.fromFormat(value || '', DATE_FMT)
    return !isNaN(date.valueOf()) || 'Invalid date'
  },
  startDateBeforeEndDate: (value: string) => {
    const startDate = DateTime.fromFormat(value || '', DATE_FMT).toJSDate()
    return startDate < endDate.value || 'Start date should be before end date'
  },
  endDateAfterStartDate: (value: string) => {
    const endDate = DateTime.fromFormat(value || '', DATE_FMT).toJSDate()
    return endDate > startDate.value || 'End date should be after start date'
  },
}

onMounted(async () => {
  loadLocations()
  loadParameters()
  loadTimeSeriesHeaders()
  if (attributes) {
    selectedAttributes.value = attributes.map(() => [])
  }
})

async function loadLocations() {
  const locationsResponse = await getLocations()
  allLocations.value = locationsResponse
  locations.value = locationsResponse
  selectedLocations.value = locationsResponse
  selectableAttributes.value = getAttributeValues(locationsResponse)
}

async function loadParameters() {
  allParameters.value = await getParameters()
}

async function loadTimeSeriesHeaders() {
  const headersResponse = await getTimeSeriesHeaders()
  headersResponse?.forEach((timeSeriesResult) => {
    const parameterQualifiersHeader: ParameterQualifiersHeader = {
      parameterId: timeSeriesResult.header?.parameterId,
      qualifiers: timeSeriesResult.header?.qualifierId,
    }
    parameterQualifiersHeaders.push(parameterQualifiersHeader)
  })
  parameterQualifiers.value = uniqWith(parameterQualifiersHeaders, isEqual)
  selectedParameterQualifiers.value = parameterQualifiers.value
}

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
  const attributes = props.topologyNode.dataDownloadDisplay?.attributes
  if (!attributes) return []

  const attributeValuesMap: string[][] = attributes.map(() => [])

  locations.forEach((location) => {
    location.attributes?.forEach((attribute) => {
      const index = attributes.findIndex((attr) => attr.id === attribute.id)
      if (
        index !== -1 &&
        attribute.value &&
        !attributeValuesMap[index].includes(attribute.value)
      ) {
        attributeValuesMap[index].push(attribute.value)
      }
    })
  })

  attributeValuesMap.forEach((values) => values.sort())
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
