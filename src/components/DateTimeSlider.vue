<template>
  <div
    class="time-slider-container"
    :class="[themeClass, floatingClass]"
  >
    <v-slider v-model="index" :max="max" step="1" tick-size="6" tabindex="0" @input="onInput" @end="onInputEnd" hide-details
      height="0">
    </v-slider>
    <div style="display:flex;flex-direction:row;flex-grow:1;padding:6px 16px">
      <slot name="prepend"></slot>
      <div style="width:1px;height:100%;max-height:100%;background-color:lightgray;">
      </div>
      <div style="display:flex;flex-grow:1;justify-content:center">
        <div style="display:flex;">
          <v-btn @mousedown="backward()" @mouseup="stopPlay" icon ref="BackButton">
            <v-icon>
              mdi-skip-previous
            </v-icon>
          </v-btn>
          <v-btn :color="playColor(speed.base)" icon @click="togglePlay(speed.base)" ref="PlayButton">
            <v-icon>
              {{ isPlayingAtSpeed(speed.base) ? 'mdi-pause' : 'mdi-play' }}
            </v-icon>
          </v-btn>
          <v-btn :color="playColor(speed.twoTimes)" icon @click="togglePlay(speed.twoTimes)" ref="TwoTimesButton">
            <v-icon>
              {{ isPlayingAtSpeed(speed.twoTimes) ? 'mdi-pause' : 'mdi-chevron-double-right' }}
            </v-icon>
          </v-btn>
          <v-btn :color="playColor(speed.fourTimes)" icon @click="togglePlay(speed.fourTimes)" ref="FourTimesButton">
            <v-icon>
              {{ isPlayingAtSpeed(speed.fourTimes) ? 'mdi-pause' : 'mdi-chevron-triple-right' }}
            </v-icon>
          </v-btn>
          <v-btn @mousedown="forward()" @mouseup="stopPlay" icon ref="ForwardButton">
            <v-icon>
              mdi-skip-next
            </v-icon>
          </v-btn>
          <slot name="append"></slot>
        </div>
        <div style="display:flex;paddingLeft:20px">
          <v-btn icon :color="nowColor" @click="toggleNow">
            <v-icon v-if="loading">mdi-loading mdi-spin</v-icon>
            <v-icon v-else>mdi-clock</v-icon>
          </v-btn>
          <div style="margin:auto;width:30ch;flex:2 0 20%" class="body-1"> {{ dateString }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator'

@Component
export default class DateTimeSlider extends Vue {
  @Prop({ default: () => { return new Date(1970) } }) private value!: Date
  @Prop({ default: () => { return [new Date(1970)] } }) private dates!: Date[]
  @Prop({ default: false, type: Boolean }) private loading!: boolean
  @Prop({ default: false, type: Boolean }) private now!: boolean
  @Prop({ default: false, type: Boolean }) private floating!: boolean

  index: number = 0
  currentDate!: Date
  useNow: boolean = true
  isPlaying: boolean = false
  intervalTimer: any = 0
  hideLabel = true
  speed = {
    base: 1000,
    twoTimes: 500,
    fourTimes: 250
  }
  timeout: number = this.speed.base

  mounted (): void {
    this.updateIndexValueChange()
    this.currentDate = this.value
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

  isPlayingAtSpeed(speed: number) {
    return this.isPlaying && this.timeout === speed
  }

  playColor(speed: number): string {
    return this.isPlayingAtSpeed(speed) ? 'orange' : ''
  }

  get themeClass (): string {
    return this.$vuetify.theme.dark ? 'dark' : 'light'
  }

  get floatingClass (): string {
    return this.floating ? 'floating' : 'non-floating'
  }

  togglePlay (newTimeOut: number): void {
    if (this.isPlayingAtSpeed(newTimeOut)) {
      this.stopPlay()
      return
    }

    this.isPlaying = true
    this.useNow = false
    this.timeout = newTimeOut
    clearInterval(this.intervalTimer)
    this.intervalTimer = setInterval(this.play, this.timeout)
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
  updateIndexValueChange (): void {
    if (this.value && this.dates) {
      this.index = this.dates.findIndex((date: Date) => { return this.value.getTime() === date.getTime() })
      this.currentDate = this.dates[this.index]
    }
  }

  @Watch('now')
  updateNow (): void {
    this.useNow = this.now
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
      this.updateDate()
    }
    this.$emit('update:now', this.useNow)
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
    this.onInputEnd()
  }

  decrement (step = 1): void {
    this.index = Math.max(0, this.index - step)
    this.inputChanged()
    this.onInputEnd()
  }

  updateDate (): void {
    this.currentDate = this.dates[this.index]
  }

  onInput (): void {
    this.updateDate()
    this.inputChanged()
  }

  onInputEnd (): void {
    this.$emit('input-end')
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
.time-slider-container.non-floating {
  height: 48px;
}

.time-slider-container.floating {
  height: 63px;
  background-clip: content-box;
  padding: 0 15px 15px;
  filter: drop-shadow(3px 3px 3px #888);
}

.time-slider-container.dark {
  background-color: black;
}

.time-slider-container.light {
  background-color: white;
}
</style>
