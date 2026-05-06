<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn v-bind="props" :text="getDateRangeString()" />
    </template>

    <v-card flat width="400">
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
        <v-switch
          v-model="collection.settings.liveUpdate.enabled"
          label="Live Update"
          hide-details
        />
        <div class="d-flex ga-2">
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
  </v-menu>
</template>

<script setup lang="ts">
import { VDateInput } from 'vuetify/labs/components'
import { type Collection } from '@/lib/analysis'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

interface Props {
  collection: Collection
  startTime: Date
  endTime: Date
}

const props = defineProps<Props>()

const { locale } = useI18n()

const rangeFormatter = computed(() => {
  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

function getDateRangeString() {
  return rangeFormatter.value.formatRange(props.startTime, props.endTime)
}
</script>
