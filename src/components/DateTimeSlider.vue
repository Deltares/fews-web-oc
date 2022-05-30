<template>
  <div>
    <div style="display:flex;flex-direction:row;flex-grow:1;padding:2px 16px">
      <slot name="prepend"></slot>
      <div style="width:1px;height:100%;max-height:100%;background-color:lightgray;">
      </div>
      <div style="display:flex;flex-grow:1;justify-content:space-between">
        <div style="display:flex;">
          <v-btn icon :color="nowColor" @click="toggleNow" ref="NowButton">
            <v-icon>mdi-clock</v-icon>
          </v-btn>
          <div style="margin:auto;width:30ch;flex:2 0 20%" class="body-2"> {{ dateString }}</div>
        </div>
        <div style="display:flex;">
          <v-btn @mousedown="backward()" @mouseup="stopPlay" icon ref="BackButton">
            <v-icon>
              mdi-skip-previous
            </v-icon>
          </v-btn>
          <v-btn :color="playColor" icon @click="togglePlay" ref="PlayButton">
            <v-icon>
              {{ isPlaying ? 'mdi-pause' : 'mdi-play' }}
            </v-icon>
          </v-btn>
          <v-btn @mousedown="forward()" @mouseup="stopPlay" icon ref="ForwardButton">
            <v-icon>
              mdi-skip-next
            </v-icon>
          </v-btn>
        </div>
        <slot name="append"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator'

@Component
export default class DateTimeSlider extends Vue {
  @Prop({ default: () => { return new Date() } })
  private value!: Date

  @Prop({ default: () => { return [new Date()] } })
  private dates!: Date[]

  @Prop({ default: true })
  private now!: boolean

  index = 0
  currentDate!: Date
  useNow = true
  isPlaying = false
  intervalTimer: any = 0

  created (): void {
    this.updateIndexValueChange()
    this.currentDate = this.value
  }

  mounted (): void {
    this.useNow = this.now
    this.$emit('update:now', this.useNow)
  }

  get max (): number {
    return Math.max(0, this.dates.length - 1)
  }

  get dateString (): string {
    return this.dates[this.index] ? this.dates[this.index].toLocaleString() : ''
  }

  get nowColor (): string {
    return this.useNow ? 'orange' : ''
  }

  get playColor (): string {
    return this.isPlaying ? 'orange' : ''
  }

  togglePlay (): void {
    if (this.isPlaying) {
      this.isPlaying = false
      clearInterval(this.intervalTimer)
      this.intervalTimer = 0
    } else {
      this.isPlaying = true
      this.useNow = false
      this.$emit('update:now', this.useNow)
      this.intervalTimer = setInterval(this.play, 200)
    }
  }

  stopPlay (): void {
    if (this.intervalTimer) {
      this.isPlaying = false
      clearInterval(this.intervalTimer)
      this.intervalTimer = 0
    }
  }

  play (): void {
    if (this.max === this.index) {
      this.stopPlay()
    } else {
      this.increment()
    }
  }

  @Watch('value')
  @Watch('dates')
  updateIndexValueChange (): void {
    if (this.value && this.dates) {
      this.index = this.dates.findIndex((date: Date) => { return this.value.getTime() === date.getTime() })
      this.currentDate = this.dates[this.index]
    }
  }

  toggleNow (): void {
    this.useNow = !this.useNow
    if (this.useNow) {
      const now = new Date()
      for (let i = 0; i < this.dates.length; i++) { // Loop the array
        if (this.dates[i] > now) {
          this.index = Math.max(0, i - 1)
          break
        }
      }
      this.stopPlay()
    }
    this.$emit('update:now', this.useNow)
    if (this.dates[this.index]) this.$emit('input', this.dates[this.index])
  }

  backward (step?: number): void {
    if (this.useNow) {
      this.useNow = false
      this.$emit('update:now', this.useNow)
    }
    this.decrement(step)
    if (this.isPlaying) this.stopPlay()
    this.intervalTimer = setInterval(() => this.decrement(step), 200)
  }

  forward (step?: number): void {
    if (this.useNow) {
      this.useNow = false
      this.$emit('update:now', this.useNow)
    }
    this.increment(step)
    if (this.isPlaying) this.stopPlay()
    this.intervalTimer = setInterval(() => this.increment(step), 200)
  }

  increment (step = 1): void {
    this.index = Math.min(this.max, this.index + step)
    this.inputChanged()
  }

  decrement (step = 1): void {
    this.index = Math.max(0, this.index - step)
    this.inputChanged()
  }

  inputChanged (): void {
    if (this.useNow) {
      this.useNow = false
      this.$emit('update:now', this.useNow)
    }
    if (this.dates[this.index]) this.$emit('input', this.dates[this.index])
  }
}
</script>
<style scoped>
.time-slider-container {
  height: 104px;
  z-index: 100;
}
</style>
