<template>
  <v-chip
    :color="backgroundColor"
    pill
    label
    class="outer-chip px-1"
  >
    <v-btn-toggle
      v-model="selected"
      @change="onChangeSelection"
      mandatory
      group
      active-class="primary--text"
    >
      <v-btn
        v-for="item in items"
        :key="item.id"
        small
        plain
        class="body-1"
      >
        {{ item.name }}
      </v-btn>
    </v-btn-toggle>
  </v-chip>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { LayerType } from './AnimatedMapboxLayer.vue';

@Component
export default class LayerTypeControl extends Vue {
  @Prop({ default: null }) value!: LayerType

  items = [
    { id: LayerType.Static, name: 'Static'},
    { id: LayerType.Streamline, name: 'Animated'}
  ]
  selected: number = 0

  mounted(): void {
    this.onChangeValue()
  }

  onChangeSelection(): void {
    const selectedLayerType = this.selected !== undefined ? this.items[this.selected].id : null
    this.$emit('input', selectedLayerType)
  }

  @Watch('value')
  onChangeValue() {
    if (this.value) {
      const index = this.items.findIndex(source => source.id === this.value)
      this.selected = index >= 0 ? index : 0
    } else {
      this.selected = 0
    }
  }

  get backgroundColor(): string {
    return this.$vuetify.theme.dark ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.5)'
  }
}
</script>

<style scoped>
.outer-chip {
  backdrop-filter: blur(4px);
}
</style>
