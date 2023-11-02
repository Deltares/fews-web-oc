<template>
  <v-chip
    :color="backgroundColor"
    class="outer-chip"
  >
    <v-chip-group
      v-model="selected"
      @change="onChangeSelection"
      active-class="primary--text"
    >
      <v-chip
        v-for="item in items"
        :key="item.id"
        small
        class="body-1"
      >
        {{ item.name }}
      </v-chip>
    </v-chip-group>
  </v-chip>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { DataSource } from '@/lib/Topology';

@Component
export default class DataSourceControl extends Vue {
  @Prop({ default: null }) value!: DataSource | null
  @Prop({ default: () => [] }) items!: DataSource[]

  selected: number = 0
  isChangingItems: boolean = false

  mounted(): void {
    this.onChangeValue()
  }

  onChangeSelection(): void {
    // Block this handler from executing when it is inadvertently triggered when changing the items
    // of the v-chip-group. See documentation at onChangeItems.
    if (this.isChangingItems) return

    const selectedDataSource = this.selected !== undefined ? this.items[this.selected] : null
    this.$emit('input', selectedDataSource)
  }

  /**
   * Keep track of whether we are currently changing items.
   *
   * For some reason, v-chip-group emits a "change" event when both the items and the currently
   * selected value are being changed simultaneously. By setting the boolean while the items are
   * being changed, we block this event from continuing in the onChangeSelection handler.
   */
  @Watch('items')
  onChangeItems(): void {
    this.isChangingItems = true
    this.$nextTick(() => { this.isChangingItems = false })
  }

  @Watch('value')
  onChangeValue() {
    if (this.value) {
      const index = this.items.findIndex(source => source.id === this.value?.id)
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
