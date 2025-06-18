<template>
  <v-card flat title="Time Settings">
    <v-card-text>
      <div class="d-flex ga-2">
        <v-date-input
          v-model="startDate"
          label="Start Date"
          variant="outlined"
          hide-details
          density="compact"
          prepend-icon=""
          min-width="120"
          :disabled="liveUpdate"
        />
        <v-date-input
          v-model="endDate"
          label="End Date"
          variant="outlined"
          hide-details
          density="compact"
          prepend-icon=""
          min-width="120"
          display-format="fullDate"
          :disabled="liveUpdate"
        />
      </div>
      <div class="d-flex ga-2 mt-4">
        <v-switch v-model="liveUpdate" label="Live Update" hide-details />
      </div>
      <div class="d-flex ga-2 mt-4">
        <v-number-input
          v-model="daysBeforeNow"
          label="Days Before Now"
          variant="outlined"
          hide-details
          density="compact"
          type="number"
          :min="0"
          :disabled="!liveUpdate"
          control-variant="stacked"
        />
        <v-number-input
          v-model="daysAfterNow"
          label="Days After Now"
          variant="outlined"
          hide-details
          density="compact"
          type="number"
          :min="0"
          :disabled="!liveUpdate"
          control-variant="stacked"
        />
      </div>
    </v-card-text>
  </v-card>

  <v-card flat title="Collection Settings">
    <v-card-text>
      <v-text-field
        v-model="collection.name"
        label="Rename"
        variant="outlined"
        hide-details
        density="compact"
        class="mb-2"
      />

      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="tonal"
            color="error"
            text="Delete Collection"
            prepend-icon="mdi-delete"
            hide-details
          />
        </template>
        <template #default="{ isActive }">
          <v-card
            title="Delete Collection"
            text="Are you sure you want to delete this collection?"
          >
            <v-card-actions>
              <v-spacer />
              <v-btn
                variant="flat"
                color="primary"
                @click="isActive.value = false"
                text="cancel"
              />
              <v-btn text="delete" @click="$emit('delete-collection')" />
            </v-card-actions>
          </v-card>
        </template>
      </v-menu>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { Collection } from '@/lib/analysis'
import { ref, watchEffect } from 'vue'
import { VDateInput } from 'vuetify/labs/components'

interface Props {
  collection: Collection
}

const props = defineProps<Props>()

defineEmits(['delete-collection'])

const startDate = ref(props.collection.settings.startTime)
const endDate = ref(props.collection.settings.endTime)

const liveUpdate = ref(false)
const daysBeforeNow = ref(2)
const daysAfterNow = ref(2)

const MS_IN_DAY = 24 * 60 * 60 * 1000

watchEffect(() => {
  if (liveUpdate.value) {
    props.collection.settings.startTime = new Date(
      Date.now() - daysBeforeNow.value * MS_IN_DAY,
    )
    props.collection.settings.endTime = new Date(
      Date.now() + daysAfterNow.value * MS_IN_DAY,
    )
  } else {
    props.collection.settings.startTime = startDate.value
    props.collection.settings.endTime = endDate.value
  }
})
</script>
