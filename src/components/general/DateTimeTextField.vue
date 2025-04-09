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
    <template v-for="(_, slot) of slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </v-text-field>
</template>

<script setup lang="ts">
import { DateTime } from 'luxon';
import { computed, ref, useSlots, watch } from 'vue'

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

// tsc doesnt understand useSlots type
const slots = useSlots() as Record<string, () => void>

const selectedDatetime = defineModel<Date>({required: true})
const datetimeString = ref(format(selectedDatetime.value, datetimeFormat.value))

watch(selectedDatetime, () => {
  datetimeString.value = format(selectedDatetime.value, datetimeFormat.value)
})

watch(datetimeString, () => {
  if (isValid(parse(datetimeString.value, datetimeFormat.value))) {
    selectedDatetime.value = parse(datetimeString.value, datetimeFormat.value)
  }
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
