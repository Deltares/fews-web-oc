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

  selected: number | undefined = 0

  onChangeSelection(): void {
    const selectedDataSource = this.selected !== undefined ? this.items[this.selected] : null
    this.$emit('input', selectedDataSource)
  }

  @Watch('value')
  onChangeValue() {
    if (this.value) {
      const index = this.items.findIndex(source => source.id === this.value?.id)
      this.selected = index >= 0 ? index : undefined
    } else {
      this.selected = undefined
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
