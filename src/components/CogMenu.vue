<template>
  <v-menu left bottom class="menu">
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-bind="attrs" v-on="on">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-subheader class="body-1">Theme</v-subheader>
      <v-list-item>
        <v-list-item-action>
          <v-list-item-action>
            <ThemeSelector v-model="theme" @input="onThemeChange"/>
          </v-list-item-action>
        </v-list-item-action>
      </v-list-item>
      <v-subheader v-if="multipleLanguages" class="body-1">Language</v-subheader>
      <v-list-item v-if="multipleLanguages">
        <v-list-item-action>
          <v-list-item-action>
            <locale-control/>
          </v-list-item-action>
        </v-list-item-action>
      </v-list-item>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title>Version {{ packageVersion }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ThemeMixin from '@/mixins/ThemeMixin'
import ThemeSelector from '@/components/ThemeSelector.vue'
import LocaleControl from './LocaleControl.vue'
import packageConfig from '../../package.json'

@Component({
  components: {
    ThemeSelector,
    LocaleControl
  }
})
export default class CogMenu extends Mixins(ThemeMixin) {
  @Prop({ default:  true }) multipleLanguages!: boolean

  packageVersion = packageConfig.version
}
</script>

<style scoped>
.menu {
  position: relative;
  z-index: 10000;
}

</style>
