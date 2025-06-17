<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon="mdi-filter-variant"
        variant="plain"
        density="compact"
        class="ms-1"
      />
    </template>
    <v-card>
      <v-card-text class="d-flex flex-column ga-2">
        <v-select
          v-model="selectedAttribute"
          :items="Object.values(locationAttributes)"
          item-value="id"
          item-title="name"
          label="Select Attribute"
          variant="outlined"
          hide-details
          density="compact"
          width="250"
          return-object
        />
        <v-select
          v-model="selectedAttributes[selectedAttribute?.id ?? '']"
          :items="Object.keys(selectedAttribute?.valueToLocationIds ?? {})"
          item-value="value"
          item-title="value"
          label="Select Values"
          variant="outlined"
          hide-details
          density="compact"
          multiple
          width="250"
          clearable
        />
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import {
  Location,
  LocationAttributeSelection1,
} from '@deltares/fews-pi-requests'
import { computed, ref, watch } from 'vue'

interface Props {
  locations: Location[]
  attributes?: LocationAttributeSelection1[]
}

const props = defineProps<Props>()

const emit = defineEmits(['update:filteredLocationIds'])

const selectedAttributes = ref<Record<string, string[]>>({})
const selectedAttribute = ref<Attribute>()

const filteredLocationIds = computed(() => {
  const locationIdsSet = new Set<string>()

  Object.entries(selectedAttributes.value).forEach(([attributeId, values]) => {
    const attribute = locationAttributes.value[attributeId]
    if (!attribute) return

    values.forEach((value) => {
      const locationIds = attribute.valueToLocationIds[value]
      if (locationIds) {
        locationIds.forEach((locationId) => {
          locationIdsSet.add(locationId)
        })
      }
    })
  })

  return Array.from(locationIdsSet)
})
watch(
  filteredLocationIds,
  (newLocationIds) => {
    emit('update:filteredLocationIds', newLocationIds)
  },
  { immediate: true },
)

type Attribute = {
  id: string
  name: string
  valueToLocationIds: Record<string, Set<string>>
}

const locationAttributes = computed(() => {
  const attributes: Record<string, Attribute> = {}

  props.locations.forEach((location) => {
    location.attributes?.forEach((attribute) => {
      if (!attribute.id || !attribute.value) return

      const configAttribute = props.attributes?.find(
        (attr) => attr.attributeId === attribute.id,
      )
      if (!configAttribute) return

      if (!attributes[attribute.id]) {
        attributes[attribute.id] = {
          id: attribute.id,
          name: configAttribute.name,
          valueToLocationIds: {},
        }
      }

      const attr = attributes[attribute.id]
      const valueSet = attr.valueToLocationIds[attribute.value] ?? new Set()
      valueSet.add(location.locationId)
      attr.valueToLocationIds[attribute.value] = valueSet
    })
  })

  return attributes
})
</script>
