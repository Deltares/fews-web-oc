<template>
  <v-card flat title="Time Settings">
    <v-card-text>
      <div class="d-flex ga-2">
        <v-date-input
          v-model="collection.settings.startTime"
          label="Start Date"
          variant="outlined"
          hide-details
          density="compact"
          prepend-icon=""
          min-width="120"
          :disabled="collection.settings.liveUpdate.enabled"
        />
        <v-date-input
          v-model="collection.settings.endTime"
          label="End Date"
          variant="outlined"
          hide-details
          density="compact"
          prepend-icon=""
          min-width="120"
          :disabled="collection.settings.liveUpdate.enabled"
        />
      </div>
      <div class="d-flex ga-2 mt-4">
        <v-switch
          v-model="collection.settings.liveUpdate.enabled"
          label="Live Update"
          hide-details
        />
      </div>
      <div class="d-flex ga-2 mt-4">
        <v-number-input
          v-model="collection.settings.liveUpdate.daysBeforeNow"
          label="Days Before Now"
          variant="outlined"
          hide-details
          density="compact"
          type="number"
          :min="0"
          :disabled="!collection.settings.liveUpdate.enabled"
          control-variant="stacked"
        />
        <v-number-input
          v-model="collection.settings.liveUpdate.daysAfterNow"
          label="Days After Now"
          variant="outlined"
          hide-details
          density="compact"
          type="number"
          :min="0"
          :disabled="!collection.settings.liveUpdate.enabled"
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
import { VDateInput } from 'vuetify/labs/components'

interface Props {
  collection: Collection
}

defineProps<Props>()

defineEmits(['delete-collection'])
</script>
