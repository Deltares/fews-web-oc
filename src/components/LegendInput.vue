<template>
  <v-text-field ref="input" v-if="enabled"
    @keydown.enter.stop="acceptEdit"
    @keydown.escape.stop="disableEdit"
    @blur="acceptEdit"
    v-model.number="inputValue"
    hide-spin-buttons
    hide-details
    :background-color="$vuetify.theme.dark ? 'black' : 'white'"
    type="number"
    class="legend-input"
    :style="{left: offset}"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class LegendInput extends Vue {
  @Prop({ default: 0}) value!: number
  @Prop({ default: -999999999}) minValue!: number
  @Prop({ default: 999999999}) maxValue!: number
  @Prop({ default: ""}) offset!: string
  @Prop({ default: false }) isEditing!: boolean

  inputValue: number = 0
  enabled: boolean = false

  disableEdit() {
    this.enabled = false
    this.$emit("update:isEditing", this.enabled)
  }

  acceptEdit() {
    if (this.inputValue > this.minValue && this.inputValue < this.maxValue) {
      this.$emit("update:value", `${this.inputValue}`)
    }

    this.disableEdit()
  }

  @Watch('isEditing')
  onIsEditingChange() {
    this.enabled = this.isEditing

    if (this.enabled) {
      this.inputValue = this.value
      this.focusInput()
    }
  }

  focusInput() {
    this.$nextTick(() => {
      (this.$refs.input as HTMLElement).focus()
    })
  }
}
</script>

<style scoped>
  .legend-input {
    font-size: 12px;
    width: 40px;
    height: 40px;
    bottom: -6px;
    padding: 0;
    position: absolute;
    border-radius: 5px;
  }

  .legend-input:deep(input) {
    padding: 8px;
  }
</style>
