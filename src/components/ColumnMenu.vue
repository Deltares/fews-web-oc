<template>
  <div>
    <v-toolbar dense flat>
      <v-btn v-if="currentLevel" icon @click="onTitleClick">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <slot name="menu-title" :text="currentTitle" :depth="currentLevel" >
        <span>
          {{ currentTitle }}
        </span>
      </slot>
    </v-toolbar>
    <v-divider/>
    <v-window
      v-model="currentLevel"
    >
    <v-window-item
      v-for="(item, i) in stack"
      v-bind:key="i"
      >
    <v-list-item-group>
      <v-list-item
        v-for="child in item.children"
        v-bind:key="child.id"
        @click="(event) => { onItemClick(event, child) }"
        :to="child.to"
        :class="getClass(child)"
      >
        <v-list-item-content>
          <v-list-item-title v-text="child.name"></v-list-item-title>
        </v-list-item-content>
        <v-icon v-if="child.children">mdi-chevron-right</v-icon>
      </v-list-item>
    </v-list-item-group>
    </v-window-item>
    </v-window>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
// eslint-disable-next-line no-unused-vars
import { ColumnItem } from './ColumnItem'

@Component
export default class ColumnMenu extends Vue {
  @Prop({ default: () => { return {} } }) items!: ColumnItem[]
  @Prop({ default: () => { return {} } }) open!: string[]
  @Prop({ default: () => { return {} } }) active!: string[]

  stack: ColumnItem[] = []
  path: string[] = []

  mounted (): void {
    this.onItemsChange()
  }

  @Watch('items')
  onItemsChange (): void {
    this.updateStack()
  }

  get currentTitle (): string {
    const title = this.stack.length > 0 ? this.stack[this.stack.length - 1].name : ''
    return title
  }

  get currentLevel (): number {
    return this.stack.length - 1
  }

  getClass (child: ColumnItem): string {
    return child.id === this.active[0] ? 'primary--text v-list-item--active' : ''
  }

  onTitleClick (): void {
    if (this.stack.length > 1) {
      this.stack.pop()
      this.path.pop()
    }
    this.$emit('update:active', [])
    this.$emit('update:open', this.path)
  }

  onItemClick (event: Event, item: ColumnItem): void {
    if (item.children) {
      this.stack.push(item)
      this.path.push(item.id)
      this.$emit('update:open', this.path)
    } else {
      this.$emit('update:active', [item.id])
    }
    this.$emit('click', event, item)
  }

  updateStack (): void {
    const stack = [...this.items]
    const path = [this.items[0].id]
    for (let i = 1; i < this.open.length; i++) {
      const parent = stack[i - 1]
      if (parent.children !== undefined) {
        const child = parent.children.find(c => c.id === this.open[i])
        if (child === undefined) continue
        stack.push(child)
        path.push(child.id)
      }
    }
    this.stack = stack
    this.path = path
  }
}
</script>
