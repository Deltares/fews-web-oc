<template>
  <v-text-field
    v-model="datetimeString"
    :rules="validationRules"
    :label="label"
    :density="density"
    :variant="variant"
    class="datetime-field"
    hide-details="auto"
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
            <v-tab value="time">
              <v-icon>mdi-timer</v-icon>
            </v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item value="date">
              <v-date-picker
                v-model="date"
                @update:model-value="() => (tab = 'time')"
              />
            </v-window-item>
            <v-window-item value="time">
              <v-time-picker v-model="time" ref="timer" format="24hr" />
            </v-window-item>
          </v-window>
        </v-card>
      </v-menu>
      <slot name="additional-append-inner" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { DateTime } from 'luxon'
import { computed, ref, watch } from 'vue'
import { VTimePicker } from 'vuetify/labs/VTimePicker'
import type { VTextField } from 'vuetify/components'

type UnwrapReadonlyArray<A> = A extends Readonly<Array<infer I>> ? I : A
type ValidationRule = UnwrapReadonlyArray<VTextField['rules']>

interface Props {
  label: string
  dateFormat?: string
  timeFormat?: string
  rules?: ValidationRule[]
  variant?: VTextField['variant']
  density?: VTextField['density']
}

const props = withDefaults(defineProps<Props>(), {
  dateFormat: 'yyyy-MM-dd',
  timeFormat: 'HH:mm',
})

const datetimeFormat = computed(() =>
  combineDateAndTimeStrings(props.dateFormat, props.timeFormat),
)

const tab = ref<'date' | 'time'>('date')

const selectedDatetime = defineModel<Date>()
const date = ref(selectedDatetime.value)
const time = ref(format(selectedDatetime.value, props.timeFormat))
const datetimeString = ref(format(selectedDatetime.value, datetimeFormat.value))

watch(selectedDatetime, () => {
  datetimeString.value = format(selectedDatetime.value, datetimeFormat.value)
  date.value = selectedDatetime.value
  time.value = format(selectedDatetime.value, props.timeFormat)
})

watch(datetimeString, () => {
  if (isValid(parse(datetimeString.value, datetimeFormat.value))) {
    const newDateTime = parse(datetimeString.value, datetimeFormat.value)
    if (newDateTime.getTime() !== selectedDatetime.value?.getTime()) {
      selectedDatetime.value = newDateTime
    }
  }
})

watch(date, () => {
  const timeString = format(selectedDatetime.value, props.timeFormat)
  const dateString = format(date.value, props.dateFormat)
  datetimeString.value = combineDateAndTimeStrings(dateString, timeString)
})

watch(time, () => {
  const dateString = format(selectedDatetime.value, props.dateFormat)
  datetimeString.value = combineDateAndTimeStrings(dateString, time.value)
})

function combineDateAndTimeStrings(date: string, time: string) {
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

const validationRules = computed(() => {
  const rule = [
    () => {
      const datetime = parse(datetimeString.value, datetimeFormat.value)
      return (
        datetimeString.value === '' ||
        isValid(datetime) ||
        `Fill in the time as ${datetimeFormat.value}, e.g. ${format(
          new Date(),
          datetimeFormat.value,
        )}`
      )
    },
  ]
  const rules = props.rules !== undefined ? props.rules.concat(rule) : rule
  return rules
})
</script>

<style scoped>
.datetime-field :deep(.v-field) {
  padding-right: 0;
}
</style>
