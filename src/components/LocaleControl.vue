<template>
  <v-btn-toggle
    v-model="$i18n.locale"
    mandatory
    dense
  >
    <v-btn
      v-for="lang in langs"
      :key="lang.id"
      :value="lang.id"
    >
    <span :class="`fi fi-${lang.flag}`"></span> {{ $t(lang.label) }}
    </v-btn>
  </v-btn-toggle>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import "flag-icons/css/flag-icons.min.css";

@Component
export default class LocaleControl extends Vue {
  langs!: {id: string; label: string, flag: string}[]

  created (): void {
    this.langs = [
      {
        id: 'nl',
        label: 'settings.nl',
        flag: 'nl'
      }, {
        id: 'en',
        label: 'settings.en',
        flag: 'us'
      }
    ]
  }
}
</script>
