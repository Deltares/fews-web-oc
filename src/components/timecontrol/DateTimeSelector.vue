<template>
  <div class="container">
    <v-menu v-model="showDatePicker">
      <template v-slot:activator="{ on, attrs }">
        <v-text-field
          v-model="selectedDate"
          :label="label"
          :prepend-icon="prependDateIcon"
          readonly
          v-bind="attrs"
          v-on="on"
        />
      </template>
      <v-date-picker
        v-model="selectedDate"
        no-title
        scrollable
        @input="onSelectedDateTimeChange"
      />
    </v-menu>
    <v-menu v-model="showTimePicker">
      <template v-slot:activator="{ on, attrs }">
        <v-text-field
          v-model="selectedTime"
          readonly
          :prepend-icon="prependTimeIcon"
          v-bind="attrs"
          v-on="on"
        />
      </template>
      <v-time-picker
        v-model="selectedTime"
        no-title
        scrollable
        @input="onSelectedDateTimeChange"
      />
    </v-menu>
    <v-btn
      class="button"
      icon
      @click="setNow"
    >
      <v-icon>
        mdi-timeline-clock-outline
      </v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { DateTime } from 'luxon'

@Component
export default class DateTimeSelector extends Vue {
  @Prop({ default: null }) value!: Date | null
  @Prop({ default: 'Date' }) label!: string
  @Prop({ default: 'mdi-calendar' }) prependDateIcon!: string
  @Prop({ default: 'mdi-clock' }) prependTimeIcon!: string

  showDatePicker: boolean = false
  showTimePicker: boolean = false

  selectedDate: string | null = null
  selectedTime: string | null = null

  mounted() {
    this.onValueChange()
  }

  @Watch('value')
  onValueChange(): void {
    this.onExternalDateTimeChange(this.value)
  }

  setNow(): void {
    const now = new Date()
    this.onExternalDateTimeChange(now)
    this.$emit('input', now)
  }

  onExternalDateTimeChange(externalDateTime: Date | null): void {
    if (externalDateTime === null) {
      this.selectedDate = null
      this.selectedTime = null
    } else {
      const dateTime = DateTime.fromJSDate(externalDateTime)
      this.selectedDate = dateTime.toISODate()
      this.selectedTime = dateTime
        .startOf('minute')
        .toISOTime({
          suppressSeconds: true,
          suppressMilliseconds: true,
          includeOffset: false
        })
    }
  }

  onSelectedDateTimeChange(): void {
    // If the time was not set, use a default.
    if (!this.selectedTime) this.selectedTime = '00:00'

    const dateTimeString = `${this.selectedDate}T${this.selectedTime}`
    const dateTime = this.selectedDate ? DateTime.fromISO(dateTimeString).toJSDate() : null
    this.$emit('input', dateTime)
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
}
</style>
