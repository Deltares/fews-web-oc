<template>
  <v-menu left bottom>
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-bind="attrs" v-on="on">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Version {{ packageVersion }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { version } from '../../package.json'

@Component
export default class DotsMenu extends Vue {
  packageVersion = version
}
</script>
