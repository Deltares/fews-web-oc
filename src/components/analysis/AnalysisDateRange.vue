<template>
  <v-menu :close-on-content-click="false">
    <template #activator="{ props, isActive }">
      <v-btn v-bind="props" :text="getDateRangeString()">
        <template #append>
          <SelectIcon :active="isActive" />
        </template>
      </v-btn>
    </template>

    <v-card flat width="400">
      <v-card-text>
        <div class="d-flex ga-2">
          <v-date-input
            v-model="settings.startTime"
            label="Start Date"
            variant="outlined"
            hide-details
            density="compact"
            prepend-icon=""
            min-width="120"
            :disabled="settings.liveUpdate.enabled"
          />
          <v-date-input
            v-model="settings.endTime"
            label="End Date"
            variant="outlined"
            hide-details
            density="compact"
            prepend-icon=""
            min-width="120"
            :disabled="settings.liveUpdate.enabled"
          />
        </div>
        <v-switch
          v-model="settings.liveUpdate.enabled"
          label="Live Update"
          hide-details
          color="primary"
        />
        <div class="d-flex ga-2">
          <v-number-input
            v-model="settings.liveUpdate.daysBeforeNow"
            label="Days Before Now"
            variant="outlined"
            hide-details
            density="compact"
            type="number"
            :min="0"
            :disabled="!settings.liveUpdate.enabled"
            control-variant="stacked"
            @blur="
              settings.liveUpdate.daysBeforeNow =
                settings.liveUpdate.daysBeforeNow ?? 0
            "
          />
          <v-number-input
            v-model="settings.liveUpdate.daysAfterNow"
            label="Days After Now"
            variant="outlined"
            hide-details
            density="compact"
            type="number"
            :min="0"
            :disabled="!settings.liveUpdate.enabled"
            control-variant="stacked"
            @blur="
              settings.liveUpdate.daysAfterNow =
                settings.liveUpdate.daysAfterNow ?? 0
            "
          />
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import SelectIcon from '@/components/general/SelectIcon.vue'
import { VDateInput } from 'vuetify/labs/components'
import type { CollectionSettings } from '@/lib/analysis'
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

interface Props {
  startTime: Date
  endTime: Date
}

const props = defineProps<Props>()

const settings = defineModel<CollectionSettings>('settings', { required: true })

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
