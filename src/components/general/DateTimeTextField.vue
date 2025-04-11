<template>
  <v-text-field
    v-model="datetimeString"
    :rules="rules"
    :label="label"
    density="compact"
    variant="outlined"
    class="datetime-field"
    hide-details
  >
    <template #append-inner>
      <v-menu offset-y :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <v-btn icon size="small" v-bind="menuProps">
            <v-icon>mdi-calendar-clock</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-tabs v-model="tab" grow>
            <v-tab value="date">
              <v-icon>mdi-calendar</v-icon>
            </v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item value="date">
              <v-date-picker v-model="date"/>
            </v-window-item>
          </v-window>
        </v-card>
      </v-menu>
      <slot name="additional-append-inner"/>
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { DateTime } from 'luxon';
import { computed, ref, watch } from 'vue'

interface Props {
  label: string
  dateFormat?: string
  timeFormat?: string
}

const props = withDefaults(defineProps<Props>(), {
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm'
})

const datetimeFormat = computed(() => combineDateAndTimeStrings(props.dateFormat, props.timeFormat))

const tab = ref<'date' | 'time'>('date')

const selectedDatetime = defineModel<Date>({required: true})
const date = ref(selectedDatetime.value)
const datetimeString = ref(format(selectedDatetime.value, datetimeFormat.value))

watch(selectedDatetime, () => {
  datetimeString.value = format(selectedDatetime.value, datetimeFormat.value)
  date.value = selectedDatetime.value
})

watch(datetimeString, () => {
  if (isValid(parse(datetimeString.value, datetimeFormat.value))) {
    selectedDatetime.value = parse(datetimeString.value, datetimeFormat.value)
  }
})

watch(date, () => {
  const timeString = format(selectedDatetime.value, props.timeFormat)
  const dateString = format(date.value, props.dateFormat)
  datetimeString.value = combineDateAndTimeStrings(dateString,timeString)
})

function combineDateAndTimeStrings(date:string, time: string) {
  return `${date} ${time}`
}

function format(date: Date | undefined, format: string) {
  if (!date) return ''
  return DateTime.fromJSDate(date).toFormat(format)
}

function isValid(date: Date) {
  return !isNaN(date.getTime())
}

function parse(dateString: string, format: string) {
  return DateTime.fromFormat(dateString, format).toJSDate()
}

const rules = [
  () => {
    const datetime = parse(datetimeString.value, datetimeFormat.value)
    return (
      datetimeString.value === '' ||
      isValid(datetime) ||
      `Fill in the time as ${datetimeFormat.value}, e.g. ${format(
        new Date(),
        datetimeFormat.value
      )}`
    )
  }
]
</script>

<style scoped>
.datetime-field :deep(.v-field) {
  padding-right: 0;
}
</style>
