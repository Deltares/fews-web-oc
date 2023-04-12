<template>
  <div class="tree-menu">
    <v-treeview
      :active="active"
      :items="items"
      :open="open"
      activatable
      open-on-click
      transition
      dense
      @update:open="(event) => $emit('update:open',event)"
      @update:active="(event) => $emit('update:active',event)"
    >
      <template v-slot:label="props">
        <v-list-item dense :to="props.item.to" :disabled="props.item.nodata">

          <v-tooltip bottom open-delay="400">
            <template v-slot:activator="{ on, attrs }">
              <v-list-item-content
                v-bind="attrs"
                v-on="on">
                {{ props.item.name }}
              </v-list-item-content>
            </template>
            <span>{{ props.item.name }}</span>
          </v-tooltip>
          <v-icon v-if="props.item.icon !==undefined" small>
            {{ props.item.icon }}
          </v-icon>
        </v-list-item>
      </template>
    </v-treeview>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
// eslint-disable-next-line no-unused-vars
import { ColumnItem } from './ColumnItem'

@Component
export default class TreeMenu extends Vue {
  @Prop({ default: () => { return [] } }) items!: ColumnItem[]
  @Prop({ default: () => { return [] } }) open!: string[]
  @Prop({ default: () => { return [] } }) active!: string[]
}
</script>

<style>
.v-list-item--dense, .v-list--dense .v-list-item {
  min-height: 28px !important;
}

.v-treeview--dense .v-treeview-node__root {
  min-height: 28px !important;
}

.v-treeview-node__level {
  width: 12px !important;
}
</style>
