<template>
  <v-list class="interval-list">
    <v-list-item-group
      v-model="selectedIndex"
      @change="onSelectInterval"
      mandatory
    >
      <!-- Empty list item to trick the list into show no selection, while still setting "mandatory" -->
      <v-list-item v-show="false"/>
      <v-list-item>
        <template v-slot:default="{ active }">
          <v-list-item-title>
            Default
          </v-list-item-title>
          <v-list-item-icon>
            <v-icon v-show="active" small>
              mdi-check
            </v-icon>
          </v-list-item-icon>
        </template>
      </v-list-item>
      <v-list-item
        v-for="(item, index) in items"
        :key="index"
      >
        <template v-slot:default="{ active }">
          <v-list-item-title>
            {{ intervalToLocaleString(item) }}
          </v-list-item-title>
          <v-list-item-icon>
            <v-icon v-show="active" small>
              mdi-check
            </v-icon>
          </v-list-item-icon>
        </template>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script lang="ts">
import { DateTime, Duration } from 'luxon'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class IntervalSelector extends Vue {
  // The interval is either a string with an interval, which may be "default" for the Default value,
  // or null if an absolute start and end date have been selected.
  @Prop({ default: 'default' }) value!: string | null
  @Prop({ default: () => [] }) items!: string[]
  @Prop({ default: () => new Date() }) now!: Date

  selectedIndex: number | undefined = 0

  mounted() {
    this.onValueChange()
  }

  @Watch('value')
  onValueChange(): void {
    if (this.value === null) {
      this.selectedIndex = 0
    } else if (this.value === 'default') {
      this.selectedIndex = 1
    } else {
      this.selectedIndex = this.items.findIndex((entry) => entry === this.value) + 2
    }
  }

  intervalToLocaleString(interval: string) {
    const duration = Duration.fromISO(interval)
    const startDateTime = DateTime.fromJSDate(this.now).plus(duration)
    return startDateTime.toRelative()
  }

  onSelectInterval(index: number): void {
    let selectedInterval = undefined
    if (index === 0) {
      selectedInterval = null
    } else if (index === 1) {
      selectedInterval = 'default'
    } else {
      selectedInterval = this.items[index - 2]
    }
    this.$emit('input', selectedInterval)
  }
}
</script>

<style scoped>
.interval-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>