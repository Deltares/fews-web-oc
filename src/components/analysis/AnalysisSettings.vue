<template>
  <v-card flat title="Settings">
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
        />
        <v-date-input
          v-model="collection.settings.endTime"
          label="End Date"
          variant="outlined"
          hide-details
          density="compact"
          prepend-icon=""
          min-width="120"
          display-format="fullDate"
        />
      </div>
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            class="mt-2"
            variant="tonal"
            color="error"
            text="Delete Collection"
            prepend-icon="mdi-delete"
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
