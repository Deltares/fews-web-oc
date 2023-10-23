<template>
  <v-dialog v-model="showDialog" max-width="900">
    <template v-slot:activator="{ on, attrs }">
      <v-btn icon v-on="on" v-attrs="attrs"><v-icon>mdi-information</v-icon></v-btn>
    </template>
    <DisclaimerText />
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import DisclaimerText from '@/components/DisclaimerText.vue'

@Component({components: {
  DisclaimerText
}})
export default class DisclaimerPopup extends Vue {
  showDialog: boolean = false
}
</script>
