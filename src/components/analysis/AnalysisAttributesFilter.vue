<template>
  <v-menu :close-on-content-click="false" max-height="400">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon="mdi-filter"
        variant="plain"
        density="compact"
        class="ms-1"
        size="small"
      />
    </template>
    <v-card>
      <v-card-text>
        <div class="attributes-grid ga-2">
          <div
            v-for="attribute in Object.values(locationAttributes)"
            :key="attribute.id"
          >
            <span>{{ attribute.name }}</span>
            <v-select
              v-model="selectedAttributes[attribute.id]"
              :items="Object.keys(attribute.valueToLocationIds ?? {})"
              item-value="value"
              item-title="value"
              placeholder="Select values"
              variant="outlined"
              hide-details
              density="compact"
              multiple
              width="250"
              clearable
            />
          </div>
        </div>
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

<style scoped>
.attributes-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>
